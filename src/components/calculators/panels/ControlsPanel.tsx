import React, { RefObject } from 'react';

interface ControlsPanelProps {
  rangeMode: boolean;
  rangeValue: number | null;
  onRangeModeChange: (value: boolean) => void;
  onRangeValueChange: (value: number | null) => void;
  onQuickRangeApply: () => void;
  isGuestMode?: boolean;
  // Student search props
  searchContainerRef: RefObject<HTMLDivElement>;
  studentSearchQuery: string;
  selectedStudentName: string | null;
  suggestions: string[];
  showSuggestions: boolean;
  activeSuggestionIndex: number;
  hasCohortData: boolean;
  onSearchInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSearchKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onSuggestionClick: (suggestion: string) => void;
  onImportStudentData: () => void;
}

/**
 * Component for the range mode controls and student search
 */
const ControlsPanel: React.FC<ControlsPanelProps> = ({
  rangeMode,
  rangeValue,
  onRangeModeChange,
  onRangeValueChange,
  onQuickRangeApply,
  isGuestMode = false,
  searchContainerRef,
  studentSearchQuery,
  selectedStudentName,
  suggestions,
  showSuggestions,
  activeSuggestionIndex,
  hasCohortData,
  onSearchInputChange,
  onSearchKeyDown,
  onSuggestionClick,
  onImportStudentData
}) => {
  return (
    <div className="bg-gray-50 rounded-lg shadow-sm p-4 mb-6 flex items-center justify-between flex-wrap gap-4">
      {!isGuestMode && (
        <div className="flex items-center space-x-4">
          <label htmlFor="rangeMode" className="flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              id="rangeMode" 
              className="form-checkbox h-5 w-5 text-blue-600" 
              checked={rangeMode} 
              onChange={(e) => onRangeModeChange(e.target.checked)} 
            />
            <span className="ml-2 text-gray-700">Range Mode</span>
          </label>
          {rangeMode && (
            <div className="flex items-center">
              <label htmlFor="rangeInput" className="text-sm text-gray-600 mr-2">Range (±):</label>
              <input
                type="number"
                id="rangeInput"
                min="0"
                max="10"
                value={rangeValue === null ? '' : rangeValue}
                onChange={(e) => {
                  const val = e.target.value ? parseInt(e.target.value, 10) : null;
                  onRangeValueChange(val);
                }}
                className="w-16 p-2 border border-gray-300 rounded text-center"
              />
              <button
                onClick={onQuickRangeApply}
                className="ml-2 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
              >
                Apply
              </button>
            </div>
          )}
        </div>
      )}
      
      <div ref={searchContainerRef} className="relative flex-grow max-w-md">
        <div className="flex items-center">
          <input
            type="text"
            placeholder={
              !hasCohortData
                ? "Upload cohort data to enable search"
                : "Start typing student name..."
            }
            value={studentSearchQuery}
            onChange={onSearchInputChange}
            onKeyDown={onSearchKeyDown}
            className="block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 flex-grow"
            autoComplete="off"
            disabled={!hasCohortData}
          />
          {selectedStudentName && (
            <button
              type="button"
              onClick={onImportStudentData}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex-shrink-0"
            >
              Import
            </button>
          )}
        </div>
        {/* Suggestions List */}
        {showSuggestions && suggestions.length > 0 && (
          <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
            {suggestions.map((suggestion, index) => (
              <li
                key={suggestion}
                onClick={() => onSuggestionClick(suggestion)}
                className={`px-4 py-2 cursor-pointer hover:bg-blue-100 ${
                  index === activeSuggestionIndex ? 'bg-blue-100' : ''
                }`}
              >
                {suggestion}
              </li>
            ))}
          </ul>
        )}
        {!hasCohortData && (
          <p className="mt-1 text-xs text-gray-500">Upload cohort data first to enable search.</p>
        )}
      </div>
    </div>
  );
};

export default ControlsPanel; 