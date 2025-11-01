"use client";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ActiveQuestionsFilter } from "./active-questions-filter";
import { ReleasedFilter } from "./released-filter";
import { ProgramFilter } from "./program-filter";
import { DifficultyFilter } from "./difficulty-filter";
import { StatusFilters } from "./status-filters";
import { useFilters } from "@/contexts/filter-context";

/**
 * FilterPanel Component
 *
 * The complete filter panel that combines all individual filters
 *
 * LAYOUT STRUCTURE:
 * - Card container with header
 * - Individual filter sections with dividers
 * - Reset button at the bottom
 *
 * KEY CONCEPT:
 * This is a "presentational" component - it just arranges the filters
 * Each filter manages its own state independently
 * Later, we'll add a way to collect all filter values for querying
 */
export function FilterPanel() {
  const { resetFilters } = useFilters();

  return (
    <Card>
      {/* <CardHeader className="pb-3">
        <CardTitle className="text-lg">Filters</CardTitle>
      </CardHeader> */}

      <CardContent className="space-y-4">
        {/* All filters on the same row */}
        <div className="flex items-start gap-4 flex-wrap">
          {/* <ActiveQuestionsFilter /> */}
          {/* <ReleasedFilter /> */}
          {/* <ProgramFilter /> */}
          <DifficultyFilter />
          {/* <StatusFilters /> */}
        </div>

        {/* Reset button at bottom right */}
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={resetFilters}>
            Reset All
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
