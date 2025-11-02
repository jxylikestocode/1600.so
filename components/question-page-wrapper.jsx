"use client";

import { QuestionViewer } from "@/components/question-viewer";
import { LoginRequiredGuard } from "@/components/auth/login-required-guard";

/**
 * QuestionPageWrapper
 *
 * Client component wrapper for question pages that includes:
 * - Login requirement guard for users with accounts
 * - QuestionViewer component
 */
export function QuestionPageWrapper(props) {
  return (
    <LoginRequiredGuard>
      <QuestionViewer {...props} />
    </LoginRequiredGuard>
  );
}
