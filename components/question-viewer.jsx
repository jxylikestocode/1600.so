"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ChevronLeft,
  ChevronRight,
  Shuffle,
  EyeOff,
  Eye,
  Clock,
  Bookmark,
} from "lucide-react";

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
  const [jumpToInput, setJumpToInput] = useState("");
  const [markedForReview, setMarkedForReview] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showTimer, setShowTimer] = useState(true);
  const [showExplanation, setShowExplanation] = useState(false);

  // Debug: Log the full question to console only once when question changes
  useEffect(() => {
    console.log("Full Question:", question);
  }, [question.questionId]);

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
                Q {question.questionId}
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

              {/* Right Side: Eye Icon and Timer */}
              <div className="flex items-center gap-4">
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
                        {question.detail.answerOptions.map((choice, idx) => (
                          <button
                            key={choice.id}
                            onClick={() => setSelectedChoice(choice.id)}
                            className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                              selectedChoice === choice.id
                                ? "border-blue-600 bg-blue-50"
                                : "border-gray-300 hover:border-gray-400 bg-white"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center ${
                                  selectedChoice === choice.id
                                    ? "border-blue-600 bg-blue-600 text-white"
                                    : "border-gray-400"
                                }`}
                              >
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
                        ))}
                      </div>
                    )}

                  {/* Explanation for Reading & Writing */}
                  {showExplanation && (
                    <div className="mt-6 p-6 bg-blue-50 border border-blue-200 rounded-lg">
                      <h3 className="font-semibold text-lg mb-3 text-blue-900">
                        Explanation
                      </h3>
                      <div
                        className="prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{
                          __html: question.detail.rationale,
                        }}
                      />
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
                        {question.detail.answerOptions.map((choice, idx) => (
                          <button
                            key={choice.id}
                            onClick={() => setSelectedChoice(choice.id)}
                            className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                              selectedChoice === choice.id
                                ? "border-blue-600 bg-blue-50"
                                : "border-gray-300 hover:border-gray-400 bg-white"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center ${
                                  selectedChoice === choice.id
                                    ? "border-blue-600 bg-blue-600 text-white"
                                    : "border-gray-400"
                                }`}
                              >
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
                        ))}
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

                          return (
                            <button
                              key={key}
                              onClick={() => setSelectedChoice(key)}
                              className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                                selectedChoice === key
                                  ? "border-blue-600 bg-blue-50"
                                  : "border-gray-300 hover:border-gray-400 bg-white"
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div
                                  className={`flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center ${
                                    selectedChoice === key
                                      ? "border-blue-600 bg-blue-600 text-white"
                                      : "border-gray-400"
                                  }`}
                                >
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
                    return (
                      <div className="mt-6">
                        <input
                          type="text"
                          placeholder="Enter your answer"
                          className="w-full p-4 border-2 border-gray-300 rounded-lg focus:border-blue-600 focus:outline-none text-lg"
                        />
                      </div>
                    );
                  }

                  return null;
                })()}

                {/* Explanation Section for Math */}
                {showExplanation && (
                  <div className="mt-6 p-6 bg-blue-50 border border-blue-200 rounded-lg">
                    <h3 className="font-semibold text-lg mb-3 text-blue-900">
                      Explanation
                    </h3>
                    <div
                      className="prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{
                        __html: Array.isArray(question.detail)
                          ? question.detail[0]?.answer?.rationale
                          : question.detail.rationale,
                      }}
                    />
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Fixed Bottom Action Buttons */}
      <div className="bg-white border-t px-6 py-4 fixed bottom-0 left-0 right-0 z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => setShowExplanation(!showExplanation)}
          >
            {showExplanation ? "Hide Explanation" : "Show Explanation"}
          </Button>

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
              onClick={() => {
                // Check answer logic here
                alert("Check answer functionality");
              }}
            >
              Check
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
    </div>
  );
}
