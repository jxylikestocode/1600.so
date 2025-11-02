"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useUserData } from '@/contexts/user-data-context';
import { ArrowLeft, Bookmark, XCircle, CheckCircle, ShieldCheck, ChevronLeft, ChevronRight } from 'lucide-react';

export default function ReviewPage() {
  const router = useRouter();
  const userData = useUserData();
  const [allQuestions, setAllQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'bookmarked', 'incorrect', 'correct', 'correct-with-prior-incorrect'
  const [currentPage, setCurrentPage] = useState(1);
  const questionsPerPage = 10;

  // Load only the questions the user has interacted with
  useEffect(() => {
    async function loadQuestions() {
      try {
        // Get all question IDs the user has interacted with
        const bookmarkedIds = userData.bookmarks || [];
        const answeredQuestions = userData.getAllAnsweredQuestions();
        const answeredIds = Object.keys(answeredQuestions);

        // Combine all unique IDs
        const allReviewedIds = [...new Set([...bookmarkedIds, ...answeredIds])];

        // If no questions to review, just finish loading
        if (allReviewedIds.length === 0) {
          setAllQuestions([]);
          setLoading(false);
          return;
        }

        // Fetch only the questions we need
        const response = await fetch(`/api/questions/batch?ids=${allReviewedIds.join(',')}`);
        if (!response.ok) throw new Error('Failed to load questions');
        const questions = await response.json();
        setAllQuestions(questions);
      } catch (error) {
        console.error('Error loading questions:', error);
      } finally {
        setLoading(false);
      }
    }

    loadQuestions();
  }, [userData]);

  // Reset to page 1 when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filter]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mb-4"></div>
          <div className="text-2xl font-bold text-gray-900 mb-2 animate-pulse">Loading...</div>
        </div>
      </div>
    );
  }

  // Get question lists
  const bookmarkedIds = userData.bookmarks || [];
  const incorrectIds = userData.getIncorrectQuestionIds();
  const answeredQuestions = userData.getAllAnsweredQuestions();
  const correctIds = Object.entries(answeredQuestions)
    .filter(([, history]) => history.lastCorrect)
    .map(([id]) => id);
  const correctWithPriorIncorrectIds = Object.entries(answeredQuestions)
    .filter(([, history]) => history.lastCorrect && history.attempts.length > 1)
    .map(([id]) => id);

  // Filter questions based on selection
  let filteredQuestions = [];
  let filterTitle = 'All Reviewed Questions';
  let filterIcon = null;

  switch (filter) {
    case 'bookmarked':
      filteredQuestions = allQuestions.filter(q => bookmarkedIds.includes(q.questionId));
      filterTitle = 'Bookmarked Questions';
      filterIcon = <Bookmark className="w-5 h-5 text-yellow-600" />;
      break;
    case 'incorrect':
      filteredQuestions = allQuestions.filter(q => incorrectIds.includes(q.questionId));
      filterTitle = 'Incorrect Answers';
      filterIcon = <XCircle className="w-5 h-5 text-red-600" />;
      break;
    case 'correct':
      filteredQuestions = allQuestions.filter(q => correctIds.includes(q.questionId));
      filterTitle = 'Correct Answers';
      filterIcon = <CheckCircle className="w-5 h-5 text-green-600" />;
      break;
    case 'correct-with-prior-incorrect':
      filteredQuestions = allQuestions.filter(q => correctWithPriorIncorrectIds.includes(q.questionId));
      filterTitle = 'Correct (with prior incorrect)';
      filterIcon = <ShieldCheck className="w-5 h-5 text-green-600" />;
      break;
    default:
      const allReviewedIds = new Set([...bookmarkedIds, ...Object.keys(answeredQuestions)]);
      filteredQuestions = allQuestions.filter(q => allReviewedIds.has(q.questionId));
      filterTitle = 'All Reviewed Questions';
  }

  const hasAnyProgress = Object.keys(answeredQuestions).length > 0 || bookmarkedIds.length > 0;

  // Pagination calculations
  const totalPages = Math.ceil(filteredQuestions.length / questionsPerPage);
  const startIndex = (currentPage - 1) * questionsPerPage;
  const endIndex = startIndex + questionsPerPage;
  const paginatedQuestions = filteredQuestions.slice(startIndex, endIndex);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => router.push("/")}
              className="text-2xl font-bold text-gray-900 hover:text-blue-600 transition-colors"
            >
              1600.so
            </button>
          </div>
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="outline"
              onClick={() => router.push('/')}
              size="sm"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Practice
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Review Questions</h1>
              <p className="text-gray-600 mt-1">Review your bookmarked and attempted questions</p>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              onClick={() => setFilter('all')}
              size="sm"
            >
              All ({Object.keys(answeredQuestions).length + bookmarkedIds.length})
            </Button>
            <Button
              variant={filter === 'bookmarked' ? 'default' : 'outline'}
              onClick={() => setFilter('bookmarked')}
              size="sm"
            >
              <Bookmark className="w-4 h-4 mr-1" />
              Bookmarked ({bookmarkedIds.length})
            </Button>
            <Button
              variant={filter === 'incorrect' ? 'default' : 'outline'}
              onClick={() => setFilter('incorrect')}
              size="sm"
            >
              <XCircle className="w-4 h-4 mr-1" />
              Incorrect ({incorrectIds.length})
            </Button>
            <Button
              variant={filter === 'correct' ? 'default' : 'outline'}
              onClick={() => setFilter('correct')}
              size="sm"
            >
              <CheckCircle className="w-4 h-4 mr-1" />
              Correct ({correctIds.length})
            </Button>
            <Button
              variant={filter === 'correct-with-prior-incorrect' ? 'default' : 'outline'}
              onClick={() => setFilter('correct-with-prior-incorrect')}
              size="sm"
            >
              <ShieldCheck className="w-4 h-4 mr-1" />
              Correct (with prior incorrect) ({correctWithPriorIncorrectIds.length})
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {!hasAnyProgress ? (
          // Empty State
          <Card className="p-12 text-center">
            <div className="text-6xl mb-4">📚</div>
            <div className="text-2xl font-bold text-gray-900 mb-2">No Questions to Review</div>
            <div className="text-gray-600 mb-6">
              Start answering questions and bookmarking them to build your review list!
            </div>
            <Button onClick={() => router.push('/')}>
              Start Practicing
            </Button>
          </Card>
        ) : filteredQuestions.length === 0 ? (
          // No results for current filter
          <Card className="p-12 text-center">
            <div className="text-6xl mb-4">🔍</div>
            <div className="text-2xl font-bold text-gray-900 mb-2">
              No {filter === 'bookmarked' ? 'Bookmarked' : filter === 'incorrect' ? 'Incorrect' : filter === 'correct' ? 'Correct' : filter === 'correct-with-prior-incorrect' ? 'Correct (with prior incorrect)' : ''} Questions
            </div>
            <div className="text-gray-600 mb-6">
              {filter === 'bookmarked' && "Use the 'Mark for Review' button to bookmark questions."}
              {filter === 'incorrect' && "Great! You haven't gotten any questions wrong yet."}
              {filter === 'correct' && "Start answering questions correctly to see them here."}
              {filter === 'correct-with-prior-incorrect' && "No questions where you got correct after previous incorrect attempts."}
            </div>
            <div className="flex gap-3 justify-center">
              <Button onClick={() => setFilter('all')} variant="outline">
                View All
              </Button>
              <Button onClick={() => router.push('/')}>
                Continue Practicing
              </Button>
            </div>
          </Card>
        ) : (
          <>
            {/* Results Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                {filterIcon}
                <h2 className="text-2xl font-bold text-gray-900">
                  {filterTitle}
                  <span className="text-gray-500 font-normal ml-2">
                    ({filteredQuestions.length} {filteredQuestions.length === 1 ? 'question' : 'questions'})
                  </span>
                </h2>
              </div>
              {totalPages > 1 && (
                <div className="text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </div>
              )}
            </div>

            {/* Question List */}
            <div className="space-y-3">
              {paginatedQuestions.map((question, index) => {
                const absoluteIndex = startIndex + index;
                const history = userData.getQuestionHistory(question.questionId);
                const isBookmarked = bookmarkedIds.includes(question.questionId);
                const isCorrect = history?.lastCorrect;
                const attempts = history?.attempts?.length || 0;

                // Get question stem preview - SHOW FULL CONTENT FOR NOW
                let questionPreview = '';
                if (Array.isArray(question.detail)) {
                  // Math format
                  questionPreview = question.detail[0]?.stem || '';
                } else {
                  // Reading format
                  questionPreview = question.detail?.stem || '';
                }

                // Don't truncate for debugging - show everything
                // (We'll optimize this later once tables work)

                return (
                  <Card
                    key={question.questionId}
                    className="p-4 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => router.push(`/question/${question.questionId}?from=review&filter=${filter}`)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge variant="outline">
                            Question {absoluteIndex + 1}
                          </Badge>

                          {/* Question ID */}
                          <span className="text-xs text-gray-400 font-mono">
                            ID: {question.questionId}
                          </span>

                          {/* Status Badges */}
                          {isBookmarked && (
                            <Badge className="bg-yellow-100 text-yellow-800">
                              <Bookmark className="w-3 h-3 mr-1 fill-yellow-600" />
                              Bookmarked
                            </Badge>
                          )}
                          {history && (
                            <Badge
                              className={
                                isCorrect
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }
                            >
                              {isCorrect ? (
                                <>
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Correct
                                </>
                              ) : (
                                <>
                                  <XCircle className="w-3 h-3 mr-1" />
                                  Incorrect
                                </>
                              )}
                            </Badge>
                          )}
                          {attempts > 0 && (
                            <span className="text-sm text-gray-500">
                              {attempts} {attempts === 1 ? 'attempt' : 'attempts'}
                            </span>
                          )}
                        </div>

                        <div className="space-y-2">
                          <div className="font-medium text-gray-900">
                            {question.skill_desc}
                          </div>

                          {/* Question Preview */}
                          {questionPreview && (
                            <div
                              className="text-sm leading-relaxed max-w-none question-preview"
                              dangerouslySetInnerHTML={{ __html: questionPreview }}
                              style={{
                                display: 'block',
                                width: '100%'
                              }}
                            />
                          )}

                          <div className="text-sm text-gray-600 flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {question.subject === 'math' ? 'Math' : 'Reading & Writing'}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {question.primary_class_cd_desc}
                            </Badge>
                            <Badge
                              className={`text-xs ${
                                question.difficulty === 'E'
                                  ? 'bg-green-100 text-green-800'
                                  : question.difficulty === 'M'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {question.difficulty === 'E' ? 'Easy' : question.difficulty === 'M' ? 'Medium' : 'Hard'}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      <Button size="sm" variant="outline">
                        Review
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Previous
                </Button>

                <div className="flex items-center gap-1">
                  {/* Show first page */}
                  {currentPage > 3 && (
                    <>
                      <Button
                        variant={currentPage === 1 ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(1)}
                      >
                        1
                      </Button>
                      {currentPage > 4 && (
                        <span className="px-2 text-gray-500">...</span>
                      )}
                    </>
                  )}

                  {/* Show pages around current page */}
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(page => {
                      return page === currentPage ||
                             page === currentPage - 1 ||
                             page === currentPage + 1 ||
                             page === currentPage - 2 ||
                             page === currentPage + 2;
                    })
                    .filter(page => page > 0 && page <= totalPages)
                    .map(page => (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </Button>
                    ))}

                  {/* Show last page */}
                  {currentPage < totalPages - 2 && (
                    <>
                      {currentPage < totalPages - 3 && (
                        <span className="px-2 text-gray-500">...</span>
                      )}
                      <Button
                        variant={currentPage === totalPages ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(totalPages)}
                      >
                        {totalPages}
                      </Button>
                    </>
                  )}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            )}

            {/* Practice All Button */}
            {filteredQuestions.length > 0 && (
              <Card className="p-6 mt-8 text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Ready to practice these questions?
                </h3>
                <p className="text-gray-600 mb-4">
                  Review all {filteredQuestions.length} questions in sequence
                </p>
                <Button
                  onClick={() => {
                    if (filteredQuestions[0]) {
                      router.push(`/question/${filteredQuestions[0].questionId}?from=review&filter=${filter}`);
                    }
                  }}
                >
                  Start Review Session
                </Button>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}
