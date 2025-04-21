import { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { useSubjectMappingLoader } from './useSubjectMappingLoader';
import { SubjectMapping } from '../services/subjectMappingService';

/**
 * Custom hook to load SET Plan specific subject list
 * This filters the complete subject list to only include subjects from SET_Plan_Subject_Validation.csv
 */
export const useSetPlanSubjects = () => {
  const { allSubjects, loadingError, isScalingDataLoaded, scalingDataError } = useSubjectMappingLoader();
  const [setPlanSubjects, setSetPlanSubjects] = useState<SubjectMapping[]>([]);
  const [setPlanLoadingError, setSetPlanLoadingError] = useState<string | null>(null);

  // Load and filter subjects on mount or when allSubjects changes
  useEffect(() => {
    const loadSetPlanSubjects = async () => {
      // If we don't have all subjects yet, wait
      if (allSubjects.length === 0 && !loadingError) {
        return;
      }

      try {
        // Load the SET Plan subjects list
        const response = await fetch('/data/SET_Plan_Subject_Validation.csv');
        if (!response.ok) {
          throw new Error(`Failed to fetch SET Plan subjects: ${response.statusText}`);
        }

        const csvText = await response.text();
        
        // Use a simple line-by-line approach since this is a single-column file
        const lines = csvText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
        
        // Skip the header row
        const setPlanSubjectNames = lines.slice(1);
        
        console.log('Extracted SET Plan subject names:', setPlanSubjectNames);

        // Filter allSubjects to only include subjects in the SET Plan list
        const filteredSubjects = allSubjects.filter(subject => 
          setPlanSubjectNames.some(name => 
            name === subject.Subject_display
          )
        );

        // Sort subjects alphabetically
        filteredSubjects.sort((a, b) => a.Subject_display.localeCompare(b.Subject_display));

        setSetPlanSubjects(filteredSubjects);
        setSetPlanLoadingError(null);

        console.log(`Loaded ${filteredSubjects.length} SET Plan subjects`);
      } catch (error) {
        console.error("Failed to load SET Plan subjects:", error);
        setSetPlanLoadingError(error instanceof Error ? error.message : "An error occurred loading SET Plan subjects.");
        setSetPlanSubjects([]);
      }
    };

    loadSetPlanSubjects();
  }, [allSubjects, loadingError]);

  return {
    setPlanSubjects,
    loadingError: loadingError || setPlanLoadingError,
    isScalingDataLoaded,
    scalingDataError
  };
}; 