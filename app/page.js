import { getAllQuestions } from "@/lib/data";
import { FilterProvider } from "@/contexts/filter-context";
import { FilterPanel } from "@/components/filter-panel";
import { QuestionCountSummary } from "@/components/question-count-summary";
import { Header } from "@/components/header";

// Force dynamic rendering to avoid ISR page size limit
export const dynamic = 'force-dynamic';

/**
 * Extract only the minimal fields needed for filtering and display
 * This reduces payload from 14.2 MB to ~200 KB
 */
function getMinimalQuestionData(questions) {
  return questions.map(q => ({
    questionId: q.questionId,
    subject: q.subject,
    primary_class_cd_desc: q.primary_class_cd_desc,
    skill_desc: q.skill_desc,
    score_band_range_cd: q.score_band_range_cd,
  }));
}

/**
 * Home Page - Test Page
 *
 * This is a React Server Component that fetches questions server-side
 * and renders the home page content.
 */
export default async function Home() {
  // Load all questions on the server
  const allQuestions = await getAllQuestions();

  // Extract only minimal data needed for filtering (reduces from 14.2 MB to ~200 KB)
  const minimalQuestions = getMinimalQuestionData(allQuestions);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <Header />
        <FilterProvider>
          <FilterPanel />
          <QuestionCountSummary allQuestions={minimalQuestions} />
        </FilterProvider>
      </div>
    </div>
  );
}
