"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  ChevronLeft,
  ChevronRight,
  Shuffle,
  EyeOff,
  Eye,
  Clock,
  Bookmark,
  Calculator,
  FileText,
  X,
  ChevronDown,
  ChevronUp,
  MapPin,
  ArrowLeft,
  Check,
} from "lucide-react";
import { DesmosCalculator } from "@/components/desmos-calculator";
import { ReferenceSheet } from "@/components/reference-sheet";
import { useUserData } from "@/contexts/user-data-context";
import { trackAnswer, trackFeature, trackNavigation } from "@/lib/analytics";

/**
 * QuestionViewer Component
 *
 * Displays a single question with SAT Bluebook-style interface
 */
export function QuestionViewer({
  question,
  currentIndex,
  totalQuestions,
  prevQuestionId,
  nextQuestionId,
  skill,
  subject,
  selectedBands,
  allFilteredQuestions,
  isReviewMode = false,
  reviewFilter = 'all',
}) {
  const router = useRouter();
  const userData = useUserData();

  const [selectedChoice, setSelectedChoice] = useState(null);
  const [textAnswer, setTextAnswer] = useState(""); // For SPR (text input) questions
  const [jumpToInput, setJumpToInput] = useState("");
  const [markedForReview, setMarkedForReview] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showTimer, setShowTimer] = useState(true);
  const [isChecked, setIsChecked] = useState(false);
  const [wrongAttempts, setWrongAttempts] = useState([]);
  const [isCorrectAnswer, setIsCorrectAnswer] = useState(false);
  const [justChecked, setJustChecked] = useState(false);
  const [lastCheckWasCorrect, setLastCheckWasCorrect] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [showReference, setShowReference] = useState(false);
  const [eliminationMode, setEliminationMode] = useState(false);
  const [eliminatedChoices, setEliminatedChoices] = useState([]);
  const [eliminationHistory, setEliminationHistory] = useState([]);
  const [questionHistory, setQuestionHistory] = useState(null);

  // Filter questions based on review filter if in review mode
  const actualFilteredQuestions = useMemo(() => {
    if (!isReviewMode) {
      return allFilteredQuestions;
    }

    // Get user data for filtering
    const bookmarkedIds = userData.bookmarks || [];
    const answeredQuestions = userData.getAllAnsweredQuestions();
    const incorrectIds = Object.entries(answeredQuestions)
      .filter(([, history]) => !history.lastCorrect)
      .map(([id]) => id);
    const correctIds = Object.entries(answeredQuestions)
      .filter(([, history]) => history.lastCorrect)
      .map(([id]) => id);
    const correctWithPriorIncorrectIds = Object.entries(answeredQuestions)
      .filter(([, history]) => history.lastCorrect && history.attempts.length > 1)
      .map(([id]) => id);

    // Filter based on review filter type
    switch (reviewFilter) {
      case 'bookmarked':
        return allFilteredQuestions.filter(q => bookmarkedIds.includes(q.questionId));
      case 'incorrect':
        return allFilteredQuestions.filter(q => incorrectIds.includes(q.questionId));
      case 'correct':
        return allFilteredQuestions.filter(q => correctIds.includes(q.questionId));
      case 'correct-with-prior-incorrect':
        return allFilteredQuestions.filter(q => correctWithPriorIncorrectIds.includes(q.questionId));
      default: // 'all'
        const allReviewedIds = new Set([...bookmarkedIds, ...Object.keys(answeredQuestions)]);
        return allFilteredQuestions.filter(q => allReviewedIds.has(q.questionId));
    }
  }, [isReviewMode, reviewFilter, allFilteredQuestions, userData]);

  // Recalculate currentIndex and totalQuestions based on filtered questions
  const actualCurrentIndex = useMemo(() => {
    if (!isReviewMode) {
      return currentIndex; // Use server-provided value when not in review mode
    }
    const index = actualFilteredQuestions.findIndex(q => q.questionId === question.questionId);
    return index === -1 ? 0 : index + 1;
  }, [isReviewMode, currentIndex, actualFilteredQuestions, question.questionId]);

  const actualTotalQuestions = isReviewMode ? actualFilteredQuestions.length : totalQuestions;

  // Debug: Log the full question to console only once when question changes
  useEffect(() => {
    console.log("Full Question:", question);
  }, [question.questionId]);

  // Reset answer states and load history when question changes
  useEffect(() => {
    setSelectedChoice(null);
    setTextAnswer("");
    setIsChecked(false);
    setWrongAttempts([]);
    setIsCorrectAnswer(false);
    setJustChecked(false);
    setLastCheckWasCorrect(false);
    setEliminationMode(false);

    // Load question history from localStorage
    const history = userData.getQuestionHistory(question.questionId);
    setQuestionHistory(history);

    // If user already got this question correct, lock it
    if (history && history.lastCorrect) {
      setIsCorrectAnswer(true);
      setIsChecked(true);
    }

    // Load bookmarked status
    const isBookmarked = userData.isBookmarked(question.questionId);
    setMarkedForReview(isBookmarked);

    // Load eliminated choices
    const savedEliminations = userData.getEliminatedChoices(question.questionId);
    setEliminatedChoices(savedEliminations);
    setEliminationHistory([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question.questionId]);

  // Track previous selected choice to detect changes
  const [prevSelectedChoice, setPrevSelectedChoice] = useState(null);

  // Reset button feedback when user selects a DIFFERENT answer after checking
  useEffect(() => {
    if (selectedChoice !== prevSelectedChoice && justChecked && prevSelectedChoice !== null) {
      // User changed their selection after checking - reset the button
      console.log('Resetting justChecked because user changed answer', { selectedChoice, prevSelectedChoice });
      setJustChecked(false);
      setPrevSelectedChoice(selectedChoice);
    }
  }, [selectedChoice, justChecked, prevSelectedChoice]);

  // Track previous text answer to detect changes
  const [prevTextAnswer, setPrevTextAnswer] = useState("");

  // Reset button feedback when user types a DIFFERENT answer (SPR)
  useEffect(() => {
    if (textAnswer !== prevTextAnswer && justChecked && prevTextAnswer !== "") {
      // User changed their text after checking - reset the button
      console.log('Resetting justChecked because user changed text answer', { textAnswer, prevTextAnswer });
      setJustChecked(false);
      setPrevTextAnswer(textAnswer);
    }
  }, [textAnswer, justChecked, prevTextAnswer]);

  const [showNavigation, setShowNavigation] = useState(false);

  // Timer effect
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Format time as MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  // Format difficulty
  const formatDifficulty = (difficulty) => {
    const difficultyMap = {
      E: "Easy",
      M: "Medium",
      H: "Hard",
    };
    return difficultyMap[difficulty] || difficulty;
  };

  // Get correct answer(s) from question data
  const getCorrectAnswers = () => {
    if (!Array.isArray(question.detail) && question.detail.keys) {
      // Format 1: Reading & Writing - keys array contains correct answer IDs
      return question.detail.keys;
    }
    if (Array.isArray(question.detail) && question.detail[0]?.answer) {
      // Format 2: Math - correct_choice or correct field contains the correct answer key
      const correctAnswer = question.detail[0].answer.correct_choice || question.detail[0].answer.correct;
      return correctAnswer ? [correctAnswer] : [];
    }
    return [];
  };

  // Check if selected answer is correct
  const isAnswerCorrect = () => {
    const correctAnswers = getCorrectAnswers();

    // For SPR questions (text input)
    if (!Array.isArray(question.detail) && question.detail.type === "spr") {
      // Normalize both user answer and correct answers for comparison
      const normalizedUserAnswer = textAnswer.trim();

      // Check if user's answer matches any of the correct answers
      return correctAnswers.some((correctAnswer) => {
        const normalizedCorrectAnswer = String(correctAnswer).trim();
        return normalizedUserAnswer === normalizedCorrectAnswer;
      });
    }

    // For MCQ questions
    return correctAnswers.includes(selectedChoice);
  };

  // Handle check button click
  const handleCheck = () => {
    // Determine if this is an SPR question
    const isSPR =
      !Array.isArray(question.detail) && question.detail.type === "spr";

    // Validate that user has provided an answer
    if (isSPR && !textAnswer.trim()) {
      alert("Please enter an answer first");
      return;
    }
    if (!isSPR && !selectedChoice) {
      alert("Please select an answer first");
      return;
    }

    const correct = isAnswerCorrect();
    setJustChecked(true);
    setLastCheckWasCorrect(correct);

    // Save answer to localStorage
    const answerValue = isSPR ? textAnswer : selectedChoice;
    userData.saveAnswer(
      question.questionId,
      answerValue,
      correct,
      elapsedTime,
      {
        skill: question.skill_desc,
        subject: question.subject || 'reading-writing',
        difficulty: question.difficulty,
        scoreBand: question.score_band_range_cd,
      }
    );

    // Track answer attempt in analytics
    trackAnswer(
      question.questionId,
      question.skill_desc,
      question.subject || 'reading-writing',
      question.difficulty,
      correct,
      elapsedTime
    );

    if (correct) {
      // Correct answer - lock the question
      setIsCorrectAnswer(true);
      setIsChecked(true);
      setJustChecked(true);
      setLastCheckWasCorrect(true);
      // Update previous state to prevent reset
      setPrevSelectedChoice(selectedChoice);
      setPrevTextAnswer(textAnswer);
    } else {
      // Wrong answer - keep selection highlighted in red, allow retry
      if (isSPR) {
        // For SPR, keep the text to show what was wrong
        // Don't clear it - let user see their wrong answer
      } else {
        // For MCQ, add to wrong attempts but KEEP selection to show red
        setWrongAttempts((prev) => [...prev, selectedChoice]);
        // Don't clear selection - keep it to show red highlight
      }
      setIsChecked(true); // Keep checked state to show red
      setJustChecked(true);
      setLastCheckWasCorrect(false);
      // Update previous state to prevent reset
      setPrevSelectedChoice(selectedChoice);
      setPrevTextAnswer(textAnswer);
    }
  };

  const buildQuestionUrl = (questionId) => {
    if (isReviewMode) {
      // If in review mode, preserve the review filter
      const params = new URLSearchParams({
        from: 'review',
        filter: reviewFilter,
      });
      return `/question/${questionId}?${params.toString()}`;
    }

    if (skill && subject) {
      const params = new URLSearchParams({
        skill: skill,
        subject: subject,
      });

      // Add selected bands to URL if any are selected
      if (selectedBands && selectedBands.length > 0) {
        params.set("bands", selectedBands.join(","));
      }

      return `/question/${questionId}?${params.toString()}`;
    }
    return `/question/${questionId}`;
  };

  const handlePrev = () => {
    if (prevQuestionId) {
      router.push(buildQuestionUrl(prevQuestionId));
    }
  };

  const handleNext = () => {
    if (nextQuestionId) {
      router.push(buildQuestionUrl(nextQuestionId));
    }
  };

  const handleBackToHome = () => {
    router.push("/");
  };

  const handleJumpToQuestion = (e) => {
    e.preventDefault();
    const questionNum = parseInt(jumpToInput, 10);

    // Validate input
    if (isNaN(questionNum) || questionNum < 1 || questionNum > actualTotalQuestions) {
      alert(`Please enter a number between 1 and ${actualTotalQuestions}`);
      return;
    }

    // Get the question at that index (questionNum - 1 because index is 0-based)
    const targetQuestion = actualFilteredQuestions[questionNum - 1];
    if (targetQuestion) {
      router.push(buildQuestionUrl(targetQuestion.questionId));
      setJumpToInput(""); // Clear input after navigation
    }
  };

  // Toggle answer elimination for a choice
  const toggleElimination = (choiceId) => {
    setEliminatedChoices((prev) => {
      const isEliminated = prev.includes(choiceId);
      const newEliminated = isEliminated
        ? prev.filter((id) => id !== choiceId)
        : [...prev, choiceId];

      // Track history for undo
      if (!isEliminated) {
        setEliminationHistory((history) => [...history, choiceId]);
      }

      // Save to localStorage
      userData.saveEliminatedChoices(question.questionId, newEliminated);

      return newEliminated;
    });
  };

  // Undo last elimination
  const undoLastElimination = () => {
    if (eliminationHistory.length > 0) {
      const lastEliminated = eliminationHistory[eliminationHistory.length - 1];
      setEliminatedChoices((prev) => {
        const newEliminated = prev.filter((id) => id !== lastEliminated);
        // Save to localStorage
        userData.saveEliminatedChoices(question.questionId, newEliminated);
        return newEliminated;
      });
      setEliminationHistory((prev) => prev.slice(0, -1));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pb-20">
      {/* Top Header Bar */}
      <div className="bg-white border-b px-6 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-4">
              <button
                onClick={handleBackToHome}
                className="text-2xl font-bold text-gray-900 hover:text-blue-600 transition-colors"
              >
                1600.so
              </button>
              {isReviewMode && (
                <button
                  onClick={() => router.push('/review')}
                  className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors text-sm"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Review</span>
                </button>
              )}
            </div>

            {/* Timer, Calculator, Reference, More - Top Right */}
            <div className="flex items-center gap-4">
              {/* Calculator button - only show for Math questions */}
              {subject === "math" && (
                <button
                  onClick={() => {
                    const newValue = !showCalculator;
                    setShowCalculator(newValue);
                    trackFeature('calculator', newValue ? 'open' : 'close');
                  }}
                  className="flex items-center gap-2 px-3 py-1.5 rounded transition-colors hover:bg-gray-100 text-gray-700"
                  title={showCalculator ? "Hide calculator" : "Show calculator"}
                >
                  <Calculator className="w-4 h-4" />
                  <span className="text-sm font-medium">Calculator</span>
                </button>
              )}

              {/* Reference button - only show for Math questions */}
              {subject === "math" && (
                <button
                  onClick={() => {
                    const newValue = !showReference;
                    setShowReference(newValue);
                    trackFeature('reference', newValue ? 'open' : 'close');
                  }}
                  className="flex items-center gap-2 px-3 py-1.5 rounded transition-colors hover:bg-gray-100 text-gray-700"
                  title={showReference ? "Hide reference" : "Show reference"}
                >
                  <FileText className="w-4 h-4" />
                  <span className="text-sm font-medium">Reference</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Filter Summary Bar */}
      {/* <div className="bg-gray-100 border-b px-6 py-3">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-6 text-xs text-gray-700">
            <div className="flex items-center gap-2">
              <span className="font-semibold">Total Questions</span>
              <span className="font-bold text-gray-900">{actualTotalQuestions}</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-semibold">Set Section</span>
              <span className="font-bold text-gray-900">
                {subject === "math"
                  ? "Math"
                  : subject === "reading-writing"
                  ? "Reading & Writing"
                  : "All"}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-semibold">Set Difficulty</span>
              <span className="font-bold text-gray-900">All</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-semibold">Set Active</span>
              <span className="font-bold text-gray-900">All</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-semibold">Set Score Band</span>
              <span className="font-bold text-gray-900">
                {selectedBands && selectedBands.length > 0
                  ? selectedBands.join(", ")
                  : "All"}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-semibold">Set Domain</span>
              <span className="font-bold text-gray-900">
                {question.primary_class_cd_desc}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-semibold">Set Skill</span>
              <span className="font-bold text-gray-900">{skill || "All"}</span>
            </div>
          </div>
        </div>
      </div> */}

      {/* Question Content */}
      <div className="flex-1 py-8 px-4">
        <div
          className={`mx-auto ${
            subject === "math" ? "max-w-4xl" : "max-w-7xl"
          }`}
        >
          <Card className="p-0">
            {/* Question Header Bar */}
            <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
              <div className="flex items-center gap-3">
                {/* Question Number Badge */}
                <Badge className="bg-gray-800 text-white px-4 py-2 text-base font-semibold">
                  {currentIndex}
                </Badge>

                {/* Previous Attempt Indicator */}
                {questionHistory && (
                  <Badge
                    className={`px-3 py-1.5 text-sm font-medium ${
                      questionHistory.lastCorrect
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {questionHistory.lastCorrect ? (
                      <>
                        <span className="hidden md:inline">✓ Correct</span>
                        <span className="md:hidden">✓</span>
                      </>
                    ) : (
                      <>
                        <span className="hidden md:inline">✗ Attempted</span>
                        <span className="md:hidden">✗</span>
                      </>
                    )}
                  </Badge>
                )}

                {/* Mark for Review */}
                <button
                  onClick={() => {
                    const newValue = userData.toggleBookmark(question.questionId);
                    setMarkedForReview(newValue);
                  }}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded transition-colors ${
                    markedForReview
                      ? "bg-yellow-100 text-yellow-800"
                      : "hover:bg-gray-100 text-gray-700"
                  }`}
                >
                  <Bookmark
                    className={`w-4 h-4 ${
                      markedForReview ? "fill-yellow-600" : ""
                    }`}
                  />
                  <span className="text-sm font-medium hidden md:inline">Mark for Review</span>
                </button>
              </div>

              {/* Center: Timer (hidden in review mode) */}
              {showTimer && !isReviewMode && (
                <div className="flex items-center gap-2 text-gray-700">
                  <Clock className="w-5 h-5" />
                  <span className="font-mono text-lg font-semibold">
                    {formatTime(elapsedTime)}
                  </span>
                </div>
              )}

              {/* Right Side: ABC */}
              <div className="flex items-center gap-4">
                {/* ABC Elimination button */}
                <button
                  onClick={() => {
                    const newValue = !eliminationMode;
                    setEliminationMode(newValue);
                    trackFeature('elimination', newValue ? 'enable' : 'disable');
                  }}
                  className={`px-3 py-1.5 rounded transition-colors font-semibold ${
                    eliminationMode
                      ? "bg-blue-600 text-white"
                      : "bg-blue-100 text-blue-800 hover:bg-blue-200"
                  }`}
                  title={
                    eliminationMode
                      ? "Exit elimination mode"
                      : "Enable answer elimination"
                  }
                >
                  <span className="text-sm line-through">ABC</span>
                </button>
              </div>
            </div>

            {/* Question Content */}
            {/* Check if this is a Reading & Writing question with stimulus (passage) */}
            {!Array.isArray(question.detail) && question.detail.stimulus ? (
              // Split-screen layout for Reading & Writing
              <div className="grid grid-cols-1 lg:grid-cols-2 divide-x">
                {/* Left Panel: Passage/Stimulus */}
                <div className="p-8 max-h-[600px] overflow-y-auto">
                  <div
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{
                      __html: question.detail.stimulus,
                    }}
                  />
                </div>

                {/* Right Panel: Question and Choices */}
                <div className="p-8 max-h-[600px] overflow-y-auto">
                  {/* Question Stem */}
                  <div
                    className="mb-6 prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{
                      __html: question.detail.stem,
                    }}
                  />

                  {/* Answer Choices for Reading & Writing */}
                  {question.detail.type === "mcq" &&
                    question.detail.answerOptions && (
                      <div className="space-y-3">
                        {question.detail.answerOptions.map((choice, idx) => {
                          const isSelected = selectedChoice === choice.id;
                          const correctAnswers = getCorrectAnswers();
                          const isCorrect = correctAnswers.includes(choice.id);
                          const isWrongAttempt = wrongAttempts.includes(
                            choice.id
                          );
                          const isEliminated = eliminatedChoices.includes(
                            choice.id
                          );

                          // Determine styling based on check state
                          let buttonClass =
                            "w-full text-left p-4 rounded-lg border-2 transition-all ";
                          let badgeClass =
                            "flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center ";

                          if (isCorrectAnswer && isSelected && isCorrect) {
                            // Correct answer locked
                            buttonClass += "border-green-600 bg-green-50";
                            badgeClass +=
                              "border-green-600 bg-green-600 text-white";
                          } else if (isWrongAttempt) {
                            // Previous wrong attempt - keep red
                            buttonClass += "border-red-600 bg-red-50";
                            badgeClass +=
                              "border-red-600 bg-red-600 text-white";
                          } else if (isSelected) {
                            // Current selection - show blue
                            buttonClass += "border-blue-600 bg-blue-50";
                            badgeClass +=
                              "border-blue-600 bg-blue-600 text-white";
                          } else {
                            // Not selected
                            buttonClass +=
                              "border-gray-300 hover:border-gray-400 bg-white";
                            badgeClass += "border-gray-400";
                          }

                          return (
                            <div key={choice.id} className="relative">
                              <button
                                onClick={() =>
                                  !isCorrectAnswer &&
                                  !isWrongAttempt &&
                                  setSelectedChoice(choice.id)
                                }
                                disabled={isCorrectAnswer || isWrongAttempt}
                                className={buttonClass}
                              >
                                <div className="flex items-center gap-3">
                                  <div className={badgeClass}>
                                    {String.fromCharCode(65 + idx)}
                                  </div>
                                  <div
                                    className={`flex-1 ${
                                      isEliminated ? "opacity-50" : ""
                                    }`}
                                    dangerouslySetInnerHTML={{
                                      __html: choice.content,
                                    }}
                                  />
                                </div>
                              </button>

                              {/* Elimination/Undo button */}
                              {eliminationMode && (
                                <>
                                  {isEliminated ? (
                                    // Show Undo button for all eliminated choices
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleElimination(choice.id);
                                      }}
                                      className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm font-medium underline"
                                    >
                                      Undo
                                    </button>
                                  ) : (
                                    // Show crossout button for non-eliminated choices
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleElimination(choice.id);
                                      }}
                                      className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white hover:bg-gray-50 border border-gray-400 text-sm font-semibold flex items-center justify-center"
                                    >
                                      <span className="line-through">
                                        {String.fromCharCode(65 + idx)}
                                      </span>
                                    </button>
                                  )}
                                </>
                              )}

                              {/* Strike-through overlay */}
                              {isEliminated && (
                                <div className="absolute left-0 right-20 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
                                  <svg
                                    className="w-full h-0.5"
                                    preserveAspectRatio="none"
                                    viewBox="0 0 100 1"
                                  >
                                    <line
                                      x1="0"
                                      y1="0.5"
                                      x2="100"
                                      y2="0.5"
                                      stroke="red"
                                      strokeWidth="2"
                                    />
                                  </svg>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                </div>
              </div>
            ) : (
              // Single-column layout for Math questions (existing layout)
              <div className="p-4 md:p-6">
                {/* Question Stem (Text) */}
                <div
                  className="mb-4 text-base leading-relaxed text-gray-900 [&_img]:align-middle"
                  dangerouslySetInnerHTML={{
                    __html: Array.isArray(question.detail)
                      ? question.detail[0]?.prompt
                      : question.detail.stem,
                  }}
                />

                {/* Answer Choices - Handle both formats */}
                {(() => {
                  // Format 1: detail is an object with answerOptions array
                  if (
                    !Array.isArray(question.detail) &&
                    question.detail.type === "mcq" &&
                    question.detail.answerOptions
                  ) {
                    return (
                      <div className="space-y-3">
                        {question.detail.answerOptions.map((choice, idx) => {
                          const isSelected = selectedChoice === choice.id;
                          const correctAnswers = getCorrectAnswers();
                          const isCorrect = correctAnswers.includes(choice.id);
                          const isWrongAttempt = wrongAttempts.includes(
                            choice.id
                          );
                          const isEliminated = eliminatedChoices.includes(
                            choice.id
                          );

                          // Determine styling based on check state
                          let buttonClass =
                            "w-full text-left p-4 rounded-lg border-2 transition-all ";
                          let badgeClass =
                            "flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center ";

                          if (isCorrectAnswer && isSelected && isCorrect) {
                            // Correct answer locked
                            buttonClass += "border-green-600 bg-green-50";
                            badgeClass +=
                              "border-green-600 bg-green-600 text-white";
                          } else if (isWrongAttempt) {
                            // Previous wrong attempt - keep red
                            buttonClass += "border-red-600 bg-red-50";
                            badgeClass +=
                              "border-red-600 bg-red-600 text-white";
                          } else if (isSelected) {
                            // Current selection - show blue
                            buttonClass += "border-blue-600 bg-blue-50";
                            badgeClass +=
                              "border-blue-600 bg-blue-600 text-white";
                          } else {
                            // Not selected
                            buttonClass +=
                              "border-gray-300 hover:border-gray-400 bg-white";
                            badgeClass += "border-gray-400";
                          }

                          return (
                            <div key={choice.id} className="relative">
                              <button
                                onClick={() =>
                                  !isCorrectAnswer &&
                                  !isWrongAttempt &&
                                  setSelectedChoice(choice.id)
                                }
                                disabled={isCorrectAnswer || isWrongAttempt}
                                className={buttonClass}
                              >
                                <div className="flex items-center gap-3">
                                  <div className={badgeClass}>
                                    {String.fromCharCode(65 + idx)}
                                  </div>
                                  <div
                                    className={`flex-1 ${
                                      isEliminated ? "opacity-50" : ""
                                    }`}
                                    dangerouslySetInnerHTML={{
                                      __html: choice.content,
                                    }}
                                  />
                                </div>
                              </button>

                              {/* Elimination/Undo button */}
                              {eliminationMode && (
                                <>
                                  {isEliminated ? (
                                    // Show Undo button for all eliminated choices
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleElimination(choice.id);
                                      }}
                                      className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm font-medium underline"
                                    >
                                      Undo
                                    </button>
                                  ) : (
                                    // Show crossout button for non-eliminated choices
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleElimination(choice.id);
                                      }}
                                      className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white hover:bg-gray-50 border border-gray-400 text-sm font-semibold flex items-center justify-center"
                                    >
                                      <span className="line-through">
                                        {String.fromCharCode(65 + idx)}
                                      </span>
                                    </button>
                                  )}
                                </>
                              )}

                              {/* Strike-through overlay */}
                              {isEliminated && (
                                <div className="absolute left-0 right-20 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
                                  <svg
                                    className="w-full h-0.5"
                                    preserveAspectRatio="none"
                                    viewBox="0 0 100 1"
                                  >
                                    <line
                                      x1="0"
                                      y1="0.5"
                                      x2="100"
                                      y2="0.5"
                                      stroke="red"
                                      strokeWidth="2"
                                    />
                                  </svg>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  }

                  // Format 2: detail is an array with answer.choices object
                  if (
                    Array.isArray(question.detail) &&
                    question.detail[0]?.answer?.choices
                  ) {
                    const choices = question.detail[0].answer.choices;
                    const choiceKeys = ["a", "b", "c", "d"];

                    return (
                      <div className="space-y-3">
                        {choiceKeys.map((key, idx) => {
                          if (!choices[key]) return null;

                          const isSelected = selectedChoice === key;
                          const correctAnswers = getCorrectAnswers();
                          const isCorrect = correctAnswers.includes(key);
                          const isWrongAttempt = wrongAttempts.includes(key);
                          const isEliminated = eliminatedChoices.includes(key);

                          // Determine styling based on check state
                          let buttonClass =
                            "w-full text-left p-4 rounded-lg border-2 transition-all ";
                          let badgeClass =
                            "flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center ";

                          if (isCorrectAnswer && isSelected && isCorrect) {
                            // Correct answer locked
                            buttonClass += "border-green-600 bg-green-50";
                            badgeClass +=
                              "border-green-600 bg-green-600 text-white";
                          } else if (isWrongAttempt) {
                            // Previous wrong attempt - keep red
                            buttonClass += "border-red-600 bg-red-50";
                            badgeClass +=
                              "border-red-600 bg-red-600 text-white";
                          } else if (isSelected) {
                            // Current selection - show blue
                            buttonClass += "border-blue-600 bg-blue-50";
                            badgeClass +=
                              "border-blue-600 bg-blue-600 text-white";
                          } else {
                            // Not selected
                            buttonClass +=
                              "border-gray-300 hover:border-gray-400 bg-white";
                            badgeClass += "border-gray-400";
                          }

                          return (
                            <div key={key} className="relative">
                              <button
                                onClick={() =>
                                  !isCorrectAnswer &&
                                  !isWrongAttempt &&
                                  setSelectedChoice(key)
                                }
                                disabled={isCorrectAnswer || isWrongAttempt}
                                className={buttonClass}
                              >
                                <div className="flex items-center gap-3">
                                  <div className={badgeClass}>
                                    {key.toUpperCase()}
                                  </div>
                                  <div
                                    className={`flex-1 ${
                                      isEliminated ? "opacity-50" : ""
                                    }`}
                                    dangerouslySetInnerHTML={{
                                      __html: choices[key].body,
                                    }}
                                  />
                                </div>
                              </button>

                              {/* Elimination/Undo button */}
                              {eliminationMode && (
                                <>
                                  {isEliminated ? (
                                    // Show Undo button for all eliminated choices
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleElimination(key);
                                      }}
                                      className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm font-medium underline"
                                    >
                                      Undo
                                    </button>
                                  ) : (
                                    // Show crossout button for non-eliminated choices
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleElimination(key);
                                      }}
                                      className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white hover:bg-gray-50 border border-gray-400 text-sm font-semibold flex items-center justify-center"
                                    >
                                      <span className="line-through">
                                        {key.toUpperCase()}
                                      </span>
                                    </button>
                                  )}
                                </>
                              )}

                              {/* Strike-through overlay */}
                              {isEliminated && (
                                <div className="absolute left-0 right-20 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
                                  <svg
                                    className="w-full h-0.5"
                                    preserveAspectRatio="none"
                                    viewBox="0 0 100 1"
                                  >
                                    <line
                                      x1="0"
                                      y1="0.5"
                                      x2="100"
                                      y2="0.5"
                                      stroke="red"
                                      strokeWidth="2"
                                    />
                                  </svg>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  }

                  // Format 3: SPR question (text input)
                  if (
                    !Array.isArray(question.detail) &&
                    question.detail.type === "spr"
                  ) {
                    // Determine input styling based on check state
                    let inputClass =
                      "w-full p-4 border-2 rounded-lg focus:outline-none text-lg transition-all ";

                    if (isCorrectAnswer) {
                      // Correct answer - show green
                      inputClass +=
                        "border-green-600 bg-green-50 focus:border-green-600";
                    } else if (justChecked && !lastCheckWasCorrect) {
                      // Just checked and wrong - show red briefly
                      inputClass +=
                        "border-red-600 bg-red-50 focus:border-red-600";
                    } else {
                      // Default state
                      inputClass +=
                        "border-gray-300 bg-white focus:border-blue-600";
                    }

                    return (
                      <div className="mt-6">
                        <input
                          type="text"
                          value={textAnswer}
                          onChange={(e) => setTextAnswer(e.target.value)}
                          placeholder="Enter your answer"
                          disabled={isCorrectAnswer}
                          className={inputClass}
                        />
                      </div>
                    );
                  }

                  return null;
                })()}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Fixed Bottom Action Buttons */}
      <div className="bg-white border-t px-2 md:px-6 py-4 fixed bottom-0 left-0 right-0 z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-1 md:gap-0">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="shrink-0">
                <span className="hidden md:inline">Show Explanation</span>
                <span className="md:hidden">Explanation</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-[calc(100vw-2rem)] md:w-[600px] max-h-[500px] overflow-y-auto"
              side="top"
              align="start"
            >
              <div className="space-y-3">
                <h3 className="font-semibold text-lg text-blue-900">
                  Explanation
                </h3>
                <div
                  className="text-base leading-relaxed text-gray-900 [&_img]:align-middle"
                  dangerouslySetInnerHTML={{
                    __html:
                      !Array.isArray(question.detail) &&
                      question.detail.stimulus
                        ? question.detail.rationale
                        : Array.isArray(question.detail)
                        ? question.detail[0]?.answer?.rationale
                        : question.detail.rationale,
                  }}
                />
              </div>
            </PopoverContent>
          </Popover>

          <Popover open={showNavigation} onOpenChange={setShowNavigation}>
            <PopoverTrigger asChild>
              <button className="px-2 md:px-4 py-2 mx-1 md:mx-3 bg-gray-900 text-white rounded text-sm font-semibold hover:bg-gray-800 transition-colors flex items-center gap-1 md:gap-2 whitespace-nowrap shrink-0">
                <span className="hidden md:inline">Question {actualCurrentIndex} of {actualTotalQuestions}</span>
                <span className="md:hidden text-xs">{actualCurrentIndex} of {actualTotalQuestions}</span>
                {showNavigation ? (
                  <ChevronDown className="w-4 h-4 flex-shrink-0" />
                ) : (
                  <ChevronUp className="w-4 h-4 flex-shrink-0" />
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent
              className="w-[calc(100vw-2rem)] md:w-[800px] max-h-[600px] overflow-y-auto"
              side="top"
              align="center"
            >
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between pb-3 border-b">
                  {/* <h2 className="text-xl font-semibold">
                    Section 1:{" "}
                    {subject === "math"
                      ? "Math"
                      : subject === "reading-writing"
                      ? "Reading and Writing"
                      : "Unknown"}{" "}
                    Questions
                  </h2> */}
                  <button
                    onClick={() => setShowNavigation(false)}
                    className="p-1 hover:bg-gray-100 rounded transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                {/* Question Metadata */}
                <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-gray-700 border-b pb-4">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">Section</span>
                    <span className="font-bold text-gray-900">
                      {subject === "math"
                        ? "Math"
                        : subject === "reading-writing"
                        ? "Reading & Writing"
                        : "N/A"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-semibold">Difficulty</span>
                    <span className="font-bold text-gray-900">
                      {formatDifficulty(question.difficulty)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-semibold">Score Band</span>
                    <span className="font-bold text-gray-900">
                      {question.score_band_range_cd}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-semibold">Domain</span>
                    <span className="font-bold text-gray-900">
                      {question.primary_class_cd_desc}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-semibold">Skill</span>
                    <span className="font-bold text-gray-900">
                      {question.skill_desc}
                    </span>
                  </div>
                </div>

                {/* Legend */}
                <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm border-b pb-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    <span className="font-medium">Current</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded border-2 border-dashed border-gray-400"></div>
                    <span className="font-medium">Unanswered</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-green-500"></div>
                    <span className="font-medium">Correct</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-red-500"></div>
                    <span className="font-medium">Incorrect</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-red-500 border-2 border-green-500"></div>
                    <span className="font-medium">
                      Correct (with prior incorrect)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Bookmark className="w-5 h-5 fill-yellow-500 text-yellow-500" />
                    <span className="font-medium">Marked for Review</span>
                  </div>
                </div>

                {/* Question Grid */}
                <div className="flex flex-wrap gap-3 justify-center">
                  {actualFilteredQuestions.map((q, idx) => {
                    const questionNum = idx + 1;
                    const isCurrent = questionNum === currentIndex;

                    // Get question status from userData
                    const questionHistory = userData.getQuestionHistory(q.questionId);
                    const isBookmarked = userData.isBookmarked(q.questionId);

                    // Determine styling based on status
                    let buttonClass = "relative w-14 h-14 rounded font-semibold text-lg transition-all hover:bg-gray-50 ";
                    let borderClass = "";
                    let bgClass = "bg-white";
                    let textClass = "text-blue-600";

                    if (questionHistory) {
                      if (questionHistory.lastCorrect) {
                        // Correct answer
                        if (questionHistory.attempts.length > 1) {
                          // Correct with prior incorrect attempts
                          borderClass = "border-2 border-green-500";
                          bgClass = "bg-red-500";
                          textClass = "text-white";
                        } else {
                          // Correct on first try
                          borderClass = "";
                          bgClass = "bg-green-500";
                          textClass = "text-white";
                        }
                      } else {
                        // Incorrect answer
                        borderClass = "";
                        bgClass = "bg-red-500";
                        textClass = "text-white";
                      }
                    } else {
                      // Unanswered
                      borderClass = "border-2 border-dashed border-gray-400";
                    }

                    return (
                      <button
                        key={q.questionId}
                        onClick={() => {
                          router.push(buildQuestionUrl(q.questionId));
                          setShowNavigation(false);
                        }}
                        className={`${buttonClass} ${borderClass} ${bgClass}`}
                      >
                        {isCurrent && (
                          <MapPin className="w-4 h-4 absolute -top-2 left-1/2 -translate-x-1/2" />
                        )}
                        <span className={textClass}>{questionNum}</span>
                        {isBookmarked && (
                          <Bookmark className="w-3 h-3 absolute -bottom-1 right-0 fill-yellow-500 text-yellow-500" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Go to Review Page Button */}
                <div className="flex justify-center pt-2">
                  <button
                    onClick={() => router.push('/review')}
                    className="px-6 py-2 border-2 border-blue-600 text-blue-600 rounded-full font-semibold hover:bg-blue-50 transition-colors"
                  >
                    Go to Review Page
                  </button>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <div className="flex gap-1 md:gap-3 shrink-0">
            <Button
              variant="outline"
              onClick={handlePrev}
              disabled={!prevQuestionId}
              className="shrink-0"
            >
              <ChevronLeft className="w-4 h-4 md:mr-1" />
              <span className="hidden md:inline">Previous</span>
            </Button>
            <Button
              variant="outline"
              onClick={handleNext}
              disabled={!nextQuestionId}
              className="shrink-0"
            >
              <span className="hidden md:inline">Next</span>
              <ChevronRight className="w-4 h-4 md:ml-1" />
            </Button>
            <Button
              onClick={handleCheck}
              disabled={
                isCorrectAnswer || (!selectedChoice && !textAnswer.trim())
              }
              variant={justChecked ? "default" : "default"}
              className={`shrink-0 ${
                justChecked
                  ? lastCheckWasCorrect
                    ? "!bg-green-600 !text-white !border-green-600 hover:!bg-green-700"
                    : "!bg-red-600 !text-white !border-red-600 hover:!bg-red-700"
                  : ""
              }`}
            >
              {justChecked ? (
                lastCheckWasCorrect ? (
                  <>
                    <span className="hidden md:inline">✓ Correct</span>
                    <span className="md:hidden">✓</span>
                  </>
                ) : (
                  <>
                    <span className="hidden md:inline">✗ Incorrect</span>
                    <span className="md:hidden">✗</span>
                  </>
                )
              ) : (
                <>
                  <span className="hidden md:inline">Check</span>
                  <Check className="w-4 h-4 md:hidden" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Desmos Calculator Panel */}
      <DesmosCalculator
        isOpen={showCalculator}
        onClose={() => setShowCalculator(false)}
      />

      {/* Reference Sheet Panel */}
      <ReferenceSheet
        isOpen={showReference}
        onClose={() => setShowReference(false)}
      />
    </div>
  );
}
