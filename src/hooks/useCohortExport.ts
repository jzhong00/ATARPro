import { useState, useCallback, useRef } from 'react';
import { generateCohortExport } from '../utils/exportUtils';
import type { Student } from '../types/cohort';
import React from 'react';

/**
 * Props for the useCohortExport hook
 */
interface UseCohortExportProps {
  /**
   * The cohort's student data
   */
  students?: Student[];
  
  /**
   * The result variation value to apply to ranges
   */
  resultVariation: number | string;
  
  /**
   * The chart component to render in reports
   */
  ChartComponent: React.ComponentType<any>;
  
  /**
   * The subject mapping service
   */
  subjectMappingService: {
    getAllMappings: () => any[];
    getMappingByDisplayName: (name: string) => any;
    getSubjectType: (subjectName: string) => string | undefined;
  };
  
  /**
   * Whether scaling data is loaded and ready for calculations
   */
  isScalingDataLoaded: boolean;
}

/**
 * Custom hook to manage cohort export process
 */
export const useCohortExport = ({
  students,
  resultVariation,
  ChartComponent,
  subjectMappingService,
  isScalingDataLoaded
}: UseCohortExportProps) => {
  // Export state
  const [isCohortExporting, setIsCohortExporting] = useState(false);
  const [exportProgressMessage, setExportProgressMessage] = useState<string | null>(null);
  const [exportHasFinished, setExportHasFinished] = useState<boolean>(false);
  const exportTriggeredRef = useRef(false);

  /**
   * Executes the cohort export process
   */
  const executeCohortExport = useCallback(async (exportRangeMode: boolean) => {
    if (!students || students.length === 0) {
      console.error("Cannot export: No students in cohort data");
      return;
    }
    
    // Clear previous finished flag and message
    setExportHasFinished(false);
    setExportProgressMessage(null);
    setIsCohortExporting(true);
    
    try {
      await generateCohortExport(
        students,
        resultVariation,
        exportRangeMode,
        ChartComponent,
        subjectMappingService,
        (message) => setExportProgressMessage(message),
        () => {
          setIsCohortExporting(false);
          setExportHasFinished(true);
          // Clear messages after 5 seconds
          setTimeout(() => {
            setExportProgressMessage(null);
            setExportHasFinished(false);
          }, 5000);
        }
      );
    } catch (error) {
      console.error("Cohort export failed:", error);
      setExportProgressMessage(`❌ Export failed: ${error instanceof Error ? error.message : String(error)}`);
      setIsCohortExporting(false);
      setExportHasFinished(true);
    }
  }, [students, resultVariation, ChartComponent, subjectMappingService]);

  /**
   * Checks whether a cohort export can be initiated
   */
  const canExport = useCallback(() => {
    return (
      !isCohortExporting && 
      isScalingDataLoaded && 
      students && 
      students.length > 0
    );
  }, [isCohortExporting, isScalingDataLoaded, students]);

  /**
   * Handles validation and initiates the cohort export process
   * Returns true if export was initiated, false if validation failed
   */
  const handleCohortExportRequest = useCallback((openModalFn: () => void) => {
    // Check if already exporting or required data is missing
    if (isCohortExporting) return false;
    
    if (!students || students.length === 0) {
      alert("No cohort data loaded to export.");
      return false;
    }
    
    if (!isScalingDataLoaded) {
      alert("Scaling data not loaded. Cannot generate accurate reports.");
      return false;
    }
    
    // Open the modal to start the export process
    openModalFn();
    return true;
  }, [isCohortExporting, students, isScalingDataLoaded]);

  /**
   * Reset the export state for a new session
   */
  const resetExportState = useCallback(() => {
    setExportProgressMessage(null);
    setExportHasFinished(false);
    setIsCohortExporting(false);
    exportTriggeredRef.current = false;
  }, []);
  
  /**
   * Set the export triggered flag
   */
  const setExportTriggered = useCallback((value: boolean) => {
    exportTriggeredRef.current = value;
  }, []);

  return {
    // State
    isCohortExporting,
    exportProgressMessage,
    exportHasFinished,
    exportTriggeredRef,
    
    // Actions
    executeCohortExport,
    handleCohortExportRequest,
    resetExportState,
    setExportTriggered,
    canExport,
  };
}; 