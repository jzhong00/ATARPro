import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect, useMemo, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import { addSelectedStudent, removeSelectedStudent, clearData } from '../../store/slices/cohortSlice';
import CohortTabs from '../cohort/CohortTabs';
import UploadView from '../cohort/views/UploadView';
import ResultsTableView from '../cohort/views/ResultsTableView';
import RangedResultsView from '../cohort/views/RangedResultsView';
import AtarsView from '../cohort/views/AtarsView';
import RangedAtarsView from '../cohort/views/RangedAtarsView';
import SchoolSummaryView from '../cohort/views/SchoolSummaryView';
import subjectMappingService from '../../services/subjectMappingService';
import ResultVariationInput from '../cohort/ResultVariationInput';
import DownloadCsvButton from '../cohort/DownloadCsvButton';
import { loadScalingData } from '../../utils/scaling';

// Placeholder components for other views - Removed unused placeholders
// const StudentRangedResultsView = () => <div>Student Ranged Results View</div>;
// const StudentATARsView = () => <div>Student ATARs View</div>;
// const StudentRangedATARsView = () => <div>Student Ranged ATARs View</div>;

const CohortCalculator = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const [mappingsLoaded, setMappingsLoaded] = useState(false);
  const [mappingError, setMappingError] = useState<string | null>(null);
  const [isScalingDataLoaded, setIsScalingDataLoaded] = useState<boolean>(false);
  const [scalingDataError, setScalingDataError] = useState<string | null>(null);

  const selectedNames = useSelector((state: RootState) => state.cohort.filters.selectedStudentNames);
  const cohortData = useSelector((state: RootState) => state.cohort.data);
  // const resultVariation = useSelector((state: RootState) => state.cohort.filters.resultVariation); // Removed unused resultVariation
  // const [rangeMode, setRangeMode] = useState(false); // Removed unused rangeMode

  const [inputValue, setInputValue] = useState('');

  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);

  // useEffect(() => {
  //   setRangeMode(resultVariation !== null && resultVariation > 0);
  // }, [resultVariation]);

  const uniqueStudentNames = useMemo(() => {
    if (!cohortData?.students) return [];
    const names = cohortData.students.map(s => s.name);
    return [...new Set(names)].sort((a, b) => a.localeCompare(b));
  }, [cohortData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    setActiveSuggestionIndex(-1);

    if (value) {
        const filteredSuggestions = uniqueStudentNames.filter(name =>
            !selectedNames.includes(name) &&
            name.toLowerCase().includes(value.toLowerCase())
        );
        setSuggestions(filteredSuggestions);
        setShowSuggestions(filteredSuggestions.length > 0);
    } else {
        setSuggestions([]);
        setShowSuggestions(false);
    }
  };

  const selectSuggestion = (suggestion: string) => {
    if (!selectedNames.includes(suggestion)) {
        dispatch(addSelectedStudent(suggestion));
    }
    setInputValue('');
    setSuggestions([]);
    setShowSuggestions(false);
    setActiveSuggestionIndex(-1);
  };

  const handleRemoveStudent = (nameToRemove: string) => {
      dispatch(removeSelectedStudent(nameToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // const inputElement = e.target as HTMLInputElement; // Removed unused inputElement

    if (e.key === 'Backspace' && inputValue === '' && selectedNames.length > 0) {
        handleRemoveStudent(selectedNames[selectedNames.length - 1]);
        return;
    }

    if (!showSuggestions || suggestions.length === 0) {
        if (e.key === 'Enter') {
            e.preventDefault();
        }
        return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveSuggestionIndex(prev => (prev + 1) % suggestions.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveSuggestionIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
        break;
      case 'Enter':
        if (activeSuggestionIndex >= 0) {
            e.preventDefault();
            selectSuggestion(suggestions[activeSuggestionIndex]);
        } else {
            e.preventDefault();
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setActiveSuggestionIndex(-1);
        break;
    }
  };

  useEffect(() => {
    if (activeSuggestionIndex >= 0 && searchContainerRef.current) {
      const list = searchContainerRef.current.querySelector('ul');
      const activeItem = list?.children[activeSuggestionIndex] as HTMLLIElement;
      activeItem?.scrollIntoView({ block: 'nearest' });
    }
  }, [activeSuggestionIndex]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
            setShowSuggestions(false);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
        document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        await subjectMappingService.loadMappings();
        setMappingsLoaded(true);
        setMappingError(null);
        await loadScalingData();
        setIsScalingDataLoaded(true);
        setScalingDataError(null);
      } catch (error) {
        console.error('Failed to load initial data:', error);
        const message = error instanceof Error ? error.message : String(error);
        if (message.includes('mapping')) {
            setMappingError('Failed to load subject mappings. Some features might be affected.');
            setMappingsLoaded(false);
        } else if (message.includes('scaling')) {
            setScalingDataError('Failed to load scaling data. Calculations may be inaccurate.');
            setIsScalingDataLoaded(false);
        } else {
            setMappingError('An unexpected error occurred loading initial data.');
            setMappingsLoaded(false);
            setIsScalingDataLoaded(false);
        }
      }
    };

    loadData();
  }, []);

  const searchablePaths = [
    '/cohort/results',
    '/cohort/ranged-results',
    '/cohort/atars',
    '/cohort/ranged-atars'
  ];
  const showSearchBar = searchablePaths.some(path => location.pathname.startsWith(path));

  const showVariationInputPaths = [
    '/cohort/ranged-results',
    '/cohort/ranged-atars'
  ];
  const showVariationInput = showVariationInputPaths.some(path => location.pathname.startsWith(path));

  const showDownloadButtonPaths = [
    '/cohort/results',
    '/cohort/ranged-results',
    '/cohort/atars',
    '/cohort/ranged-atars',
    '/cohort/summary'
  ];
  const showDownloadButton = showDownloadButtonPaths.some(path => location.pathname.startsWith(path));

  const handleClearData = () => {
    const uploadPath = '/cohort/upload';
    if (window.confirm('Are you sure you want to clear all cohort data? This action cannot be undone.')) {
      dispatch(clearData());
      navigate(uploadPath);
    }
  };

  const handleExportPdfClick = () => {
    navigate('/student?triggerExport=true');
  };

  /**
   * Handle navigation to Single Student Calculator with the selected student
   */
  const handleViewInSingleCalculator = () => {
    if (selectedNames.length !== 1) return;
    
    const studentName = selectedNames[0];
    // URL encode the student name to handle special characters
    const encodedName = encodeURIComponent(studentName);
    navigate(`/student?preloadStudent=${encodedName}`);
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto p-4">
        <CohortTabs />

        {(showSearchBar || showVariationInput || showDownloadButton || (!location.pathname.includes('/cohort/upload') && cohortData?.students && cohortData.students.length > 0)) && (
          <div className="bg-white rounded-lg shadow-sm p-3 border border-gray-200 mb-3">
            <div className="flex flex-wrap justify-between items-center gap-4">
              {showSearchBar ? (
                <div className="flex items-center flex-shrink-0">
                  <div ref={searchContainerRef} className="relative sm:w-[350px]">
                    <div className="flex flex-wrap items-center p-2 border border-gray-300 rounded-md shadow-sm focus-within:ring-1 focus-within:ring-blue-500 focus-within:border-blue-500">
                      {selectedNames.map(name => (
                        <span key={name} className="flex items-center bg-blue-100 text-blue-800 text-sm font-medium mr-2 mb-1 px-2.5 py-0.5 rounded">
                            {name}
                            <button 
                                type="button" 
                                onClick={() => handleRemoveStudent(name)}
                                className="ml-1.5 text-blue-400 hover:text-blue-600 focus:outline-none"
                                aria-label={`Remove ${name}`}
                            >
                                &times;
                            </button>
                        </span>
                      ))}
                      <input
                          type="text"
                          placeholder={selectedNames.length === 0 ? "Search by Student Name..." : ""}
                          value={inputValue}
                          onChange={handleInputChange}
                          onKeyDown={handleKeyDown}
                          className="flex-grow p-1 mb-1 bg-transparent focus:outline-none focus:ring-blue-500 focus:border-blue-500 min-w-[200px]"
                          autoComplete='off'
                      />
                    </div>
                    {showSuggestions && suggestions.length > 0 && (
                      <ul className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md text-base ring-1 ring-black ring-opacity-5 overflow-y-auto">
                        {suggestions.map((suggestion, index) => (
                          <li
                            key={suggestion}
                            onClick={() => selectSuggestion(suggestion)}
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
                  
                  {selectedNames.length === 1 && (
                    <button
                      onClick={handleViewInSingleCalculator}
                      className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ml-3"
                      title="Open selected student in Single Student Calculator"
                    >
                      View in Single Calculator
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex-grow-0 sm:w-[45%]"></div>
              )}
              
              <div className="flex flex-wrap gap-2 items-center ml-auto">
                {showVariationInput && <ResultVariationInput />}
                {showDownloadButton && <DownloadCsvButton />}
                {!location.pathname.includes('/cohort/upload') && (
                  <button
                    onClick={handleExportPdfClick}
                    disabled={!cohortData?.students?.length}
                    className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 ${
                      !cohortData?.students?.length
                        ? 'opacity-50 cursor-not-allowed'
                        : 'hover:bg-green-700'
                    }`}
                    title={
                      !cohortData?.students?.length
                        ? "Upload cohort data to enable export"
                        : "Print PDFs for all students"
                    }
                  >
                    Export Cohort PDFs
                  </button>
                )}
                {cohortData?.students && cohortData.students.length > 0 && (
                  <button
                    onClick={handleClearData}
                    className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    Clear All Data
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {mappingError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
            <span className="block sm:inline">{mappingError}</span>
          </div>
        )}
        {scalingDataError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
            <span className="block sm:inline">{scalingDataError}</span>
          </div>
        )}
        {!mappingsLoaded && !isScalingDataLoaded && !mappingError && !scalingDataError && (
          <div className="bg-gray-100 border border-gray-300 text-gray-700 px-4 py-3 rounded relative mb-4" role="alert">
            <span className="block sm:inline">{cohortData?.students?.length === 0 ? "Upload cohort data to begin." : "Loading cohort data..."}</span>
          </div>
        )}

        <div className="mt-6">
          {mappingsLoaded ? (
            <Routes>
              <Route path="upload" element={<div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200"><UploadView /></div>} />
              
              {!cohortData || cohortData.students.length === 0 ? (
                <Route path="*" element={<Navigate to="/cohort/upload" replace />} />
              ) : (
                <>
                  <Route path="results" element={<div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200"><ResultsTableView mappingsLoaded={mappingsLoaded} /></div>} />
                  <Route path="ranged-results" element={<div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200"><RangedResultsView mappingsLoaded={mappingsLoaded} /></div>} />
                  <Route path="atars" element={<div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200"><AtarsView mappingsLoaded={mappingsLoaded} /></div>} />
                  <Route path="ranged-atars" element={<div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200"><RangedAtarsView mappingsLoaded={mappingsLoaded} /></div>} />
                  <Route path="summary" element={<div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200"><SchoolSummaryView /></div>} />
                  <Route path="*" element={<Navigate to="/cohort/results" replace />} />
                </>
              )}
            </Routes>
          ) : (
            <div className="text-center py-10">
              {mappingError ? (
                <p className="text-red-500">{mappingError}</p>
              ) : (
                <p>Loading subject data...</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CohortCalculator; 