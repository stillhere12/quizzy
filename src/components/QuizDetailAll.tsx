'use client';
import { savequizAttempt } from '@/actions/quiz';
import { Quiz } from '@/lib/types/quiz';
import he from 'he';
import { useRouter } from 'next/navigation';

import { useEffect, useMemo, useState } from 'react';
import ProgressBar from './ProgressBar';

interface QuizDetailProps {
  quiz: Quiz;
}
// particular user -> particular quiz -> some score.
export default function QuizDetailAll({ quiz }: QuizDetailProps) {
  // all at once submit
  // things to focus on : record like structure
  // for each question we have correct option
  // track if entire quiz is submitted.

  const [selections, setSelections] = useState<Record<number, number>>({});
  const [isSubmitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  // implementing timer feature
  const [timeRemain, setTimeRemain] = useState(quiz.timeLimit);
  const minutes = Math.floor(timeRemain / 60);
  const seconds = timeRemain % 60;
  const router = useRouter();
  const solved = Object.keys(selections).length;
  const correctAns = useMemo(() => {
    return quiz.questions.map((question) => {
      return question.options
        .map((option, idx) => (option.isCorrect ? idx : -1))
        .filter((idx) => idx !== -1);
    });
  }, [quiz.questions]);
  function handleSelect(questionIdx: number, optionIdx: number) {
    if (isSubmitted) return;
    // console.log(selections);

    setSelections((prev) => ({ ...prev, [questionIdx]: optionIdx }));
  }
  async function handleSubmit() {
    // as we are trying to store in database it should be async......
    setSubmitted(true);

    // Build userAnswers array and calculate score in one pass
    const userAnswers: {
      questionId: string;
      selectedOptionId: string;
      isCorrect: boolean;
    }[] = [];
    let calculatedScore = 0;

    quiz.questions.forEach((question, idx) => {
      const selectedOptionIdx = selections[idx];

      // Handle unanswered questions (e.g., timer ran out)
      if (selectedOptionIdx === undefined) {
        userAnswers.push({
          questionId: question.id,
          selectedOptionId: question.options[0].id, // Use first option as placeholder
          isCorrect: false,
        });
        return; // Skip to next question
      }

      // what option i selected can be known from selections record
      const selectedOption = question.options[selectedOptionIdx];
      const isCorrect = correctAns[idx].includes(selectedOptionIdx);

      if (isCorrect) calculatedScore++;

      userAnswers.push({
        questionId: question.id,
        selectedOptionId: selectedOption.id,
        isCorrect,
      });
    });

    setScore(calculatedScore);

    // Save to database
    try {
      const attempt = await savequizAttempt({
        quizId: quiz.id,
        score: calculatedScore,
        userAnswers,
      });
      const attemptId = attempt.id;
      // after saving to db now route....
      if (attemptId) {
        router.push(`/quiz/${quiz.id}/results/${attemptId}`);
      }
      // console.log(score);
    } catch (error) {
      console.error('Failed to save quiz attempt:', error);
    }
  }
  const allAnswered = Object.keys(selections).length === quiz.questions.length;
  useEffect(() => {
    // Don't run timer if already submitted or time is up
    if (isSubmitted || timeRemain <= 0) return;

    const intervalId = setInterval(() => {
      setTimeRemain((prev) => {
        // Stop at 0, don't go negative
        if (prev <= 1) return 0;
        return prev - 1;
      });
    }, 1000);

    // Cleanup: clear interval when effect re-runs or component unmounts
    return () => clearInterval(intervalId);
  }, [isSubmitted]); // Re-run when isSubmitted changes to stop timer
  useEffect(() => {
    if (timeRemain <= 0 && !isSubmitted) {
      handleSubmit();
    }
  }, [timeRemain, isSubmitted]);

  return (
    <div className="min-h-screen bg-slate-50 max-w-2xl mx-auto px-6 py-8">
      <div className="text-center text-2xl font-semibold text-slate-700 mb-4">
        ⏱ {minutes}:{seconds.toString().padStart(2, '0')}
      </div>
      <div className="p-2 flex flex-col justify-center items-center">
        <ProgressBar solved={solved} total={quiz.questionCount} />
      </div>
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-2 text-slate-800">{quiz.title}</h1>
        <p className="text-slate-500 mb-6">{quiz.questions.length} questions</p>
      </div>

      <div className="space-y-6">
        {quiz.questions.map((question, idx) => (
          <div key={question.id} className="bg-white p-5 rounded-lg border border-slate-200">
            <p className="font-medium text-slate-700 mb-4">
              {idx + 1}. {he.decode(question.text)}
            </p>
            <div className="flex flex-col gap-2">
              {question.options.map((option, optionIdx) => {
                const isSelected = selections[idx] === optionIdx;
                return (
                  <button
                    key={option.id}
                    onClick={() => handleSelect(idx, optionIdx)}
                    disabled={isSubmitted}
                    className={`p-3 text-left rounded-lg border transition-all
                      ${
                        isSelected
                          ? 'border-slate-400 bg-slate-100 text-slate-800'
                          : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                      }
                      ${isSubmitted ? 'cursor-not-allowed' : 'cursor-pointer'}
                      ${isSubmitted && isSelected ? (option.isCorrect ? 'bg-emerald-100 border-emerald-300' : 'bg-rose-100 border-rose-300') : ''}
                      ${isSubmitted && !isSelected ? 'opacity-60' : ''}
                    `}
                  >
                    {he.decode(option.text)} {isSelected && <span className="float-right">✓</span>}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 text-center text-slate-500">
        {allAnswered
          ? 'Ready to submit!'
          : `Answer all questions (${Object.keys(selections).length}/${quiz.questions.length})`}
      </div>

      {!isSubmitted ? (
        <button
          onClick={handleSubmit}
          disabled={!allAnswered}
          className={`mt-4 w-full py-3 rounded-lg font-medium transition-colors
            ${
              allAnswered
                ? 'bg-slate-800 text-white hover:bg-slate-700'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }
          `}
        >
          Submit Quiz
        </button>
      ) : (
        <div className="mt-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-center">
          <p className="text-emerald-700 font-bold text-xl">
            Score: {score} / {quiz.questions.length}
          </p>
        </div>
      )}
    </div>
  );
}
