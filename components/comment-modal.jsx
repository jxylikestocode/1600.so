'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

/**
 * CommentModal - Modal for submitting comments
 *
 * @param {boolean} isOpen - Whether the modal is open
 * @param {function} onClose - Callback when modal is closed
 * @param {string} userId - Current user ID
 * @param {string} pagePath - Current page path
 */
export default function CommentModal({ isOpen, onClose, userId, pagePath }) {
  const [commentText, setCommentText] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const isAnonymous = userId?.startsWith('anon_');
  const maxLength = 5000;

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setCommentText('');
      setError(null);
      setSuccess(false);
    }
  }, [isOpen]);

  // Auto-close after success
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        onClose();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [success, onClose]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!commentText.trim()) {
      setError('Please enter a comment');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          pagePath,
          commentText: commentText.trim(),
          userEmail: userEmail.trim() || null,
          userName: userName.trim() || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit comment');
      }

      setSuccess(true);
      setCommentText('');
      setUserEmail('');
      setUserName('');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Invisible backdrop - click to close */}
      <div
        className={`fixed inset-0 z-40 ${isOpen ? 'block' : 'hidden'}`}
        onClick={onClose}
      />

      {/* Side Panel - slides in from right */}
      <div className={`fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out overflow-y-auto ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">💬 Share Your Feedback</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <X size={24} />
          </button>
        </div>

        {/* Success Message */}
        {success ? (
          <div className="py-8 text-center">
            <div className="text-6xl mb-4">✅</div>
            <p className="text-lg font-semibold text-green-600">Thank you for your feedback!</p>
            <p className="text-sm text-gray-600 mt-2">Your comment has been submitted.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {/* Page Info */}
            <div className="mb-4 p-3 bg-gray-50 rounded-md">
              <p className="text-xs text-gray-600 font-medium">Commenting on:</p>
              <p className="text-sm text-gray-900 font-mono">{pagePath}</p>
            </div>

            {/* Comment Text */}
            <div className="mb-4">
              <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2">
                Your Comment *
              </label>
              <textarea
                id="comment"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Share your thoughts, report an issue, or suggest an improvement..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={5}
                maxLength={maxLength}
                required
              />
              <div className="flex justify-between items-center mt-1">
                <p className="text-xs text-gray-500">
                  {commentText.length} / {maxLength}
                </p>
                {commentText.length > maxLength * 0.9 && (
                  <p className="text-xs text-orange-600">
                    {maxLength - commentText.length} characters remaining
                  </p>
                )}
              </div>
            </div>

            {/* Optional fields for anonymous users */}
            {isAnonymous && (
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-sm text-blue-900 font-medium mb-3">
                  Optional: Help us follow up with you
                </p>

                <div className="mb-3">
                  <label htmlFor="name" className="block text-sm text-gray-700 mb-1">
                    Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    placeholder="Your name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || !commentText.trim()}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-md transition-colors"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
            </button>
          </form>
        )}
        </div>
      </div>
    </>
  );
}
