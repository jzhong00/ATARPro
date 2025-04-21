import type { SubjectType } from './scaling'; // Assuming SubjectType is defined here

// Grade mapping (higher value is better)
const gradeMap: { [key: string]: number } = {
  E: 1,
  D: 2,
  C: 3,
  B: 4,
  A: 5,
};
const validGrades = Object.keys(gradeMap);

// Helper to parse and validate numeric input (0-100)
const parseNumeric = (value: string | null): number | null => {
  if (value === null || value.trim() === '') return null;
  const num = parseFloat(value);
  if (!isNaN(num) && num >= 0 && num <= 100) {
    return num;
  }
  return null; // Invalid number or out of range
};

// Helper to parse and validate grade input (A-E)
const parseGrade = (value: string | null): number | null => {
  if (value === null || value.trim() === '') return null;
  const upperValue = value.trim().toUpperCase();
  if (validGrades.includes(upperValue)) {
    return gradeMap[upperValue];
  }
  return null; // Invalid grade
};

// Helper to convert numeric comparison value back to grade string
const gradeFromValue = (value: number | null): string | null => {
    if (value === null) return null;
    for (const grade in gradeMap) {
        if (gradeMap[grade] === value) {
            return grade;
        }
    }
    return null; // Should not happen if value is from gradeMap
}

// Helper to convert numeric value back to string, handling null
const numericToString = (value: number | null): string | null => {
    return value === null ? null : String(value);
}

interface RubberBandResult {
  lowerResult: string | null;
  rawResult: string | null;
  upperResult: string | null;
}

type ChangedField = 'lower' | 'result' | 'upper';

/**
 * Applies the Rubber-Band Logic constraints (L <= R <= U) based on subject type.
 *
 * @param lower Current lower value (string or null)
 * @param result Current result value (string or null)
 * @param upper Current upper value (string or null)
 * @param subjectType The type of the subject ('General', 'Applied', 'VET')
 * @param changed Which field was just modified by the user
 * @returns An object containing the adjusted lower, result, and upper values as strings.
 */
export const applyRubberBandConstraints = (
  lower: string | null,
  result: string | null,
  upper: string | null,
  subjectType: SubjectType | null,
  changed: ChangedField
): RubberBandResult => {
  // If VET or unknown type, return values unchanged
  if (subjectType !== 'General' && subjectType !== 'Applied') {
    return { lowerResult: lower, rawResult: result, upperResult: upper };
  }

  let lNum: number | null = null;
  let rNum: number | null = null;
  let uNum: number | null = null;
  let parseFunc: (value: string | null) => number | null;
  let toStringFunc: (value: number | null) => string | null;

  // Set parsing and comparison strategy based on type
  if (subjectType === 'General') {
    parseFunc = parseNumeric;
    toStringFunc = numericToString;
  } else { // Applied
    parseFunc = parseGrade;
    toStringFunc = gradeFromValue;
  }

  lNum = parseFunc(lower);
  rNum = parseFunc(result);
  uNum = parseFunc(upper);

  // Apply cascade logic ONLY if all involved values are validly parsed
  // Otherwise, we risk incorrect adjustments based on incomplete/invalid state.
  // If a value is null, it cannot trigger a change in others, but can be changed itself.

  if (changed === 'lower' && lNum !== null) {
      if (rNum !== null && lNum > rNum) {
          rNum = lNum;
      }
      // Check U against potentially updated R
      if (uNum !== null && rNum !== null && rNum > uNum) {
          uNum = rNum;
      }
  } else if (changed === 'result' && rNum !== null) {
      if (lNum !== null && rNum < lNum) {
          lNum = rNum;
      }
      if (uNum !== null && rNum > uNum) {
          uNum = rNum;
      }
  } else if (changed === 'upper' && uNum !== null) {
      if (rNum !== null && uNum < rNum) {
          rNum = uNum;
      }
      // Check L against potentially updated R
      if (lNum !== null && rNum !== null && rNum < lNum) {
          lNum = rNum;
      }
  }

  // Convert back to strings for state update
  return {
    lowerResult: toStringFunc(lNum),
    rawResult: toStringFunc(rNum),
    upperResult: toStringFunc(uNum),
  };
}; 