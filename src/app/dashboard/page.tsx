import { showDashboard } from "@/actions/quiz";
import UserTime from "@/components/UserTime";
import LocalTime from "@/components/LocalTime";

export default async function Dashboard() {
  const data = await showDashboard();
  // recentAttempts give top 10 only
  const {
    recentAttempts,
    totalAttempts,
    averageScore,
    minScore,
    maxScore,
    improvementScore,
    categoryPerformance,
  } = data;

  const font = "'Inter', sans-serif";

  return (
    <div
      className="max-w-2xl mx-auto h-screen p-4 space-y-8 min-h-[calc(100vh - 8rem)] bg-[#f7fafc]"
      style={{ fontFamily: font }}
    >
      <header className="flex items-center justify-center">
        <p className="text-xl font-bold italic text-black">{`Total Attempts: ${totalAttempts}`}</p>
      </header>
      <div className="flex flex-col">
        <div className="flex flex-col space-y-4">
          <h2
            className="text-2xl font-bold text-[#3498db]"
            style={{ fontFamily: font }}
          >
            Recent Attempts
          </h2>
          <ul className="list-none space-y-2">
            {recentAttempts.map((attempt) => (
              <li
                key={attempt.id}
                className="bg-[#f1f5f9] p-2 rounded-md shadow-md"
              >
                <span
                  className="block text-xl font-semibold text-[#212529]"
                  style={{ fontFamily: font }}
                >
                  {attempt.score}
                </span>
                <span
                  className="block text-sm text-gray-500"
                  style={{ fontFamily: font }}
                >
                  {attempt.quiz.timeLimit} seconds.
                </span>
                {/* took help from claude pass this to client */}
                {/* above was showing server time not needed */}
                {/* I want time when user clicks start and user clicks end */}
                <span>
                  <UserTime />
                </span>
                Score: {attempt.score} / {attempt.quiz.questionCount}
              </li>
            ))}
          </ul>
        </div>
        <div className="flex flex-col space-y-4">
          <h2
            className="text-2xl font-bold text-[#3498db]"
            style={{ fontFamily: font }}
          >
            Statistics
          </h2>
          <ul className="list-none space-y-2">
            <li
              className="bg-[#f1f5f9] p-2 rounded-md shadow-md"
              style={{ fontFamily: font }}
            >
              Average Score: {averageScore}
            </li>
            <li
              className="bg-[#f1f5f9] p-2 rounded-md shadow-md"
              style={{ fontFamily: font }}
            >
              Min Score: {minScore}
            </li>
            <li
              className="bg-[#f1f5f9] p-2 rounded-md shadow-md"
              style={{ fontFamily: font }}
            >
              Max Score: {maxScore}
            </li>
            <li
              className="bg-[#f1f5f9] p-2 rounded-md shadow-md"
              style={{ fontFamily: font }}
            >
              Improvement Score: {improvementScore.percentage}%
            </li>
          </ul>
        </div>
        <div className="flex flex-col space-y-4">
          <h2
            className="text-2xl font-bold text-[#3498db]"
            style={{ fontFamily: font }}
          >
            Category Performance
          </h2>
          <ul className="list-none space-y-2">
            {categoryPerformance.map((category) => (
              <li
                key={category.category}
                className="bg-[#f1f5f9] p-2 rounded-md shadow-md flex flex-col justify-center items-center"
                style={{ fontFamily: font }}
              >
                <span className="block text-xl font-semibold text-[#212529]">
                  {category.category}
                </span>
                <span className="block text-sm text-gray-500">
                  Average Score: {category.avgScore.toFixed(2)}% (
                  {category.attemptCount} attempts)
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
