import { useNavigate, useLocation } from 'react-router-dom';
// ATAR Calculator – Greenfield architecture: follow utils/services/components separation and avoid legacy patterns.
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store';

// Services
import subjectMappingService from '../../services/subjectMappingService';

// Utils
import { preparePdfSubjectData } from '../../utils/calculatorUtils';
import { generateStudentPDF } from '../../utils/exportUtils';

// Custom Hooks
import { useSubjectRows } from '../../hooks/useSubjectRows';
import { useStudentSearch } from '../../hooks/useStudentSearch';
import { useExportModals } from '../../hooks/useExportModals';
import { useCohortExport } from '../../hooks/useCohortExport';
import { useTeAtarCalculator } from '../../hooks/useTeAtarCalculator';
import { useSubjectMappingLoader } from '../../hooks/useSubjectMappingLoader';

// UI Components
import { ScaledScoreChart } from './ScaledScoreChart';
import ScaledScoreChartContainer from './ScaledScoreChartContainer';
import ConfirmationModal from '../common/ConfirmationModal';
import ActionButtonsBar from './panels/ActionButtonsBar';
// import ControlsPanel from './panels/ControlsPanel'; // Removed unused ControlsPanel
import SubjectTable from './panels/SubjectTable';
// import ResultsPanel from './panels/ResultsPanel'; // Removed unused ResultsPanel
import ProgressDisplay from '../common/ProgressDisplay';

/**
 * Single Student Calculator component
 * Handles calculating ATAR and TE scores for a single student or manual entry
 */
const SingleStudentCalculator = ({ isGuestMode = false }: { isGuestMode?: boolean }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const preloadingStudentRef = useRef<string | null>(null);

  // Get cohort data from Redux
  const cohortData = useSelector((state: RootState) => state.cohort.data);
  const resultVariation = useSelector((state: RootState) => state.cohort.filters.resultVariation);

  const [rangeMode, setRangeMode] = useState(false);
  const [rangeValue, setRangeValue] = useState<number | null>(3);
  
  const {
    allSubjects,
    loadingError,
    isScalingDataLoaded,
    scalingDataError
  } = useSubjectMappingLoader();
  
  const {
    subjectRows,
    handleAddRow,
    handleDeleteRow,
    handleSubjectChange: handleSubjectChangeBase,
    handleResultChange: handleResultChangeBase,
    handleLowerResultChange: handleLowerResultChangeBase,
    handleUpperResultChange: handleUpperResultChangeBase,
    handleQuickRangeApply,
    resetSubjectRows,
    setRowsFromData
  } = useSubjectRows(6);
  
  // Determine which selected subjects have an asterisk in their display name
  const warningSubjects = useMemo(() => {
    if (!allSubjects || allSubjects.length === 0) {
      return []; // No subjects loaded, so no warnings
    }
    // Find all rows where the selected subject's display name includes '*'
    const subjectsWithWarning = subjectRows.filter(row => {
      if (!row.subject) {
        return false; // Skip rows without a selected subject name
      }
      
      // The name stored in the row might have an asterisk, remove it for lookup
      const lookupName = row.subject.replace('*', ''); 
      
      // Find the full subject details using the potentially stripped name
      const subjectDetails = allSubjects.find(s => s.Subject_name === lookupName);
      
      // Now check if the *actual* display name for this subject includes an asterisk
      return subjectDetails?.Subject_display?.includes('*') ?? false; 
    });

    // Return the display names of those subjects
    return subjectsWithWarning.map(row => {
      // Ensure subject name exists before processing
      if (!row.subject) return ''; // Should not happen due to filter, but satisfy TS
      // Find the details again to get the exact display name
      const lookupName = row.subject.replace('*', '');
      const subjectDetails = allSubjects.find(s => s.Subject_name === lookupName);
      return subjectDetails?.Subject_display || row.subject; // Fallback to row.subject if details somehow not found
    }).filter(name => name !== ''); // Filter out any empty strings added by the safety check

  }, [subjectRows, allSubjects]); // Dependencies: recalculate when rows or subjects change
  
  // Wrapper functions to provide subjectMappingService
  const handleSubjectChange = useCallback((idToUpdate: string, inputValue: string | null) => {
    handleSubjectChangeBase(idToUpdate, inputValue, subjectMappingService);
  }, [handleSubjectChangeBase]);
  
  const handleResultChange = useCallback((idToUpdate: string, newResult: string | null) => {
    handleResultChangeBase(idToUpdate, newResult, subjectMappingService);
  }, [handleResultChangeBase]);
  
  const handleLowerResultChange = useCallback((idToUpdate: string, newLowerResult: string | null) => {
    handleLowerResultChangeBase(idToUpdate, newLowerResult, subjectMappingService);
  }, [handleLowerResultChangeBase]);
  
  const handleUpperResultChange = useCallback((idToUpdate: string, newUpperResult: string | null) => {
    handleUpperResultChangeBase(idToUpdate, newUpperResult, subjectMappingService);
  }, [handleUpperResultChangeBase]);
  
  const [isPrinting, setIsPrinting] = useState(false);
  
  const {
    teScore,
    atar,
    scaledScoresMap,
    lowerTeScore,
    upperTeScore,
    atarRange
  } = useTeAtarCalculator(subjectRows, isScalingDataLoaded);
  
  const clearSubjectsAndResults = useCallback(() => {
    resetSubjectRows();
  }, [resetSubjectRows]);
  
  const {
    studentSearchQuery,
    selectedStudentName,
    suggestions,
    showSuggestions,
    activeSuggestionIndex,
    handleSearchInputChange,
    handleSuggestionClick,
    handleSearchKeyDown,
    handleImportStudentData,
    clearSearchState
  } = useStudentSearch({
    students: isGuestMode ? undefined : cohortData?.students,
    resultVariation,
    subjectMappingService,
    searchContainerRef,
    onStudentImport: setRowsFromData,
    onClearResults: clearSubjectsAndResults
  });
  
  const {
    isCohortExporting,
    exportProgressMessage,
    exportHasFinished,
    exportTriggeredRef,
    executeCohortExport,
    handleCohortExportRequest
  } = useCohortExport({
    students: isGuestMode ? undefined : cohortData?.students,
    resultVariation,
    ChartComponent: ScaledScoreChart,
    subjectMappingService,
    isScalingDataLoaded
  });

  const {
    isRangeModalOpen,
    isConfirmModalOpen,
    handleRangeModeSelection,
    handleFinalConfirmation,
    handleCancelExport,
    initiateExport,
    setIsRangeModalOpen
  } = useExportModals({
    onExecuteExport: executeCohortExport
  });

  const handleCohortExport = useCallback(() => {
    handleCohortExportRequest(initiateExport);
  }, [handleCohortExportRequest, initiateExport]);

  // Effect to handle automatic cohort export trigger from URL
  useEffect(() => {
    if (isGuestMode) return; // Disable for guest mode
    const params = new URLSearchParams(location.search);
    const triggerExport = params.get('triggerExport') === 'true';

    if (
      triggerExport &&
      isScalingDataLoaded &&
      cohortData &&
      !exportTriggeredRef.current
    ) {
      console.log('Triggering cohort export from URL parameter...');
      exportTriggeredRef.current = true;
      handleCohortExport();
      navigate('/student', { replace: true });
    }
  }, [location.search, isScalingDataLoaded, cohortData, handleCohortExport, navigate, exportTriggeredRef]);

  // Effect to handle automatic student preload from URL
  useEffect(() => {
    if (isGuestMode) return; // Disable for guest mode
    const params = new URLSearchParams(location.search);
    const preloadStudent = params.get('preloadStudent');
    
    if (
      preloadStudent && 
      cohortData?.students && 
      isScalingDataLoaded && 
      !selectedStudentName &&
      preloadingStudentRef.current !== preloadStudent
    ) {
      const decodedName = decodeURIComponent(preloadStudent);
      console.log(`Preloading student: ${decodedName}`);
      
      // Check if student exists in cohort data
      const studentExists = cohortData.students.some(s => s.name === decodedName);
      
      if (studentExists) {
        console.log(`Student found in cohort data, setting selected student: ${decodedName}`);
        // Set ref to prevent duplicate processing
        preloadingStudentRef.current = preloadStudent;
        // Just set the search value, import will happen in the effect below
        handleSuggestionClick(decodedName);
      } else {
        console.error(`Student "${decodedName}" not found in cohort data.`);
        // Clear URL parameter if student not found
        navigate('/student', { replace: true });
      }
    }
  }, [
    location.search, 
    cohortData?.students, 
    isScalingDataLoaded, 
    selectedStudentName, 
    handleSuggestionClick, 
    navigate
  ]);

  // Effect to handle import after selectedStudentName is updated
  useEffect(() => {
    // If we have a selected student name and it matches what we're preloading
    if (
      selectedStudentName && 
      preloadingStudentRef.current && 
      decodeURIComponent(preloadingStudentRef.current) === selectedStudentName
    ) {
      console.log(`Selected student name set, importing data for: ${selectedStudentName}`);
      
      // Give a tiny delay just to be safe
      setTimeout(() => {
        handleImportStudentData();
        // Clear URL parameter and ref after import
        navigate('/student', { replace: true });
        preloadingStudentRef.current = null;
        console.log('Student data import completed');
      }, 50);
    }
  }, [selectedStudentName, handleImportStudentData, navigate]);

  const onQuickRangeApply = () => {
    const currentRange = rangeValue ?? 0;
    handleQuickRangeApply(currentRange);
  };

  /**
   * Handles PDF generation and download
   */
  const handlePrint = async () => {
    if (isPrinting) return;

    setIsPrinting(true);
    console.log("Print process started...");

    try {
      const pdfStudentName = selectedStudentName || '';
      const pdfSubjectResults = preparePdfSubjectData(subjectRows, scaledScoresMap, rangeMode);
      
      // Construct warning text if needed
      const warningText = warningSubjects.length > 0 
        ? `Note: ${warningSubjects.join(', ')} scaling data is not available. Instead, the average of all subjects scaling data has been applied to this subject. This will decrease the accuracy of this ATAR calculation.`
        : null;

      const success = await generateStudentPDF(
        pdfStudentName,
        pdfSubjectResults,
        rangeMode,
        atar,
        teScore,
        warningText, // Pass warning text directly
        chartContainerRef.current
        // Note: Options object would go here if used
      );
      
      if (success) {
        console.log("PDF generated successfully.");
      } else {
        console.error("PDF generation failed.");
      }
    } catch (error) {
      console.error("Error during PDF generation:", error);
    } finally {
      setIsPrinting(false);
      console.log("Print process finished.");
    }
  };

  /**
   * Clears all subject rows, results, and search state.
   */
  const handleClearAll = useCallback(() => {
    clearSubjectsAndResults();
    if (!isGuestMode) {
      clearSearchState();
    }
  }, [clearSubjectsAndResults, clearSearchState, isGuestMode]);

  // Restore Render Logic checks
  if (loadingError || scalingDataError) {
    return <div className="error-message">Error loading necessary data. Please try refreshing the page.</div>;
  }

  if (!isScalingDataLoaded) {
    return <div>Loading scaling data...</div>;
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto p-2 xl:p-4">
        {exportProgressMessage && (
          <ProgressDisplay 
            progressMessage={exportProgressMessage} 
            hasFinished={exportHasFinished} 
          />
        )}

        {loadingError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
            <strong className="font-bold">Error:</strong> <span className="block sm:inline"> {loadingError}</span>
          </div>
        )}

        {!isGuestMode && (
          <div className="flex items-center justify-between bg-white rounded-lg shadow-sm p-1.5 xl:p-3 border border-gray-200 mb-3">
            <div className="flex-grow" ref={searchContainerRef}>
              <div className="flex items-center">
                <div className="relative w-3/4 mr-2">
                  <input
                    type="text"
                    placeholder="Search student..."
                    value={studentSearchQuery}
                    onChange={handleSearchInputChange}
                    onKeyDown={handleSearchKeyDown}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    disabled={!cohortData?.students?.length}
                  />
                  {showSuggestions && suggestions.length > 0 && (
                    <ul className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                      {suggestions.map((suggestion, index) => (
                        <li
                          key={suggestion}
                          onClick={() => handleSuggestionClick(suggestion)}
                          className={`cursor-default select-none relative py-2 pl-3 pr-9 ${
                            index === activeSuggestionIndex
                              ? 'text-white bg-blue-600'
                              : 'text-gray-900'
                          }`}
                        >
                          {suggestion}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                
                {selectedStudentName && (
                  <div className="ml-2">
                    <button
                      onClick={handleImportStudentData}
                      className="px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Import
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-end">
              <ActionButtonsBar
                onPrint={handlePrint}
                onExport={handleCohortExport}
                isPrinting={isPrinting}
                isCohortExporting={isCohortExporting}
                isScalingDataLoaded={isScalingDataLoaded}
                hasCohortData={!!cohortData?.students?.length}
                loadingError={loadingError || scalingDataError}
                onClear={handleClearAll}
                isGuestMode={isGuestMode}
              />
            </div>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-2 xl:gap-4">
          <div className="lg:w-3/5 flex flex-col gap-2 xl:gap-4">
            <div className="bg-white rounded-lg shadow-sm p-2 xl:p-4 border border-gray-200 flex flex-col flex-1">
              {/* Conditionally render the Range Mode controls section */} 
              {!isGuestMode && (
                <div className="mb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 bg-blue-50 px-3 py-2 rounded border border-blue-100 hover:bg-blue-100 transition-colors mb-2 sm:mb-0">
                      <input
                        type="checkbox"
                        checked={rangeMode}
                        onChange={(e) => setRangeMode(e.target.checked)}
                        className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                      />
                      <span>Select Range Mode</span>
                    </label>
                  </div>

                  {rangeMode && (
                    <div className="flex items-center">
                      <label className="text-sm font-medium text-gray-700 mr-2">
                        Quick Range
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={rangeValue || ''}
                        onChange={(e) => setRangeValue(parseInt(e.target.value) || null)}
                        className="w-16 px-3 py-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 mr-2"
                      />
                      <button
                        onClick={onQuickRangeApply}
                        className="px-3 py-1 bg-blue-600 text-white text-sm font-medium rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        disabled={!rangeValue || rangeValue < 1 || rangeValue > 10}
                      >
                        Apply
                      </button>
                    </div>
                  )}
                </div>
              )}
              
              <div className="flex-1 min-h-0">
                <SubjectTable
                  subjectRows={subjectRows}
                  rangeMode={rangeMode}
                  scaledScoresMap={scaledScoresMap}
                  allSubjects={allSubjects}
                  onAddRow={handleAddRow}
                  onDeleteRow={handleDeleteRow}
                  onSubjectChange={handleSubjectChange}
                  onResultChange={handleResultChange}
                  onLowerResultChange={handleLowerResultChange}
                  onUpperResultChange={handleUpperResultChange}
                />
              </div>
            </div>

            {/* Conditionally rendered Warning Container */}
            {warningSubjects.length > 0 && (
              <div 
                className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-2 xl:p-4 rounded-md shadow-sm" 
                role="alert"
              >
                <p className="font-semibold">Note:</p>
                <p>
                  {warningSubjects.join(', ')} scaling data is not available. 
                  Instead, the average of all subjects scaling data has been applied to this subject. 
                  This will decrease the accuracy of this ATAR calculation.
                </p>
              </div>
            )}
          </div>

          <div className="lg:w-2/5 flex flex-col gap-2 xl:gap-4">
            {(teScore !== null || atar !== null || lowerTeScore !== null || upperTeScore !== null || atarRange !== null) && (
              <div className="bg-white rounded-xl shadow-sm p-2 xl:p-4 border border-gray-200">
                <div className="space-y-2 text-sm xl:text-base">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">
                      {rangeMode ? 'TE Score Range:' : 'TE Score:'}
                    </span>
                    <span className="font-semibold text-right">
                      {rangeMode 
                        ? `${lowerTeScore ?? '-'} - ${teScore ?? '-'} - ${upperTeScore ?? '-'}` 
                        : (teScore ?? 'N/A')}
                    </span>
                  </div>
                  
                  <div className="border-t border-gray-200 pt-2"></div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">
                      {rangeMode ? 'ATAR Range:' : 'ATAR:'}
                    </span>
                    <span className="font-semibold text-right">
                      {rangeMode 
                        ? (atarRange ?? 'N/A') 
                        : (atar !== null ? String(atar) : 'N/A')}
                    </span>
                  </div>
                </div>
              </div>
            )}
            
            {/* Chart Container - Conditionally render based on isGuestMode */}
            {!isGuestMode && (
              <div className="bg-white rounded-lg shadow-sm p-1.5 xl:p-3 border border-gray-200 flex flex-col flex-1">
                <ScaledScoreChartContainer
                  subjectRows={subjectRows}
                  rangeMode={rangeMode}
                  isScalingDataLoaded={isScalingDataLoaded}
                  loadingError={loadingError}
                  scalingDataError={scalingDataError}
                  subjectMappingService={subjectMappingService}
                  chartRef={chartContainerRef}
                />
              </div>
            )}
            {/* Guest Mode Promo Container */}
            {isGuestMode && (
              <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg shadow-md p-3 xl:p-6 border border-blue-200 text-center flex flex-col flex-1">
                <h3 className="text-base md:text-lg xl:text-xl font-semibold text-gray-800 mb-3">Unlock Advanced Features</h3>
                <p className="text-gray-600 mb-4 text-sm xl:text-base">
                  Are you a school leader or educator? Subscribe to access powerful tools for in-depth ATAR analysis and student planning:
                </p>
                <ul className="list-disc list-inside text-left text-gray-600 mb-5 space-y-1 pl-4 text-sm xl:text-base">
                  <li>Search and import individual student results.</li>
                  <li>Utilize Range Mode for prediction variations.</li>
                  <li>Print individual student reports with scaled score charts.</li>
                  <li>Export full cohort results and charts to PDF.</li>
                  <li>Visualize scaled score distributions.</li>
                  <li>Access SET Plan and Equivalent calculators.</li> 
                </ul>
                <button 
                  onClick={() => navigate('/')}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg shadow transition duration-300 ease-in-out transform hover:-translate-y-1"
                >
                  Learn More
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmationModal
        isOpen={isRangeModalOpen}
        onClose={() => setIsRangeModalOpen(false)}
        title="Select Export Mode"
        message="Would you like to print in Ranged Mode?"
        buttons={[
          {
            text: 'Yes, Ranged Mode',
            onClick: () => handleRangeModeSelection(true),
            styleClass: 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500',
          },
          {
            text: 'No, Single Result Only',
            onClick: () => handleRangeModeSelection(false),
            styleClass: 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500',
          },
        ]}
      />

      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={handleCancelExport}
        title="Confirm Export"
        message="Printing a full cohort can take a few minutes. Proceed?"
        buttons={[
          {
            text: 'Cancel',
            onClick: handleCancelExport,
            styleClass: 'bg-gray-500 hover:bg-gray-600 text-white focus:ring-gray-400',
          },
          {
            text: 'Proceed',
            onClick: handleFinalConfirmation,
            styleClass: 'bg-green-600 hover:bg-green-700 text-white focus:ring-green-500',
          },
        ]}
      />
    </div>
  );
};

export default SingleStudentCalculator;