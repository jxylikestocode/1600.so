import { getAllQuestions } from "@/lib/data";
import { FilterProvider } from "@/contexts/filter-context";
import { FilterPanel } from "@/components/filter-panel";
import { QuestionCountSummary } from "@/components/question-count-summary";

/**
 * Home Page - Test Page
 *
 * This is a temporary page to test our data layer
 * This is a React Server Component (default in Next.js App Router)
 *
 * Server Components:
 * - Run on the server during build or request
 * - Can directly call async functions
 * - Cannot use React hooks (useState, useEffect, etc.)
 * - Cannot use browser APIs
 */
export default async function Home() {
  // Load all questions on the server
  const allQuestions = await getAllQuestions();

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <h1 className="text-4xl font-bold mb-8">1600.so - SAT Question Bank</h1>

        {/* Wrap everything in FilterProvider so filters work */}
        <FilterProvider>
          {/* Filter Panel */}
          <FilterPanel />

          {/* Question Count Summary - now updates based on filters */}
          <QuestionCountSummary allQuestions={allQuestions} />
        </FilterProvider>
      </div>
    </div>
  );
}
