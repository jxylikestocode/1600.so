import { getAllQuestions, getQuestionById } from "@/lib/data";
import { QuestionViewer } from "@/components/question-viewer";
import { notFound } from "next/navigation";

// Force dynamic rendering to avoid ISR page size limit
export const dynamic = 'force-dynamic';

/**
 * Question Page
 *
 * Dynamic route that displays a single question
 * URL: /question/[questionId]?skill=SkillName&subject=math
 */
export default async function QuestionPage({ params, searchParams }) {
  // In Next.js 16, params and searchParams are Promises
  const { id } = await params;
  const resolvedSearchParams = await searchParams;
  const skill = resolvedSearchParams.skill;
  const domain = resolvedSearchParams.domain;
  const subject = resolvedSearchParams.subject;
  const bandsParam = resolvedSearchParams.bands;
  const fromReview = resolvedSearchParams.from === 'review';
  const reviewFilter = resolvedSearchParams.filter || 'all';

  // Parse selected bands from URL
  const selectedBands = bandsParam
    ? bandsParam.split(',').map(b => parseInt(b, 10))
    : [];

  // Get the current question
  const question = await getQuestionById(id);

  if (!question) {
    notFound();
  }

  // Get all questions to find next/prev within filtered set
  const allQuestions = await getAllQuestions();

  // Filter questions by skill and difficulty bands if provided
  let filteredQuestions = allQuestions;

  if (fromReview) {
    // If from review page, filter based on review filter type
    // This would need access to user data, which is client-side only
    // For now, we'll pass the filter type to the client component
    // and let it handle the filtering
    filteredQuestions = allQuestions; // Will be filtered on client side
  } else if (skill && subject) {
    // Filter by specific skill
    filteredQuestions = allQuestions.filter(
      (q) => q.subject === subject && q.skill_desc === skill
    );
  } else if (domain && subject) {
    // Filter by domain (category)
    filteredQuestions = allQuestions.filter(
      (q) => q.subject === subject && q.primary_class_cd_desc === domain
    );
  } else if (subject) {
    // Filter by subject only
    filteredQuestions = allQuestions.filter(
      (q) => q.subject === subject
    );
  }

  // Apply difficulty band filter if selected (only if not from review)
  if (!fromReview && selectedBands.length > 0) {
    filteredQuestions = filteredQuestions.filter(
      (q) => selectedBands.includes(q.score_band_range_cd)
    );
  }

  // Find current question index in filtered list
  const currentIndex = filteredQuestions.findIndex(
    (q) => q.questionId === id
  );

  // Get prev/next question IDs
  const prevQuestion =
    currentIndex > 0 ? filteredQuestions[currentIndex - 1] : null;
  const nextQuestion =
    currentIndex < filteredQuestions.length - 1
      ? filteredQuestions[currentIndex + 1]
      : null;

  return (
    <QuestionViewer
      question={question}
      currentIndex={currentIndex + 1}
      totalQuestions={filteredQuestions.length}
      prevQuestionId={prevQuestion?.questionId}
      nextQuestionId={nextQuestion?.questionId}
      skill={skill}
      domain={domain}
      subject={subject}
      selectedBands={selectedBands}
      allFilteredQuestions={filteredQuestions}
      isReviewMode={fromReview}
      reviewFilter={reviewFilter}
    />
  );
}
