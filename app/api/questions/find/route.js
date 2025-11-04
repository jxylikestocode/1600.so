import { NextResponse } from 'next/server';
import { getAllQuestions } from '@/lib/data';

/**
 * GET /api/questions/find?subject=math&domain=Algebra&skill=Linear+functions
 * Finds the first question matching the given filters
 *
 * Query params:
 *  - subject: (optional) 'math' or 'reading-writing'
 *  - domain: (optional) domain name (e.g., 'Algebra')
 *  - skill: (optional) skill name (e.g., 'Linear functions')
 *
 * Returns the first matching question or null if none found
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const subject = searchParams.get('subject');
    const domain = searchParams.get('domain');
    const skill = searchParams.get('skill');

    // Get all questions
    const allQuestions = await getAllQuestions();

    // Filter questions based on provided params
    let matchingQuestion = allQuestions.find(q => {
      // Check subject filter
      if (subject && q.subject !== subject) {
        return false;
      }

      // Check domain filter
      if (domain && q.primary_class_cd_desc !== domain) {
        return false;
      }

      // Check skill filter
      if (skill && q.skill_desc !== skill) {
        return false;
      }

      return true;
    });

    if (!matchingQuestion) {
      return NextResponse.json({ questionId: null });
    }

    // Return only the question ID to minimize payload
    return NextResponse.json({ questionId: matchingQuestion.questionId });
  } catch (error) {
    console.error('Error finding question:', error);
    return NextResponse.json(
      { error: 'Failed to find question' },
      { status: 500 }
    );
  }
}
