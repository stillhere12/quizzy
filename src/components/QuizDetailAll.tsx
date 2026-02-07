"use client";
import { savequizAttempt } from "@/actions/quiz";
import { Quiz } from "@/lib/types/quiz";
import { confetti } from "@tsparticles/confetti";
import he from "he";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import ProgressBar from "./ProgressBar";
import { log } from "console";

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
    // check if it is correct
    return correctAns[questionIdx].includes(optionIdx);
  }
  function handleCelebration() {
    confetti("tsparticles", {
      count: 100,
      spread: 70,
      origin: { y: 0.6 },
    });
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
        console.log("debug", attemptId);
      }
      // console.log(score);
    } catch (error) {
      console.error("Failed to save quiz attempt:", error);
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
      console.log("debug", timeRemain);
      handleSubmit();
    }
  }, [timeRemain, isSubmitted]);

  return (
    <div className="min-h-screen bg-slate-50 max-w-2xl mx-auto px-6 py-8">
      {/* Timer — pill turns amber at 30s, rose at 10s */}
      <div className="flex justify-center mb-5">
        <div
          className={`gap-2 px-4 py-1.5 rounded-full border text-sm font-semibold transition-colors ${
            timeRemain <= 10
              ? "bg-rose-50 border-rose-200 text-rose-700"
              : timeRemain <= 30
              ? "bg-amber-50 border-amber-200 text-amber-700"
              : "bg-white border-slate-200 text-slate-700 shadow-sm"
          }`}
        >
          ⏱ {minutes}:{seconds.toString().padStart(2, "0")}
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-8 p-1 rounded-full flex justify-center">
        <ProgressBar solved={solved} total={quiz.questionCount} />
      </div>

      {/* Quiz header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-slate-800 mb-1">{quiz.title}</h1>
        <p className="text-sm text-slate-500">
          {quiz.questions.length} questions
        </p>
      </div>

      {/* Question cards */}
      <div className="space-y-4">
        {quiz.questions.map((question, idx) => (
          <div
            key={question.id}
            className="bg-white rounded-xl border border-slate-200 shadow-sm p-5"
          >
            {/* Question number badge + text */}
            <div className="flex items-start gap-3 mb-4">
              <span className="inline-flex items-center justify-center min-w-[28px] h-7 rounded-full bg-slate-100 text-slate-600 text-xs font-bold">
                {idx + 1}
              </span>
              <p className="font-medium text-slate-700 leading-relaxed">
                {he.decode(question.text)}
              </p>
            </div>

            {/* Options — indented to align under question text (badge 28px + gap 12px = 40px) */}
            <div className="flex flex-col gap-2 pl-[40px]">
              {question.options.map((option, optionIdx) => {
                const isSelected = selections[idx] === optionIdx;
                return (
                  <button
                    key={option.id}
                    onClick={() => {
                      if (handleSelect(idx, optionIdx)) {
                        handleCelebration();
                      }
                    }}
                    disabled={isSubmitted}
                    className={`flex items-center gap-3 py-2 px-3 rounded-lg transition-colors ${
                      isSelected
                        ? "bg-sky-50 border-sky-200 text-sky-700"
                        : "border-slate-200 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <span>{he.decode(option.text)}</span>
                    {isSelected && <span>✓</span>}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Answered count */}
      <p className="mt-6 text-center text-sm text-slate-500">
        {allAnswered
          ? "All questions answered — ready to submit!"
          : `${Object.keys(selections).length} of ${
              quiz.questions.length
            } answered`}
      </p>

      {/* Submit button / Score card */}
      {!isSubmitted ? (
        <button
          onClick={handleSubmit}
          disabled={!allAnswered}
          className={`mt-4 w-full py-3 rounded-xl font-semibold text-sm transition-all ${
            allAnswered
              ? "bg-slate-800 text-white hover:bg-slate-700 shadow-sm"
              : "bg-slate-200 text-slate-400 cursor-not-allowed"
          }`}
        >
          Submit Quiz
        </button>
      ) : (
        <div className="mt-6 p-5 bg-emerald-50 border border-emerald-200 rounded-xl text-center shadow-sm">
          <p className="text-emerald-600 text-sm font-medium mb-1">
            Your Score
          </p>
          <p className="text-emerald-800 font-bold text-3xl">
            {score}{" "}
            <span className="text-lg font-medium text-emerald-600">
              / {quiz.questions.length}
            </span>
          </p>
          <p className="text-sm text-emerald-600">
            Time taken: {minutes}:{seconds.toString().padStart(2, "0")}
          </p>
          <button className="mt-4 w-full py-3 rounded-xl font-semibold text-sm transition-all bg-slate-800 text-white hover:bg-slate-700 shadow-sm">
            <Link href="/quizzes">Go back to quizzes</Link>
          </button>
          <Link href="/dashboard">
            <button className="mt-4 w-full py-3 rounded-xl font-semibold text-sm transition-all bg-slate-800 text-white hover:bg-slate-700 shadow-sm">
              Dashboard
            </button>
          </Link>
        </div>
      )}
    </div>
  );
}
