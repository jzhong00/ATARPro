// ATAR Calculator – Greenfield architecture: follow utils/services/components separation and avoid legacy patterns.

/**
 * Defines the structure for a subject input row in the calculator UI.
 */
export interface SubjectRow {
  id: string;             // Unique identifier for the row
  subject: string | null; // Stores the Subject_display name (or user input if not resolved)
  rawResult: string | null; // The primary result input by the user
  lowerResult: string | null; // The lower bound result input (for Range Mode)
  upperResult: string | null; // The upper bound result input (for Range Mode)
  validationRule: string | null; // Validation rule associated with the selected subject (e.g., "0-100", "A-E")
  rank?: string | null; // Optional rank for SET Plan Calculator
  resultRange?: string | null; // Optional result range for SET Plan Calculator 
} 