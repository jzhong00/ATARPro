import { useState, useCallback } from 'react';
import { generateStudentPDF } from '../utils/exportUtils';
import { preparePdfSubjectData } from '../utils/calculatorUtils';
import type { SubjectRow } from '../types/calculator';
import type { ScalingResult } from '../utils/scaling';

interface UsePrintFunctionalityProps {
  studentName: string | null;
  subjectRows: SubjectRow[];
  scaledScoresMap: Map<string, { 
    lower: ScalingResult | null; 
    result: ScalingResult | null; 
    upper: ScalingResult | null; 
  }>;
  rangeMode: boolean;
  atar: string | null;
  teScore: string | null;
  chartContainerRef: React.RefObject<HTMLDivElement>;
}

/**
 * Custom hook for handling PDF generation and printing functionality
 */
export const usePrintFunctionality = ({
  studentName,
  subjectRows,
  scaledScoresMap,
  rangeMode,
  atar,
  teScore,
  chartContainerRef
}: UsePrintFunctionalityProps) => {
  const [isPrinting, setIsPrinting] = useState(false);

  /**
   * Handle PDF generation and download
   */
  const handlePrint = useCallback(async () => {
    if (isPrinting) return; // Prevent multiple clicks

    setIsPrinting(true);

    try {
      const pdfStudentName = studentName || 'Manual Entry';
      const pdfSubjectResults = preparePdfSubjectData(subjectRows, scaledScoresMap, rangeMode);
      
      const success = await generateStudentPDF(
        pdfStudentName,
        pdfSubjectResults,
        rangeMode,
        atar,
        teScore,
        null,
        chartContainerRef.current
      );
      
      if (!success) {
        console.error("PDF generation failed.");
      } 
    } catch (error) {
      console.error("PDF generation or download failed:", error);
    } finally {
      setIsPrinting(false);
    }
  }, [
    isPrinting,
    studentName,
    subjectRows,
    scaledScoresMap,
    rangeMode,
    atar,
    teScore,
    chartContainerRef
  ]);

  return {
    isPrinting,
    handlePrint
  };
}; 