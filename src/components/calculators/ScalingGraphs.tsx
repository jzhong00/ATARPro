import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Selection,
  ScalingRow,
  YEARS,
  loadScalingGraphData,
  hasDataForSubjectAndYear,
  getUniqueSubjects
} from '../../utils/scalingDataUtils';
import ScalingGraph from './ScalingGraph';
import SubjectSelectionTable from './SubjectSelectionTable';

/**
 * Main Scaling Graphs component
 * 
 * Fetches scaling data, manages subject/year selections, 
 * processes URL parameters to pre-select subjects, 
 * and renders the selection table and the scaling graph.
 */
const ScalingGraphs = () => {
  const [subjects, setSubjects] = useState<string[]>([]);
  const [selections, setSelections] = useState<Selection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<ScalingRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const location = useLocation();

  // Effect to process subjects passed via URL query parameter ('?subjects=...')
  // This runs after initial data loading is complete.
  useEffect(() => {
    const processSubjectsFromURL = () => {
      const searchParams = new URLSearchParams(location.search);
      const subjectsParam = searchParams.get('subjects');
      
      if (subjectsParam) {
        try {
          // Decode and parse the JSON array of subject names
          const selectedSubjects = JSON.parse(decodeURIComponent(subjectsParam)) as string[];
          
          // Check if we have subjects from URL and necessary data is loaded
          if (selectedSubjects.length > 0 && data.length > 0) {
            const year = '2024'; // Default year for pre-selection
            const newSelections: Selection[] = [];
            
            // Create selection objects for valid subjects found in the loaded data
            selectedSubjects.forEach(subject => {
              if (subjects.includes(subject) && hasDataForSubjectAndYear(data, subject, year)) {
                newSelections.push({ subject, year });
              }
            });
            
            // Add the new selections if any are valid
            if (newSelections.length > 0) {
              setSelections(prev => {
                  // Prevent adding duplicates
                  const currentSelections = new Set(prev.map(s => `${s.subject}-${s.year}`));
                  const additions = newSelections.filter(ns => !currentSelections.has(`${ns.subject}-${ns.year}`));
                  return [...prev, ...additions];
              });
            }
          }
        } catch (e) {
          // console.error('Error parsing subjects from URL:', e); // Removed log
          // Error parsing is handled silently, won't pre-select
        }
      }
    };
    
    // Only run processing if data and subjects are loaded
    if (!isLoading && data.length > 0 && subjects.length > 0) {
      processSubjectsFromURL();
    }
  }, [isLoading, data, subjects, location.search]);

  // Effect to load initial scaling data and available subjects on component mount
  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);
      try {
        const loadedData = await loadScalingGraphData();
        
        if (loadedData.length === 0) {
          throw new Error('No scaling data was loaded from source');
        }
        setData(loadedData);
        
        // Extract unique subject names from the loaded data
        const loadedSubjects = await getUniqueSubjects(loadedData);
        
        if (loadedSubjects.length === 0) {
          throw new Error('No subjects with available data were found');
        }
        setSubjects(loadedSubjects);
        setError(null); // Clear any previous errors
      } catch (err) {
        // console.error('Failed to load initial data:', err); // Removed log
        setError(err instanceof Error ? err.message : 'Unknown error loading data');
        setData([]);
        setSubjects([]);
      } finally {
        setIsLoading(false);
      }
    };
    loadInitialData();
  }, []); // Empty dependency array ensures this runs only once on mount

  // Handler to clear all current selections
  const handleClearAll = () => {
      setSelections([]);
  };

  // Handler to toggle a single subject-year selection
  const handleToggleSelection = (subject: string, year: string) => {
    setSelections(prev => {
      const exists = prev.some(s => s.subject === subject && s.year === year);
      if (exists) {
        // Remove the selection if it exists
        return prev.filter(s => !(s.subject === subject && s.year === year));
      } else {
        // Add the selection if data exists for it (safety check)
        if (hasDataForSubjectAndYear(data, subject, year)) {
             return [...prev, { subject, year }];
        }
        return prev; // No change if data doesn't exist
      }
    });
  };

  // Handler to toggle all selections for a specific year
  const handleToggleYear = (year: string) => {
      // Check if all available subjects for the year are already selected
      const isAllSelectedForYear = subjects.every(subject => 
        !hasDataForSubjectAndYear(data, subject, year) || // Ignore if no data
        selections.some(s => s.subject === subject && s.year === year)
      );

      setSelections(prev => {
        const withoutYear = prev.filter(s => s.year !== year);
        if (isAllSelectedForYear) {
          // If all were selected, remove them (return only selections from other years)
          return withoutYear;
        } else {
          // If not all were selected, add all available subjects for this year
          const newSelectionsForYear = subjects
            .filter(subject => hasDataForSubjectAndYear(data, subject, year))
            .map(subject => ({ subject, year }));
          return [...withoutYear, ...newSelectionsForYear]; // Combine with other years
        }
      });
  };

  // Handler to toggle all selections for a specific subject across all years
  const handleToggleSubject = (subject: string) => {
      // Check if all available years for the subject are already selected
      const isAllSelectedForSubject = YEARS.every(year => 
        !hasDataForSubjectAndYear(data, subject, year) || // Ignore if no data
        selections.some(s => s.subject === subject && s.year === year)
      );

      setSelections(prev => {
        const withoutSubject = prev.filter(s => s.subject !== subject);
        if (isAllSelectedForSubject) {
          // If all were selected, remove them
          return withoutSubject;
        } else {
          // If not all were selected, add all available years for this subject
          const newSelectionsForSubject = YEARS
            .filter(year => hasDataForSubjectAndYear(data, subject, year))
            .map(year => ({ subject, year }));
          return [...withoutSubject, ...newSelectionsForSubject]; // Combine with other subjects
        }
      });
  };

  // --- Component Rendering --- //
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex gap-8 h-[calc(100vh-200px)]">
        
        {/* Sidebar/Table Area: Render based on loading/error state */}
        {isLoading ? (
           <div className="flex-none max-w-lg w-full bg-white rounded-xl shadow-md p-4 flex items-center justify-center">Loading subject data...</div>
        ) : error ? (
           <div className="flex-none max-w-lg w-full bg-white rounded-xl shadow-md p-4 text-red-500">Error loading data: {error}</div>
        ) : subjects.length === 0 && !error ? (
           <div className="flex-none max-w-lg w-full bg-white rounded-xl shadow-md p-4">No subjects available.</div>
        ) : (
          // Render the selection table if data is loaded successfully
          <SubjectSelectionTable
            subjects={subjects}
            allScalingData={data}
            selections={selections}
            onClearAll={handleClearAll} 
            onToggleSelection={handleToggleSelection}
            onToggleYear={handleToggleYear}
            onToggleSubject={handleToggleSubject}
          />
        )}
        
        {/* Graph Area: Render the scaling graph component */}
        <div className="flex-1 bg-white rounded-xl shadow-md p-4 min-h-[32rem] flex items-center justify-center">
          {/* Pass the current selections and the loaded data to the graph */}
          <ScalingGraph selections={selections} allScalingData={data} /> 
        </div>

      </div>
    </div>
  );
};

export default ScalingGraphs; 