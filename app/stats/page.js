"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useUserData } from "@/contexts/user-data-context";
import { ArrowLeft, TrendingUp, Clock, Target, Flame, ChevronDown, ChevronRight } from "lucide-react";
import { AuthButton } from "@/components/auth/auth-button";

export default function StatsPage() {
  const router = useRouter();
  const userData = useUserData();
  const [collapsedDomains, setCollapsedDomains] = useState({});

  // No longer need to load questions - stats functions use stored metadata
  const stats = userData.stats || { totalAnswered: 0, correctCount: 0, accuracy: 0, totalTimeSpent: 0, averageTimePerQuestion: 0, streakDays: 0 };
  const domainStats = userData.getStatsByDomain() || {};
  const subjectStats = userData.getStatsBySubject() || {};
  const isLoading = userData.statsLoading;

  // Check if user has any progress
  const hasProgress = stats && stats.totalAnswered > 0;

  const toggleDomain = (key) => {
    setCollapsedDomains(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

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
            <AuthButton />
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => router.push("/")}
              size="sm"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Practice
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Your Progress
              </h1>
              <p className="text-gray-600 mt-1">
                Track your SAT preparation journey
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {isLoading ? (
          // Loading State
          <Card className="p-12 text-center">
            <div className="text-6xl mb-4">⏳</div>
            <div className="text-2xl font-bold text-gray-900 mb-2">
              Loading Your Progress...
            </div>
            <div className="text-gray-600">
              Fetching your stats from the database
            </div>
          </Card>
        ) : !hasProgress ? (
          // Empty State
          <Card className="p-12 text-center">
            <div className="text-6xl mb-4">📊</div>
            <div className="text-2xl font-bold text-gray-900 mb-2">
              No Progress Yet
            </div>
            <div className="text-gray-600 mb-6">
              Start answering questions to track your progress and see your
              stats!
            </div>
            <Button onClick={() => router.push("/")}>Start Practicing</Button>
          </Card>
        ) : (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Target className="w-5 h-5 text-blue-600" />
                  <div className="text-sm font-medium text-gray-600">
                    Questions Answered
                  </div>
                </div>
                <div className="text-3xl font-bold text-gray-900">
                  {stats.totalAnswered}
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  {stats.correctCount} correct
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  <div className="text-sm font-medium text-gray-600">
                    Accuracy
                  </div>
                </div>
                <div className="text-3xl font-bold text-green-600">
                  {stats.accuracy.toFixed(1)}%
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  {stats.correctCount}/{stats.totalAnswered}
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Clock className="w-5 h-5 text-purple-600" />
                  <div className="text-sm font-medium text-gray-600">
                    Study Time
                  </div>
                </div>
                <div className="text-3xl font-bold text-gray-900">
                  {Math.floor(stats.totalTimeSpent / 60)}m
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  {Math.floor(stats.averageTimePerQuestion)}s avg
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Flame className="w-5 h-5 text-orange-600" />
                  <div className="text-sm font-medium text-gray-600">
                    Study Streak
                  </div>
                </div>
                <div className="text-3xl font-bold text-orange-600">
                  {stats.streakDays}
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  {stats.streakDays === 1 ? "day" : "days"} in a row
                </div>
              </Card>
            </div>

            {/* Performance by Subject */}
            {Object.keys(subjectStats).length > 0 && (
              <Card className="p-6 mb-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  Performance by Subject
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(subjectStats).map(([subject, data]) => (
                    <div key={subject} className="p-6 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 capitalize">
                          {subject === "reading-writing"
                            ? "Reading & Writing"
                            : subject}
                        </h3>
                        <Badge
                          className={
                            data.accuracy >= 70
                              ? "bg-green-100 text-green-800"
                              : data.accuracy >= 50
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                          }
                        >
                          {data.accuracy.toFixed(1)}%
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">
                            Questions Answered
                          </span>
                          <span className="font-medium text-gray-900">
                            {data.answered}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Correct Answers</span>
                          <span className="font-medium text-gray-900">
                            {data.correct}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Total Time</span>
                          <span className="font-medium text-gray-900">
                            {Math.floor(data.totalTime / 60)}m{" "}
                            {data.totalTime % 60}s
                          </span>
                        </div>
                      </div>
                      {/* Progress bar */}
                      <div className="mt-4">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              data.accuracy >= 70
                                ? "bg-green-600"
                                : data.accuracy >= 50
                                ? "bg-yellow-600"
                                : "bg-red-600"
                            }`}
                            style={{
                              width: `${Math.min(data.accuracy, 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Performance by Domain and Skill */}
            {Object.keys(domainStats).length > 0 && (
              <Card className="p-6 mb-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  Performance by Skill
                </h2>
                <div className="space-y-6">
                  {/* Loop through subjects (Math, Reading & Writing) */}
                  {Object.entries(domainStats).map(([subject, domains]) => (
                    <div key={subject}>
                      <h3 className="text-lg font-semibold text-gray-800 mb-3">
                        {subject === "math" ? "📐 Math" : "📖 Reading & Writing"}
                      </h3>
                      <div className="space-y-3">
                        {/* Loop through domains within subject */}
                        {Object.entries(domains).map(([domain, domainData]) => {
                          const domainKey = `${subject}-${domain}`;
                          const isCollapsed = collapsedDomains[domainKey];
                          const skillCount = Object.keys(domainData.skills || {}).length;

                          return (
                            <div key={domainKey} className="border border-gray-200 rounded-lg overflow-hidden">
                              {/* Domain Header - Clickable */}
                              <button
                                onClick={() => toggleDomain(domainKey)}
                                className="w-full p-4 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between"
                              >
                                <div className="flex items-center gap-3">
                                  {isCollapsed ? <ChevronRight className="w-5 h-5 text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
                                  <div className="text-left">
                                    <div className="font-semibold text-gray-900">{domain}</div>
                                    <div className="text-sm text-gray-600">
                                      {skillCount} {skillCount === 1 ? 'skill' : 'skills'} · {domainData.totalAnswered} questions
                                    </div>
                                  </div>
                                </div>
                                <Badge
                                  className={
                                    domainData.accuracy >= 70
                                      ? "bg-green-100 text-green-800"
                                      : domainData.accuracy >= 50
                                      ? "bg-yellow-100 text-yellow-800"
                                      : "bg-red-100 text-red-800"
                                  }
                                >
                                  {domainData.accuracy.toFixed(0)}%
                                </Badge>
                              </button>

                              {/* Skills within domain - Collapsible */}
                              {!isCollapsed && (
                                <div className="p-4 space-y-3 bg-white">
                                  {Object.entries(domainData.skills || {})
                                    .sort(([, a], [, b]) => b.answered - a.answered)
                                    .map(([skill, skillData]) => (
                                      <div key={skill} className="pl-4 border-l-2 border-gray-200">
                                        <div className="flex items-center justify-between mb-1">
                                          <div className="flex-1">
                                            <div className="text-sm font-medium text-gray-900">{skill}</div>
                                            <div className="text-xs text-gray-600">
                                              {skillData.correct} / {skillData.answered} correct
                                              {" · "}
                                              {Math.floor(skillData.totalTime / skillData.answered)}s avg
                                            </div>
                                          </div>
                                          <Badge
                                            className={
                                              skillData.accuracy >= 70
                                                ? "bg-green-100 text-green-800"
                                                : skillData.accuracy >= 50
                                                ? "bg-yellow-100 text-yellow-800"
                                                : "bg-red-100 text-red-800"
                                            }
                                            variant="outline"
                                          >
                                            {skillData.accuracy.toFixed(0)}%
                                          </Badge>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                                          <div
                                            className={`h-1.5 rounded-full ${
                                              skillData.accuracy >= 70
                                                ? "bg-green-600"
                                                : skillData.accuracy >= 50
                                                ? "bg-yellow-600"
                                                : "bg-red-600"
                                            }`}
                                            style={{
                                              width: `${Math.min(skillData.accuracy, 100)}%`,
                                            }}
                                          />
                                        </div>
                                      </div>
                                    ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Quick Actions */}
            <Card className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Continue Studying
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button
                  onClick={() => router.push("/review")}
                  className="w-full"
                  variant="outline"
                >
                  Review Incorrect Answers
                </Button>
                {/* <Button
                  onClick={() => {
                    // Find lowest accuracy skill
                    const lowestSkill = Object.entries(skillStats)
                      .sort(([, a], [, b]) => a.accuracy - b.accuracy)[0];
                    if (lowestSkill) {
                      const [skillName] = lowestSkill;
                      router.push(`/?skill=${encodeURIComponent(skillName)}`);
                    } else {
                      router.push('/');
                    }
                  }}
                  className="w-full"
                  variant="outline"
                >
                  Practice Weakest Skill
                </Button> */}
                <Button onClick={() => router.push("/")} className="w-full">
                  Continue Practicing
                </Button>
              </div>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
