import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store'; // Adjust path as needed
import { exportToCsv } from '../../utils/csvExporter'; // Adjust path as needed

const DownloadCsvButton: React.FC = () => {
  // Select the necessary data from the Redux store
  const { columns, data, filename } = useSelector((state: RootState) => state.downloadableData);

  const handleDownload = () => {
    // Call the export utility with the data from Redux
    exportToCsv(filename, columns, data);
  };

  // Determine if the button should be disabled (no data to export)
  const isDisabled = data.length === 0;

  return (
    <button
      onClick={handleDownload}
      disabled={isDisabled}
      className={`px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 ml-3 ${isDisabled
          ? 'opacity-50 cursor-not-allowed'
          : 'hover:bg-green-700'
        }`}
      aria-label="Download current table data as CSV"
    >
      Download CSV
    </button>
  );
};

export default DownloadCsvButton; 