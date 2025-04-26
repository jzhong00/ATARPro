import React from 'react';

interface ActionButtonsBarProps {
  isPrinting: boolean;
  isCohortExporting: boolean;
  isScalingDataLoaded: boolean;
  hasCohortData: boolean;
  loadingError: string | null;
  onPrint: () => void;
  onExport: () => void;
  onClear: () => void;
  hideExport?: boolean;
  isGuestMode?: boolean;
  hasValidData?: boolean;
}

/**
 * Component for the top action buttons in the calculator
 */
const ActionButtonsBar: React.FC<ActionButtonsBarProps> = ({
  isPrinting,
  isCohortExporting,
  isScalingDataLoaded,
  hasCohortData,
  loadingError,
  onPrint,
  onExport,
  onClear,
  hideExport = false,
  isGuestMode = false,
  hasValidData = false
}) => {
  return (
    <div className="flex items-center space-x-2">
      {/* Print Button - Conditionally render based on isGuestMode */}
      {!isGuestMode && (
        <button
          onClick={onPrint}
          disabled={isPrinting || isCohortExporting || !isScalingDataLoaded || loadingError !== null || !hasValidData}
          className={`px-4 py-2 text-sm font-medium rounded-md shadow-sm text-white bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 ${
            (isPrinting || isCohortExporting || !isScalingDataLoaded || loadingError !== null || !hasValidData)
              ? 'opacity-50 cursor-not-allowed'
              : 'hover:bg-green-700'
          }`}
          title={loadingError ? "Cannot print due to loading error" : (!isScalingDataLoaded ? "Scaling data not loaded" : (!hasValidData ? "Enter subject data to enable printing" : (isPrinting ? "Printing..." : (isCohortExporting ? "Cohort export running..." : "Print single report"))))}
        >
          {isPrinting ? 'Generating...' : 'Print'}
        </button>
      )}
      
      {/* Cohort Export Button - only show if not hidden AND not in guest mode */}
      {!hideExport && !isGuestMode && (
        <button
          onClick={onExport}
          disabled={isCohortExporting || isPrinting || !hasCohortData || !isScalingDataLoaded || loadingError !== null}
          className={`px-4 py-2 text-sm font-medium rounded-md shadow-sm text-white bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 ${
            (isCohortExporting || isPrinting || !hasCohortData || !isScalingDataLoaded || loadingError !== null)
              ? 'opacity-50 cursor-not-allowed'
              : 'hover:bg-green-700'
          }`}
          title={loadingError ? "Cannot export due to loading error" : (!isScalingDataLoaded ? "Scaling data not loaded" : (!hasCohortData ? "No cohort data loaded" : (isCohortExporting ? "Exporting cohort..." : (isPrinting ? "Single print running..." : "Print PDFs for all students"))))}
        >
          {isCohortExporting ? 'Exporting Cohort...' : 'Export Cohort PDFs'}
        </button>
      )}
      
      <button
        onClick={onClear}
        disabled={isCohortExporting || isPrinting}
        className={`px-4 py-2 text-sm font-medium rounded-md shadow-sm text-white bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 ${
          (isCohortExporting || isPrinting) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-red-700'
        }`}
      >
        Clear
      </button>
    </div>
  );
};

export default ActionButtonsBar;