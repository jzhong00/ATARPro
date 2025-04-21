import { useState, useCallback } from 'react';
import type { SubjectRow } from '../types/calculator';

interface UseQuickRangeResult {
  rangeMode: boolean;
  rangeValue: number | null;
  setRangeMode: (value: boolean) => void;
  setRangeValue: (value: number | null) => void;
  onQuickRangeApply: () => void;
  handleQuickRangeApply: (rows: SubjectRow[], rangeValue: number) => SubjectRow[];
}

/**
 * Custom hook for managing range mode and quick range application
 */
export const useQuickRange = (
  initialRangeMode: boolean = false,
  initialRangeValue: number | null = 3,
  applyQuickRange: (rows: SubjectRow[], rangeValue: number) => SubjectRow[]
): UseQuickRangeResult => {
  // State for range mode toggle
  const [rangeMode, setRangeMode] = useState<boolean>(initialRangeMode);
  
  // State for range value
  const [rangeValue, setRangeValue] = useState<number | null>(initialRangeValue);

  /**
   * Function to apply the current range value to subject rows
   */
  const onQuickRangeApply = useCallback(() => {
    // Default range to 0 if null/undefined
    return rangeValue ?? 0;
  }, [rangeValue]);

  /**
   * Function that applies the range to the provided subject rows
   */
  const handleQuickRangeApply = useCallback((rows: SubjectRow[], value: number) => {
    return applyQuickRange(rows, value);
  }, [applyQuickRange]);

  return {
    rangeMode,
    rangeValue,
    setRangeMode,
    setRangeValue,
    onQuickRangeApply,
    handleQuickRangeApply
  };
}; 