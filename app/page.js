import { getAllQuestions } from "@/lib/data";
import { FilterProvider } from "@/contexts/filter-context";
import { FilterPanel } from "@/components/filter-panel";
import { QuestionCountSummary } from "@/components/question-count-summary";
import { Header } from "@/components/header";

// Force dynamic rendering to avoid ISR page size limit
export const dynamic = 'force-dynamic';

/**
 * Home Page - Test Page
 *
 * This is a React Server Component that fetches questions server-side
 * and renders the home page content.
 */
export default async function Home() {
  // Load all questions on the server
  const allQuestions = await getAllQuestions();

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <Header />
        <FilterProvider>
          <FilterPanel allQuestions={allQuestions} />
          <QuestionCountSummary allQuestions={allQuestions} />
        </FilterProvider>
      </div>
    </div>
  );
}
