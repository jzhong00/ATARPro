import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Selection,
  ScalingRow,
  YEARS,
  hasDataForSubjectAndYear,
  getUniqueSubjects
} from '../../utils/scalingDataUtils';
import ScalingGraph from './ScalingGraph';
import SubjectSelectionTable from './SubjectSelectionTable';
import csvDataService from '../../services/csvDataService';

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

  // Load scaling graph data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        
        // Load the scaling graph data using the centralized service
        const scalingData = await csvDataService.loadScalingGraphsData();
        
        setData(scalingData);
        
        // Get unique subjects that have actual data
        const uniqueSubjects = await getUniqueSubjects(scalingData);
        setSubjects(uniqueSubjects);
        
        setIsLoading(false);
        setError(null);
      } catch (err) {
        console.error('Error loading scaling graphs data:', err);
        setError('Failed to load scaling data. Please try again later.');
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Process URL parameters to pre-select subjects
  useEffect(() => {
    const processUrlParams = async () => {
      if (isLoading || subjects.length === 0 || data.length === 0) {
        return;
      }

      const params = new URLSearchParams(location.search);
      const subjectsParam = params.get('subjects');
      
      if (!subjectsParam) {
        return;
      }
      
      try {
        // Parse the subject names from the URL
        const selectedSubjects = JSON.parse(decodeURIComponent(subjectsParam));
        
        if (!Array.isArray(selectedSubjects) || selectedSubjects.length === 0) {
          return;
        }
        
        // Create new selection entries for valid subjects with the most recent year
        const newSelections: Selection[] = [];
        
        for (const subject of selectedSubjects) {
          if (subjects.includes(subject)) {
            // Find the most recent year that has data for this subject
            const validYear = [...YEARS].reverse().find(year => 
              hasDataForSubjectAndYear(data, subject, year)
            );
            
            if (validYear) {
              newSelections.push({ subject, year: validYear });
            }
          }
        }
        
        if (newSelections.length > 0) {
          setSelections(newSelections);
        }
      } catch (error) {
        console.error('Error processing URL parameters:', error);
      }
    };
    
    processUrlParams();
  }, [location.search, subjects, data, isLoading]);

  // Handle adding a new selection
  const handleAddSelection = (subject: string, year: string) => {
    // Prevent adding duplicates
    if (selections.some(s => s.subject === subject && s.year === year)) {
      return;
    }
    
    // Add the new selection
    setSelections(prev => [...prev, { subject, year }]);
  };

  // Handle removing a selection
  const handleRemoveSelection = (index: number) => {
    setSelections(prev => prev.filter((_, i) => i !== index));
  };

  // Clear all current selections
  const handleClearSelections = () => {
    setSelections([]);
  };

  return (
    <div className="container mx-auto px-4 py-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">Scaling Graphs</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md mb-6" role="alert">
          <p>{error}</p>
        </div>
      )}
      
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-1/3 bg-white rounded-xl shadow-sm p-6 h-min">
          <SubjectSelectionTable
            subjects={subjects}
            allScalingData={data}
            selections={selections}
            onClearAll={handleClearSelections}
            onToggleSelection={(subject, year) => {
              // If already selected, remove it, otherwise add it
              const index = selections.findIndex(s => s.subject === subject && s.year === year);
              if (index >= 0) {
                handleRemoveSelection(index);
              } else {
                handleAddSelection(subject, year);
              }
            }}
            onToggleYear={(year) => {
              // For each subject, toggle selection for this year
              subjects.forEach(subject => {
                if (hasDataForSubjectAndYear(data, subject, year)) {
                  const isSelected = selections.some(s => s.subject === subject && s.year === year);
                  if (!isSelected) {
                    handleAddSelection(subject, year);
                  } else {
                    const index = selections.findIndex(s => s.subject === subject && s.year === year);
                    if (index >= 0) {
                      handleRemoveSelection(index);
                    }
                  }
                }
              });
            }}
            onToggleSubject={(subject) => {
              // For each year, toggle selection for this subject
              YEARS.forEach(year => {
                if (hasDataForSubjectAndYear(data, subject, year)) {
                  const isSelected = selections.some(s => s.subject === subject && s.year === year);
                  if (!isSelected) {
                    handleAddSelection(subject, year);
                  } else {
                    const index = selections.findIndex(s => s.subject === subject && s.year === year);
                    if (index >= 0) {
                      handleRemoveSelection(index);
                    }
                  }
                }
              });
            }}
          />
        </div>
        
        <div className="lg:w-2/3 bg-white rounded-xl shadow-sm p-6">
          <ScalingGraph 
            selections={selections} 
            allScalingData={data}
          />
          
          {selections.length === 0 && !isLoading && (
            <div className="h-64 flex items-center justify-center text-gray-500 border border-dashed border-gray-300 rounded-lg">
              <p>Select subjects and years to display scaling data</p>
            </div>
          )}
          
          {isLoading && (
            <div className="h-64 flex items-center justify-center">
              <p className="text-gray-500">Loading scaling data...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScalingGraphs; 