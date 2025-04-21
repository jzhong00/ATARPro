import { useState, useEffect } from 'react';
import setPlanDataService from '../services/setPlanDataService';
import type { SubjectPercentileData } from '../services/setPlanDataService';

/**
 * Custom hook to load and manage SET Plan Calculator data
 */
export const useSetPlanData = () => {
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        if (!setPlanDataService.isInitialized()) {
          await setPlanDataService.loadData();
        }
        setIsLoaded(true);
        setError(null);
      } catch (err) {
        console.error('Failed to load SET Plan Calculator data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load SET Plan data');
        setIsLoaded(false);
      }
    };
    
    loadData();
  }, []);
  
  /**
   * Get result range for a subject based on rank
   */
  const getResultRange = (subjectName: string | null, rank: string | null): string | null => {
    if (!isLoaded || !subjectName || !rank) {
      return null;
    }
    
    return setPlanDataService.calculateResultRange(subjectName, rank);
  };
  
  /**
   * Get scaled score range for a subject based on rank
   */
  const getScaledRange = (subjectName: string | null, rank: string | null): [number, number] | null => {
    if (!isLoaded || !subjectName || !rank) {
      return null;
    }
    
    return setPlanDataService.calculateScaledRange(subjectName, rank);
  };
  
  return {
    isLoaded,
    error,
    getResultRange,
    getScaledRange
  };
}; 