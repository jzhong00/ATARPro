import type { SubjectRow } from '../types/calculator';
import type { Student, SubjectType as CohortSubjectType, StudentResult } from '../types/cohort';
import { calculateScaledScore, ScalingResult } from './scaling';
import { calculateStudentTEScores, calculateAndFormatAtar, calculateAndFormatAtarRange, StudentScore, AtarRangeResult } from './teCalculator';
import { generatePDF } from './generateStudentReport';
import { prepareChartData } from './calculatorUtils';
import React from 'react';
import ReactDOM from 'react-dom/client';
import html2canvas from 'html2canvas';
import { PDFDocument } from 'pdf-lib';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { SubjectMapping } from '../services/subjectMappingService';

/**
 * Type for chart component props needed for rendering
 */
export type ChartComponentProps = {
  chartData: any[];
  rangeMode: boolean;
  xAxisMin: number;
  xAxisMax: number;
  disableAnimation?: boolean;
};

/**
 * Type for chart component that can be rendered
 */
export type ChartComponent = React.ComponentType<ChartComponentProps>;

/**
 * Interface for subject mapping service
 */
export interface SubjectMappingService {
  getAllMappings: () => SubjectMapping[];
  getMappingByDisplayName: (name: string) => SubjectMapping | undefined;
  getSubjectType: (subjectName: string) => string | undefined;
}

/**
 * Generate and download a PDF report for a single student
 */
export const generateStudentPDF = async (
  studentName: string,
  subjectResults: any[],
  rangeMode: boolean,
  atarText: string | number | null,
  teText: string | null,
  warningText: string | null,
  chartContainer: HTMLDivElement | null,
  options?: {
    setPlanMode?: boolean;
    explanatoryText?: string;
    imagePath?: string;
    hideRangeColumns?: boolean;
    reduceChartSize?: boolean;
  }
) => {
  let chartImageBase64: string | null = null;

  // Attempt to capture chart if container exists
  if (chartContainer) {
    try {
      const canvas = await html2canvas(chartContainer, {
        useCORS: true,
        logging: false
      });
      chartImageBase64 = canvas.toDataURL('image/png');
    } catch (error) {
      console.error("Chart capture failed:", error);
    }
  }

  // Generate PDF
  const pdfInput = {
    studentName,
    subjectResults,
    rangeMode,
    atarText,
    teText,
    chartImageBase64,
    warningText,
    // Add SET Plan specific options if provided
    setPlanMode: options?.setPlanMode || false,
    explanatoryText: options?.explanatoryText || null,
    imagePath: options?.imagePath || null,
    hideRangeColumns: options?.hideRangeColumns || false,
    reduceChartSize: options?.reduceChartSize || false
  };

  try {
    const pdfBytes = await generatePDF(pdfInput);
    
    // Create download link
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    // Sanitize filename
    const safeStudentName = studentName.replace(/[^a-z0-9_-]/gi, '_');
    link.download = `ATAR_Report_${safeStudentName}.pdf`;
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    return true;
  } catch (error) {
    console.error("PDF generation failed:", error);
    return false;
  }
};

/**
 * Generate reports for an entire cohort and export as a zip file
 */
export const generateCohortExport = async (
  students: Student[],
  resultVariation: number | string,
  exportRangeMode: boolean,
  ChartComponent: ChartComponent,
  subjectMappingService: SubjectMappingService,
  onProgress: (message: string) => void,
  onComplete: () => void
) => {
  // Ensure we have numeric variation
  const numericVariation = Number(resultVariation) || 0;
  
  // Sort students by name
  const sortedStudents = [...students].sort((a, b) => a.name.localeCompare(b.name));
  const totalStudents = sortedStudents.length;
  
  onProgress(`Starting export for ${totalStudents} students...`);
  
  // Initialize variables
  const zip = new JSZip();
  let failures = 0;
  let successes = 0;
  const mergedPdf = await PDFDocument.create();
  
  // Create temporary container for chart rendering
  const tempChartContainer = document.createElement('div');
  tempChartContainer.id = 'temp-chart-container-for-export';
  tempChartContainer.style.position = 'absolute';
  tempChartContainer.style.left = '-9999px';
  tempChartContainer.style.top = '-9999px';
  tempChartContainer.style.width = '800px';
  tempChartContainer.style.height = '600px';
  tempChartContainer.style.backgroundColor = '#ffffff';
  document.body.appendChild(tempChartContainer);
  const tempRoot = ReactDOM.createRoot(tempChartContainer);
  
  try {
    // Process each student
    for (let i = 0; i < totalStudents; i++) {
      const student = sortedStudents[i];
      onProgress(`Generating PDF ${i + 1} of ${totalStudents}: ${student.name}`);
      
      try {
        // Process student subject rows
        const subjectRows: SubjectRow[] = student.results.map((res: StudentResult, index: number) => {
          const mapping = subjectMappingService.getAllMappings().find((m: SubjectMapping) => m.Subject_name === res.subject);
          const subjectDisplay = mapping?.Subject_display ?? res.subject;
          const validationRule = mapping?.Validation ?? null;
          const subjectType = mapping?.Type as CohortSubjectType | null;
          const rawResultStr = res.rawResult !== null && res.rawResult !== undefined ? String(res.rawResult) : null;
          
          let lowerResult: string | null = null;
          let upperResult: string | null = null;
          
          if (exportRangeMode) {
            if (subjectType === 'General') {
              const numericResult = typeof res.rawResult === 'string' ? parseInt(res.rawResult, 10) : res.rawResult;
              if (rawResultStr !== null && numericResult != null && !isNaN(numericResult)) {
                lowerResult = String(Math.max(0, numericResult - numericVariation));
                upperResult = String(Math.min(100, numericResult + numericVariation));
              }
            } else if (subjectType === 'Applied' || subjectType === 'VET') {
              lowerResult = rawResultStr;
              upperResult = rawResultStr;
            }
          }
          
          return {
            id: `${student.name}-${index}-${crypto.randomUUID()}`,
            subject: subjectDisplay,
            rawResult: rawResultStr,
            lowerResult: lowerResult,
            upperResult: upperResult,
            validationRule: validationRule,
          };
        });
        
        // Sort by scaled score
        subjectRows.sort((a, b) => {
          if (!a.subject || !a.rawResult) return 1; // Push empty rows to the end
          if (!b.subject || !b.rawResult) return -1;
          
          const mappingA = a.subject ? subjectMappingService.getMappingByDisplayName(a.subject) : null;
          const mappingB = b.subject ? subjectMappingService.getMappingByDisplayName(b.subject) : null;
          
          if (!mappingA || !mappingB) return 0;
          
          const scaleA = calculateScaledScore(mappingA.Subject_name, a.rawResult);
          const scaleB = calculateScaledScore(mappingB.Subject_name, b.rawResult);
          
          return (scaleB.error ? 0 : scaleB.scaledScore) - (scaleA.error ? 0 : scaleA.scaledScore);
        });
        
        // Pad with empty rows
        while (subjectRows.length < 6) {
          subjectRows.push({
            id: crypto.randomUUID(),
            subject: null,
            rawResult: null,
            lowerResult: null,
            upperResult: null,
            validationRule: null,
          });
        }
        
        // Determine if warning text is needed for this student
        const studentWarningSubjects = subjectRows
          .map(row => row.subject ? subjectMappingService.getMappingByDisplayName(row.subject) : null)
          .filter(mapping => mapping?.Subject_display?.includes('*') ?? false)
          .map(mapping => mapping?.Subject_display ?? ''); // Get the display name

        const studentWarningText = studentWarningSubjects.length > 0
          ? `Note: ${studentWarningSubjects.join(', ')} scaling data is not available. Instead, the average of all subjects scaling data has been applied to this subject. This will decrease the accuracy of this ATAR calculation.`
          : null;
        
        // Prepare chart data
        const { chartData, xAxisMin, xAxisMax } = prepareChartData(subjectRows, exportRangeMode, subjectMappingService);
        
        // Render chart
        tempRoot.render(
          React.createElement(
            React.StrictMode,
            null,
            React.createElement(ChartComponent, {
              chartData: chartData,
              rangeMode: exportRangeMode,
              xAxisMin: xAxisMin,
              xAxisMax: xAxisMax,
              disableAnimation: true
            })
          )
        );
        
        // Wait for rendering
        await new Promise(requestAnimationFrame);
        await new Promise(resolve => setTimeout(resolve, 50));
        
        // Capture chart
        let chartImageBase64 = null;
        try {
          const canvas = await html2canvas(tempChartContainer, {
            logging: false,
            useCORS: true,
            scale: 2,
            backgroundColor: '#ffffff',
          });
          chartImageBase64 = canvas.toDataURL('image/png');
        } catch (error) {
          console.error(`Error capturing chart for ${student.name}:`, error);
        }
        
        // Calculate TE/ATAR scores
        const scaledScoreCache = new Map();
        
        const scoresForTE: StudentScore[] = subjectRows
          .map(row => {
            const mapping = row.subject ? subjectMappingService.getMappingByDisplayName(row.subject) : null;
            if (!mapping || row.rawResult === null || row.rawResult === '') return null;
            
            const subjectName = mapping.Subject_name;
            const subjectType = mapping.Type as CohortSubjectType;
            
            const mainScaled = calculateScaledScore(subjectName, row.rawResult);
            const lowerScaled = row.lowerResult ? calculateScaledScore(subjectName, row.lowerResult) : mainScaled;
            const upperScaled = row.upperResult ? calculateScaledScore(subjectName, row.upperResult) : mainScaled;
            
            scaledScoreCache.set(row.id, { main: mainScaled, lower: lowerScaled, upper: upperScaled });
            
            if (mainScaled.error || lowerScaled.error || upperScaled.error) return null;
            
            return {
              scaledScore: mainScaled.scaledScore,
              lowerScaledScore: Math.min(lowerScaled.scaledScore, mainScaled.scaledScore),
              upperScaledScore: Math.max(upperScaled.scaledScore, mainScaled.scaledScore),
              subjectType: subjectType,
            };
          })
          .filter((score): score is StudentScore => score !== null);
          
        const teResult = calculateStudentTEScores(scoresForTE);
        const finalTeText = (teResult.te !== 'ATAR Ineligible' && exportRangeMode)
          ? `${teResult.lowerTE} - ${teResult.upperTE}`
          : teResult.te;
          
        const atarCalcResult = exportRangeMode
          ? calculateAndFormatAtarRange(teResult)
          : calculateAndFormatAtar(teResult.te);

        // Prepare the text for the PDF (ensure it's string or null)
        let atarTextForPdf: string | number | null = null;
        if (exportRangeMode) {
          // We know atarCalcResult is AtarRangeResult here
          atarTextForPdf = (atarCalcResult as AtarRangeResult).displayString;
        } else {
          // We know atarCalcResult is string | number here
          atarTextForPdf = atarCalcResult as string | number;
        }
          
        // Generate individual PDF
        const pdfSubjectResults = subjectRows
          .filter(r => r.subject)
          .map(r => {
            const cachedScores = scaledScoreCache.get(r.id);
            return {
              subject: r.subject,
              rawResult: r.rawResult,
              lowerResult: r.lowerResult,
              upperResult: r.upperResult,
              scaledScore: cachedScores?.main?.error ? null : cachedScores?.main?.scaledScore,
              lowerScaledScore: cachedScores?.lower?.error ? null : cachedScores?.lower?.scaledScore,
              upperScaledScore: cachedScores?.upper?.error ? null : cachedScores?.upper?.scaledScore,
            };
          });
          
        const pdfBytes = await generatePDF({
          studentName: student.name,
          subjectResults: pdfSubjectResults,
          rangeMode: exportRangeMode,
          atarText: atarTextForPdf,
          teText: finalTeText,
          chartImageBase64: chartImageBase64,
          warningText: studentWarningText
        });
        
        // Add to zip
        const safeStudentName = student.name.replace(/[^a-zA-Z0-9_.-]/g, '_');
        zip.file(`ATAR_Report_${safeStudentName}.pdf`, pdfBytes, { binary: true });
        
        // Add to merged PDF
        try {
          const studentPdf = await PDFDocument.load(pdfBytes);
          const copiedPages = await mergedPdf.copyPages(studentPdf, studentPdf.getPageIndices());
          copiedPages.forEach(page => mergedPdf.addPage(page));
        } catch (mergeError) {
          console.error(`Failed to merge pages for student ${student.name}:`, mergeError);
        }
        
        successes++;
      } catch (error) {
        failures++;
        console.error(`Failed to process student ${student.name}:`, error);
        onProgress(`❌ Error for ${student.name} - skipping...`);
        
        // Add error file to zip
        const safeStudentName = student.name.replace(/[^a-zA-Z0-9_.-]/g, '_');
        zip.file(
          `FAILURE_Report_${safeStudentName}.txt`, 
          `Failed to generate PDF for ${student.name}.\nError: ${error instanceof Error ? error.message : String(error)}`
        );
      }
      
      // Small pause to prevent UI lockup
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    
    // Save merged PDF
    if (successes > 0) {
      try {
        const mergedPdfBytes = await mergedPdf.save();
        zip.file('_0_Cohort_Complete.pdf', mergedPdfBytes, { binary: true });
      } catch (saveError) {
        console.error("Failed to save or add merged PDF to ZIP:", saveError);
        zip.file(
          '_FAILURE_MERGING_PDF.txt', 
          `Failed to save the combined cohort PDF.\nError: ${saveError instanceof Error ? saveError.message : String(saveError)}`
        );
      }
    }
    
    // Generate and download zip
    if (successes > 0 || failures > 0) {
      try {
        const zipBlob = await zip.generateAsync({
          type: 'blob',
          compression: "DEFLATE",
          compressionOptions: { level: 6 }
        });
        saveAs(zipBlob, 'ATAR_Cohort_Reports.zip');
      } catch (error) {
        console.error('Failed to generate or save the ZIP file:', error);
        onProgress(`❌ Failed to generate the final ZIP file: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    
    // Final progress message
    if (failures === 0) {
      onProgress(`✅ Export complete (${successes} PDFs${successes > 0 ? ' + 1 Merged PDF' : ''}).`);
    } else {
      onProgress(`⚠️ Export finished with ${failures} errors (${successes} PDFs). Merged PDF might be incomplete or missing.`);
    }
  } finally {
    // Cleanup
    tempRoot.unmount();
    document.body.removeChild(tempChartContainer);
    onComplete();
  }
}; 