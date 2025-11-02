import { NextResponse } from 'next/server';
import { getAllUsersWithActivity } from '@/lib/analytics-db';

/**
 * GET /api/admin/users
 * Returns a list of all users with their activity summary
 */
export async function GET() {
  try {
    const result = await getAllUsersWithActivity();

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      users: result.data,
      total: result.data.length,
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}
