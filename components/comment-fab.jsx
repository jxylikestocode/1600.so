'use client';

import { useState, useEffect } from 'react';
import { MessageCircle } from 'lucide-react';
import { usePathname } from 'next/navigation';
import CommentModal from './comment-modal';

/**
 * CommentFAB - Floating Action Button for comments
 * Appears on all pages to allow users to leave feedback
 */
export default function CommentFAB() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userId, setUserId] = useState(null);
  const pathname = usePathname();

  // Get or create user ID (using same ID as analytics system)
  useEffect(() => {
    // Use the same user ID that analytics uses
    let storedUserId = localStorage.getItem('analytics_user_id');

    if (!storedUserId) {
      // Check if user has a temp user ID from authentication
      storedUserId = localStorage.getItem('temp_user_id');

      if (!storedUserId) {
        // Generate anonymous user ID (same format as analytics)
        storedUserId = `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      }

      localStorage.setItem('analytics_user_id', storedUserId);
    }

    setUserId(storedUserId);
  }, []);

  // Don't render FAB on admin pages (to avoid clutter)
  if (pathname?.startsWith('/admin')) {
    return null;
  }

  if (!userId) {
    return null; // Wait for user ID to be set
  }

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-24 right-6 z-40 bg-blue-600/80 hover:bg-blue-600 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-110 group"
        aria-label="Leave feedback"
      >
        <MessageCircle size={24} />

        {/* Tooltip */}
        <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-gray-900 text-white text-sm px-3 py-2 rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          Leave Feedback
        </span>
      </button>

      {/* Comment Modal */}
      <CommentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        userId={userId}
        pagePath={pathname || '/'}
      />
    </>
  );
}
