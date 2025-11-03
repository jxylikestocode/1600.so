import { NextResponse } from 'next/server';
import { insertComment } from '@/lib/comments-db';

/**
 * POST /api/comments
 * Submit a new comment
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { userId, pagePath, commentText, userEmail, userName } = body;

    // Validation
    if (!userId || !pagePath || !commentText) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, pagePath, commentText' },
        { status: 400 }
      );
    }

    if (commentText.trim().length === 0) {
      return NextResponse.json(
        { error: 'Comment text cannot be empty' },
        { status: 400 }
      );
    }

    if (commentText.length > 5000) {
      return NextResponse.json(
        { error: 'Comment text too long (max 5000 characters)' },
        { status: 400 }
      );
    }

    const result = await insertComment({
      userId,
      pagePath,
      commentText,
      userEmail,
      userName
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to save comment' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      comment: result.data
    });
  } catch (error) {
    console.error('Error in POST /api/comments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
