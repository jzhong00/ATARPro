import React, { useMemo, useRef } from 'react';
import { prepareChartData } from '../../utils/calculatorUtils';
import { ScaledScoreChart } from './ScaledScoreChart';
import type { SubjectRow } from '../../types/calculator';
import type { SubjectMapping } from '../../services/subjectMappingService';

interface ScaledScoreChartContainerProps {
  subjectRows: SubjectRow[];
  rangeMode: boolean;
  isScalingDataLoaded: boolean;
  loadingError: string | null;
  scalingDataError: string | null;
  subjectMappingService: {
    getMappingByDisplayName: (name: string) => SubjectMapping | undefined;
  };
  // Ref forwarding to allow parent component to access the chart container
  chartRef?: React.Ref<HTMLDivElement>;
  // Flag to skip using middle value (used in SET Plan calculator)
  skipMiddleValue?: boolean;
}

const ScaledScoreChartContainer: React.FC<ScaledScoreChartContainerProps> = ({
  subjectRows,
  rangeMode,
  isScalingDataLoaded,
  loadingError,
  scalingDataError,
  subjectMappingService,
  chartRef,
  skipMiddleValue = false
}) => {
  // Internal ref if no ref is provided by the parent
  const internalChartRef = useRef<HTMLDivElement>(null);
  const effectiveRef = chartRef || internalChartRef;

  // Data Preparation for Chart
  const { chartData, xAxisMin, xAxisMax } = useMemo(() => {
    if (!isScalingDataLoaded) {
      // Include default xAxisMax
      return { chartData: [], xAxisMin: 0, xAxisMax: 100 };
    }
    // Use the extracted chart data preparation function
    return prepareChartData(subjectRows, rangeMode, subjectMappingService, skipMiddleValue);
  }, [subjectRows, rangeMode, isScalingDataLoaded, subjectMappingService, skipMiddleValue]);

  // Render the chart component or error/loading states
  return (
    <>
      <div className="bg-white rounded-lg shadow-md p-2 min-h-96">
        {/* REMOVED Title */}
        {/* <h3 className="text-base font-medium text-gray-700 mb-2 text-center">Scaled Score Distribution</h3> */}
        {loadingError || scalingDataError ? (
          <div className="text-center text-red-600 py-10 min-h-72 flex items-center justify-center">
            Error: Could not load necessary data for the chart. ({loadingError || scalingDataError})
          </div>
        ) : !subjectRows.some(row => row.subject && (row.rawResult || rangeMode)) ? (
          <div className="text-center text-gray-500 py-10 min-h-72 flex items-center justify-center">
            Enter subject results to view the scaled score chart.
          </div>
        ) : (
          <div ref={effectiveRef} className="min-h-72 relative">
            {isScalingDataLoaded ? (
              <ScaledScoreChart
                chartData={chartData}
                rangeMode={rangeMode}
                xAxisMin={xAxisMin}
                xAxisMax={xAxisMax}
                skipMiddleValue={skipMiddleValue}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-center text-gray-500">
                <p>Loading scaling data for chart...</p>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default ScaledScoreChartContainer; 