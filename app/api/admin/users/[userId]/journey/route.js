import { NextResponse } from 'next/server';
import { getUserJourney } from '@/lib/analytics-db';

/**
 * GET /api/admin/users/[userId]/journey
 * Returns a user's complete event journey
 */
export async function GET(request, { params }) {
  try {
    const { userId } = await params;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const result = await getUserJourney(userId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      userId,
      events: result.data,
      total: result.data.length,
    });
  } catch (error) {
    console.error('Error fetching user journey:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user journey' },
      { status: 500 }
    );
  }
}
