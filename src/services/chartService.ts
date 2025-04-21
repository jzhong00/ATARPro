// ATAR Calculator – Greenfield architecture: follow utils/services/components separation and avoid legacy patterns.

import type { SubjectRow } from '../types/calculator';
import type { ScaledScoreChartDataPoint } from '../types/chart';
import { calculateScaledScore, ScalingResult } from '../utils/scaling';
import subjectMappingService from './subjectMappingService';

// Constants for chart logic
const MIN_X_AXIS_STEP = 10; // Determine axis minimum in steps of 10
// Increase the offset for better visibility of single-point bars in range mode
const BAR_VISUAL_OFFSET = 0.5; 

/**
 * Result structure from the preparation function.
 */
interface PreparedChartData {
  chartData: ScaledScoreChartDataPoint[];
  xAxisMin: number;
  xAxisMax: number;
}

/**
 * Prepares data for the Scaled Score Bar Chart.
 *
 * Takes raw subject rows and range mode status, calculates scaled scores,
 * determines appropriate axis ranges, sorts the data, and formats it
 * for consumption by the Recharts BarChart component.
 *
 * @param subjectRows - Array of subject input rows from the calculator.
 * @param rangeMode - Boolean indicating if range mode is active.
 * @returns An object containing the formatted chartData and the calculated xAxisMin.
 */
export const prepareScaledScoreChartData = (
  subjectRows: SubjectRow[],
  rangeMode: boolean
): PreparedChartData => {

  const validEntries: { subject: string; lower: ScalingResult | null; middle: ScalingResult | null; upper: ScalingResult | null }[] = [];

  for (const row of subjectRows) {
    if (!row.subject || row.rawResult === null || row.rawResult === '') {
      continue;
    }

    const mapping = subjectMappingService.getMappingByDisplayName(row.subject);
    if (!mapping) {
        console.warn(`Chart Prep: No mapping found for subject: ${row.subject}`);
        continue;
    }

    const subjectName = mapping.Subject_name;
    const middleScoreResult = calculateScaledScore(subjectName, row.rawResult);
    if (middleScoreResult.error) {
      console.warn(`Chart Prep: Error calculating middle scaled score for ${subjectName} (${row.subject}) with result ${row.rawResult}: ${middleScoreResult.error}`);
      continue;
    }

    let lowerScoreResult: ScalingResult | null = middleScoreResult;
    let upperScoreResult: ScalingResult | null = middleScoreResult;

    if (rangeMode) {
      if (row.lowerResult !== null && row.lowerResult !== '') {
        const lowerCalc = calculateScaledScore(subjectName, row.lowerResult);
        if (!lowerCalc.error) lowerScoreResult = lowerCalc;
        else console.warn(`Chart Prep: Error calculating lower scaled score for ${subjectName}: ${lowerCalc.error}`);
      }
      if (row.upperResult !== null && row.upperResult !== '') {
        const upperCalc = calculateScaledScore(subjectName, row.upperResult);
        if (!upperCalc.error) upperScoreResult = upperCalc;
        else console.warn(`Chart Prep: Error calculating upper scaled score for ${subjectName}: ${upperCalc.error}`);
      }

      if (lowerScoreResult && lowerScoreResult.scaledScore > middleScoreResult.scaledScore) lowerScoreResult = middleScoreResult;
      if (upperScoreResult && upperScoreResult.scaledScore < middleScoreResult.scaledScore) upperScoreResult = middleScoreResult;
    }

    validEntries.push({
      subject: row.subject,
      lower: lowerScoreResult,
      middle: middleScoreResult,
      upper: upperScoreResult,
    });
  }

  if (validEntries.length === 0) {
    return { chartData: [], xAxisMin: 0, xAxisMax: 100 }; 
  }

  const lowestScore = Math.min(...validEntries.map(e => e.lower?.scaledScore ?? e.middle?.scaledScore ?? 0));
  const highestScore = Math.max(...validEntries.map(e => e.upper?.scaledScore ?? e.middle?.scaledScore ?? 0));

  const xAxisMin = Math.max(0, Math.floor(lowestScore / MIN_X_AXIS_STEP) * MIN_X_AXIS_STEP);
  const calculatedXAxisMax = Math.min(100, Math.ceil(highestScore / MIN_X_AXIS_STEP) * MIN_X_AXIS_STEP);
  
  // Declare finalMax here
  let finalMax: number;

  // Ensure max is always >= min
  if (calculatedXAxisMax < xAxisMin) {
      console.warn(`Calculated xAxisMax (${calculatedXAxisMax}) was less than xAxisMin (${xAxisMin}). Resetting max to 100.`);
      finalMax = 100; // Assign to finalMax
  } else {
      finalMax = calculatedXAxisMax; // Assign to finalMax
  }

  // Transform data
  let chartData: ScaledScoreChartDataPoint[] = validEntries.map(entry => {
    const lowerValue = entry.lower?.scaledScore ?? 0;
    const middleValue = entry.middle?.scaledScore ?? 0;
    const upperValue = entry.upper?.scaledScore ?? 0;

    let base = 0;
    let middle: number | undefined = undefined;
    let upper: number | undefined = undefined;

    const internalMax = finalMax - xAxisMin;
    const isSinglePoint = lowerValue === middleValue && middleValue === upperValue;

    if (rangeMode) {
        const adjustedLower = lowerValue;
        // Apply offset only if it's a single point value
        const visualWidth = isSinglePoint ? BAR_VISUAL_OFFSET : 0;
        const adjustedUpper = upperValue + visualWidth;

        base = Math.max(0, adjustedLower - xAxisMin);
        middle = Math.max(0, middleValue - adjustedLower); // Will be 0 if single point
        // Upper gets the visual width added if it's a single point
        upper = Math.max(0, adjustedUpper - middleValue); 
        
        // Ensure total width doesn't exceed internalMax (clipping)
        const totalWidth = base + middle + upper;
        if (totalWidth > internalMax) {
            const overshoot = totalWidth - internalMax;
            // Clip the last segment (upper)
            upper = Math.max(0, upper - overshoot); 
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

  chartData.sort((a, b) => b.middleValue - a.middleValue);

  // Return finalMax
  return { chartData, xAxisMin, xAxisMax: finalMax };
}; 