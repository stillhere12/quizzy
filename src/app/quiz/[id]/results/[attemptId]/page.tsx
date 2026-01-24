import he from 'he';
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
  const optionsProps = gotQuizAttempt.userAnswers.map((answer) => {
    return {
      text: answer.question.text,
      isCorrect: answer.isCorrect,
    };
  });
  return (
    <main className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-2xl mx-auto px-6">
        {/* Score Header */}
        <div className="bg-white rounded-xl p-8 text-center mb-8">
          <h1 className="text-2xl font-bold">{gotQuizAttempt.quiz.title}</h1>
          <p className="text-3xl font-bold mt-4">{percentage}%</p>
          <p>
            {correct}/{total} correct
          </p>
          <p className={getScore().color}>{getScore().text}</p>
        </div>
        <ul>
          {gotQuizAttempt.userAnswers.map((answer) => (
            <li key={answer.id}>
              <Card
                question={he.decode(answer.question.text)}
                options={answer.question.options}
                selectedOptionId={answer.selectedOptionId}
              />
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
