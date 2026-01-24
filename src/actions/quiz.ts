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
