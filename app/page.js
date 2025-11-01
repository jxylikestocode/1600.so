import { getAllQuestions } from "@/lib/data";
import { FilterProvider } from "@/contexts/filter-context";
import { FilterPanel } from "@/components/filter-panel";
import { QuestionCountSummary } from "@/components/question-count-summary";
import Link from "next/link";
import { BarChart3, BookMarked } from "lucide-react";

// Force dynamic rendering to avoid ISR page size limit
export const dynamic = 'force-dynamic';

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
        {/* Header with Navigation */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold">1600.so - SAT Question Bank</h1>

          <div className="flex items-center gap-3">
            <Link
              href="/stats"
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-700 font-medium"
            >
              <BarChart3 className="w-4 h-4" />
              <span>My Progress</span>
            </Link>
            <Link
              href="/review"
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-700 font-medium"
            >
              <BookMarked className="w-4 h-4" />
              <span>Review</span>
            </Link>
          </div>
        </div>

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
