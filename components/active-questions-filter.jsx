'use client';

import { Button } from '@/components/ui/button';
import { useFilters } from '@/contexts/filter-context';

/**
 * ActiveQuestionsFilter Component
 *
 * Simple filter with 3 mutually exclusive options:
 * - All (default)
 * - Bluebook Only
 * - Exclude Bluebook
 *
 * This is the SIMPLEST filter pattern - just radio-button style selection
 */
export function ActiveQuestionsFilter() {
  const { activeQuestions, setActiveQuestions } = useFilters();

  return (
    <div>
      <h3 className="text-sm font-semibold mb-2">Active Questions</h3>

      <div className="flex gap-2 flex-wrap">
        <Button
          variant={activeQuestions === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveQuestions('all')}
        >
          All
        </Button>

        <Button
          variant={activeQuestions === 'bluebook' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveQuestions('bluebook')}
        >
          Bluebook Only
        </Button>

        <Button
          variant={activeQuestions === 'exclude-bluebook' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveQuestions('exclude-bluebook')}
        >
          Exclude Bluebook
        </Button>
      </div>
    </div>
  );
}
