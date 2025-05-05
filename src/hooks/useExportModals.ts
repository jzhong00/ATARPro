import { useState, useCallback } from 'react';

/**
 * Props for the useExportModals hook
 */
interface UseExportModalsProps {
  /**
   * Callback function to execute the cohort export
   */
  onExecuteExport: (exportRangeMode: boolean) => void;
}

/**
 * Custom hook to manage export modal state and handlers
 */
export const useExportModals = ({ onExecuteExport }: UseExportModalsProps) => {
  // Modal states
  const [isRangeModalOpen, setIsRangeModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [pendingExportRangeMode, setPendingExportRangeMode] = useState<boolean | null>(null);

  /**
   * Initiates the export process by opening the range selection modal
   */
  const initiateExport = useCallback(() => {
    // Clear any pending choice from a previous attempt
    setPendingExportRangeMode(null);
    // Open the Range Mode selection modal
    setIsRangeModalOpen(true);
  }, []);

  /**
   * Handles the selection of range mode in the first modal
   */
  const handleRangeModeSelection = useCallback((exportRangeMode: boolean) => {
    setPendingExportRangeMode(exportRangeMode); // Store the choice
    setIsRangeModalOpen(false); // Close the first modal
    setIsConfirmModalOpen(true); // Open the second (confirmation) modal
  }, []);

  /**
   * Handles the final confirmation to proceed with export
   */
  const handleFinalConfirmation = useCallback(() => {
    setIsConfirmModalOpen(false); // Close the confirmation modal
    if (pendingExportRangeMode !== null) { // Should always be set, but check anyway
      onExecuteExport(pendingExportRangeMode);
    } else {
      console.error("Export range mode was not set before final confirmation.");
    }
  }, [pendingExportRangeMode, onExecuteExport]);

  /**
   * Handles cancellation of the export process
   */
  const handleCancelExport = useCallback(() => {
    setIsConfirmModalOpen(false); // Close the confirmation modal
    setPendingExportRangeMode(null); // Clear the pending choice
  }, []);

  return {
    // Modal states
    isRangeModalOpen,
    isConfirmModalOpen,
    pendingExportRangeMode,
    
    // Modal actions
    initiateExport,
    handleRangeModeSelection,
    handleFinalConfirmation,
    handleCancelExport,
    
    // Modal state setters (for direct control if needed)
    setIsRangeModalOpen,
    setIsConfirmModalOpen
  };
}; 