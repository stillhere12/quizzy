import { getQuizById } from '@/actions/quiz';
import { quizIdSchema } from '@/lib/schemas/quiz';
import { notFound } from 'next/navigation';
import QuizDetailAll from '../../../components/QuizDetailAll';

export default async function QuizPage({ params }: { params: { id: string } }) {
  // this is a server component so i can direclty call the db
  let quiz;
  try {
    const resolvedParams = await (params as unknown as Promise<{ id: string }>);
    const validatedId = quizIdSchema.parse(resolvedParams.id);
    quiz = await getQuizById(validatedId);
  } catch (error: unknown) {
    notFound();
  }
  if (!quiz) {
    notFound();
  }

  return (
    <div className="bg-white">
      <QuizDetailAll quiz={quiz}/>
    </div>
  );
}
