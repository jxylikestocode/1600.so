'use client';

import { Button } from '@/components/ui/button';
import { Bookmark, CheckCircle, XCircle } from 'lucide-react';
import { useFilters } from '@/contexts/filter-context';

/**
 * StatusFilters Component
 *
 * Three independent filter groups:
 * 1. Marked for Review
 * 2. Solved
 * 3. Answered Incorrectly
 *
 * Each has: All / Yes / No options
 * Each filter is independent (not mutually exclusive)
 *
 * KEY DIFFERENCE from DifficultyFilter:
 * - This has 3 separate states (one for each filter)
 * - DifficultyFilter had 1 state with complex logic
 */
export function StatusFilters() {
  // Use filter context instead of local state
  const { markedForReview, setMarkedForReview, solved, setSolved, answeredIncorrectly, setAnsweredIncorrectly } = useFilters();

  /**
   * Reusable FilterGroup component
   *
   * Props:
   * - icon: React component for the icon
   * - label: Display text
   * - value: Current selected value ('all', 'yes', 'no')
   * - onChange: Function to call when selection changes
   * - color: Color theme (yellow, green, red)
   */
  const FilterGroup = ({ icon: Icon, label, value, onChange, color }) => {
    // Map colors to Tailwind classes
    const colorClasses = {
      yellow: 'text-yellow-600',
      green: 'text-green-600',
      red: 'text-red-600',
    };

    return (
      <div>
        {/* Label with Icon */}
        <div className="flex items-center gap-1.5 mb-2">
          <Icon className={`w-4 h-4 ${colorClasses[color]}`} />
          <h4 className="text-xs font-semibold">{label}</h4>
        </div>

        {/* Buttons */}
        <div className="flex gap-2">
          <Button
            variant={value === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onChange('all')}
          >
            All
          </Button>
          <Button
            variant={value === 'yes' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onChange('yes')}
          >
            Yes
          </Button>
          <Button
            variant={value === 'no' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onChange('no')}
          >
            No
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Marked for Review */}
      <FilterGroup
        icon={Bookmark}
        label="Marked for Review"
        value={markedForReview}
        onChange={setMarkedForReview}
        color="yellow"
      />

      {/* Solved */}
      <FilterGroup
        icon={CheckCircle}
        label="Solved"
        value={solved}
        onChange={setSolved}
        color="green"
      />

      {/* Answered Incorrectly */}
      <FilterGroup
        icon={XCircle}
        label="Answered Incorrectly"
        value={answeredIncorrectly}
        onChange={setAnsweredIncorrectly}
        color="red"
      />
    </div>
  );
}
