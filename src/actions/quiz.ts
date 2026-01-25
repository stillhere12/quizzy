// server actions
'use server';
import prisma from '@/lib/prisma';
import { auth, currentUser } from '@clerk/nextjs/server';
import {
  createQuizSchema,
  QuizAttemptInput,
  quizAttemptSchema,
  type CreateQuiz,
} from '../lib/schemas/quiz';

export default async function createQuiz(data: CreateQuiz) {
  const validatedData = createQuizSchema.safeParse(data);
  if (!validatedData.success) {
    throw new Error('Invalid quiz data');
  }
  // proceed to create quiz in the database
  // zod returns the validated data in the .data property
  const {
    title,
    description,
    questionCount,
    timeLimit,
    difficulty,
    category,
    externalId,
    questions,
  } = validatedData.data;
  // this is just in memory of js
  // we need to store in db
  // so we use prisma.quiz.create({data:    questions:{create: }})
  await prisma.quiz.create({
    data: {
      title,
      description,
      questionCount,
      timeLimit,
      difficulty,
      category,
      externalId,
      questions: {
        // nest create for questions and options
        create: questions.map((question) => {
          return {
            text: question.text,
            type: question.type,
            difficulty: question.difficulty,
            category: category,
            options: {
              create: question.options.map((option) => {
                return {
                  text: option.text,
                  isCorrect: option.isCorrect,
                };
              }),
            },
          };
        }),
      },
    },
  });
}

/**
 * Get all quizzes for the dashboard
 * Supports optional filtering by difficulty and category
 */
export async function getQuizzes(filters?: {
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
  category?: string;
}) {
  const filterDifficulty = filters?.difficulty;
  const filterCategory = filters?.category;
  const quizzes = await prisma.quiz.findMany({
    where: {
      difficulty: filterDifficulty,
      category: filterCategory,
    },
    orderBy: { createdAt: 'desc' },
  });
  console.log('Fetched quizzes:', quizzes.length);
  return quizzes;
}

/**
 * Get a single quiz by its ID, including questions and options
 * @param quizId - the ID of the quiz to retrieve
 * @return the quiz with its questions and options
 **/
export async function getQuizById(quizId: string) {
  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: {
      questions: {
        include: {
          options: true,
        },
      },
    },
  });

  return quiz;
}

// after submitting quiz
// user info, quiz id, score
// we are taking data from client as parameters
// we need to validate it
export async function savequizAttempt(data: QuizAttemptInput) {
  const { userId } = await auth();
  // auth() function returns auth object of current active user.
  if (!userId) {
    throw new Error('You must be logged in to submit.');
  }

  // Get Clerk user details and sync to our DB
  const clerkUser = await currentUser();
  // currentUser() can only be used in server components.
  if (!clerkUser) {
    throw new Error('User not found.');
  }

  // Upsert user in our database (create if not exists, update if exists)
  await prisma.user.upsert({
    where: { id: userId },
    update: {
      name: clerkUser.firstName || clerkUser.emailAddresses[0]?.emailAddress || 'User',
      email: clerkUser.emailAddresses[0]?.emailAddress || '',
      emailVerified: clerkUser.emailAddresses[0]?.verification?.status === 'verified',
      image: clerkUser.imageUrl,
    },
    create: {
      id: userId,
      name: clerkUser.firstName || clerkUser.emailAddresses[0]?.emailAddress || 'User',
      email: clerkUser.emailAddresses[0]?.emailAddress || '',
      emailVerified: clerkUser.emailAddresses[0]?.verification?.status === 'verified',
      image: clerkUser.imageUrl,
    },
  });

  const validated = quizAttemptSchema.safeParse(data);
  if (!validated.success) {
    throw new Error('Invalid quiz attempt schema.');
  }

  const { quizId, score, userAnswers } = validated.data;
  const savedQuizAttempt = await prisma.quizAttempt.create({
    data: {
      userId,
      quizId,
      score,
      userAnswers: {
        create: userAnswers.map((answer) => ({
          questionId: answer.questionId,
          selectedOptionId: answer.selectedOptionId,
          isCorrect: answer.isCorrect,
        })),
      },
    },
  });
  return savedQuizAttempt;
}

export async function getQuizAttemptById(attemptId: string) {
  const attempt = await prisma.quizAttempt.findUnique({
    where: { id: attemptId },
    include: {
      quiz: true, // gets quiz title, description etc.
      userAnswers: {
        include: {
          question: {
            include: {
              options: true, // all options for this question
            },
          },
          selectedOption: true, // the option user selected.
        },
      },
    },
  });
  return attempt;
}
// below two functions handle dashboard and took heavily from ai.
export async function showDashboard() {
  const { userId } = await auth();
  if (!userId) {
    throw new Error('You must be logged in to submit.');
  }

  // Get Clerk user details and sync to our DB
  const clerkUser = await currentUser();
  // currentUser() can only be used in server components.
  if (!clerkUser) {
    throw new Error('User not found.');
  }
  // what to show in dashboard.
  const attempts = await prisma.quizAttempt.findMany({
    where: { userId },
    include: {
      quiz: true,
    },
    orderBy: { completedAt: 'desc' },
    take: 10,
  });
  // Aggregate stats
  const stats = await prisma.quizAttempt.aggregate({
    // what it does is ?
    // WHERE clause - filter which records to include
    // _avg - calculate average of score field
    // _count - calculate count how many id values exist.
    where: { userId },
    _avg: { score: true },
    _count: { id: true },
    _min: { score: true }, // worst score
    _max: { score: true }, // best score
  });
  // it will return object of {_avg : {score : }, _count : {id : }}
  // console.log(stats._avg.score)
  // Category-wise performance using groupBy
  // TODO(human): Implement getCategoryPerformance logic
  const categoryPerformance = await getCategoryPerformance(userId);

  // Calculate improvement: compare recent vs older attempts
  // Filter out attempts with null scores/dates and map to required shape
  const attemptsForImprovement = attempts
    .filter((a) => a.score !== null && a.completedAt !== null)
    .map((a) => ({ score: a.score as number, completedAt: a.completedAt as Date }));
  const improvementScore = calculateImprovement(attemptsForImprovement);

  return {
    recentAttempts: attempts,
    totalAttempts: stats._count.id,
    averageScore: stats._avg.score,
    minScore: stats._min.score,
    maxScore: stats._max.score,
    categoryPerformance,
    improvementScore,
  };
}

/**
 * Get user's performance breakdown by quiz category
 * TODO(human): Implement the groupBy query and data transformation
 */

async function getCategoryPerformance(userId: string) {
  // TODO(human): Use prisma.quizAttempt.groupBy to get average scores per category
  // Return format: [{ category: string, avgScore: number, attemptCount: number }]

  const attempts = await prisma.quizAttempt.findMany({
    where: { userId },
    include: {
      quiz: { select: { category: true } },
    },
  });
  const categoryPerformanceMap: Map<string, { totalScore: number; attemptCount: number }> =
    new Map();
  attempts.forEach((attempt) => {
    const category = attempt.quiz.category;
    const score = attempt.score;
    if (!score) return;
    const currentObject = categoryPerformanceMap.get(category) || null;
    if (!currentObject) {
      categoryPerformanceMap.set(category, { totalScore: score, attemptCount: 1 });
      return;
    }
    categoryPerformanceMap.set(category, {
      totalScore: score + currentObject.totalScore,
      attemptCount: currentObject.attemptCount + 1,
    });
  });
  /*
  const myMap = new Map<string, number>([
    ['one', 1],
    ['two', 2],
  ]);

  const arrayOfObjects = Array.from(myMap, ([key, value]) => ({ key, value }));
  console.log(arrayOfObjects);
  // Output: [ { key: 'one', value: 1 }, { key: 'two', value: 2 } ]


  */
  const result = Array.from(categoryPerformanceMap.entries()).map(
    ([category, { totalScore, attemptCount }]) => ({
      category,
      avgScore: totalScore / attemptCount,
      attemptCount,
    })
    // returning array of object {category, avgScore, attemptCount}
  );
  return result;
}

/**
 * Calculate if user is improving by comparing recent vs older attempts
 */
function calculateImprovement(attempts: { score: number; completedAt: Date }[]): {
  trend: 'improving' | 'declining' | 'stable';
  percentage: number;
} {
  if (attempts.length < 4) {
    return { trend: 'stable', percentage: 0 };
  }

  const midpoint = Math.floor(attempts.length / 2);
  const recentAttempts = attempts.slice(0, midpoint);
  const olderAttempts = attempts.slice(midpoint);

  const recentAvg = recentAttempts.reduce((sum, a) => sum + a.score, 0) / recentAttempts.length;
  const olderAvg = olderAttempts.reduce((sum, a) => sum + a.score, 0) / olderAttempts.length;

  const percentageChange = ((recentAvg - olderAvg) / olderAvg) * 100;

  let trend: 'improving' | 'declining' | 'stable';
  if (percentageChange > 5) trend = 'improving';
  else if (percentageChange < -5) trend = 'declining';
  else trend = 'stable';

  return { trend, percentage: Math.round(percentageChange) };
}
