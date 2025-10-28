'use client';

import { Button } from '@/components/ui/button';
import { useFilters } from '@/contexts/filter-context';

/**
 * ReleasedFilter Component
 *
 * Filter by release date
 * Options: All, 2023, 2024 October, 2025 March, 2025 August
 * Mutually exclusive (only one selected at a time)
 */
export function ReleasedFilter() {
  const { released, setReleased } = useFilters();

  const options = [
    { value: 'all', label: 'All' },
    { value: '2023', label: '2023' },
    { value: '2024-oct', label: '2024 October' },
    { value: '2025-mar', label: '2025 March' },
    { value: '2025-aug', label: '2025 August' },
  ];

  return (
    <div>
      <h3 className="text-sm font-semibold mb-2">Released</h3>

      <div className="flex gap-2 flex-wrap">
        {options.map(option => (
          <Button
            key={option.value}
            variant={released === option.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => setReleased(option.value)}
          >
            {option.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
