'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatDateTime } from '@/lib/journey-utils';
import { Trash2, CheckCircle, Circle } from 'lucide-react';

export default function AdminCommentsPage() {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterRead, setFilterRead] = useState('all'); // all, read, unread
  const [searchPage, setSearchPage] = useState('');

  useEffect(() => {
    fetchComments();
  }, [filterRead, searchPage]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      if (filterRead !== 'all') {
        params.set('isRead', filterRead === 'read' ? 'true' : 'false');
      }

      if (searchPage) {
        params.set('pagePath', searchPage);
      }

      const response = await fetch(`/api/admin/comments?${params.toString()}`);
      const data = await response.json();

      if (response.ok) {
        setComments(data.comments || []);
      } else {
        setError(data.error || 'Failed to fetch comments');
      }
    } catch (err) {
      setError('Failed to fetch comments');
      console.error('Error fetching comments:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleReadStatus = async (commentId, currentStatus) => {
    try {
      const response = await fetch(`/api/admin/comments/${commentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isRead: !currentStatus }),
      });

      if (response.ok) {
        // Update local state
        setComments(comments.map(comment =>
          comment.id === commentId
            ? { ...comment, is_read: !currentStatus }
            : comment
        ));
      }
    } catch (err) {
      console.error('Error updating comment:', err);
    }
  };

  const deleteComment = async (commentId) => {
    if (!confirm('Are you sure you want to delete this comment?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/comments/${commentId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setComments(comments.filter(comment => comment.id !== commentId));
      }
    } catch (err) {
      console.error('Error deleting comment:', err);
    }
  };

  const unreadCount = comments.filter(c => !c.is_read).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-8"></div>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">Error: {error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/admin" className="text-blue-600 hover:text-blue-800 text-sm mb-2 inline-block">
            ← Back to admin
          </Link>
          <div className="flex items-center justify-between mt-2">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">💬 User Comments</h1>
              <p className="text-gray-600 mt-2">
                {comments.length} total comments
                {unreadCount > 0 && (
                  <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded">
                    {unreadCount} unread
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 bg-white rounded-lg p-4 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Read Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setFilterRead('all')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    filterRead === 'all'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilterRead('unread')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    filterRead === 'unread'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Unread
                </button>
                <button
                  onClick={() => setFilterRead('read')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    filterRead === 'read'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Read
                </button>
              </div>
            </div>

            {/* Page Search */}
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                Search by Page
              </label>
              <input
                id="search"
                type="text"
                value={searchPage}
                onChange={(e) => setSearchPage(e.target.value)}
                placeholder="Enter page path..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Comments List */}
        <div className="space-y-4">
          {comments.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg">
              <p className="text-gray-500">No comments found</p>
            </div>
          ) : (
            comments.map((comment) => (
              <div
                key={comment.id}
                className={`bg-white rounded-lg shadow-sm p-6 border-l-4 ${
                  comment.is_read ? 'border-l-gray-300' : 'border-l-blue-500'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Header */}
                    <div className="flex items-center gap-3 mb-2">
                      <button
                        onClick={() => toggleReadStatus(comment.id, comment.is_read)}
                        className="text-gray-400 hover:text-blue-600 transition-colors"
                        title={comment.is_read ? 'Mark as unread' : 'Mark as read'}
                      >
                        {comment.is_read ? (
                          <CheckCircle size={20} className="text-green-600" />
                        ) : (
                          <Circle size={20} />
                        )}
                      </button>

                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {comment.user_name || 'Anonymous User'}
                          {comment.user_email && (
                            <span className="text-gray-500 font-normal ml-2">
                              ({comment.user_email})
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDateTime(comment.created_at)}
                        </p>
                      </div>
                    </div>

                    {/* Page Path */}
                    <div className="mb-3 flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-600">Page:</span>
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-800">
                        {comment.page_path}
                      </code>
                      <Link
                        href={comment.page_path}
                        target="_blank"
                        className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        Visit page →
                      </Link>
                    </div>

                    {/* Comment Text */}
                    <div className="bg-gray-50 rounded-md p-4 mb-3">
                      <p className="text-gray-900 whitespace-pre-wrap">{comment.comment_text}</p>
                    </div>

                    {/* User ID */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">User ID:</span>
                      <Link
                        href={`/admin/users/${comment.user_id}`}
                        className="text-xs font-mono text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        {comment.user_id}
                      </Link>
                      <Link
                        href={`/admin/users/${comment.user_id}`}
                        className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        View journey →
                      </Link>
                    </div>
                  </div>

                  {/* Delete Button */}
                  <button
                    onClick={() => deleteComment(comment.id)}
                    className="ml-4 text-red-400 hover:text-red-600 transition-colors"
                    title="Delete comment"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
