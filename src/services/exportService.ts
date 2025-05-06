// ATAR Calculator – Greenfield architecture: follow utils/services/components separation and avoid legacy patterns.

import type { SubjectRow } from '../types/calculator';
import type { ScalingResult } from '../utils/scaling';

// Utilities called by the service
import { preparePdfSubjectData } from '../utils/calculatorUtils';
import { generateStudentPDF } from '../utils/exportUtils';

// Interface for data required by the SET Plan PDF generation
export interface SetPlanPdfData {
  pdfStudentName: string;
  subjectRows: SubjectRow[];
  scaledScoresMap: Map<string, { 
    lower: ScalingResult | null; 
    result: ScalingResult | null; 
    upper: ScalingResult | null 
  }>;
  atarRange: string | number | null;
  teScoreRange: string | number | null;
  chartContainerElement: HTMLDivElement | null;
  explanatoryText: string;
  imagePath: string;
  // Add any other parameters needed from the component
}

/**
 * Generates the SET Plan specific PDF report.
 * Orchestrates data preparation and PDF generation utility calls.
 */
const generateSetPlanPdf = async (data: SetPlanPdfData): Promise<boolean> => {
  const { 
    pdfStudentName, 
    subjectRows, 
    scaledScoresMap, 
    atarRange, 
    teScoreRange, 
    chartContainerElement,
    explanatoryText,
    imagePath
  } = data;

  try {
    // Prepare enhanced subject data for SET Plan Calculator PDF
    const pdfSubjectResults = preparePdfSubjectData(subjectRows, scaledScoresMap, true) // Always use range mode
      .map(subject => ({
        ...subject,
        // Add SET Plan specific fields that aren't included in standard PDF generation
        rank: subjectRows.find(row => row.subject === subject.subject)?.rank || null,
        resultRange: subjectRows.find(row => row.subject === subject.subject)?.resultRange || null,
      }));
    
    // --- DEBUGGING: Log prepared subject data & check for NaN ---
    pdfSubjectResults.forEach((subject, index) => {
      // Check fields if they are numbers and if they are NaN
      const checkNaN = (value: any): boolean => typeof value === 'number' && isNaN(value);
      
      if (checkNaN(subject.scaledScore) || checkNaN(subject.lowerScaledScore) || checkNaN(subject.upperScaledScore)) {
        console.error(`NaN detected in prepared subject data at index ${index}:`, subject);
      }
    });
    // --- END DEBUGGING ---

    // Format ATAR range to only show upper and lower bounds
    let formattedAtarRange = atarRange;
    if (atarRange && typeof atarRange === 'string' && atarRange.includes(' - ')) {
      const parts = atarRange.split(' - ');
      if (parts.length === 3) {
        // If format is "lower - middle - upper", return "lower - upper"
        formattedAtarRange = `${parts[0]} - ${parts[2]}`;
      }
    }

    // Format TE Score range (already should be in "lower - upper" or single value format)
    const formattedTeScore = teScoreRange;

    // Keep atarRange as string | number | null. Convert TE score to string or null for the utility function.
    const teScoreForPdf = formattedTeScore === null ? null : String(formattedTeScore);

    // Generate PDF with SET Plan specific data using the utility
    const success = await generateStudentPDF(
      pdfStudentName,
      pdfSubjectResults,
      true, // Always use range mode for SET Plan Calculator
      formattedAtarRange, // Pass string | number | null directly
      teScoreForPdf,      // Pass string | null
      null, // Pass null for warningText (6th argument)
      chartContainerElement, // Pass chart container (7th argument)
      // Pass special options for SET Plan Calculator (8th argument)
      {
        setPlanMode: true,
        explanatoryText,
        imagePath,
        hideRangeColumns: true, // Set flag to hide Lower/Result/Upper columns
        reduceChartSize: true // Make the chart smaller
      }
    );
    
    if (!success) {
      console.error("PDF generation failed within exportService.");
      return false;
    } else {
      return true;
    }
  } catch (error) { 
    console.error("Error during PDF generation in exportService:", error);
    return false;
  }
};

const exportService = {
  generateSetPlanPdf,
};

export default exportService; 