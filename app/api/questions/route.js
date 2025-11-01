import { NextResponse } from 'next/server';
import { getAllQuestions } from '@/lib/data';

/**
 * GET /api/questions
 * Returns all questions (cached)
 */
export async function GET() {
  try {
    const questions = await getAllQuestions();
    return NextResponse.json(questions);
  } catch (error) {
    console.error('Error loading questions:', error);
    return NextResponse.json(
      { error: 'Failed to load questions' },
      { status: 500 }
    );
  }
}
