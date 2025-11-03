import { NextResponse } from 'next/server';
import { getAllComments } from '@/lib/comments-db';

/**
 * GET /api/admin/comments
 * Get all comments with optional filters
 * Query params: isRead (true/false), pagePath, limit, offset
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    const isReadParam = searchParams.get('isRead');
    const pagePath = searchParams.get('pagePath');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    const filters = {
      limit,
      offset
    };

    // Parse isRead parameter
    if (isReadParam !== null) {
      filters.isRead = isReadParam === 'true';
    }

    if (pagePath) {
      filters.pagePath = pagePath;
    }

    const result = await getAllComments(filters);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to fetch comments' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      comments: result.data,
      total: result.total
    });
  } catch (error) {
    console.error('Error in GET /api/admin/comments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
