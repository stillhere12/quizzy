'use client';
import { Quiz } from '@/lib/types/quiz';
import he from 'he';
import { useMemo, useState } from 'react';

interface QuizDetailProps {
  quiz: Quiz;
}

export default function QuizDetailIndividual({ quiz }: QuizDetailProps) {
  const [selections, setSelections] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState<Record<number, boolean>>({});
  const [score, setScore] = useState(0);

  // Memoize correct answers - only recalculate when quiz changes
  const correctAnswers = useMemo(() => {
    // it is returning array of array.....
    // what we are essentially doing is that for each question we have multiple options
    // we choose the correct option else we store undefined for it.......
    // this should be a pure function.....
    return quiz.questions.map((question) => {
      return question.options
        .map((option, idx) => (option.isCorrect ? idx : -1))
        .filter((idx) => idx !== -1);
    });
  }, [quiz.questions]);

  function handleChoose(questionIdx: number, optionIdx: number) {
    if (submitted[questionIdx]) return;
    setSelections((prev) => ({
      ...prev,
      [questionIdx]: optionIdx,
      // the above is just index linkage to other value......
    }));
  }

  function handleSubmit(questionIdx: number) {
    const selectedOption = selections[questionIdx];
    if (selectedOption === undefined) return; // No option selected
    // console.log(correctAnswers);
    const isCorrect = correctAnswers[questionIdx].includes(selectedOption);
    if (isCorrect) {
      setScore((prev) => prev + 1);
    }
    setSubmitted((prev) => ({
      ...prev,
      [questionIdx]: true,
    }));
  }

  function getOptionStyle(questionIdx: number, optionIdx: number): string {
    return 'border-2 border-black m-1 p-2 rounded-md hover:cursor-pointer';
  }
  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 bg-white rounded-lg shadow-md">
      <div className="mb-6 text-center space-y-3">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{quiz.title}</h1>
        <p className="text-sm text-gray-500">
          Category: {quiz.category} | Difficulty: {quiz.difficulty}
        </p>
        <p className="mt-4 text-lg text-gray-700">{quiz.description}</p>
        <p className="mt-2 text-md font-semibold text-green-600">
          Score: {score} / {quiz.questions.length}
        </p>
      </div>
      <div>
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Questions</h2>
        <ul className="space-y-8">
          {quiz.questions.map((question, questionIdx) => (
            <li key={question.id} className="bg-gray-50 p-6 rounded-lg border-2 border-blue-300">
              <p className="font-semibold text-lg text-gray-800 mb-4">
                {questionIdx + 1}. {he.decode(question.text)}
              </p>
              <div className="flex flex-col gap-3">
                {question.options.map((option, optionIdx) => (
                  <button
                    key={option.id}
                    className={getOptionStyle(questionIdx, optionIdx)}
                    onClick={() => handleChoose(questionIdx, optionIdx)}
                    disabled={submitted[questionIdx]}
                  >
                    <div className="w-full flex justify-between items-center">
                      <span>{he.decode(option.text)}</span>
                      {selections[questionIdx] === optionIdx && (
                        <span className="text-blue-600">✓ Selected</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
              <div className="text-center mt-4">
                {!submitted[questionIdx] ? (
                  <button
                    className="w-1/4 border-2 border-black m-2 p-2 rounded-md hover:cursor-pointer hover:bg-gray-200 disabled:opacity-50"
                    onClick={() => handleSubmit(questionIdx)}
                    disabled={selections[questionIdx] === undefined}
                  >
                    Submit
                  </button>
                ) : (
                  <p
                    className={
                      correctAnswers[questionIdx].includes(selections[questionIdx])
                        ? 'text-green-600 font-semibold'
                        : 'text-red-600 font-semibold'
                    }
                  >
                    {correctAnswers[questionIdx].includes(selections[questionIdx])
                      ? '✓ Correct!'
                      : '✗ Incorrect'}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
