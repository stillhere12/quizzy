import he from 'he';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getQuizAttemptById } from '../../../../../actions/quiz';
import Card from '../../../../../components/Card';

export default async function ResultsAttempt({
  params,
}: {
  params: Promise<{ id: string; attemptId: string }>;
}) {
  const { id, attemptId } = await params;
  const gotQuizAttempt = await getQuizAttemptById(attemptId);
  if (!gotQuizAttempt) {
    console.log('Quiz attempt not found');
    return notFound();
  }
  const total = gotQuizAttempt.userAnswers.length;
  const correct = gotQuizAttempt.userAnswers.filter((answer) => answer.isCorrect).length;
  const percentage = Math.round((correct / total) * 100);
  const getScore = () => {
    if (percentage >= 90) return { text: 'Excellent!', color: 'text-emerald-600' };
    if (percentage >= 70) return { text: 'Great job!', color: 'text-blue-600' };
    if (percentage >= 50) return { text: 'Good effort!', color: 'text-amber-600' };
    return { text: 'Keep practicing!', color: 'text-rose-600' };
  };
  return (
    <main className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-2xl mx-auto px-6">
        {/* Score Header */}
        <div className="bg-white rounded-xl p-8 text-center mb-8 border border-slate-200">
          <h1 className="text-2xl font-bold text-slate-800">{gotQuizAttempt.quiz.title}</h1>
          <p className="text-4xl font-bold mt-4 text-slate-800">{percentage}%</p>
          <p className="text-slate-500 mt-1">
            {correct}/{total} correct
          </p>
          <p className={`mt-2 font-medium ${getScore().color}`}>{getScore().text}</p>
        </div>
        <ul>
          {gotQuizAttempt.userAnswers.map((answer, index) => (
            <li key={answer.id}>
              <p className="font-medium text-slate-500 mb-2 text-sm">Question {index + 1}</p>
              <Card
                question={he.decode(answer.question.text)}
                options={answer.question.options}
                selectedOptionId={answer.selectedOptionId}
              />
            </li>
          ))}
        </ul>
        <div className="mt-8 flex gap-4 justify-center">
          <Link
            href="/quizzes"
            className="px-6 py-3 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition"
          >
            Back to quizzes
          </Link>
          <Link
            href={`/quiz/${id}`}
            className="px-6 py-3 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition"
          >
            Retake quiz
          </Link>
        </div>
      </div>
    </main>
  );
}
