/**
 * Interface for subject data mapping score values to scaled scores
 */
export interface SubjectData {
  [subject: string]: number[];
}

/**
 * Type for equivalent score results which can be a number, string message, or null
 */
export type EquivalentScore = number | string | null;

/**
 * Interface for score comparison classification
 */
export interface ScoreComparison {
  better: boolean;
  worse: boolean;
} 