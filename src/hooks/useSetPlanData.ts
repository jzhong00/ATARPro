import { useState, useEffect } from 'react';
import csvDataService from '../services/csvDataService';

export type PercentileRange = '90-100' | '80-90' | '70-80' | '60-70' | '50-60' | '40-50' | '30-40' | '20-30' | '10-20' | '0-10';

export type SubjectPercentileData = {
  name: string;
  raw: Record<PercentileRange, number>;
  scaled: Record<PercentileRange, number>;
};

/**
 * Custom hook to load and manage SET Plan Calculator data
 */
export const useSetPlanData = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const loadData = async () => {
      try {
        // Check if data is already loaded through the centralized service
        if (csvDataService.isSetPlanDataLoaded()) {
          setIsLoaded(true);
          setError(null);
          return;
        }
        
        // Load SET Plan data if not already loaded
        await csvDataService.loadSetPlanData();
        setIsLoaded(true);
        setError(null);
      } catch (err) {
        console.error('Error loading SET Plan data:', err);
        setError('Failed to load SET Plan data');
        setIsLoaded(false);
      }
    };
    
    loadData();
  }, []);
  
  /**
   * Gets the result range for a subject at a specific rank
   */
  const getResultRange = (subjectName: string, rank: string): string | null => {
    if (!isLoaded) return null;
    
    try {
      const allData = csvDataService.getSetPlanData();
      if (!allData) return null;
      
      // Find the subject in the data
      const subjectData = allData.find((item: any) => 
        item.Subject.toLowerCase() === subjectName.toLowerCase()
      );
      
      if (!subjectData) return null;
      
      // Check if the rank column exists
      const rankColumn = `Rank_${rank}`;
      if (rankColumn in subjectData) {
        return subjectData[rankColumn];
      }
      
      return null;
    } catch (err) {
      console.error('Error getting result range:', err);
      return null;
    }
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