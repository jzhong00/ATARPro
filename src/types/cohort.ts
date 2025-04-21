// ATAR Calculator – Greenfield architecture: follow utils/services/components separation and avoid legacy patterns.

export type SubjectType = 'General' | 'Applied' | 'VET';
export type ValidationRule = '0 - 100' | 'A - E' | 'Pass';

export interface Subject {
  name: string;
  type: SubjectType;
  validationType: ValidationRule;
}

export interface StudentResult {
  subject: string;
  rawResult: string | number;
  resultRange?: {
    lower: number;
    upper: number;
  };
}

export interface Student {
  name: string;
  results: StudentResult[];
}

export interface CohortData {
  students: Student[];
  subjects: Subject[];
}

export interface ScalingParameters {
  general: {
    maxScore: number;
    minScore: number;
    weight: number;
  };
  applied: {
    A: number;
    B: number;
    C: number;
    D: number;
    E: number;
    weight: number;
  };
  vet: {
    passScore: number;
    weight: number;
  };
}

export interface CohortState {
  data: CohortData | null;
  loading: boolean;
  error: string | null;
  view: 'upload' | 'results' | 'ranged-results' | 'atars' | 'ranged-atars' | 'summary';
  filters: {
    selectedStudentNames: string[];
    resultVariation: number;
  };
} 