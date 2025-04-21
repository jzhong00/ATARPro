// ATAR Calculator – Greenfield architecture: follow utils/services/components separation and avoid legacy patterns.

// Utils
import { calculateScaledScore as calculateScaledScoreUtil, ScalingResult } from '../utils/scaling';

/**
 * Service method to calculate the scaled score for a given subject and result.
 * This acts as a wrapper around the utility function, adhering to the architecture rules.
 */
const calculateScaledScore = (subject: string, result: string | number | null): ScalingResult => {
  // Basic check before calling the utility
  if (result === null || result === undefined) { 
    return { scaledScore: 0, error: 'Missing result value' };
  }
  // Ensure result is a string for the utility if it's a number (e.g., General subjects)
  const resultStr = typeof result === 'number' ? String(result) : result;

  // Call the underlying utility function
  return calculateScaledScoreUtil(subject, resultStr); 
};

const scalingService = {
  calculateScaledScore,
};

export default scalingService; 