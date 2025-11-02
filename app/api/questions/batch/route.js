import { NextResponse } from 'next/server';
import { getQuestionsByIds } from '@/lib/data';

/**
 * GET /api/questions/batch?ids=id1,id2,id3
 * Returns specific questions by their IDs
 *
 * Query params:
 *  - ids: comma-separated list of question IDs
 *
 * Example: /api/questions/batch?ids=ac472881,bd583992,ce694a03
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const idsParam = searchParams.get('ids');

    if (!idsParam) {
      return NextResponse.json(
        { error: 'Missing "ids" query parameter' },
        { status: 400 }
      );
    }

    // Parse comma-separated IDs
    const questionIds = idsParam.split(',').map(id => id.trim()).filter(Boolean);

    if (questionIds.length === 0) {
      return NextResponse.json([]);
    }

    // Limit to prevent abuse (max 1000 questions at once)
    if (questionIds.length > 1000) {
      return NextResponse.json(
        { error: 'Too many IDs requested (max 1000)' },
        { status: 400 }
      );
    }

    const questions = await getQuestionsByIds(questionIds);
    return NextResponse.json(questions);
  } catch (error) {
    console.error('Error loading questions batch:', error);
    return NextResponse.json(
      { error: 'Failed to load questions' },
      { status: 500 }
    );
  }
}
