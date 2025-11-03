'use client';

import { Button } from '@/components/ui/button';
import { useFilters } from '@/contexts/filter-context';
import { ChevronRight } from 'lucide-react';
import { trackFilter } from '@/lib/analytics';

/**
 * SubjectDomainSkillFilter Component
 *
 * Hierarchical filter for: Subject → Domain → Skill
 * - Click "Math" → Shows all math domains
 * - Click "Algebra" → Shows all algebra skills
 * - Click specific skill → Filters to that skill
 */
export function SubjectDomainSkillFilter({ allQuestions }) {
  const {
    selectedSubject,
    setSelectedSubject,
    selectedDomain,
    setSelectedDomain,
    selectedSkill,
    setSelectedSkill,
  } = useFilters();

  // Get unique domains for selected subject
  const domains = selectedSubject !== 'all'
    ? [...new Set(
        allQuestions
          .filter(q => q.subject === selectedSubject)
          .map(q => q.primary_class_cd_desc)
      )].sort()
    : [];

  // Get unique skills for selected subject/domain
  const skills = selectedDomain !== 'all'
    ? [...new Set(
        allQuestions
          .filter(q =>
            q.subject === selectedSubject &&
            q.primary_class_cd_desc === selectedDomain
          )
          .map(q => q.skill_desc)
      )].sort()
    : selectedSubject !== 'all'
    ? [...new Set(
        allQuestions
          .filter(q => q.subject === selectedSubject)
          .map(q => q.skill_desc)
      )].sort()
    : [];

  const handleSubjectChange = (subject) => {
    trackFilter('subject', subject);
    setSelectedSubject(subject);
    setSelectedDomain('all'); // Reset domain when subject changes
    setSelectedSkill('all'); // Reset skill when subject changes
  };

  const handleDomainChange = (domain) => {
    trackFilter('domain', domain);
    setSelectedDomain(domain);
    setSelectedSkill('all'); // Reset skill when domain changes
  };

  const handleSkillChange = (skill) => {
    trackFilter('skill', skill);
    setSelectedSkill(skill);
  };

  // Calculate counts for each level
  const mathCount = allQuestions.filter(q => q.subject === 'math').length;
  const readingCount = allQuestions.filter(q => q.subject === 'reading-writing').length;

  return (
    <div className="space-y-3">
      {/* Subject Level */}
      <div>
        <label className="text-sm font-medium text-gray-700 mb-2 block">
          Subject
        </label>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedSubject === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleSubjectChange('all')}
          >
            All Subjects
          </Button>
          <Button
            variant={selectedSubject === 'math' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleSubjectChange('math')}
          >
            Math ({mathCount})
          </Button>
          <Button
            variant={selectedSubject === 'reading-writing' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleSubjectChange('reading-writing')}
          >
            Reading & Writing ({readingCount})
          </Button>
        </div>
      </div>

      {/* Domain Level - Show if subject is selected */}
      {selectedSubject !== 'all' && domains.length > 0 && (
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            Domain
            <span className="text-xs text-gray-500 ml-2 font-normal">
              (in {selectedSubject === 'math' ? 'Math' : 'Reading & Writing'})
            </span>
          </label>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedDomain === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleDomainChange('all')}
            >
              All {selectedSubject === 'math' ? 'Math' : 'Reading & Writing'}
            </Button>
            {domains.map(domain => {
              const domainCount = allQuestions.filter(
                q => q.subject === selectedSubject && q.primary_class_cd_desc === domain
              ).length;
              return (
                <Button
                  key={domain}
                  variant={selectedDomain === domain ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleDomainChange(domain)}
                >
                  {domain} ({domainCount})
                </Button>
              );
            })}
          </div>
        </div>
      )}

      {/* Skill Level - Show if subject is selected */}
      {selectedSubject !== 'all' && skills.length > 0 && (
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            Skills
            {selectedDomain !== 'all' && (
              <span className="text-xs text-gray-500 ml-2 font-normal">
                (in {selectedDomain})
              </span>
            )}
          </label>
          <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
            <Button
              variant={selectedSkill === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleSkillChange('all')}
            >
              All {selectedDomain !== 'all' ? `${selectedDomain} ` : ''}Skills
            </Button>
            {skills.map(skill => {
              let skillCount;
              if (selectedDomain !== 'all') {
                skillCount = allQuestions.filter(
                  q => q.subject === selectedSubject &&
                       q.primary_class_cd_desc === selectedDomain &&
                       q.skill_desc === skill
                ).length;
              } else {
                skillCount = allQuestions.filter(
                  q => q.subject === selectedSubject && q.skill_desc === skill
                ).length;
              }

              return (
                <Button
                  key={skill}
                  variant={selectedSkill === skill ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleSkillChange(skill)}
                  className="text-left"
                >
                  {skill} ({skillCount})
                </Button>
              );
            })}
          </div>
        </div>
      )}

      {/* Breadcrumb showing current selection */}
      {selectedSubject !== 'all' && (
        <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 p-3 rounded">
          <span className="font-medium">Current selection:</span>
          <span>{selectedSubject === 'math' ? 'Math' : 'Reading & Writing'}</span>
          {selectedDomain !== 'all' && (
            <>
              <ChevronRight className="w-4 h-4" />
              <span>{selectedDomain}</span>
            </>
          )}
          {selectedSkill !== 'all' && (
            <>
              <ChevronRight className="w-4 h-4" />
              <span>{selectedSkill}</span>
            </>
          )}
        </div>
      )}
    </div>
  );
}
