// import type { TableRow } from '../components/cohort/views/StudentResultsView';
import subjectMappingService from '../services/subjectMappingService';

interface TableRow {
  id: number;
  studentName: string;
  subjectOriginal: string;
  subjectDisplay: string;
  result: string | number;
  lowerResult: number | null;
  upperResult: number | null;
  lowerScaled: number | null;
  scaled: number | null;
  upperScaled: number | null;
  lowerTE: string;
  te: string;
  upperTE: string;
}

export type SubjectType = 'General' | 'Applied' | 'VET';

export interface SubjectScore {
  subject: string;
  subjectType: SubjectType;
  scaledScore: number;
}

export const calculateTEScore = (subjectScores: SubjectScore[]): number => {
  // Filter general subjects and sort by scaled score descending
  const generalScores = subjectScores
    .filter(s => s.subjectType === 'General')
    .map(s => s.scaledScore)
    .sort((a, b) => b - a);

  // Sum of top 5 general scaled scores
  const top5GeneralSum = generalScores.slice(0, 5).reduce((acc, score) => acc + score, 0);

  // Sum of top 4 general scaled scores
  const top4GeneralSum = generalScores.slice(0, 4).reduce((acc, score) => acc + score, 0);

  // Find the best applied scaled score
  const bestAppliedScore = subjectScores
    .filter(s => s.subjectType === 'Applied')
    .map(s => s.scaledScore)
    .reduce((max, score) => Math.max(max, score), 0);

  // Calculate TE score
  return Math.max(top5GeneralSum, top4GeneralSum + bestAppliedScore);
};

export function TE_to_ATAR_conversion(teScore: number | string): string | number {
  // Handle special case for 'ATAR Ineligible'
  if (typeof teScore === 'string' && teScore === 'ATAR Ineligible') {
    return 'ATAR Ineligible';
  }

  // Ensure teScore is a number for calculation
  if (typeof teScore !== 'number') {
    throw new Error('Invalid TE score');
  }

  // Coefficients for the 6th degree polynomial
  const a = -7.3159e-14;
  const b = 1.01772e-10;
  const c = -4.37167e-08;
  const d = 1.93676e-06;
  const e = 0.002716082;
  const f = -0.271855355;
  const g = 11.34274504;

  // Calculate ATAR using the polynomial
  let atar = a * Math.pow(teScore, 6) +
             b * Math.pow(teScore, 5) +
             c * Math.pow(teScore, 4) +
             d * Math.pow(teScore, 3) +
             e * Math.pow(teScore, 2) +
             f * teScore +
             g;

  // Round ATAR to the nearest 0.05
  atar = Math.round(atar * 20) / 20;

  // Ensure ATAR is within the range [30, 99.95]
  if (atar < 30) atar = 30;
  if (atar > 99.95) atar = 99.95;

  return atar;
}

export interface StudentScore {
  scaledScore: number;
  lowerScaledScore: number;
  upperScaledScore: number;
  subjectType: SubjectType;
}

export const calculateStudentTEScores = (studentScores: StudentScore[]): { te: string; lowerTE: string; upperTE: string } => {
  const generalScores = studentScores.filter(s => s.subjectType === 'General');
  const appliedScores = studentScores.filter(s => s.subjectType === 'Applied');
  const vetScores = studentScores.filter(s => s.subjectType === 'VET');

  // Check eligibility
  const isEligible =
    generalScores.length >= 5 ||
    (generalScores.length >= 4 && (appliedScores.length >= 1 || vetScores.length >= 1));

  if (!isEligible) {
    return {
      te: 'ATAR Ineligible',
      lowerTE: 'ATAR Ineligible',
      upperTE: 'ATAR Ineligible'
    };
  }

  // Inner helper to calculate TE for a specific set of scores (lower, result, or upper)
  const calculateSingleTEScore = ( 
    generalSet: number[], 
    appliedSet: number[], 
    vetSet: number[] 
  ): number => {
    // Sort general scores descending
    const sortedGeneral = [...generalSet].sort((a, b) => b - a);

    // Sum of top 5 general scaled scores
    const top5GeneralSum = sortedGeneral.slice(0, 5).reduce((acc, score) => acc + score, 0);

    // Sum of top 4 general scaled scores
    const top4GeneralSum = sortedGeneral.slice(0, 4).reduce((acc, score) => acc + score, 0);

    // Find the best applied scaled score from the relevant set
    const bestAppliedScore = appliedSet.reduce((max, score) => Math.max(max, score), 0);
    
    // Find the best VET scaled score from the relevant set
    const bestVetScore = vetSet.reduce((max, score) => Math.max(max, score), 0);

    // Compare Top 5 General vs Top 4 General + MAX(Best Applied, Best VET)
    return Math.max(top5GeneralSum, top4GeneralSum + Math.max(bestAppliedScore, bestVetScore));
  };

  // Calculate TE for main, lower, and upper bounds using the helper
  const teScore = calculateSingleTEScore(
    generalScores.map(s => s.scaledScore),
    appliedScores.map(s => s.scaledScore),
    vetScores.map(s => s.scaledScore)
  );
  const lowerTEScore = calculateSingleTEScore(
    generalScores.map(s => s.lowerScaledScore),
    appliedScores.map(s => s.lowerScaledScore),
    vetScores.map(s => s.lowerScaledScore)
  );
  const upperTEScore = calculateSingleTEScore(
    generalScores.map(s => s.upperScaledScore),
    appliedScores.map(s => s.upperScaledScore),
    vetScores.map(s => s.upperScaledScore)
  );

  // Return formatted results
  return {
    te: teScore.toFixed(1),
    lowerTE: lowerTEScore.toFixed(1),
    upperTE: upperTEScore.toFixed(1)
  };
};

// --- NEW UTILITY FUNCTIONS ---

/**
 * Defines the structure for the result of ATAR range calculations.
 */
export interface AtarRangeResult {
  status: 'success' | 'ineligible' | 'error' | 'invalid_input';
  lowerAtar: number | null;
  nominalAtar: number | null;
  upperAtar: number | null;
  displayString: string; // Holds the appropriate status string or the formatted 3-part range
}

/**
 * Calculates and formats a single ATAR value from a TE score.
 * Handles eligibility, parsing, conversion, errors, and formatting.
 * @param teValue - The raw TE score value (number, string, null, undefined).
 * @returns The formatted ATAR (number to 2dp) or a status string.
 */
export function calculateAndFormatAtar(teValue: unknown): number | string {
    // Use === for strict comparison
    if (teValue === "ATAR Ineligible" || teValue === "N/A" || teValue === null || teValue === undefined) {
        return typeof teValue === 'string' ? teValue : "N/A"; // Return the status string or default N/A
    }
    try {
        // Ensure parsing works even if it's already a number
        const numericTE = parseFloat(String(teValue));
        if (isNaN(numericTE)) {
            return "Invalid TE"; // Specific status for bad numeric input
        }
        const atar = TE_to_ATAR_conversion(numericTE); // Use the existing core function

        // Check the type of the result from conversion
        if (typeof atar === 'number') {
           // Return as number, potentially formatted if needed elsewhere, or keep precision
           // Let's return the number directly for now, formatting can happen at display time if needed.
           // return parseFloat(atar.toFixed(2));
           return atar;
        } else {
            // Return the status string if conversion didn't yield a number
            return atar; // e.g., "ATAR Ineligible" could theoretically come from conversion too
        }
    } catch (error) {
        console.error("Error calculating ATAR:", error);
        return "Calculation Error"; // Generic error status
    }
}

/**
 * Calculates and formats an ATAR range string from TE score ranges.
 * Handles eligibility, parsing, conversion, errors, and formatting.
 * @param scores - An object containing te, lowerTE, and upperTE values.
 * @returns A formatted ATAR range string ("min - middle - max") or a status string.
 */
export function calculateAndFormatAtarRange(scores: { te?: unknown, lowerTE?: unknown, upperTE?: unknown }): AtarRangeResult {
    // Base eligibility check on the primary 'te' score
    if (scores.te === "ATAR Ineligible" || scores.te === "N/A" || scores.te === null || scores.te === undefined) {
        const displayStr = typeof scores.te === 'string' ? scores.te : "N/A";
        return {
            status: 'ineligible',
            lowerAtar: null,
            nominalAtar: null,
            upperAtar: null,
            displayString: displayStr
        };
    }

    // Check if range bounds are available and valid *before* parsing
    if (scores.lowerTE === "N/A" || scores.upperTE === "N/A" || scores.lowerTE === null || scores.upperTE === null || scores.lowerTE === undefined || scores.upperTE === undefined || scores.lowerTE === "ATAR Ineligible" || scores.upperTE === "ATAR Ineligible") {
        return {
            status: 'ineligible', // Or perhaps 'invalid_input' if bounds are missing but TE is ok
            lowerAtar: null,
            nominalAtar: null,
            upperAtar: null,
            displayString: "N/A" // If range bounds are missing or ineligible, return N/A for the range
        };
    }

    try {
        const numericLowerTE = parseFloat(String(scores.lowerTE));
        const numericMiddleTE = parseFloat(String(scores.te));
        const numericUpperTE = parseFloat(String(scores.upperTE));

        if (isNaN(numericLowerTE) || isNaN(numericMiddleTE) || isNaN(numericUpperTE)) {
             return {
                status: 'invalid_input',
                lowerAtar: null,
                nominalAtar: null,
                upperAtar: null,
                displayString: "Invalid TE Range" // Specific status for bad numeric input
            };
        }

        // Use the single ATAR calculator for consistency (handles error/status returns)
        const lowerAtarResult = calculateAndFormatAtar(numericLowerTE);
        const middleAtarResult = calculateAndFormatAtar(numericMiddleTE);
        const upperAtarResult = calculateAndFormatAtar(numericUpperTE);

        // Check if all results are valid numbers
        if (typeof lowerAtarResult === 'number' && typeof middleAtarResult === 'number' && typeof upperAtarResult === 'number') {
            // Format to 2dp and return all three values in the display string
            const displayStr = `${lowerAtarResult.toFixed(2)} - ${middleAtarResult.toFixed(2)} - ${upperAtarResult.toFixed(2)}`;
            return {
                status: 'success',
                lowerAtar: lowerAtarResult,
                nominalAtar: middleAtarResult,
                upperAtar: upperAtarResult,
                displayString: displayStr
            };
        } else {
            // If any calculation resulted in an error/status, return a generic status
            // Determine a more specific status if possible, otherwise default.
            let errorString = "Calculation Error";
            if (typeof lowerAtarResult === 'string') errorString = lowerAtarResult;
            else if (typeof middleAtarResult === 'string') errorString = middleAtarResult;
            else if (typeof upperAtarResult === 'string') errorString = upperAtarResult;

             return {
                status: 'error', // Or derive status from the string results if needed
                lowerAtar: null,
                nominalAtar: null,
                upperAtar: null,
                displayString: errorString
            };
        }
    } catch (error) {
        console.error("Error calculating ATAR range:", error);
        return {
            status: 'error',
            lowerAtar: null,
            nominalAtar: null,
            upperAtar: null,
            displayString: "Calculation Error" // Generic error status
        };
    }
} 