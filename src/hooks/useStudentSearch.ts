import { useState, useCallback, useEffect, RefObject } from 'react';
import type { Student } from '../types/cohort';
import type { SubjectRow } from '../types/calculator';
import { sortSubjectRowsByScaledScore, createEmptyRow } from '../utils/calculatorUtils';

interface UseStudentSearchProps {
  students?: Student[];
  resultVariation: number | string;
  subjectMappingService: {
    getAllMappings: () => any[];
    getSubjectType: (subjectName: string) => string | undefined;
  };
  searchContainerRef: RefObject<HTMLDivElement>;
  onStudentImport: (rows: SubjectRow[]) => void;
  onClearResults: () => void;
}

/**
 * Custom hook for student search functionality
 */
export const useStudentSearch = ({
  students = [],
  resultVariation,
  subjectMappingService,
  searchContainerRef,
  onStudentImport,
  onClearResults
}: UseStudentSearchProps) => {
  // Search state
  const [studentSearchQuery, setStudentSearchQuery] = useState<string>('');
  const [selectedStudentName, setSelectedStudentName] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);

  // Memoize unique student names
  const uniqueStudentNames = students
    ? [...new Set(students.map(s => s.name))].sort((a, b) => a.localeCompare(b))
    : [];

  // Effect for handling clicks outside the search input/suggestions
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
  }, [searchContainerRef]);

  // Effect for scrolling active suggestion into view
  useEffect(() => {
    if (activeSuggestionIndex >= 0 && searchContainerRef.current) {
      const list = searchContainerRef.current.querySelector('ul');
      const activeItem = list?.children[activeSuggestionIndex] as HTMLLIElement;
      activeItem?.scrollIntoView({ block: 'nearest' });
    }
  }, [activeSuggestionIndex, searchContainerRef]);

  /**
   * Handle search input changes
   */
  const handleSearchInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    // Clear results if a student was selected and user starts typing a different name
    if (selectedStudentName) {
      onClearResults();
    }

    setStudentSearchQuery(value);
    setSelectedStudentName(null); // Clear selection as soon as user types again
    setActiveSuggestionIndex(-1);

    if (value) {
      const filteredSuggestions = uniqueStudentNames.filter(name =>
        name.toLowerCase().includes(value.toLowerCase())
      );
      setSuggestions(filteredSuggestions);
      setShowSuggestions(filteredSuggestions.length > 0);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [selectedStudentName, uniqueStudentNames, onClearResults]);

  /**
   * Handle suggestion click
   */
  const handleSuggestionClick = useCallback((suggestion: string) => {
    setSelectedStudentName(suggestion);
    setStudentSearchQuery(suggestion);
    setSuggestions([]);
    setShowSuggestions(false);
    setActiveSuggestionIndex(-1);
  }, []);

  /**
   * Handle keyboard navigation in search
   */
  const handleSearchKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === 'Enter') e.preventDefault();
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
          handleSuggestionClick(suggestions[activeSuggestionIndex]);
        } else {
          e.preventDefault();
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setActiveSuggestionIndex(-1);
        break;
    }
  }, [showSuggestions, suggestions, activeSuggestionIndex, handleSuggestionClick]);

  /**
   * Import the selected student's data
   */
  const handleImportStudentData = useCallback(() => {
    // Clear previous results first through callback
    onClearResults();

    if (!selectedStudentName || !students.length) {
      console.error("Cannot import: No student selected or student data missing.");
      return;
    }

    const student = students.find(s => s.name === selectedStudentName);

    if (!student) {
      console.error(`Cannot import: Student "${selectedStudentName}" not found in student data.`);
      return;
    }

    const numericVariation = Number(resultVariation) || 0;
    
    // Sort the subject results by scaled score
    const sortedRows = sortSubjectRowsByScaledScore(
      student.results, 
      numericVariation, 
      subjectMappingService
    );

    // Pad with empty rows
    const finalRows = sortedRows.length > 0 ? sortedRows : [createEmptyRow()];
    while (finalRows.length < 6) {
      finalRows.push(createEmptyRow());
    }
    
    // Call the callback with the prepared rows
    onStudentImport(finalRows);
  }, [selectedStudentName, students, resultVariation, subjectMappingService, onClearResults, onStudentImport]);

  /**
   * Clear all search state
   */
  const clearSearchState = useCallback(() => {
    setStudentSearchQuery('');
    setSelectedStudentName(null);
    setSuggestions([]);
    setShowSuggestions(false);
    setActiveSuggestionIndex(-1);
  }, []);

  return {
    studentSearchQuery,
    selectedStudentName,
    suggestions,
    showSuggestions,
    activeSuggestionIndex,
    uniqueStudentNames,
    handleSearchInputChange,
    handleSuggestionClick,
    handleSearchKeyDown,
    handleImportStudentData,
    clearSearchState
  };
}; 