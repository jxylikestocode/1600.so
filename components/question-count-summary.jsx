'use client';

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useFilters } from '@/contexts/filter-context';
import { applyFilters, getFilteredSkillBreakdown } from '@/lib/filter-utils';
import { useRouter } from 'next/navigation';

/**
 * QuestionCountSummary Component
 *
 * Displays a breakdown of question counts by subject, category, and skill
 * Now filters based on the active filter state
 *
 * Props:
 * - allQuestions: Array of all question objects
 */
export function QuestionCountSummary({ allQuestions }) {
  const filters = useFilters();
  const router = useRouter();

  // Apply filters to questions
  const filteredQuestions = applyFilters(allQuestions, filters);

  // Get breakdowns for filtered questions
  const mathBreakdown = getFilteredSkillBreakdown(filteredQuestions, 'math');
  const readingBreakdown = getFilteredSkillBreakdown(filteredQuestions, 'reading-writing');

  // Calculate totals
  const mathTotal = filteredQuestions.filter(q => q.subject === 'math').length;
  const readingTotal = filteredQuestions.filter(q => q.subject === 'reading-writing').length;

  /**
   * Handle clicking on a subject header - navigate to first question in that subject
   */
  const handleSubjectClick = (subject) => {
    const subjectQuestions = filteredQuestions.filter(q => q.subject === subject);

    if (subjectQuestions.length > 0) {
      const firstQuestion = subjectQuestions[0];
      const params = new URLSearchParams({ subject });

      // Add selected bands to URL if any are selected
      if (filters.selectedBands.length > 0) {
        params.set('bands', filters.selectedBands.join(','));
      }

      router.push(`/question/${firstQuestion.questionId}?${params.toString()}`);
    }
  };

  /**
   * Handle clicking on a category - navigate to first question in that category
   */
  const handleCategoryClick = (category, subject) => {
    const categoryQuestions = filteredQuestions.filter(
      q => q.subject === subject && q.primary_class_cd_desc === category
    );

    if (categoryQuestions.length > 0) {
      const firstQuestion = categoryQuestions[0];
      const params = new URLSearchParams({
        domain: category,
        subject: subject,
      });

      // Add selected bands to URL if any are selected
      if (filters.selectedBands.length > 0) {
        params.set('bands', filters.selectedBands.join(','));
      }

      router.push(`/question/${firstQuestion.questionId}?${params.toString()}`);
    }
  };

  /**
   * Handle clicking on a skill - navigate to first question in that skill
   */
  const handleSkillClick = (skillName, subject) => {
    // Find questions matching this skill
    const skillQuestions = filteredQuestions.filter(
      q => q.subject === subject && q.skill_desc === skillName
    );

    if (skillQuestions.length > 0) {
      // Navigate to first question with skill filter and difficulty bands in URL
      const firstQuestion = skillQuestions[0];
      const params = new URLSearchParams({
        skill: skillName,
        subject: subject,
      });

      // Add selected bands to URL if any are selected
      if (filters.selectedBands.length > 0) {
        params.set('bands', filters.selectedBands.join(','));
      }

      router.push(`/question/${firstQuestion.questionId}?${params.toString()}`);
    }
  };
  /**
   * CategorySection - Renders a category with its skills
   */
  const CategorySection = ({ category, skills, subject }) => {
    const categoryTotal = skills.reduce((sum, skill) => sum + skill.count, 0);

    return (
      <div className="mb-4">
        {/* Category Header */}
        <div
          className="flex items-center gap-2 mb-2 cursor-pointer hover:bg-gray-50 p-1 rounded transition-colors w-fit"
          onClick={() => categoryTotal > 0 && handleCategoryClick(category, subject)}
        >
          <Badge variant="outline" className="font-semibold">
            {category}
          </Badge>
          <span className="text-xs text-gray-500">({categoryTotal})</span>
        </div>

        {/* Skills List */}
        <div className="space-y-1.5 ml-4">
          {skills.map((skill, idx) => (
            <div
              key={idx}
              onClick={() => skill.count > 0 && handleSkillClick(skill.name, subject)}
              className={`flex items-center justify-between group px-2 py-1 rounded transition-colors ${
                skill.count > 0 ? 'hover:bg-blue-50 cursor-pointer' : 'opacity-50'
              }`}
            >
              <span className="text-sm text-gray-700">{skill.name}</span>
              <Badge
                variant="secondary"
                className="ml-2 min-w-[40px] justify-center"
              >
                {skill.count}
              </Badge>
            </div>
          ))}
        </div>
      </div>
    );
  };

  /**
   * SubjectColumn - Renders all categories for a subject
   */
  const SubjectColumn = ({ title, breakdown, total, emoji, subject }) => {
    return (
      <div>
        {/* Subject Header */}
        <div className="flex items-center justify-between mb-4 pb-3 border-b-2">
          <div
            className="flex items-center gap-2 cursor-pointer hover:opacity-70 transition-opacity"
            onClick={() => total > 0 && handleSubjectClick(subject)}
          >
            <span className="text-2xl">{emoji}</span>
            <h3 className="text-lg font-bold">{title}</h3>
          </div>
          <Badge
            className="bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
            onClick={() => total > 0 && handleSubjectClick(subject)}
          >
            {total} questions
          </Badge>
        </div>

        {/* Categories */}
        <div>
          {breakdown.map((item, idx) => (
            <CategorySection
              key={idx}
              category={item.category}
              skills={item.skills}
              subject={subject}
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Reading & Writing Column */}
          <SubjectColumn
            title="Reading & Writing"
            breakdown={readingBreakdown}
            total={readingTotal}
            emoji="📖"
            subject="reading-writing"
          />

          {/* Math Column */}
          <SubjectColumn
            title="Math"
            breakdown={mathBreakdown}
            total={mathTotal}
            emoji="🔢"
            subject="math"
          />
        </div>
      </CardContent>
    </Card>
  );
}
