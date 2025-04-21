import React from 'react';

interface ResultsPanelProps {
  teScore: string | null;
  atar: string | number | null;
  rangeMode: boolean;
}

/**
 * Component to display TE and ATAR calculation results
 */
const ResultsPanel: React.FC<ResultsPanelProps> = ({ teScore, atar, rangeMode }) => {
  if (teScore === null && atar === null) {
    return null; // Don't render anything if no results
  }

  // Format atar to string for display
  const formatAtar = (value: string | number | null): string => {
    if (value === null) return 'N/A';
    return String(value);
  };

  return (
    <div className="p-6 bg-blue-50 rounded-lg shadow-md border border-blue-100">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-lg font-semibold text-gray-700">{rangeMode ? 'TE Range' : 'TE'}</span>
          <span className="text-2xl font-bold text-blue-800">{teScore ?? 'N/A'}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-lg font-semibold text-gray-700">{rangeMode ? 'ATAR Range' : 'ATAR'}</span>
          <span className="text-2xl font-bold text-blue-800">{formatAtar(atar)}</span>
        </div>
      </div>
    </div>
  );
};

export default ResultsPanel; 