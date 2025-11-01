import { getAllQuestions, getQuestionById } from "@/lib/data";
import { QuestionViewer } from "@/components/question-viewer";
import { notFound } from "next/navigation";

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
  const subject = resolvedSearchParams.subject;
  const bandsParam = resolvedSearchParams.bands;
  const fromReview = resolvedSearchParams.from === 'review';

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
  if (skill && subject) {
    filteredQuestions = allQuestions.filter(
      (q) => q.subject === subject && q.skill_desc === skill
    );
  }

  // Apply difficulty band filter if selected
  if (selectedBands.length > 0) {
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
      subject={subject}
      selectedBands={selectedBands}
      allFilteredQuestions={filteredQuestions}
      isReviewMode={fromReview}
    />
  );
}
