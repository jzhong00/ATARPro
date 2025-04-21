import { useState, useEffect, useMemo } from 'react';
import { SubjectData, EquivalentScore, ScoreComparison } from '../types/equivalent';
import { SubjectRow } from '../types/calculator';
import { calculateScaledScore, ScalingResult } from '../utils/scaling';
// import { calculateEquivalentScore, scoreValues } from '../utils/equivalentScoreCalculator'; // Removed unused scoreValues
import subjectMappingService from '../services/subjectMappingService';

export const useEquivalentCalculator = () => {
  const [subjects, setSubjects] = useState<string[]>([]);
  const [score, setScore] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [comparisonSubjects, setComparisonSubjects] = useState<string[]>(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(true);
  const [subjectData, setSubjectData] = useState<SubjectData>({});
  const [equivalentScores, setEquivalentScores] = useState<EquivalentScore[]>([null, null, null, null, null, null]);
  const [sourceScaledScore, setSourceScaledScore] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load subjects from equivalent score data
  useEffect(() => {
    const loadSubjects = async () => {
      try {
        const response = await fetch('/data/Equivalent_score_calculator_data.csv');
        const text = await response.text();
        const lines = text.split('\n');
        
        // Get header - these are the scores (0-100)
        const scoreValues = lines[0].split(',').slice(1).map(Number);
        
        // Process each subject's data
        const data: SubjectData = {};
        const subjectNames: string[] = [];
        
        lines.slice(1).forEach(line => {
          const [subject, ...values] = line.split(',');
          if (subject.trim()) {
            subjectNames.push(subject);
            data[subject] = values.map(Number);
          }
        });
        
        setSubjects(subjectNames);
        setSubjectData(data);
        setIsLoading(false);
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
      setEquivalentScores([null, null, null, null, null, null]);
      setSourceScaledScore(null);
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

  // Helper function to interpolate between scores
  const interpolateScore = (score: number, scaledScores: number[]): number => {
    // Handle edge cases
    if (score <= 0) return scaledScores[100];
    if (score >= 100) return scaledScores[0];

    // Find the indices for interpolation
    const upperIndex = Math.ceil(100 - score);
    const lowerIndex = Math.floor(100 - score);

    // If we're exactly on a value, return it
    if (upperIndex === lowerIndex) return scaledScores[upperIndex];

    // Interpolate between the two closest values
    const upperScore = scaledScores[upperIndex];
    const lowerScore = scaledScores[lowerIndex];
    const fraction = score - Math.floor(score);

    return lowerScore + (upperScore - lowerScore) * (1 - fraction);
  };

  // Helper function to find nearest whole score
  const findNearestWholeScore = (targetScaledScore: number, scaledScores: number[]): EquivalentScore => {
    // Check if the target scaled score is higher than what's achievable
    if (targetScaledScore > scaledScores[0]) {
      return 'Not\nPossible';
    }

    // Find where our target scaled score fits in the array
    for (let i = 0; i < scaledScores.length - 1; i++) {
      const currentScaled = scaledScores[i];
      const nextScaled = scaledScores[i + 1];
      
      // If we're between two values, interpolate
      if (targetScaledScore <= currentScaled && targetScaledScore >= nextScaled) {
        const score = 100 - i;
        // Calculate the fraction between the two scores
        const fraction = (currentScaled - targetScaledScore) / (currentScaled - nextScaled);
        return score - fraction;
      }
    }

    // If we get here, the score must be at or below the lowest scaled score
    return 0;
  };

  // Helper function for consistent score formatting
  const formatScore = (score: EquivalentScore): string => {
    if (score === null) return '--';
    if (typeof score === 'string') return score;
    return score.toFixed(1);
  };

  // Helper function to get scaled score display
  const getScaledScoreDisplay = (subject: string, equivalentScore: EquivalentScore): string => {
    if (!subject) return '';
    if (typeof equivalentScore === 'number') {
      const scaledScore = interpolateScore(equivalentScore, subjectData[subject]);
      return scaledScore.toFixed(2);
    }
    if (equivalentScore === 'Not\nPossible') {
      return subjectData[subject][0].toFixed(2);
    }
    return '';
  };

  // Helper function to get score classes
  const getScoreClasses = (equivalentScore: EquivalentScore, sourceScore: number): ScoreComparison => {
    if (typeof equivalentScore !== 'number' || isNaN(sourceScore)) {
      return { better: false, worse: false };
    }

    return {
      better: equivalentScore < sourceScore,
      worse: equivalentScore > sourceScore
    };
  };

  const handleScoreChange = (value: string) => {
    // Only allow integers between 0 and 100
    const intValue = parseInt(value);
    if (value === '' || (!isNaN(intValue) && intValue >= 0 && intValue <= 100)) {
      setScore(value);
    }
  };

  const handleSubjectChange = (value: string) => {
    setSelectedSubject(value);
  };

  const handleComparisonSubjectChange = (index: number, value: string) => {
    const newComparisonSubjects = [...comparisonSubjects];
    newComparisonSubjects[index] = value;
    setComparisonSubjects(newComparisonSubjects);
  };

  const handleRandomSubjects = () => {
    const availableSubjects = subjects.filter(s => s !== selectedSubject);
    setComparisonSubjects(
      [...availableSubjects]
        .sort(() => Math.random() - 0.5)
        .slice(0, 6)
    );
  };

  const handleClearComparisons = () => {
    setComparisonSubjects(['', '', '', '', '', '']);
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