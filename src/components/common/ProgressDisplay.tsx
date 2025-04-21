import React from 'react';

interface ProgressDisplayProps {
  progressMessage: string | null;
  hasFinished: boolean;
}

/**
 * Component to display progress messages for export operations
 */
const ProgressDisplay: React.FC<ProgressDisplayProps> = ({ 
  progressMessage, 
  hasFinished 
}) => {
  if (!progressMessage) {
    return null; // Don't render if no message
  }

  const isError = progressMessage.includes('Error') || progressMessage.includes('error');
  
  const bgColorClass = hasFinished 
    ? (isError ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700') 
    : 'bg-blue-100 text-blue-700';

  return (
    <div className={`p-2 mb-4 rounded text-sm text-center ${bgColorClass}`}>
      {progressMessage}
    </div>
  );
};

export default ProgressDisplay; 