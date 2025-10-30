"use client";

import { useState, useEffect } from "react";
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
} from "lucide-react";
import { DesmosCalculator } from "@/components/desmos-calculator";

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
}) {
  const router = useRouter();
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

  // Debug: Log the full question to console only once when question changes
  useEffect(() => {
    console.log("Full Question:", question);
  }, [question.questionId]);

  // Reset answer states when question changes
  useEffect(() => {
    setSelectedChoice(null);
    setTextAnswer("");
    setIsChecked(false);
    setWrongAttempts([]);
    setIsCorrectAnswer(false);
    setJustChecked(false);
    setLastCheckWasCorrect(false);
  }, [question.questionId]);

  // Reset button feedback when user selects a new answer (MCQ)
  useEffect(() => {
    if (selectedChoice && justChecked && !lastCheckWasCorrect) {
      setJustChecked(false);
    }
  }, [selectedChoice, justChecked, lastCheckWasCorrect]);

  // Reset button feedback when user types a new answer (SPR)
  useEffect(() => {
    if (textAnswer && justChecked && !lastCheckWasCorrect) {
      setJustChecked(false);
    }
  }, [textAnswer, justChecked, lastCheckWasCorrect]);

  // Use localStorage to persist navigation visibility across page navigations
  const [showNavigation, setShowNavigation] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("showNavigation");
      return saved !== null ? JSON.parse(saved) : true;
    }
    return true;
  });

  // Save navigation visibility to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("showNavigation", JSON.stringify(showNavigation));
    }
  }, [showNavigation]);

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
    if (Array.isArray(question.detail) && question.detail[0]?.answer?.correct) {
      // Format 2: Math - correct field contains the correct answer key
      return [question.detail[0].answer.correct];
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
      return correctAnswers.some(correctAnswer => {
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
    const isSPR = !Array.isArray(question.detail) && question.detail.type === "spr";

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

    if (correct) {
      // Correct answer - lock the question
      setIsCorrectAnswer(true);
      setIsChecked(true);
    } else {
      // Wrong answer - allow retry
      if (isSPR) {
        // For SPR, just clear the input (don't track wrong attempts for text)
        setTextAnswer("");
      } else {
        // For MCQ, add to wrong attempts and clear selection
        setWrongAttempts((prev) => [...prev, selectedChoice]);
        setSelectedChoice(null);
      }
      setIsChecked(false);
    }
  };

  const buildQuestionUrl = (questionId) => {
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
    if (isNaN(questionNum) || questionNum < 1 || questionNum > totalQuestions) {
      alert(`Please enter a number between 1 and ${totalQuestions}`);
      return;
    }

    // Get the question at that index (questionNum - 1 because index is 0-based)
    const targetQuestion = allFilteredQuestions[questionNum - 1];
    if (targetQuestion) {
      router.push(buildQuestionUrl(targetQuestion.questionId));
      setJumpToInput(""); // Clear input after navigation
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pb-20">
      {/* Top Header Bar */}
      <div className="bg-white border-b px-6 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <div>
              <Button variant="ghost" size="sm" onClick={handleBackToHome}>
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back to Question Bank
              </Button>
            </div>
          </div>

          {/* Question Metadata */}
          {/* <div className="flex flex-wrap gap-2 text-xs">
            <Badge variant="outline" className="font-mono">
              ID: {question.questionId}
            </Badge>
            <Badge variant="outline">{question.primary_class_cd_desc}</Badge>
            <Badge variant="outline">{question.skill_desc}</Badge>
            <Badge variant="outline">Difficulty: {question.difficulty}</Badge>
            <Badge variant="outline">
              Score Band: {question.score_band_range_cd}
            </Badge>
          </div> */}
        </div>
      </div>

      {/* Filter Summary Bar */}
      {/* <div className="bg-gray-100 border-b px-6 py-3">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-6 text-xs text-gray-700">
            <div className="flex items-center gap-2">
              <span className="font-semibold">Total Questions</span>
              <span className="font-bold text-gray-900">{totalQuestions}</span>
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

      {/* Current Question Info Bar */}
      <div className="bg-white border-b px-6 py-3">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-6 text-xs text-gray-700">
            <div className="flex items-center gap-2">
              <span className="font-semibold">Question Bank ID</span>
              <span className="font-bold text-blue-600">
                {question.questionId}
              </span>
            </div>

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
        </div>
      </div>

      {/* Question Content */}
      <div className="flex-1 py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <Card className="p-0">
            {/* Question Header Bar */}
            <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
              <div className="flex items-center gap-3">
                {/* Question Number Badge */}
                <Badge className="bg-gray-800 text-white px-4 py-2 text-base font-semibold">
                  {currentIndex}
                </Badge>

                {/* Mark for Review */}
                <button
                  onClick={() => setMarkedForReview(!markedForReview)}
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
                  <span className="text-sm font-medium">Mark for Review</span>
                </button>
              </div>

              {/* Right Side: Calculator, Eye Icon and Timer */}
              <div className="flex items-center gap-4">
                {/* Calculator button - only show for Math questions */}
                {subject === "math" && (
                  <button
                    onClick={() => setShowCalculator(!showCalculator)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded transition-colors ${
                      showCalculator
                        ? "bg-blue-100 text-blue-800"
                        : "hover:bg-gray-100 text-gray-700"
                    }`}
                    title={showCalculator ? "Hide calculator" : "Show calculator"}
                  >
                    <Calculator className="w-4 h-4" />
                    <span className="text-sm font-medium">Calculator</span>
                  </button>
                )}

                <button
                  onClick={() => setShowTimer(!showTimer)}
                  className="p-1 hover:bg-gray-200 rounded transition-colors"
                  title={showTimer ? "Hide timer" : "Show timer"}
                >
                  {showTimer ? (
                    <Eye className="w-5 h-5 text-gray-600" />
                  ) : (
                    <EyeOff className="w-5 h-5 text-gray-400" />
                  )}
                </button>
                {showTimer && (
                  <div className="flex items-center gap-2 text-gray-700">
                    <Clock className="w-5 h-5" />
                    <span className="font-mono text-lg font-semibold">
                      {formatTime(elapsedTime)}
                    </span>
                  </div>
                )}
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
                            <button
                              key={choice.id}
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
                                  className="flex-1"
                                  dangerouslySetInnerHTML={{
                                    __html: choice.content,
                                  }}
                                />
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                </div>
              </div>
            ) : (
              // Single-column layout for Math questions (existing layout)
              <div className="p-8">
                {/* Question Stem (Text) */}
                <div
                  className="mb-6 prose prose-sm max-w-none"
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
                            <button
                              key={choice.id}
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
                                  className="flex-1"
                                  dangerouslySetInnerHTML={{
                                    __html: choice.content,
                                  }}
                                />
                              </div>
                            </button>
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
                            <button
                              key={key}
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
                                  className="flex-1"
                                  dangerouslySetInnerHTML={{
                                    __html: choices[key].body,
                                  }}
                                />
                              </div>
                            </button>
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
                    let inputClass = "w-full p-4 border-2 rounded-lg focus:outline-none text-lg transition-all ";

                    if (isCorrectAnswer) {
                      // Correct answer - show green
                      inputClass += "border-green-600 bg-green-50 focus:border-green-600";
                    } else if (justChecked && !lastCheckWasCorrect) {
                      // Just checked and wrong - show red briefly
                      inputClass += "border-red-600 bg-red-50 focus:border-red-600";
                    } else {
                      // Default state
                      inputClass += "border-gray-300 bg-white focus:border-blue-600";
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
      <div className="bg-white border-t px-6 py-4 fixed bottom-0 left-0 right-0 z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">Show Explanation</Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-[600px] max-h-[500px] overflow-y-auto"
              side="top"
              align="start"
            >
              <div className="space-y-3">
                <h3 className="font-semibold text-lg text-blue-900">
                  Explanation
                </h3>
                <div
                  className="prose prose-sm max-w-none"
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

          <div className="text-sm font-semibold text-gray-700">
            Question {currentIndex} of {totalQuestions}
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handlePrev}
              disabled={!prevQuestionId}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </Button>
            <Button onClick={handleNext} disabled={!nextQuestionId}>
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
            <Button
              variant="outline"
              onClick={handleCheck}
              disabled={
                isCorrectAnswer ||
                (!selectedChoice && !textAnswer.trim())
              }
              className={
                justChecked
                  ? lastCheckWasCorrect
                    ? "bg-green-600 text-white border-green-600 hover:bg-green-700"
                    : "bg-red-600 text-white border-red-600 hover:bg-red-700"
                  : ""
              }
            >
              {justChecked
                ? lastCheckWasCorrect
                  ? "✓ Correct"
                  : "✗ Incorrect"
                : "Check"}
            </Button>
          </div>
        </div>
      </div>

      {/* Bottom Navigation Panel */}
      {showNavigation && (
        <div className="bg-white border-t px-6 py-4">
          <div className="max-w-6xl mx-auto">
            {/* Top Controls */}
            <div className="flex items-center gap-3 mb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowNavigation(false)}
                className="text-blue-600 border-blue-600 hover:bg-blue-50"
              >
                <EyeOff className="w-4 h-4 mr-2" />
                Hide Navigation
              </Button>
              <Button variant="outline" size="sm" className="border-gray-300">
                <Shuffle className="w-4 h-4 mr-2" />
                Shuffle Question Order
              </Button>
            </div>

            {/* Glossary */}
            <div className="flex items-center gap-6 mb-4 text-sm">
              <span className="font-semibold">Glossary:</span>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span>Correct</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span>Incorrect</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gradient-to-r from-green-500 to-red-500"></div>
                <span>Correct (with prior incorrect attempt)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                <span>Marked for Review</span>
              </div>
            </div>

            {/* Question Grid */}
            <div className="flex flex-wrap gap-2">
              {allFilteredQuestions.map((q, idx) => {
                const questionNum = idx + 1;
                const isCurrent = questionNum === currentIndex;

                return (
                  <button
                    key={q.questionId}
                    onClick={() => router.push(buildQuestionUrl(q.questionId))}
                    className={`w-12 h-12 rounded-lg border-2 font-semibold text-sm transition-all ${
                      isCurrent
                        ? "bg-gray-900 text-white border-gray-900"
                        : "bg-white text-gray-900 border-gray-900 hover:bg-gray-100"
                    }`}
                  >
                    {questionNum}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Show Navigation Button (when hidden) */}
      {!showNavigation && (
        <div className="bg-white border-t px-6 py-2">
          <div className="max-w-6xl mx-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowNavigation(true)}
              className="text-blue-600 border-blue-600 hover:bg-blue-50"
            >
              Show Navigation
            </Button>
          </div>
        </div>
      )}

      {/* Desmos Calculator Panel */}
      <DesmosCalculator
        isOpen={showCalculator}
        onClose={() => setShowCalculator(false)}
      />
    </div>
  );
}
