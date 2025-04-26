import { useState, useEffect } from 'react';
import csvDataService from '../services/csvDataService';

/**
 * Type Definitions
 */
type SubjectData = Record<string, number[]>;

/**
 * Helper Functions
 */
const interpolateScore = (score: number, values: number[]): number => {
  // Ensure score is in valid range
  const clamped = Math.max(0, Math.min(100, score));
  
  // Get index for interpolation
  const index = Math.floor(clamped / 5);
  
  // Handle edge cases
  if (index >= values.length - 1) return values[values.length - 1];
  if (index < 0) return values[0];
  
  // Calculate interpolation
  const low = values[index];
  const high = values[index + 1];
  const t = (clamped % 5) / 5;
  
  return low + t * (high - low);
};

const findNearestWholeScore = (targetScaled: number, values: number[]): number | 'Not\nPossible' => {
  // Find the index of values that would bracket the target scaled score
  let low = 0;
  let high = values.length - 1;
  
  // Handle special cases
  if (targetScaled <= values[0]) return 0;
  if (targetScaled >= values[high]) return 100;
  
  // Binary search to find where the target should be
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    if (values[mid] < targetScaled) {
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }
  
  // At this point, values[high] < targetScaled < values[low]
  
  // If we couldn't find a suitable bracket, it might not be possible
  if (high < 0 || low >= values.length) {
    return 'Not\nPossible';
  }
  
  // Interpolate to find the exact score
  const highScore = low * 5;
  const lowScore = high * 5;
  const highValue = values[low];
  const lowValue = values[high];
  
  // Check if target is in range
  if (targetScaled < lowValue || targetScaled > highValue) {
    if (Math.abs(targetScaled - lowValue) < 0.01 || Math.abs(targetScaled - highValue) < 0.01) {
      // If very close to one of the values, return the corresponding score
      return Math.abs(targetScaled - lowValue) < Math.abs(targetScaled - highValue) ? lowScore : highScore;
    }
    // Not possible to achieve exactly this scaled score
    return 'Not\nPossible';
  }
  
  // Linear interpolation: x = x1 + (y - y1) * (x2 - x1) / (y2 - y1)
  const equivalentScore = lowScore + (targetScaled - lowValue) * (highScore - lowScore) / (highValue - lowValue);
  
  // Round to nearest whole number
  return Math.round(equivalentScore);
};

/**
 * Custom hook for the Equivalent Calculator
 */
export const useEquivalentCalculator = () => {
  const [subjects, setSubjects] = useState<string[]>([]);
  const [score, setScore] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [comparisonSubjects, setComparisonSubjects] = useState<string[]>(['', '', '', '']);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [subjectData, setSubjectData] = useState<SubjectData>({});
  const [equivalentScores, setEquivalentScores] = useState<(number | 'Not\nPossible' | null)[]>([null, null, null, null]);
  const [sourceScaledScore, setSourceScaledScore] = useState<number>(0);

  // Load subjects from equivalent score data using the centralized service
  useEffect(() => {
    const loadSubjects = async () => {
      try {
        // Check if data is already loaded 
        if (csvDataService.isEquivalentDataLoaded()) {
          setSubjects(csvDataService.getEquivalentSubjects());
          setSubjectData(csvDataService.getEquivalentSubjectData());
          setIsLoading(false);
          setError(null);
          return;
        }
        
        // Load equivalent data if not already loaded
        await csvDataService.loadEquivalentData();
        
        // Get the data from the service
        setSubjects(csvDataService.getEquivalentSubjects());
        setSubjectData(csvDataService.getEquivalentSubjectData());
        setIsLoading(false);
        setError(null);
      } catch (error) {
        console.error('Failed to load subjects:', error);
        setError('Failed to load subject data. Please try again later.');
        setIsLoading(false);
      }
    };

    loadSubjects();
  }, []);

  // Calculate equivalent scores whenever inputs change
  useEffect(() => {
    if (!score || !selectedSubject || !subjectData[selectedSubject]) {
      setEquivalentScores([null, null, null, null]);
      setSourceScaledScore(0);
      return;
    }

    const sourceScore = Math.round(Number(score));
    
    // Get the scaled score for the source subject at the source score
    const scaledScore = interpolateScore(sourceScore, subjectData[selectedSubject]);
    setSourceScaledScore(scaledScore);

    // Calculate equivalent scores for each comparison subject
    const newEquivalentScores = comparisonSubjects.map(compSubject => {
      if (!compSubject || !subjectData[compSubject]) return null;
      
      // Find the equivalent score in the comparison subject
      return findNearestWholeScore(scaledScore, subjectData[compSubject]);
    });

    setEquivalentScores(newEquivalentScores);
  }, [score, selectedSubject, comparisonSubjects, subjectData]);

  /**
   * Handlers
   */
  const handleScoreChange = (value: string) => {
    // Only allow numbers between 0-100
    if (value === '') {
      setScore('');
    } else {
      const num = Number(value);
      if (!isNaN(num) && num >= 0 && num <= 100) {
        setScore(value);
      }
    }
  };

  const handleSubjectChange = (value: string) => {
    setSelectedSubject(value);
  };

  const handleComparisonSubjectChange = (index: number, value: string) => {
    setComparisonSubjects(prev => {
      const newValues = [...prev];
      newValues[index] = value;
      return newValues;
    });
  };

  const handleRandomSubjects = () => {
    // Get all subjects except the currently selected one
    const availableSubjects = subjects.filter(s => s !== selectedSubject);
    
    // Shuffle the array
    const shuffled = [...availableSubjects].sort(() => 0.5 - Math.random());
    
    // Take the first 4 for comparison
    const randomSubjects = shuffled.slice(0, 4);
    
    // Pad with empty strings if we don't have enough
    while (randomSubjects.length < 4) {
      randomSubjects.push('');
    }
    
    setComparisonSubjects(randomSubjects);
  };

  const handleClearComparisons = () => {
    setComparisonSubjects(['', '', '', '']);
  };

  /**
   * Helper Functions for UI
   */
  const formatScore = (value: number | 'Not\nPossible'): string => {
    if (value === 'Not\nPossible') return 'Not possible';
    return Math.round(value).toString();
  };

  const getScaledScoreDisplay = (subject: string, rawScore: number | 'Not\nPossible'): string => {
    if (rawScore === 'Not\nPossible' || !subject || !subjectData[subject]) return '';
    
    // If the subject is the source subject, just return the source scaled score
    if (subject === selectedSubject) {
      return sourceScaledScore.toFixed(2);
    }
    
    // For Not\nPossible, find the max possible scaled score
    if (rawScore === 'Not\nPossible') {
      const maxScaled = Math.max(...subjectData[subject]);
      return `max: ${maxScaled.toFixed(2)}`;
    }
    
    // Otherwise, calculate the scaled score for this raw score
    const scaled = interpolateScore(rawScore, subjectData[subject]);
    return scaled.toFixed(2);
  };

  const getScoreClasses = (score: number | 'Not\nPossible' | null, sourceScore: number): { better: boolean; worse: boolean } => {
    if (score === null || score === 'Not\nPossible') {
      return { better: false, worse: false };
    }
    
    // Return status based on comparison with source score
    const numericScore = typeof score === 'number' ? score : Number.MAX_VALUE;
    return {
      better: numericScore < sourceScore, // Lower raw score is better (easier to achieve)
      worse: numericScore > sourceScore  // Higher raw score is worse (harder to achieve)
    };
  };

  return {
    subjects,
    score,
    selectedSubject,
    comparisonSubjects,
    isLoading,
    error,
    equivalentScores,
    sourceScaledScore,
    handleScoreChange,
    handleSubjectChange,
    handleComparisonSubjectChange,
    handleRandomSubjects,
    handleClearComparisons,
    formatScore,
    getScaledScoreDisplay,
    getScoreClasses
  };
}; 