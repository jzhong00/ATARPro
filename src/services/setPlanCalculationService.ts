// ATAR Calculator – Greenfield architecture: follow utils/services/components separation and avoid legacy patterns.
import type { SubjectRow } from '../types/calculator';
import type { TeAtarResult, ScaledScoresMap } from '../hooks/useTeAtarCalculator';
// Using 'any' as placeholder for the service instance type
// import type { SubjectMapping } from './subjectMappingService'; 
import { calculateScaledScore } from '../utils/scaling';
import type { ScalingResult } from '../utils/scaling';

// Import the service instead of the utility
import scalingService from './scalingService';

// Type definitions (could be moved to a types file if they grow)
type SubjectType = 'General' | 'Applied' | 'VET' | null;

/**
 * Calculate scaled score for a single result value
 * TEMPORARY: Directly calls utility in Phase 1
 */
const getScaledScoreForResult = (subject: string, result: string | null): ScalingResult => {
  if (!result) return { scaledScore: 0, error: 'Missing result value' };
  // Use the scaling service method
  return scalingService.calculateScaledScore(subject, result); 
};

/**
 * Get result range based on rank and subject type
 */
const getResultRangeFromRank = (subjectType: SubjectType, rank: string): string | null => {
  if (subjectType === 'Applied') {
    // Applied subjects use the rank directly as the result range
    // The format from the dropdown is "B - A" or "B - C"
    // We just need to remove extra spaces to get "B-A" or "B-C"
    return rank.replace(/\s+/g, '');
  } else if (subjectType === 'VET' && rank === 'Pass') {
    return 'Pass';
  }
  
  // General subjects will get their range from useSetPlanData hook via the component,
  // so no specific logic needed here for them.
  return null;
};

/**
 * Convert result range format (like "B-A") to individual parts
 */
const parseResultRange = (resultRange: string): { lower: string, upper: string } | null => {
  const parts = resultRange.split('-');
  if (parts.length !== 2) return null;
  
  // For Applied subjects, the format in the CSV is "B - A" which means
  // the lower grade (B) comes first, and the upper grade (A) comes second
  return {
    lower: parts[0].trim(), // First part (B in "B-A")
    upper: parts[1].trim()  // Second part (A in "B-A") 
  };
};

/**
 * Calculate and format scaled score range string for Applied and VET subjects.
 * Note: This specific formatting function might become redundant if formatDisplayScaledScore handles all cases.
 * Keeping it for now as it was directly moved, but review in Phase 3.
 */
const getAppliedVetScaledRange = (subject: string, resultRange: string): string => {
    // For result ranges like "A-B", split and calculate each part
  const parts = resultRange.split('-');
  
  if (parts.length === 2) {
    // Applied subjects with ranges like "A-B"
    const firstResult = parts[0].trim();
    const secondResult = parts[1].trim();
    
    // Use the service's own getScaledScoreForResult
    const firstScaled = getScaledScoreForResult(subject, firstResult); 
    const secondScaled = getScaledScoreForResult(subject, secondResult);
    
    if (firstScaled.error || secondScaled.error) {
      return 'Calculation Error';
    }
    
    // Returns a simple string range
    return `${firstScaled.scaledScore} - ${secondScaled.scaledScore}`;
  } else if (parts.length === 1) {
    // VET subjects with single result like "Pass"
    const result = parts[0].trim();
    // Use the service's own getScaledScoreForResult
    const scaled = getScaledScoreForResult(subject, result); 
    
    if (scaled.error) {
      return 'Calculation Error';
    }
    
    return `${scaled.scaledScore}`;
  }
  
  return 'Invalid Range';
};

/**
 * Calculate and format the scaled score string for display purposes in the table.
 */
const formatDisplayScaledScore = (
  row: SubjectRow, 
  scaledScoresMap: ScaledScoresMap,
  subjectMappingService: any // TEMPORARY: Use actual service instance type when available
): string | null => {
  // const rowScaledScore = scaledScoresMap.get(row.id);
  // Use row data directly, don't rely on rowScaledScore.result as it might be middle value
  // We need to recalculate based on lower/upper for ranges.

  if (!row.subject) return null;

  const mapping = subjectMappingService.getMappingByDisplayName(row.subject);
  if (!mapping) return null;
  
  // Determine subject type from the mapping
  const subjectName = mapping.Subject_name; // Use the canonical name for scaling
  const subjectType = mapping.Type as SubjectType; // Get type from mapping

  // For Applied subjects with result ranges like B-A
  if (subjectType === 'Applied' && row.resultRange && row.lowerResult && row.upperResult) {
    // Calculate scaled score for each part separately
    const lowerScaled = getScaledScoreForResult(subjectName, row.lowerResult);
    const upperScaled = getScaledScoreForResult(subjectName, row.upperResult);

    if (lowerScaled.error || upperScaled.error) {
      return 'Calculation Error';
    }

    // Format the range, ensure consistent precision
    return `${lowerScaled.scaledScore.toFixed(1)} - ${upperScaled.scaledScore.toFixed(1)}`;
  }

  // For VET subjects with just a single value (e.g., "Pass")
  if (subjectType === 'VET' && row.resultRange) {
     // VET only has one result, use rawResult which holds 'Pass'
     if (!row.rawResult) return 'Missing Result';
     const scaled = getScaledScoreForResult(subjectName, row.rawResult);
     if (scaled.error) return 'Calculation Error';
     // Display single value
     return scaled.scaledScore.toFixed(1);
  }

  // For General subjects, use both lower and upper values to display a range
  if (subjectType === 'General' && row.lowerResult && row.upperResult) {
    // Calculate scaled score for lower and upper bounds
    const lowerScaled = getScaledScoreForResult(subjectName, row.lowerResult);
    const upperScaled = getScaledScoreForResult(subjectName, row.upperResult);

    if (lowerScaled.error || upperScaled.error) {
      return 'Calculation Error';
    }

    // Show a range for General subjects
    return `${lowerScaled.scaledScore.toFixed(1)} - ${upperScaled.scaledScore.toFixed(1)}`;
  }
  
  // If no conditions match and no fallback score, return null or an indicator
  return null; 
};


// Export service methods
const setPlanCalculationService = {
  // getScaledScoreForResult is internal for now, might expose later if needed elsewhere
  getResultRangeFromRank,
  parseResultRange,
  // getAppliedVetScaledRange might be internal only, used by formatDisplayScaledScore if needed
  formatDisplayScaledScore,
};

export default setPlanCalculationService; 