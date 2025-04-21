import { useMemo } from 'react';
// import { useSelector } from 'react-redux'; // Removed unused useSelector
// import { RootState } from '../store'; // Removed unused RootState
import subjectMappingService from '../services/subjectMappingService';
import { calculateScaledScore } from '../utils/scaling';
import {
  calculateStudentTEScores,
  calculateAndFormatAtar,
  calculateAndFormatAtarRange,
  // AtarRangeResult // Removed unused AtarRangeResult
} from '../utils/teCalculator';
import { SubjectType } from '../types/cohort';
import { CohortData } from '../types/cohort';

// Define the TableRow interface locally or import if shared
export interface CalculatedTableRow {
  id: number;
  studentName: string;
  subjectOriginal: string;
  subjectDisplay: string;
  result: string | number;
  lowerResult: string | number | null;
  upperResult: string | number | null;
  resultRange: string | null;
  lowerScaled: number | null;
  scaled: number | null;
  upperScaled: number | null;
  scaledRange: string | null;
  te: string;
  displayAtar: number | string;
  displayAtarRange: string;
}

// Define the structure for TE scores returned to components
// Now includes the calculated display values
export interface StudentProcessedScores {
  te: string;          // Raw TE
  lowerTE: string;     // Raw lower TE
  upperTE: string;     // Raw upper TE
  displayAtar: number | string; // Formatted ATAR or status string
  displayAtarRange: string;     // Formatted ATAR range or status string
}

interface UseCohortCalculatedDataProps {
  data: CohortData | null;
  mappingsLoaded: boolean;
  variation: string; // Pass variation as a prop
}

// Define a structure for the hook's return value for clarity
interface UseCohortCalculatedDataReturn {
    tableData: CalculatedTableRow[];
    processedStudentScores: Record<string, StudentProcessedScores>;
}

export const useCohortCalculatedData = ({
  data,
  mappingsLoaded,
  variation,
}: UseCohortCalculatedDataProps): UseCohortCalculatedDataReturn => {

  // Memoize TE scores calculation first, as tableData might depend on it indirectly
  const rawTeScoresByStudent = useMemo(() => {
    if (!data || !mappingsLoaded) return {};

    const scoresByStudent: Record<string, { te: string; lowerTE: string; upperTE: string }> = {};
    const currentVariation = Number(variation); // Calculate variation once

    data.students.forEach(student => {
      const studentScoresForTE = student.results.map(result => {
        const subjectOriginal = result.subject;
        let lowerResultNum: number | null = null;
        let upperResultNum: number | null = null;
        let scaledScoreNum: number | null = null;

        const scaledResult = calculateScaledScore(subjectOriginal, result.rawResult);
        scaledScoreNum = scaledResult.scaledScore;

        const subjectType = subjectMappingService.getSubjectType(subjectOriginal) || 'General';
        if (subjectType === 'General') {
            const numericResult = typeof result.rawResult === 'string' ? parseInt(result.rawResult, 10) : result.rawResult;
            if (!isNaN(numericResult)) {
                lowerResultNum = Math.max(0, numericResult - currentVariation);
                upperResultNum = Math.min(100, numericResult + currentVariation);
            }
        }

        let lowerScaledNum = lowerResultNum !== null ? calculateScaledScore(subjectOriginal, lowerResultNum).scaledScore : scaledScoreNum;
        let upperScaledNum = upperResultNum !== null ? calculateScaledScore(subjectOriginal, upperResultNum).scaledScore : scaledScoreNum;

        return {
          scaledScore: scaledScoreNum ?? 0,
          lowerScaledScore: lowerScaledNum ?? 0,
          upperScaledScore: upperScaledNum ?? 0,
          subjectType: subjectType as SubjectType
        };
      });

      if (studentScoresForTE.length > 0) {
         scoresByStudent[student.name] = calculateStudentTEScores(studentScoresForTE);
      } else {
         scoresByStudent[student.name] = { te: "N/A", lowerTE: "N/A", upperTE: "N/A" };
      }
    });
    return scoresByStudent;
  }, [data, mappingsLoaded, variation]);

  // Calculate processed scores (including display ATAR values) using raw TE scores
  const processedStudentScores = useMemo(() => {
    const processedScores: Record<string, StudentProcessedScores> = {};
    Object.entries(rawTeScoresByStudent).forEach(([studentName, rawScores]) => {
      // Call the modified function to get the result object
      const atarRangeResult = calculateAndFormatAtarRange(rawScores);

      processedScores[studentName] = {
        ...rawScores,
        displayAtar: calculateAndFormatAtar(rawScores.te),
        // Use the components to create the 2-part string if successful, otherwise use the status string
        displayAtarRange: atarRangeResult.status === 'success' && atarRangeResult.lowerAtar !== null && atarRangeResult.upperAtar !== null
            ? `${atarRangeResult.lowerAtar.toFixed(2)} - ${atarRangeResult.upperAtar.toFixed(2)}`
            : atarRangeResult.displayString // Use the pre-formatted status/error string from the result object
      };
    });
    return processedScores;
  }, [rawTeScoresByStudent]);

  // Calculate the flat array of table rows, now including display ATAR values
  const tableData = useMemo(() => {
    // Add checks: ensure data, mappings, and the intermediate processed scores are ready
    if (!data || !mappingsLoaded || !processedStudentScores) return [];
    // If there are students but no processed scores yet (shouldn't happen with correct deps, but safe check)
    if (data.students.length > 0 && Object.keys(processedStudentScores).length === 0) return [];

    let id = 0;
    const rows: CalculatedTableRow[] = [];
    const currentVariation = Number(variation);

    data.students.forEach(student => {
      // Get pre-calculated scores for the student
      const studentProcessedData = processedStudentScores[student.name];
      if (!studentProcessedData) return; // Skip if student has no processed data

      student.results.forEach(result => {
        const subjectOriginal = result.subject;
        const subjectDisplay = subjectMappingService.getSubjectDisplay(subjectOriginal);
        const subjectType = subjectMappingService.getSubjectType(subjectOriginal) || 'General';

        let lowerResult: string | number | null = null;
        let upperResult: string | number | null = null;
        let resultRange: string | null = null;

        if (subjectType === 'General') {
          const numericResult = typeof result.rawResult === 'string' ? parseInt(result.rawResult, 10) : result.rawResult;
          if (!isNaN(numericResult)) {
            lowerResult = Math.max(0, numericResult - currentVariation);
            upperResult = Math.min(100, numericResult + currentVariation);
            resultRange = `${lowerResult} - ${upperResult}`;
          }
        } else {
          const rawValue = result.rawResult.toString();
          lowerResult = rawValue;
          upperResult = rawValue;
          resultRange = rawValue;
        }

        const scaledResult = calculateScaledScore(subjectOriginal, result.rawResult);
        let lowerScaled = null;
        let upperScaled = null;
        let scaledRange = null;

        if (subjectType === 'General') {
          if (lowerResult !== null && upperResult !== null && typeof lowerResult === 'number' && typeof upperResult === 'number') {
            lowerScaled = calculateScaledScore(subjectOriginal, lowerResult).scaledScore;
            upperScaled = calculateScaledScore(subjectOriginal, upperResult).scaledScore;
            scaledRange = typeof lowerScaled === 'number' && typeof upperScaled === 'number'
              ? `${lowerScaled.toFixed(1)} - ${upperScaled.toFixed(1)}`
              : null;
          }
        } else {
          lowerScaled = scaledResult.scaledScore;
          upperScaled = scaledResult.scaledScore;
          scaledRange = typeof scaledResult.scaledScore === 'number'
            ? scaledResult.scaledScore.toFixed(1)
            : null;
        }

        rows.push({
          id: id++,
          studentName: student.name,
          subjectOriginal,
          subjectDisplay,
          result: result.rawResult,
          lowerResult,
          upperResult,
          resultRange,
          lowerScaled,
          scaled: scaledResult.scaledScore,
          upperScaled,
          scaledRange,
          te: studentProcessedData.te,
          displayAtar: studentProcessedData.displayAtar,
          displayAtarRange: studentProcessedData.displayAtarRange
        });
      });
    });

    return rows;
    // Depend on processedStudentScores now, which depends on rawTeScores, which depends on variation
  }, [data, mappingsLoaded, processedStudentScores]);

  return { tableData, processedStudentScores };
}; 