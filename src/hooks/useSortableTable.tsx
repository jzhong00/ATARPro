import React, { useState, useMemo, useCallback } from 'react';
import { parseValueForSort } from '../utils/sortingUtils';

type SortOrder = 'asc' | 'desc';

// Define the structure for a single sort criterion
interface SortCriterion<T> {
  key: keyof T;
  order: SortOrder;
}

interface UseSortableTableProps<T> {
  initialData: T[];
  // Replace single initial sort key/order with an array of criteria
  initialSortCriteria?: SortCriterion<T>[];
}

interface UseSortableTableReturn<T> {
  sortedData: T[];
  // Return the full criteria array instead of single key/order
  sortCriteria: SortCriterion<T>[];
  handleSort: (key: keyof T) => void;
  renderSortArrow: (key: keyof T) => React.ReactNode;
}

export function useSortableTable<T extends Record<string, any>>({
  initialData,
  initialSortCriteria,
}: UseSortableTableProps<T>): UseSortableTableReturn<T> {
  // State now holds an array of sort criteria
  const [sortCriteria, setSortCriteria] = useState<SortCriterion<T>[]>(() => {
    // Initialize based on the new initialSortCriteria prop
    return initialSortCriteria || [];
  });

  const handleSort = useCallback((key: keyof T) => {
    setSortCriteria(prevCriteria => {
      const newCriteria = [...prevCriteria];
      const existingIndex = newCriteria.findIndex(criterion => criterion.key === key);

      if (existingIndex === 0) {
        // Key is already the primary sort key, just toggle its order
        newCriteria[0] = { ...newCriteria[0], order: newCriteria[0].order === 'asc' ? 'desc' : 'asc' };
      } else {
        // Key is not the primary or not present
        if (existingIndex > 0) {
          // Remove from its current position if it exists as secondary/tertiary etc.
          newCriteria.splice(existingIndex, 1);
        }
        // Prepend the new key as the primary sort criterion
        newCriteria.unshift({ key, order: 'asc' });

        // Optional: Limit the depth of sorting criteria (e.g., max 3 levels)
        // if (newCriteria.length > 3) {
        //   newCriteria.length = 3;
        // }
      }
      return newCriteria;
    });
  }, []);

  const sortedData = useMemo(() => {
    if (!initialData || initialData.length === 0) return [];

    const dataToSort = [...initialData];

    // Return unsorted data if no sort criteria are set
    if (sortCriteria.length === 0) return dataToSort;

    dataToSort.sort((a, b) => {
      for (const criterion of sortCriteria) {
        const { key, order } = criterion;
        const valA = a[key];
        const valB = b[key];

        let compareResult = 0;

        // Use localeCompare for specific string fields, numerical/parse otherwise
        if (typeof valA === 'string' && typeof valB === 'string' && (key === 'studentName' || key === 'subjectDisplay')) {
            compareResult = valA.localeCompare(valB);
        } else {
            const numA = parseValueForSort(valA);
            const numB = parseValueForSort(valB);
            if (isNaN(numA) && isNaN(numB)) compareResult = 0;
            else if (isNaN(numA)) compareResult = -1; // Treat NaN as less than numbers
            else if (isNaN(numB)) compareResult = 1;  // Treat NaN as less than numbers
            else compareResult = numA - numB;
        }

        // If the comparison yields a difference, return the result based on order
        if (compareResult !== 0) {
          return order === 'asc' ? compareResult : -compareResult;
        }
      }
      // If all criteria result in equality, maintain original relative order (or return 0)
      return 0;
    });

    return dataToSort;
  }, [initialData, sortCriteria]);

  const renderSortArrow = useCallback((key: keyof T): React.ReactNode => {
    // Check if the key is the *primary* sort key
    const primaryCriterion = sortCriteria[0];
    if (primaryCriterion && primaryCriterion.key === key) {
      return primaryCriterion.order === 'asc' ? ' ▲' : ' ▼';
    }
    // Default arrow for non-primary or unsorted columns
    return ' ↕';
  }, [sortCriteria]); // Dependency is now the whole criteria array

  return {
    sortedData,
    sortCriteria, // Return the criteria array
    handleSort,
    renderSortArrow,
  };
} 