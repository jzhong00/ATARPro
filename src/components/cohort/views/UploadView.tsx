// ATAR Calculator – Greenfield architecture: follow utils/services/components separation and avoid legacy patterns.

import { useCallback, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { setLoading, setCohortData, setError, setView } from '../../../store/slices/cohortSlice';
import { parseFile } from '../../../services/dataLoader';

const UploadView = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = useCallback(async (file: File) => {
    dispatch(setLoading(true));
    try {
      const data = await parseFile(file);
      dispatch(setCohortData(data));
      dispatch(setView('results'));
      navigate('/cohort/results'); // Navigate to results view after successful upload
    } catch (error) {
      dispatch(setError(error instanceof Error ? error.message : 'Failed to parse file'));
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch, navigate]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  }, [handleFile]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  }, [handleFile]);

  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Import Student Data</h2>
      <p className="text-gray-600 mb-6">
        Import an Excel file containing student results data.
      </p>
      <p className="text-gray-600 mb-6">
        <strong>Important:</strong> To avoid errors, please use the provided format.{' '}
        <a 
          href="/Student_data_template.xlsx" // Path relative to the public folder - Corrected Case
          download="student_data_template.xlsx" // Suggested filename for download
          className="text-blue-600 hover:text-blue-800 underline font-semibold"
        >
          Download the required Excel template here.
        </a>
      </p>

      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center ${
          isDragging
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-blue-500'
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        <div className="mb-4">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            stroke="currentColor"
            fill="none"
            viewBox="0 0 48 48"
            aria-hidden="true"
          >
            <path
              d="M24 8l8 16H16l8-16zm0 32l-8-16h16l-8 16z"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <p className="text-gray-600 mb-2">
          Drag and drop your file here, or
        </p>
        <label className="inline-block">
          <span className="bg-blue-600 text-white px-4 py-2 rounded cursor-pointer hover:bg-blue-700">
            Choose File
          </span>
          <input
            type="file"
            className="hidden"
            accept=".xlsx,.xls"
            onChange={handleFileInput}
          />
        </label>
      </div>

      {/* Privacy Information Box */}
      <div className="mt-4 text-center text-xs text-gray-500 p-3 bg-gray-50 rounded-lg border border-gray-200">
         <strong>Data Privacy:</strong> Good news! Your file is processed locally in your browser. 
        Student names, subjects, and results are <strong>never</strong> uploaded to our servers. 
        All calculations happen on your computer.
      </div>
    </div>
  );
};

export default UploadView; 