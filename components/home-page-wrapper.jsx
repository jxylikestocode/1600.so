"use client";

import { FilterProvider } from "@/contexts/filter-context";
import { FilterPanel } from "@/components/filter-panel";
import { QuestionCountSummary } from "@/components/question-count-summary";
import { Header } from "@/components/header";
import { LoginRequiredGuard } from "@/components/auth/login-required-guard";

/**
 * HomePageWrapper
 *
 * Client component wrapper for the home page that includes:
 * - Login requirement guard for users with accounts
 * - Filter context provider
 * - All home page content
 */
export function HomePageWrapper({ allQuestions }) {
  return (
    <LoginRequiredGuard>
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header with Navigation */}
          <Header />

          {/* Wrap everything in FilterProvider so filters work */}
          <FilterProvider>
            {/* Filter Panel */}
            <FilterPanel allQuestions={allQuestions} />

            {/* Question Count Summary - now updates based on filters */}
            <QuestionCountSummary allQuestions={allQuestions} />
          </FilterProvider>
        </div>
      </div>
    </LoginRequiredGuard>
  );
}
