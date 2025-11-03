import { NextResponse } from 'next/server';
import { getUserJourney } from '@/lib/analytics-db';
import { getQuestionsByIds } from '@/lib/data';
import { getUserComments } from '@/lib/comments-db';

/**
 * GET /api/admin/users/[userId]/journey
 * Returns a user's complete event journey with question details
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

    // Extract unique question IDs from events
    const questionIds = new Set();
    result.data.events.forEach(event => {
      // Check both answer events and pageview events for question IDs
      if (event.event_data?.questionId) {
        questionIds.add(event.event_data.questionId);
      }
      // Also check page_path for question IDs (e.g., /question/abc123)
      if (event.page_path && event.page_path.startsWith('/question/')) {
        const idFromPath = event.page_path.split('/')[2]?.split('?')[0];
        if (idFromPath) {
          questionIds.add(idFromPath);
        }
      }
    });

    // Fetch question details in batch
    let questionDetails = {};
    if (questionIds.size > 0) {
      const questions = await getQuestionsByIds(Array.from(questionIds));
      // Create lookup map
      questionDetails = Object.fromEntries(
        questions.map(q => [q.questionId, q])
      );
      console.log(`[Journey API] Loaded ${questions.length} question details for user ${userId}`);
    }

    // Fetch user comments
    const commentsResult = await getUserComments(userId);
    const comments = commentsResult.success ? commentsResult.data : [];

    return NextResponse.json({
      userId,
      userEmail: result.data.userEmail, // User email for authenticated users
      events: result.data.events, // Backward compatible flat events
      sessions: result.data.sessions, // New grouped sessions
      questionDetails, // New question details map
      comments, // User comments
      total: result.data.events.length,
    });
  } catch (error) {
    console.error('Error fetching user journey:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user journey' },
      { status: 500 }
    );
  }
}
