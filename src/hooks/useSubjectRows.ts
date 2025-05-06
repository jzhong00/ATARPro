import { useState, useCallback } from 'react';
import type { SubjectRow } from '../types/calculator';
import { applyRubberBandConstraints } from '../utils/rubberband';
import { createEmptyRow, applyQuickRange } from '../utils/calculatorUtils';
import type { SubjectType } from '../utils/scaling';
import type { SubjectMapping } from '../services/subjectMappingService';

/**
 * Interface for subject mapping service
 */
interface SubjectMappingService {
  getMappingByDisplayName: (name: string) => SubjectMapping | undefined;
}

/**
 * Custom hook for managing subject rows in the calculator
 */
export const useSubjectRows = (initialRows: number = 6) => {
  // State for the subject input rows
  const [subjectRows, setSubjectRows] = useState<SubjectRow[]>(() =>
    Array.from({ length: initialRows }, createEmptyRow)
  );

  /**
   * Add a new empty row
   */
  const handleAddRow = useCallback(() => {
    setSubjectRows((prevRows) => [...prevRows, createEmptyRow()]);
  }, []);

  /**
   * Delete a row by its ID
   */
  const handleDeleteRow = useCallback((idToDelete: string) => {
    setSubjectRows((prevRows) => prevRows.filter((row) => row.id !== idToDelete));
  }, []);

  /**
   * Handle changes to the subject input
   */
  const handleSubjectChange = useCallback((idToUpdate: string, inputValue: string | null, subjectMappingService: SubjectMappingService) => {
    let resolvedSubjectDisplay: string | null = null;
    let validationRule: string | null = null;

    if (inputValue === "") {
      resolvedSubjectDisplay = null;
      validationRule = null;
    } else if (inputValue) {
      const trimmedValue = inputValue.trim();
      const foundMapping = subjectMappingService.getMappingByDisplayName(trimmedValue);

      if (foundMapping) {
        resolvedSubjectDisplay = foundMapping.Subject_display;
        validationRule = foundMapping.Validation ?? null;
      } else {
        resolvedSubjectDisplay = trimmedValue;
        validationRule = null;
      }
    } else {
      resolvedSubjectDisplay = null;
      validationRule = null;
    }

    // Update state, also clear lower/upper result for simplicity
    setSubjectRows((prevRows) =>
      prevRows.map((row) =>
        row.id === idToUpdate
          ? {
              ...row,
              subject: resolvedSubjectDisplay,
              validationRule: validationRule,
              rawResult: null,
              lowerResult: null,
              upperResult: null
            }
          : row
      )
    );
  }, []);

  /**
   * Handle changes to the main result input
   */
  const handleResultChange = useCallback((idToUpdate: string, newResult: string | null, subjectMappingService: SubjectMappingService) => {
    setSubjectRows((prevRows) =>
      prevRows.map((row) => {
        if (row.id === idToUpdate) {
          // Find subject type
          const mapping = row.subject ? subjectMappingService.getMappingByDisplayName(row.subject) : null;
          const subjectType = mapping?.Type as SubjectType | null;

          // Apply rubber band logic only for General/Applied subjects
          if (subjectType === 'General' || subjectType === 'Applied') {
            const adjustedValues = applyRubberBandConstraints(
              row.lowerResult, // Current lower
              newResult,       // New result
              row.upperResult, // Current upper
              subjectType,
              'result'         // Indicate that 'result' changed
            );
            return { ...row, ...adjustedValues }; // Update all three fields
          } else {
            // For VET or unknown, just update the rawResult
            return { ...row, rawResult: newResult };
          }
        }
        return row;
      })
    );
  }, []);

  /**
   * Handle changes to the lower result input
   */
  const handleLowerResultChange = useCallback((idToUpdate: string, newLowerResult: string | null, subjectMappingService: SubjectMappingService) => {
    setSubjectRows((prevRows) =>
      prevRows.map((row) => {
        if (row.id === idToUpdate) {
          // Find subject type
          const mapping = row.subject ? subjectMappingService.getMappingByDisplayName(row.subject) : null;
          const subjectType = mapping?.Type as SubjectType | null;

          // Apply rubber band logic only for General/Applied subjects
          if (subjectType === 'General' || subjectType === 'Applied') {
            const adjustedValues = applyRubberBandConstraints(
              newLowerResult,  // New lower
              row.rawResult,   // Current result
              row.upperResult, // Current upper
              subjectType,
              'lower'          // Indicate that 'lower' changed
            );
            return { ...row, ...adjustedValues }; // Update all three fields
          } else {
            // For VET or unknown, just update the lowerResult
            return { ...row, lowerResult: newLowerResult };
          }
        }
        return row;
      })
    );
  }, []);

  /**
   * Handle changes to the upper result input
   */
  const handleUpperResultChange = useCallback((idToUpdate: string, newUpperResult: string | null, subjectMappingService: SubjectMappingService) => {
    setSubjectRows((prevRows) =>
      prevRows.map((row) => {
        if (row.id === idToUpdate) {
          // Find subject type
          const mapping = row.subject ? subjectMappingService.getMappingByDisplayName(row.subject) : null;
          const subjectType = mapping?.Type as SubjectType | null;

          // Apply rubber band logic only for General/Applied subjects
          if (subjectType === 'General' || subjectType === 'Applied') {
            const adjustedValues = applyRubberBandConstraints(
              row.lowerResult, // Current lower
              row.rawResult,   // Current result
              newUpperResult,  // New upper
              subjectType,
              'upper'          // Indicate that 'upper' changed
            );
            return { ...row, ...adjustedValues }; // Update all three fields
          } else {
            // For VET or unknown, just update the upperResult
            return { ...row, upperResult: newUpperResult };
          }
        }
        return row;
      })
    );
  }, []);

  /**
   * Apply quick range to all rows
   */
  const handleQuickRangeApply = useCallback((rangeValue: number) => {
    setSubjectRows(prevRows => applyQuickRange(prevRows, rangeValue));
  }, []);

  /**
   * Reset subject rows to initial state
   */
  const resetSubjectRows = useCallback(() => {
    setSubjectRows(Array.from({ length: initialRows }, createEmptyRow));
  }, [initialRows]);

  /**
   * Set subject rows from external data
   */
  const setRowsFromData = useCallback((newRows: SubjectRow[]) => {
    setSubjectRows(newRows);
  }, []);

  return {
    subjectRows,
    handleAddRow,
    handleDeleteRow,
    handleSubjectChange,
    handleResultChange,
    handleLowerResultChange,
    handleUpperResultChange,
    handleQuickRangeApply,
    resetSubjectRows,
    setRowsFromData
  };
}; 