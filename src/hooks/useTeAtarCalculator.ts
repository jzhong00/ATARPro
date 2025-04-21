import { useMemo, useEffect, useState } from 'react';
import { SubjectRow } from '../types/calculator'; 
import { ScalingResult, SubjectType } from '../utils/scaling';
import { calculateStudentTEScores, calculateAndFormatAtar, calculateAndFormatAtarRange } from '../utils/teCalculator';
import subjectMappingService from '../services/subjectMappingService';
import { parseAndScale } from '../utils/calculatorUtils';

export type ScaledScoresMap = Map<string, { 
  lower: ScalingResult | null; 
  result: ScalingResult | null; 
  upper: ScalingResult | null 
}>;

export type TeAtarResult = {
  te: string;
  lowerTE: string;
  upperTE: string;
  atar: string | number;
  atarRange: string;
};

/**
 * Hook to handle TE and ATAR calculations based on subject rows
 */
export const useTeAtarCalculator = (
  subjectRows: SubjectRow[],
  isScalingDataLoaded: boolean
) => {
  // State for TE score and ATAR
  const [teScore, setTeScore] = useState<string | null>(null);
  const [lowerTeScore, setLowerTeScore] = useState<string | null>(null);
  const [upperTeScore, setUpperTeScore] = useState<string | null>(null);
  const [atar, setAtar] = useState<string | number | null>(null);
  const [atarRange, setAtarRange] = useState<string | null>(null);

  // Calculate scaled scores map
  const scaledScoresMap = useMemo<ScaledScoresMap>(() => {
    if (!isScalingDataLoaded) {
      return new Map<string, { lower: ScalingResult | null; result: ScalingResult | null; upper: ScalingResult | null }>();
    }

    const results = new Map<string, { lower: ScalingResult | null; result: ScalingResult | null; upper: ScalingResult | null }>();
    subjectRows.forEach(row => {
      let scaledLower: ScalingResult | null = null;
      let scaledResult: ScalingResult | null = null;
      let scaledUpper: ScalingResult | null = null;

      if (row.subject) {
        const mapping = subjectMappingService.getMappingByDisplayName(row.subject);
        if (mapping) {
          const subjectName = mapping.Subject_name; // Canonical name for scaling
          const validationRule = mapping.Validation;

          // Use the imported parseAndScale function from calculatorUtils
          scaledLower = parseAndScale(subjectName, row.lowerResult, validationRule);
          scaledResult = parseAndScale(subjectName, row.rawResult, validationRule);
          scaledUpper = parseAndScale(subjectName, row.upperResult, validationRule);
        }
      } 
      // Always set the result for the row, even if mapping failed (all values will be null)
      results.set(row.id, { lower: scaledLower, result: scaledResult, upper: scaledUpper });
    });
    return results;
  }, [subjectRows, isScalingDataLoaded]);

  // Calculate TE and ATAR
  const calculatedTotals = useMemo<TeAtarResult>(() => {
    const validScoresForTeCalculation: { 
      scaledScore: number;
      lowerScaledScore: number;
      upperScaledScore: number;
      subjectType: SubjectType; 
    }[] = [];

    scaledScoresMap.forEach((scaledRange, id) => {
      // Check if the main result calculation was successful
      if (scaledRange && scaledRange.result && !scaledRange.result.error) {
        const row = subjectRows.find(r => r.id === id);
        if (row && row.subject) {
          const mapping = subjectMappingService.getMappingByDisplayName(row.subject);
          if (mapping && mapping.Type) {
            // Use the calculated result score as the primary value
            const resultScore = scaledRange.result.scaledScore;
            
            // Use lower/upper if valid, otherwise fallback to the result score
            // For VET subjects or any subject with just a single value, use that value for both lower and upper
            const lowerScore = (scaledRange.lower && !scaledRange.lower.error) 
              ? scaledRange.lower.scaledScore 
              : resultScore;
              
            const upperScore = (scaledRange.upper && !scaledRange.upper.error) 
              ? scaledRange.upper.scaledScore 
              : resultScore;
            
            validScoresForTeCalculation.push({
              scaledScore: resultScore, 
              lowerScaledScore: lowerScore, 
              upperScaledScore: upperScore, 
              subjectType: mapping.Type as SubjectType
            });
          }
        }
      }
    });

    // Handle empty/invalid input
    if (validScoresForTeCalculation.length === 0) {
      return { 
        te: '-', 
        lowerTE: '-',
        upperTE: '-',
        atar: '-',
        atarRange: '-'
      };
    }

    // Calculate TE using the collected scores - always use range calculation
    const teResult = calculateStudentTEScores(validScoresForTeCalculation);
    
    // Calculate ATAR using both single value and range functions
    const atarResult = calculateAndFormatAtar(teResult.te);
    const atarRangeResultObject = calculateAndFormatAtarRange(teResult);

    return {
      te: teResult.te,
      lowerTE: teResult.lowerTE,
      upperTE: teResult.upperTE,
      atar: atarResult,
      atarRange: atarRangeResultObject.displayString
    };
  }, [scaledScoresMap, subjectRows]);

  // Update state when calculations change
  useEffect(() => {
    setTeScore(calculatedTotals.te);
    setLowerTeScore(calculatedTotals.lowerTE);
    setUpperTeScore(calculatedTotals.upperTE);
    setAtar(calculatedTotals.atar);
    setAtarRange(calculatedTotals.atarRange);
  }, [calculatedTotals]);

  return {
    teScore,
    lowerTeScore,
    upperTeScore,
    atar,
    atarRange,
    scaledScoresMap
  };
}; 