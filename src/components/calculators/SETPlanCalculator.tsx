// ATAR Calculator – Greenfield architecture: follow utils/services/components separation and avoid legacy patterns.
import { useState, useEffect, useCallback, useRef } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store';
import type { SubjectRow } from '../../types/calculator';

// Services
import subjectMappingService from '../../services/subjectMappingService';
import setPlanCalculationService from '../../services/setPlanCalculationService';
import exportService from '../../services/exportService';
import type { SetPlanPdfData } from '../../services/exportService';

// Custom Hooks
import { useSubjectRows } from '../../hooks/useSubjectRows';
import { useTeAtarCalculator } from '../../hooks/useTeAtarCalculator';
import { useSetPlanSubjects } from '../../hooks/useSetPlanSubjects';
import { useSetPlanData } from '../../hooks/useSetPlanData';

// UI Components
import ScaledScoreChartContainer from './ScaledScoreChartContainer';
import SETPlanSubjectTable from './panels/SETPlanSubjectTable';
import ActionButtonsBar from './panels/ActionButtonsBar';

/**
 * SET Plan Calculator component
 * Helps with planning subject choices based on rankings
 */
const SETPlanCalculator = () => {
  const chartContainerRef = useRef<HTMLDivElement>(null);

  // Get cohort data from Redux
  // const cohortData = useSelector((state: RootState) => state.cohort.data);
  // const resultVariation = useSelector((state: RootState) => state.cohort.filters.resultVariation);
  
  const {
    setPlanSubjects: allSubjects,
    loadingError: subjectsLoadingError,
    isScalingDataLoaded,
    scalingDataError
  } = useSetPlanSubjects();
  
  // Load SET Plan data (percentiles)
  const {
    isLoaded: isPlanDataLoaded,
    error: planDataError,
    getResultRange,
    // getScaledRange // Removed unused getScaledRange
  } = useSetPlanData();
  
  // Combine errors
  const loadingError = subjectsLoadingError || planDataError;
  
  // Get the base subject rows functionality from the hook
  const {
    subjectRows: baseSubjectRows,
    handleAddRow,
    handleDeleteRow,
    handleSubjectChange: handleSubjectChangeBase,
    resetSubjectRows: resetBaseSubjectRows,
    // setRowsFromData // Removed unused setRowsFromData
  } = useSubjectRows(6);
  
  // State for subject rows with added rank
  const [subjectRows, setSubjectRows] = useState(baseSubjectRows);
  
  // Sync with base subject rows when they change, but preserve rank and resultRange
  useEffect(() => {
    setSubjectRows((prevRows) => 
      baseSubjectRows.map(baseRow => {
        // Find the corresponding previous row to preserve rank data
        const prevRow = prevRows.find(row => row.id === baseRow.id);
        
        // If we found a matching previous row, preserve its rank and resultRange
        if (prevRow) {
          return {
            ...baseRow,
            // Preserve all relevant scaled score data
            rank: prevRow.rank,
            resultRange: prevRow.resultRange,
            rawResult: prevRow.rawResult,
            lowerResult: prevRow.lowerResult,
            upperResult: prevRow.upperResult,
            // If we have rank data but the subject changed, reset these values
            ...(prevRow.rank && baseRow.subject !== prevRow.subject ? { 
              rank: null, 
              resultRange: null,
              rawResult: null,
              lowerResult: null,
              upperResult: null
            } : {})
          };
        }
        
        // Otherwise, use the base row as is
        return baseRow;
      })
    );
  }, [baseSubjectRows]);
  
  // Wrapper function to provide subjectMappingService
  const handleSubjectChange = useCallback((idToUpdate: string, inputValue: string | null) => {
    // Call the base handler to update the base subject rows
    handleSubjectChangeBase(idToUpdate, inputValue, subjectMappingService);
    
    // The useEffect that syncs from baseSubjectRows will preserve all data for rows
    // other than the one being updated, preventing loss of scaled scores
  }, [handleSubjectChangeBase]);
  
  // Handle rank change
  const handleRankChange = useCallback((idToUpdate: string, rankValue: string | null) => {
    setSubjectRows((prevRows) => 
      prevRows.map((row) => {
        if (row.id === idToUpdate) {
          // Get mapping and type using the service
          const mapping = row.subject ? subjectMappingService.getMappingByDisplayName(row.subject) : undefined;
          const subjectType = mapping?.Type as 'General' | 'Applied' | 'VET' | null;
          
          let resultRange = null;
          let lowerResult = null;
          let upperResult = null;
          let rawResult = null; // Hold single value for VET/General

          if (subjectType === 'General') {
            if (row.subject && rankValue) {
              // Get range from data hook
              resultRange = getResultRange(row.subject, rankValue);
              if (resultRange) {
                const [lower, upper] = resultRange.split('-').map(num => num.trim());
                lowerResult = lower;
                upperResult = upper;
                rawResult = lower; // Use lower for consistency
              }
            }
          } else if (subjectType && rankValue) {
            // Use service for Applied/VET
            resultRange = setPlanCalculationService.getResultRangeFromRank(subjectType, rankValue);
            
            if (subjectType === 'Applied' && resultRange) {
              // Use service to parse
              const parsedRange = setPlanCalculationService.parseResultRange(resultRange);
              if (parsedRange) {
                lowerResult = parsedRange.lower;
                upperResult = parsedRange.upper;
                rawResult = parsedRange.lower; // Use lower for consistency
              }
            } else if (subjectType === 'VET' && resultRange) {
              // VET uses the range directly as the result
              lowerResult = resultRange;
              upperResult = resultRange;
              rawResult = resultRange;
            }
          }
          
          return { 
            ...row, 
            rank: rankValue,
            resultRange: resultRange,
            rawResult: rawResult, // Store the derived result
            lowerResult: lowerResult, // Store derived lower
            upperResult: upperResult  // Store derived upper
          };
        }
        return row;
      })
    );
  }, [getResultRange]);
  
  const [isPrinting, setIsPrinting] = useState(false);
  
  const {
    teScore,
    lowerTeScore,
    upperTeScore,
    atar,
    atarRange,
    scaledScoresMap
  } = useTeAtarCalculator(subjectRows, isScalingDataLoaded);
  
  const clearSubjectsAndResults = useCallback(() => {
    resetBaseSubjectRows();
  }, [resetBaseSubjectRows]);
  
  /**
   * Handles PDF generation and download using the exportService
   */
  const handlePrint = async () => {
    if (isPrinting) return;

    setIsPrinting(true);
    console.log("Print process started via component...");

    try {
      const pdfStudentName = '';
      const explanatoryText = "Imagine a class of 100 students from across QLD who have selected the same subject.\nWhere would you place yourself?";
      const imagePath = "/images/single_student_mock_up.png";

      // --- DEBUGGING: Log values used for PDF ranges ---
      console.log('Debug PDF Data - Raw Values:', { atarRange, atar, lowerTeScore, upperTeScore, teScore }); 
      // --- END DEBUGGING ---

      // Consolidate data for the export service
      const pdfData: SetPlanPdfData = {
        pdfStudentName,
        subjectRows, // Pass current subject rows
        scaledScoresMap, // Pass current scaled scores map
        atarRange: atarRange || atar, // Pass calculated ATAR range or single value
        teScoreRange: lowerTeScore && upperTeScore ? `${lowerTeScore} - ${upperTeScore}` : teScore, // Pass calculated TE score range or single value
        chartContainerElement: chartContainerRef.current, // Pass the chart container element
        explanatoryText,
        imagePath
      };

      // Call the export service
      const success = await exportService.generateSetPlanPdf(pdfData);

      if (!success) {
        console.error("PDF generation failed (reported by exportService).");
        // Optionally show a user-facing error message here
      } else {
        console.log("PDF generated and downloaded successfully (via exportService).");
      }
    } catch (error) {
      // Catch potential errors from the service call itself (e.g., network errors if service was remote)
      console.error("Error calling exportService for PDF generation:", error);
      // Optionally show a user-facing error message here
    } finally {
      setIsPrinting(false);
      console.log("Print process finished in component.");
    }
  };

  const handleClearAll = useCallback(() => {
    clearSubjectsAndResults();
  }, [clearSubjectsAndResults]);

  // Function to get formatted scaled score for display
  const getFormattedScaledScore = useCallback((row: SubjectRow): string | null => {
    // Pass necessary data to the service function (without subjectType)
    return setPlanCalculationService.formatDisplayScaledScore(
      row,
      scaledScoresMap,       // The calculated scores map
      subjectMappingService // The subject mapping service instance
    );
  }, [scaledScoresMap]);

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto p-4">
        {loadingError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
            <strong className="font-bold">Error:</strong> <span className="block sm:inline"> {loadingError}</span>
          </div>
        )}

        <div className="flex items-center justify-between bg-white rounded-lg shadow-sm p-3 border border-gray-200 mb-3">
          <div className="flex-grow">
            <p className="text-md text-gray-700">
              Imagine a class of 100 students from across QLD who have selected the same subject.<br />
              Where would you place yourself?
            </p>
            <img 
              src="/images/single_student_mock_up.png" 
              alt="SET Plan ATAR Calculator Ruler" 
              className="max-w-full mt-2" 
              style={{ maxHeight: "80px", maxWidth: "66%" }}
            />
          </div>
          
          <div className="flex items-end ml-4">
            <ActionButtonsBar
              isPrinting={isPrinting}
              isCohortExporting={false}
              isScalingDataLoaded={isScalingDataLoaded && isPlanDataLoaded}
              hasCohortData={false}
              loadingError={loadingError}
              onPrint={handlePrint}
              onExport={() => {}} // Empty function as this button is hidden
              onClear={handleClearAll}
              hideExport={true}
            />
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-4">
          <div className="lg:w-3/5 flex flex-col gap-4">
            <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
              <SETPlanSubjectTable
                subjectRows={subjectRows}
                scaledScoresMap={scaledScoresMap}
                allSubjects={allSubjects}
                onAddRow={handleAddRow}
                onDeleteRow={handleDeleteRow}
                onSubjectChange={handleSubjectChange}
                onRankChange={handleRankChange}
                getFormattedScaledScore={getFormattedScaledScore}
              />
            </div>
          </div>

          <div className="lg:w-2/5 flex flex-col gap-4">
            {(teScore !== null || atar !== null) && (
              <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">TE Range:</span>
                    <span className="font-semibold text-right">
                      {lowerTeScore && upperTeScore && teScore !== 'ATAR Ineligible' && teScore !== '-'
                        ? `${lowerTeScore} - ${upperTeScore}`
                        : teScore ?? 'N/A'
                      }
                    </span>
                  </div>
                  
                  <div className="border-t border-gray-200 pt-2"></div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">ATAR Range:</span>
                    <span className="font-semibold text-right">
                      {atarRange && atarRange !== '-' && atarRange !== 'ATAR Ineligible'
                        ? (() => {
                            // Extract just the lower and upper values from the ATAR range
                            const parts = atarRange.split(' - ');
                            if (parts.length === 3) {
                              // If format is "lower - middle - upper", return "lower - upper"
                              return `${parts[0]} - ${parts[2]}`;
                            }
                            return atarRange; // Return as is if not in expected format
                          })()
                        : atar !== null ? String(atar) : 'N/A'
                      }
                    </span>
                  </div>
                </div>
              </div>
            )}
            
            <div className="bg-white rounded-lg shadow-sm p-2 border border-gray-200">
              <ScaledScoreChartContainer
                subjectRows={subjectRows}
                rangeMode={true}
                isScalingDataLoaded={isScalingDataLoaded}
                loadingError={loadingError}
                scalingDataError={scalingDataError}
                subjectMappingService={subjectMappingService}
                chartRef={chartContainerRef}
                skipMiddleValue={true}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SETPlanCalculator; 