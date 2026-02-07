import { getQuizzes } from '@/actions/quiz';
import QuizzesPageInteraction from '@/components/QuizzesPageInteraction';
import SignedInUser from '@/components/SignedInUser';
import Link from 'next/link';

const difficultyColors = {
  EASY: 'bg-emerald-100 text-emerald-700',
  MEDIUM: 'bg-amber-100 text-amber-700',
  HARD: 'bg-rose-100 text-rose-700',
};

export default async function Quizzes() {
  const quizzes = await getQuizzes();
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow mb-8 text-center">
          <h1 className="text-2xl font-semibold text-slate-800 mb-8">Quizzes</h1>
          <Link href="/dashboard" className="bg-blue-200 text-blue-600 px-4 py-2 rounded-md">
            Dashboard
          </Link>
        </div>
        {quizzes.length === 0 ? (
          <p className="text-slate-500">No quizzes available.</p>
        ) : (
          <div className="grid gap-4">
            {quizzes.map((quiz) => (
              <div
                key={quiz.id}
                className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-between gap-4 flex-wrap">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-lg font-medium text-slate-800">{quiz.title}</h2>
                      <span
                        className={`text-xs font-medium px-2 py-1 rounded-full ${difficultyColors[quiz.difficulty]}`}
                      >
                        {quiz.difficulty}
                      </span>
                    </div>

                    <p className="text-slate-500 text-sm mb-4">{quiz.description}</p>

                    <div className="flex gap-6 text-sm text-slate-400">
                      <span>{quiz.questionCount} questions</span>
                      <span>{Math.floor(quiz.timeLimit / 60)} min</span>
                      <span>{quiz.category}</span>
                    </div>
                  </div>

                  <button>
                    <QuizzesPageInteraction quizId={quiz.id} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        <SignedInUser />
      </div>
    </main>
  );
}
