import { SubjectMapping } from '../services/subjectMappingService';
import { calculateScaledScore, ScalingResult, SubjectType } from './scaling';
import type { SubjectRow } from '../types/calculator';
import type { StudentResult } from '../types/cohort';

/**
 * Helper to create a new empty subject row with unique ID
 */
export const createEmptyRow = (): SubjectRow => ({
  id: crypto.randomUUID(),
  subject: null,
  rawResult: null,
  lowerResult: null,
  upperResult: null,
  validationRule: null,
});

/**
 * Parse and scale a single subject result value
 */
export const parseAndScale = (
  subjectName: string, 
  rawValue: string | null,
  validationRule: string | null
): ScalingResult | null => {
  if (!rawValue || !validationRule || !subjectName) {
    return null;
  }

  let parsedResult: number | string | null = null;
  let isValid = false;
  const resultStr = String(rawValue).trim();

  // Parsing Logic
  if (validationRule === '0 - 100') {
    const num = parseFloat(resultStr);
    if (!isNaN(num) && num >= 0 && num <= 100) { parsedResult = num; isValid = true; }
  } else if (validationRule === 'A - E') {
    const upperResult = resultStr.toUpperCase();
    if (['A', 'B', 'C', 'D', 'E'].includes(upperResult)) { parsedResult = upperResult; isValid = true; }
  } else if (validationRule === 'Pass') {
    const upperResult = resultStr.toUpperCase();
    if (upperResult === 'PASS') { parsedResult = upperResult; isValid = true; }
  }

  // Scaling Logic
  if (isValid && parsedResult !== null) {
    try {
      // calculateScaledScore expects the canonical subject name
      const scalingResult = calculateScaledScore(subjectName, parsedResult as string | number);
      return scalingResult;
    } catch (err) {
      console.error(`Error calling calculateScaledScore for ${subjectName}:`, err);
      return { scaledScore: 0, error: 'Calculation Error' };
    }
  } else {
    // Parsing failed or result is invalid
    return null;
  }
};

/**
 * Prepare chart data for the scaled score chart
 */
export const prepareChartData = (
  subjectRows: SubjectRow[],
  rangeMode: boolean,
  mappingService: {
    getMappingByDisplayName: (name: string) => SubjectMapping | undefined;
  },
  skipMiddleValue: boolean = false
) => {
  // Default values for empty charts
  const defaultReturn = { chartData: [], xAxisMin: 0, xAxisMax: 100 };
  
  // Constants for chart logic
  const MIN_X_AXIS_STEP = 10; // Determine axis minimum in steps of 10
  const BAR_VISUAL_OFFSET = 0.5; // Offset for better visibility of single-point bars
  
  // Process valid entries first
  const validEntries: { 
    subject: string; 
    lower: ScalingResult | null; 
    middle: ScalingResult | null; 
    upper: ScalingResult | null 
  }[] = [];

  // Filter and process valid rows
  for (const row of subjectRows) {
    if (!row.subject || row.rawResult === null || row.rawResult === '') {
      continue;
    }

    const mapping = row.subject ? mappingService.getMappingByDisplayName(row.subject) : undefined;
    if (!mapping) {
      console.warn(`Chart Prep: No mapping found for subject: ${row.subject}`);
      continue;
    }

    const subjectName = mapping.Subject_name;
    
    // Calculate middle score if we're not skipping it
    let middleScoreResult: ScalingResult | null = null;
    if (!skipMiddleValue) {
      middleScoreResult = calculateScaledScore(subjectName, row.rawResult as string | number);
      if (middleScoreResult.error) {
        console.warn(`Chart Prep: Error calculating middle scaled score for ${subjectName} (${row.subject}): ${middleScoreResult.error}`);
        continue;
      }
    }
    
    // Handle lower result calculation
    let lowerScoreResult: ScalingResult | null = null;
    if (row.lowerResult !== null && row.lowerResult !== '') {
      lowerScoreResult = calculateScaledScore(subjectName, row.lowerResult as string | number);
      if (lowerScoreResult.error) {
        console.warn(`Chart Prep: Error calculating lower scaled score for ${subjectName}: ${lowerScoreResult.error}`);
        continue;
      }
    }
    
    // Handle upper result calculation
    let upperScoreResult: ScalingResult | null = null;
    if (row.upperResult !== null && row.upperResult !== '') {
      upperScoreResult = calculateScaledScore(subjectName, row.upperResult as string | number);
      if (upperScoreResult.error) {
        console.warn(`Chart Prep: Error calculating upper scaled score for ${subjectName}: ${upperScoreResult.error}`);
        continue;
      }
    }
    
    // When skipping middle value, use lower as middle and ensure both lower and upper exist
    if (skipMiddleValue) {
      if (!lowerScoreResult || !upperScoreResult) {
        console.warn(`Chart Prep: Missing lower or upper result when skipMiddleValue is true for ${subjectName}`);
        continue;
      }
      // In skip middle mode, middle will be same as lower for calculation purposes
      middleScoreResult = lowerScoreResult;
    } else {
      // Standard mode requires a valid middle value
      if (!middleScoreResult) {
        console.warn(`Chart Prep: Missing middle score result for ${subjectName}`);
        continue;
      }
      
      // Default behavior - assign middle to lower/upper if they're missing
      if (!lowerScoreResult) lowerScoreResult = middleScoreResult;
      if (!upperScoreResult) upperScoreResult = middleScoreResult;
    
      // Ensure lower <= middle <= upper
      if (lowerScoreResult && lowerScoreResult.scaledScore > middleScoreResult.scaledScore) {
        lowerScoreResult = middleScoreResult;
      }
      if (upperScoreResult && upperScoreResult.scaledScore < middleScoreResult.scaledScore) {
        upperScoreResult = middleScoreResult;
      }
    }

    // At this point, all three values should be non-null
    if (!lowerScoreResult || !middleScoreResult || !upperScoreResult) {
      console.warn(`Chart Prep: Missing required score values for ${subjectName}`);
      continue;
    }

    validEntries.push({
      subject: row.subject,
      lower: lowerScoreResult,
      middle: middleScoreResult,
      upper: upperScoreResult,
    });
  }
  
  if (validEntries.length === 0) {
    return defaultReturn;
  }

  // Calculate axis ranges
  const lowestScore = Math.min(...validEntries.map(e => e.lower?.scaledScore ?? e.middle?.scaledScore ?? 0));
  const highestScore = Math.max(...validEntries.map(e => e.upper?.scaledScore ?? e.middle?.scaledScore ?? 0));

  const xAxisMin = Math.max(0, Math.floor(lowestScore / MIN_X_AXIS_STEP) * MIN_X_AXIS_STEP);
  const calculatedXAxisMax = Math.min(100, Math.ceil(highestScore / MIN_X_AXIS_STEP) * MIN_X_AXIS_STEP);
  
  // Ensure max is always >= min
  const xAxisMax = calculatedXAxisMax < xAxisMin ? 100 : calculatedXAxisMax;

  // Transform data for the chart
  const chartData = validEntries.map(entry => {
    const lowerValue = entry.lower?.scaledScore ?? 0;
    const middleValue = skipMiddleValue ? lowerValue : (entry.middle?.scaledScore ?? 0);
    const upperValue = entry.upper?.scaledScore ?? 0;

    let base = 0;
    let middle: number | undefined = undefined;
    let upper: number | undefined = undefined;

    const internalMax = xAxisMax - xAxisMin;
    const isSinglePoint = lowerValue === upperValue;

    if (rangeMode) {
      const adjustedLower = lowerValue;
      // Apply offset only if it's a single point value
      const visualWidth = isSinglePoint ? BAR_VISUAL_OFFSET : 0;
      const adjustedUpper = upperValue + visualWidth;

      if (skipMiddleValue) {
        // With skipMiddleValue, only show base and upper (no middle segment)
        base = Math.max(0, adjustedLower - xAxisMin);
        middle = 0; // No middle segment
        upper = Math.max(0, adjustedUpper - adjustedLower); // Upper goes directly from lower to upper
      } else {
        // Standard behavior with middle value
        base = Math.max(0, adjustedLower - xAxisMin);
        middle = Math.max(0, middleValue - adjustedLower);
        upper = Math.max(0, adjustedUpper - middleValue);
      }
      
      // Ensure total width doesn't exceed internalMax (clipping)
      const totalWidth = base + (middle || 0) + (upper || 0);
      if (totalWidth > internalMax) {
        const overshoot = totalWidth - internalMax;
        // Clip the last segment (upper)
        upper = Math.max(0, (upper || 0) - overshoot);
      }
    } else {
      base = Math.max(0, middleValue - xAxisMin);
      // Ensure base doesn't exceed internalMax (clipping)
      if (base > internalMax) {
        base = internalMax;
      }
    }
    
    return {
      subject: entry.subject,
      base: base,
      middle: middle,
      upper: upper,
      lowerValue: lowerValue,
      middleValue: middleValue,
      upperValue: upperValue,
    };
  });

  // Sort by middle value (descending)
  chartData.sort((a, b) => b.middleValue - a.middleValue);
  
  return {
    chartData,
    xAxisMin,
    xAxisMax
  };
};

/**
 * Applies the Quick Range feature to subject rows
 */
export const applyQuickRange = (
  subjectRows: SubjectRow[],
  rangeValue: number
): SubjectRow[] => {
  return subjectRows.map(row => {
    // Don't modify rows without a subject or validation rule
    if (!row.subject || !row.validationRule) {
      return row;
    }

    // Make copies to potentially update
    let newLowerResult = row.lowerResult;
    let newUpperResult = row.upperResult;

    if (row.validationRule === '0 - 100') {
      const rawNum = parseFloat(row.rawResult ?? '');
      // Only proceed if rawResult is a valid number in range
      if (!isNaN(rawNum) && rawNum >= 0 && rawNum <= 100) {
        newLowerResult = String(Math.max(0, Math.min(100, rawNum - rangeValue)));
        newUpperResult = String(Math.max(0, Math.min(100, rawNum + rangeValue)));
      } else {
        // If rawResult is invalid/empty, leave lower/upper unchanged
        return row;
      }
    } else if (row.validationRule === 'A - E' || row.validationRule === 'Pass') {
      // For Grades or Pass/Fail, set Lower/Upper to the current Result
      newLowerResult = row.rawResult;
      newUpperResult = row.rawResult;
    } else {
      // Leave other types unchanged
      return row;
    }

    // Return updated row only if changes were made
    if (newLowerResult !== row.lowerResult || newUpperResult !== row.upperResult) {
      return { ...row, lowerResult: newLowerResult, upperResult: newUpperResult };
    } else {
      return row; // No change needed
    }
  });
};

/**
 * Prepares subject data for PDF generation
 */
export const preparePdfSubjectData = (
  subjectRows: SubjectRow[],
  scaledScoresMap: Map<string, { 
    lower: ScalingResult | null; 
    result: ScalingResult | null; 
    upper: ScalingResult | null 
  }>,
  rangeMode: boolean
) => {
  return subjectRows
    .filter(row => row.subject) // Only include rows with a subject
    .map(row => {
      // Get scaled scores from the map
      const scaledRange = scaledScoresMap.get(row.id);
      return {
        subject: row.subject,
        rawResult: row.rawResult,
        // Conditionally add range results
        lowerResult: rangeMode ? row.lowerResult : null,
        upperResult: rangeMode ? row.upperResult : null,
        // Add scaled scores (handle potential errors/nulls)
        scaledScore: scaledRange?.result?.error ? null : scaledRange?.result?.scaledScore,
        lowerScaledScore: scaledRange?.lower?.error ? null : scaledRange?.lower?.scaledScore,
        upperScaledScore: scaledRange?.upper?.error ? null : scaledRange?.upper?.scaledScore,
      };
    });
};

/**
 * Sorts subject rows by scaled score
 */
export const sortSubjectRowsByScaledScore = (
  results: StudentResult[], 
  resultVariation: number,
  subjectMappingService: {
    getAllMappings: () => SubjectMapping[];
    getSubjectType: (subjectName: string) => string | undefined;
  }
): SubjectRow[] => {
  const allMappings = subjectMappingService.getAllMappings();

  // Map results to an intermediate format with scaled scores
  const rowsWithScores = results.map((result) => {
    const mapping = allMappings.find(m => m.Subject_name === result.subject);
    const subjectDisplay = mapping?.Subject_display ?? result.subject;
    const validationRule = mapping?.Validation ?? null;
    const subjectType = subjectMappingService.getSubjectType(result.subject) || 'General';
    const rawResultStr = result.rawResult?.toString() ?? null;

    // Calculate lower/upper result based on variation
    let lowerResult: string | null = null;
    let upperResult: string | null = null;
    
    if (subjectType === 'General') {
      const numericResult = typeof result.rawResult === 'string' ? parseInt(result.rawResult, 10) : result.rawResult;
      if (rawResultStr !== null && numericResult != null && !isNaN(numericResult)) {
        lowerResult = String(Math.max(0, numericResult - resultVariation));
        upperResult = String(Math.min(100, numericResult + resultVariation));
      } else {
        lowerResult = null;
        upperResult = null;
      }
    } else {
      // For non-General, lower/upper are same as raw
      lowerResult = rawResultStr;
      upperResult = rawResultStr;
    }

    // Calculate scaled score for sorting
    const scalingResult = calculateScaledScore(result.subject, result.rawResult);
    const scaledScoreForSort = scalingResult?.scaledScore; // Get the numeric score or null

    const row: SubjectRow = {
      id: crypto.randomUUID(),
      subject: subjectDisplay,
      rawResult: rawResultStr,
      lowerResult: lowerResult,
      upperResult: upperResult,
      validationRule: validationRule,
    };

    return { row, scaledScore: scaledScoreForSort };
  }).filter(item => item !== null);

  // Sort the intermediate array by scaled score (descending)
  rowsWithScores.sort((a, b) => {
    const scoreA = a.scaledScore ?? -Infinity; // Treat null as lowest
    const scoreB = b.scaledScore ?? -Infinity;
    return scoreB - scoreA; // Descending order
  });

  // Extract the sorted rows
  return rowsWithScores.map(item => item.row);
}; 