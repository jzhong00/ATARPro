import { useState, useEffect } from 'react';
import subjectMappingService, { SubjectMapping, DatalistOption } from '../services/subjectMappingService';
import csvDataService from '../services/csvDataService';

/**
 * Custom hook to load subject mapping and scaling data
 */
export const useSubjectMappingLoader = () => {
  // State for subjects and loading status
  const [allSubjects, setAllSubjects] = useState<SubjectMapping[]>([]);
  const [subjectOptions, setSubjectOptions] = useState<DatalistOption[]>([]);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [isScalingDataLoaded, setIsScalingDataLoaded] = useState<boolean>(false);
  const [scalingDataError, setScalingDataError] = useState<string | null>(null);

  // Load subject mappings on mount
  useEffect(() => {
    const loadAndSetSubjects = async () => {
      try {
        // Ensure mappings are loaded before getting them
        await subjectMappingService.loadMappings();

        const mappings = subjectMappingService.getAllMappings();

        // Check if mappings are empty
        if (mappings.length === 0) {
          console.warn("Subject mappings are empty after loading.");
          setLoadingError("Subject list is empty. Check data file.");
        } else {
          // Sort subjects alphabetically by display name
          mappings.sort((a, b) => a.Subject_display.localeCompare(b.Subject_display));
          setAllSubjects(mappings);
          setLoadingError(null); // Clear any previous error
        }
        
        // Get options for datalist
        const options = subjectMappingService.getSubjectOptionsForDatalist();
        setSubjectOptions(options);
      } catch (error) {
        console.error("Failed to load or get subject mappings:", error);
        setLoadingError(error instanceof Error ? error.message : "An error occurred loading subjects.");
        setAllSubjects([]); // Clear subjects on error
        setSubjectOptions([]);
      }
    };

    loadAndSetSubjects();
  }, []); // Run once on mount

  // Check if scaling data is already loaded through the centralized service
  useEffect(() => {
    const checkScalingData = async () => {
      try {
        // First check if data is already loaded from App component
        if (csvDataService.isScalingDataLoaded()) {
          setIsScalingDataLoaded(true);
          setScalingDataError(null);
          return;
        }
        
        // If not loaded yet, wait for it to load (the App component should handle this)
        setIsScalingDataLoaded(csvDataService.isScalingDataLoaded());
        setScalingDataError(null);
      } catch (error) {
        console.error("Error checking scaling data status:", error);
        const message = error instanceof Error ? error.message : String(error);
        setScalingDataError(`Error loading scaling data: ${message}`);
        setIsScalingDataLoaded(false);
      }
    };
    
    checkScalingData();
    
    // Set up a periodic check to see if data has been loaded
    const intervalId = setInterval(() => {
      if (csvDataService.isScalingDataLoaded()) {
        setIsScalingDataLoaded(true);
        setScalingDataError(null);
        clearInterval(intervalId);
      }
    }, 500); // Check every 500ms
    
    return () => {
      clearInterval(intervalId);
    };
  }, []);

  return {
    allSubjects,
    subjectOptions,
    loadingError,
    isScalingDataLoaded,
    scalingDataError
  };
}; 