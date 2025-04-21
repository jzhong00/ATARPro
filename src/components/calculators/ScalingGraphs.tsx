import React, { useState, useEffect } from 'react';
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
 * Main Scaling Graphs component - orchestrates data fetching and selection state
 */
const ScalingGraphs = () => {
  const [subjects, setSubjects] = useState<string[]>([]);
  const [selections, setSelections] = useState<Selection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<ScalingRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const location = useLocation();

  // Process URL parameters effect remains the same
  useEffect(() => {
    const processSubjectsFromURL = () => {
      const searchParams = new URLSearchParams(location.search);
      const subjectsParam = searchParams.get('subjects');
      
      if (subjectsParam) {
        try {
          const selectedSubjects = JSON.parse(decodeURIComponent(subjectsParam)) as string[];
          console.log('Received subjects from URL:', selectedSubjects);
          
          if (selectedSubjects.length > 0 && data.length > 0) {
            const year = '2024';
            const newSelections: Selection[] = [];
            
            selectedSubjects.forEach(subject => {
              if (subjects.includes(subject) && hasDataForSubjectAndYear(data, subject, year)) {
                newSelections.push({ subject, year });
              }
            });
            
            if (newSelections.length > 0) {
              console.log('Adding selections from URL:', newSelections);
              setSelections(prev => {
                  const currentSelections = new Set(prev.map(s => `${s.subject}-${s.year}`));
                  const additions = newSelections.filter(ns => !currentSelections.has(`${ns.subject}-${ns.year}`));
                  return [...prev, ...additions];
              });
            }
          }
        } catch (e) {
          console.error('Error parsing subjects from URL:', e);
        }
      }
    };
    
    if (!isLoading && data.length > 0 && subjects.length > 0) {
      processSubjectsFromURL();
    }
  }, [isLoading, data, subjects, location.search]);

  // Initial data loading effect remains the same
  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);
      try {
        console.log('Starting initial data loading process...');
        const loadedData = await loadScalingGraphData();
        console.log('Initial data loaded, rows:', loadedData.length);
        
        if (loadedData.length === 0) {
          throw new Error('No scaling data was loaded from source');
        }
        setData(loadedData);
        
        const loadedSubjects = await getUniqueSubjects(loadedData);
        console.log('Available subjects loaded:', loadedSubjects.length);
        
        if (loadedSubjects.length === 0) {
          throw new Error('No subjects with available data were found');
        }
        setSubjects(loadedSubjects);
        setError(null);
      } catch (err) {
        console.error('Failed to load initial data:', err);
        setError(err instanceof Error ? err.message : 'Unknown error loading data');
        setData([]);
        setSubjects([]);
      } finally {
        setIsLoading(false);
      }
    };
    loadInitialData();
  }, []); 

  // Selection toggle handlers remain here as they modify state
  const handleClearAll = () => {
      setSelections([]);
  };

  const handleToggleSelection = (subject: string, year: string) => {
    setSelections(prev => {
      const exists = prev.some(s => s.subject === subject && s.year === year);
      if (exists) {
        return prev.filter(s => !(s.subject === subject && s.year === year));
      } else {
        // Prevent adding if data doesn't exist (safety check)
        if (hasDataForSubjectAndYear(data, subject, year)) {
             return [...prev, { subject, year }];
        }
        return prev;
      }
    });
  };

  // Bulk toggle handlers remain here
  const handleToggleYear = (year: string) => {
      // Need to recalculate isYearSelected logic here based on current state/props
      const isAllSelectedForYear = subjects.every(subject => 
        !hasDataForSubjectAndYear(data, subject, year) || 
        selections.some(s => s.subject === subject && s.year === year)
      );

      setSelections(prev => {
        const withoutYear = prev.filter(s => s.year !== year);
        if (isAllSelectedForYear) {
          return withoutYear;
        } else {
          const newSelectionsForYear = subjects
            .filter(subject => hasDataForSubjectAndYear(data, subject, year))
            .map(subject => ({ subject, year }));
          return [...withoutYear, ...newSelectionsForYear];
        }
      });
  };

  const handleToggleSubject = (subject: string) => {
      // Need to recalculate isSubjectSelected logic here based on current state/props
      const isAllSelectedForSubject = YEARS.every(year => 
        !hasDataForSubjectAndYear(data, subject, year) || 
        selections.some(s => s.subject === subject && s.year === year)
      );

      setSelections(prev => {
        const withoutSubject = prev.filter(s => s.subject !== subject);
        if (isAllSelectedForSubject) {
          return withoutSubject;
        } else {
          const newSelectionsForSubject = YEARS
            .filter(year => hasDataForSubjectAndYear(data, subject, year))
            .map(year => ({ subject, year }));
          return [...withoutSubject, ...newSelectionsForSubject];
        }
      });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex gap-8 h-[calc(100vh-200px)]">
        
        {/* Render Sidebar/Table Component */} 
        {isLoading ? (
           <div className="flex-none w-[500px] bg-white rounded-xl shadow-md p-4 flex items-center justify-center">Loading subject data...</div>
        ) : error ? (
           <div className="flex-none w-[500px] bg-white rounded-xl shadow-md p-4 text-red-500">Error loading data: {error}</div>
        ) : subjects.length === 0 && !error ? (
           <div className="flex-none w-[500px] bg-white rounded-xl shadow-md p-4">No subjects available.</div>
        ) : (
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
        
        {/* Render Graph Component */}
        <div className="flex-1 bg-white rounded-xl shadow-md p-4 min-h-[500px] flex items-center justify-center">
          {/* Pass necessary props to ScalingGraph */}
          <ScalingGraph selections={selections} allScalingData={data} /> 
        </div>

      </div>
    </div>
  );
};

export default ScalingGraphs; 