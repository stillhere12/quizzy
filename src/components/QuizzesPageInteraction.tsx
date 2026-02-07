"use client";
import Link from "next/link";
interface QuizzesPageInteractionProps {
  quizId: string;
}
export default function QuizzesPageInteraction({
  quizId,
}: QuizzesPageInteractionProps) {
  function recordCurrentTime() {
    const utcDate = new Date();
    console.log(utcDate);
    return utcDate;
  }
  return (
    <div>
      <Link
        href={`/quiz/${quizId}`}
        className="bg-blue-200 text-blue-600 px-4 py-2 rounded-md"
        onClick={() => {
          recordCurrentTime();
        }}
      >
        Start
      </Link>
    </div>
  );
}
