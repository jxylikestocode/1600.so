"use client";

import { Button } from "@/components/ui/button";
import { Gauge } from "lucide-react";
import { useFilters } from "@/contexts/filter-context";

/**
 * DifficultyFilter Component
 *
 * A combined Difficulty + Score Band filter
 *
 * HOW IT WORKS:
 * - Easy includes score bands 1, 2, 3
 * - Medium includes score bands 4, 5
 * - Hard includes score bands 6, 7
 * - Selecting a difficulty auto-selects its bands
 * - Selecting a band auto-selects its difficulty
 * - Only one selection active at a time (mutually exclusive)
 *
 * WHY CLIENT COMPONENT:
 * - Needs useState to track selection
 * - Needs onClick handlers for interactivity
 */
export function DifficultyFilter() {
  // Use filter context instead of local state
  const { selectedBands, setSelectedBands } = useFilters();

  /**
   * Toggle a score band on/off
   *
   * Logic:
   * - If band is already selected, remove it
   * - If band is not selected, add it
   * - If all 7 bands get selected, switch to "All" (empty array)
   */
  const toggleBand = (band) => {
    let newBands;

    if (selectedBands.includes(band)) {
      // Remove band
      newBands = selectedBands.filter((b) => b !== band);
    } else {
      // Add band
      newBands = [...selectedBands, band];
    }

    // If all 7 bands are selected, switch to "All"
    if (newBands.length === 7) {
      setSelectedBands([]);
    } else {
      setSelectedBands(newBands);
    }
  };

  /**
   * Select all bands for a difficulty level
   *
   * Logic:
   * - Clicking "Easy" selects bands 1, 2, 3
   * - Clicking "Medium" selects bands 4, 5
   * - Clicking "Hard" selects bands 6, 7
   * - If already all selected, it deselects them
   * - If all 7 bands get selected, switch to "All"
   */
  const selectDifficulty = (bands) => {
    // Check if all these bands are already selected
    const allSelected = bands.every((b) => selectedBands.includes(b));

    let newBands;

    if (allSelected) {
      // Deselect all these bands
      newBands = selectedBands.filter((b) => !bands.includes(b));
    } else {
      // Add all these bands (remove duplicates)
      newBands = [...new Set([...selectedBands, ...bands])];
    }

    // If all 7 bands are selected, switch to "All"
    if (newBands.length === 7) {
      setSelectedBands([]);
    } else {
      setSelectedBands(newBands);
    }
  };

  /**
   * Check if "All" is selected
   */
  const isAllSelected = selectedBands.length === 0;

  /**
   * Check if a button should be highlighted
   *
   * Logic:
   * - If "All" is selected, everything is highlighted
   * - Otherwise, only selected bands/difficulties are highlighted
   */
  const isSelected = (value) => {
    // If "All" is selected, highlight everything
    if (isAllSelected) {
      return true;
    }

    if (value === "all") {
      return false; // All button not highlighted when bands are selected
    }

    if (value === "easy") {
      return [1, 2, 3].every((b) => selectedBands.includes(b));
    }

    if (value === "medium") {
      return [4, 5].every((b) => selectedBands.includes(b));
    }

    if (value === "hard") {
      return [6, 7].every((b) => selectedBands.includes(b));
    }

    // For individual band numbers
    return selectedBands.includes(value);
  };

  /**
   * Get which score bands are selected
   * Used for the "Selected bands: X" display
   */
  const getSelectedBands = () => {
    if (selectedBands.length === 0) return "1, 2, 3, 4, 5, 6, 7 (all)";
    return selectedBands.sort((a, b) => a - b).join(", ");
  };

  return (
    <div>
      <div className="flex gap-1.5 items-center mb-2">
        <Gauge className="w-4 h-4 text-purple-600" />
        <h3 className="text-sm font-semibold">Difficulty / Score Band</h3>
      </div>

      <div className="flex gap-2 items-center flex-wrap">
        {/* All Button */}
        <Button
          variant={isSelected("all") ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedBands([])}
        >
          All
        </Button>

        {/* Easy + Bands 1, 2, 3 */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => selectDifficulty([1, 2, 3])}
          className={
            isSelected("easy")
              ? "border-green-500 text-green-700 bg-green-50"
              : "border-green-200 text-green-600 hover:border-green-400 hover:bg-green-50"
          }
        >
          Easy
        </Button>
        {[1, 2, 3].map((band) => (
          <Button
            key={band}
            variant="outline"
            size="sm"
            onClick={() => toggleBand(band)}
            className={
              isSelected(band)
                ? "border-green-500 text-green-700 bg-green-50"
                : "border-green-200 text-green-600 hover:border-green-400 hover:bg-green-50"
            }
          >
            {band}
          </Button>
        ))}

        {/* Medium + Bands 4, 5 */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => selectDifficulty([4, 5])}
          className={
            isSelected("medium")
              ? "border-orange-500 text-orange-700 bg-orange-50"
              : "border-orange-200 text-orange-600 hover:border-orange-400 hover:bg-orange-50"
          }
        >
          Medium
        </Button>
        {[4, 5].map((band) => (
          <Button
            key={band}
            variant="outline"
            size="sm"
            onClick={() => toggleBand(band)}
            className={
              isSelected(band)
                ? "border-orange-500 text-orange-700 bg-orange-50"
                : "border-orange-200 text-orange-600 hover:border-orange-400 hover:bg-orange-50"
            }
          >
            {band}
          </Button>
        ))}

        {/* Hard + Bands 6, 7 */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => selectDifficulty([6, 7])}
          className={
            isSelected("hard")
              ? "border-red-500 text-red-700 bg-red-50"
              : "border-red-200 text-red-600 hover:border-red-400 hover:bg-red-50"
          }
        >
          Hard
        </Button>
        {[6, 7].map((band) => (
          <Button
            key={band}
            variant="outline"
            size="sm"
            onClick={() => toggleBand(band)}
            className={
              isSelected(band)
                ? "border-red-500 text-red-700 bg-red-50"
                : "border-red-200 text-red-600 hover:border-red-400 hover:bg-red-50"
            }
          >
            {band}
          </Button>
        ))}
      </div>
    </div>
  );
}
