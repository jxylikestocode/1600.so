"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { hasUserAccount } from "@/lib/local-storage";
import { LoginModal } from "@/components/auth/login-modal";

/**
 * LoginRequiredGuard
 *
 * Shows a login prompt overlay if:
 * - User is not authenticated
 * - User has previously created an account (marker exists in localStorage)
 *
 * This prevents users who have created accounts from using the app anonymously.
 * First-time users without accounts can still use the app normally.
 */
export function LoginRequiredGuard({ children }) {
  const { user, isAuthenticated, loading } = useAuth();
  const [hasAccount, setHasAccount] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setHasAccount(hasUserAccount());
    }
  }, []);

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mb-4"></div>
          <div className="text-xl font-semibold text-gray-900">Loading...</div>
        </div>
      </div>
    );
  }

  // If user has account but is logged out, show login prompt
  const requiresLogin = hasAccount && !isAuthenticated;

  if (requiresLogin) {
    return (
      <>
        {/* Blurred content in background */}
        <div className="filter blur-sm pointer-events-none select-none">
          {children}
        </div>

        {/* Login required overlay */}
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-8 text-center">
            <svg
              className="w-16 h-16 text-blue-600 mx-auto mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Please Sign In
            </h2>
            <p className="text-gray-600 mb-6">
              You've previously created an account. Please sign in to continue using the app and access your progress.
            </p>
            <button
              onClick={() => setShowLoginModal(true)}
              className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              Sign In to Continue
            </button>
          </div>
        </div>

        {/* Login Modal */}
        <LoginModal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
        />
      </>
    );
  }

  // Normal render - user is authenticated OR anonymous without account
  return <>{children}</>;
}
