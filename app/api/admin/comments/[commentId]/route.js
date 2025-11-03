import { NextResponse } from 'next/server';
import { updateCommentReadStatus, deleteComment } from '@/lib/comments-db';

/**
 * PATCH /api/admin/comments/[commentId]
 * Update comment read status
 */
export async function PATCH(request, { params }) {
  try {
    const { commentId } = await params;
    const body = await request.json();
    const { isRead } = body;

    if (typeof isRead !== 'boolean') {
      return NextResponse.json(
        { error: 'isRead must be a boolean' },
        { status: 400 }
      );
    }

    const result = await updateCommentReadStatus(commentId, isRead);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to update comment' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      comment: result.data
    });
  } catch (error) {
    console.error('Error in PATCH /api/admin/comments/[commentId]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/comments/[commentId]
 * Delete a comment
 */
export async function DELETE(request, { params }) {
  try {
    const { commentId } = await params;

    const result = await deleteComment(commentId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to delete comment' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true
    });
  } catch (error) {
    console.error('Error in DELETE /api/admin/comments/[commentId]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
