'use client';

import { Button } from '@/components/ui/button';
import { useFilters } from '@/contexts/filter-context';

/**
 * ProgramFilter Component
 *
 * Filter by test program
 * Options: All, SAT, PSAT 8/9, PSAT/NMSQT & PSAT 10
 * Mutually exclusive (only one selected at a time)
 */
export function ProgramFilter() {
  const { program, setProgram } = useFilters();

  const options = [
    { value: 'all', label: 'All' },
    { value: 'sat', label: 'SAT' },
    { value: 'psat-8-9', label: 'PSAT 8/9' },
    { value: 'psat-nmsqt', label: 'PSAT/NMSQT & PSAT 10' },
  ];

  return (
    <div>
      <h3 className="text-sm font-semibold mb-2">Program</h3>

      <div className="flex gap-2 flex-wrap">
        {options.map(option => (
          <Button
            key={option.value}
            variant={program === option.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => setProgram(option.value)}
          >
            {option.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
