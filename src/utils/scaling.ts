import Papa from 'papaparse';

// Types
export type SubjectType = 'General' | 'Applied' | 'VET';
export type ValidationType = '0-100' | 'A-E' | 'Pass';

export interface ScalingResult {
  scaledScore: number;
  error?: string;
}

export interface GeneralScalingParameters {
  subject: string;
  subjectType: SubjectType;
  a: number | null;  // Logistic function parameter, can be null for non-General subjects
  k: number | null;  // Logistic function parameter, can be null for non-General subjects
}

export interface AppliedVetScalingMapping {
  subject: string;
  result: string;
  scaledScore: number;
}

// Cache for scaling parameters
let generalScalingParams: GeneralScalingParameters[] = [];
let appliedVetScalingMappings: AppliedVetScalingMapping[] = [];

/**
 * Loads and caches the scaling parameters from CSV files with retry logic
 */
export const loadScalingData = async (retries = 3): Promise<void> => {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      // Check if general scaling parameters are already loaded
      if (generalScalingParams.length === 0) {
        const generalResponse = await fetch('/data/Subject_type_and_general_scaling.csv');
        if (!generalResponse.ok) {
          throw new Error(`Failed to fetch general scaling data: ${generalResponse.statusText}`);
        }
        const generalText = await generalResponse.text();
        generalScalingParams = parseGeneralScalingCSV(generalText);
      }

      // Check if Applied/VET scaling mappings are already loaded
      if (appliedVetScalingMappings.length === 0) {
        const appliedVetResponse = await fetch('/data/applied_and_vet_scaling.csv');
        if (!appliedVetResponse.ok) {
          throw new Error(`Failed to fetch Applied/VET scaling data: ${appliedVetResponse.statusText}`);
        }
        const appliedVetText = await appliedVetResponse.text();
        appliedVetScalingMappings = parseAppliedVetScalingCSV(appliedVetText);
      }

      return;
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.error(`Error loading scaling data (attempt ${attempt + 1}/${retries}):`, error);
      
      if (attempt === retries - 1) {
        generalScalingParams = [];
        appliedVetScalingMappings = [];
        throw new Error(`Failed to load scaling data after ${retries} attempts: ${error.message}`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
    }
  }
};

/**
 * Parses the general scaling parameters CSV
 */
const parseGeneralScalingCSV = (csvText: string): GeneralScalingParameters[] => {
  const result = Papa.parse(csvText, { 
    header: true,
    skipEmptyLines: true,
    transformHeader: (header: string) => header.trim(),
    transform: (value: string) => value.trim()
  });
  
  if (result.errors.length > 0) {
    console.error('Errors parsing general scaling CSV:', result.errors);
    throw new Error('Failed to parse general scaling CSV');
  }

  const params = result.data
    .filter((row: any) => row.Subject_name && row.Type && row.Validation)
    .map((row: any) => ({
      subject: row.Subject_name.trim(),
      subjectType: row.Type.trim() as SubjectType,
      a: row.a === 'null' ? null : parseFloat(row.a),
      k: row.k === 'null' ? null : parseFloat(row.k)
    }));

  return params;
};

/**
 * Parses the Applied/VET scaling mappings CSV
 */
const parseAppliedVetScalingCSV = (csvText: string): AppliedVetScalingMapping[] => {
  const result = Papa.parse(csvText, { 
    header: true,
    skipEmptyLines: true,
    transformHeader: (header: string) => header.trim(),
    transform: (value: string) => value.trim()
  });
  
  if (result.errors.length > 0) {
    console.error('Errors parsing Applied/VET scaling CSV:', result.errors);
    throw new Error('Failed to parse Applied/VET scaling CSV');
  }

  const mappings = result.data
    .filter((row: any) => row.Subject && row.Result && row['Scaled Score'])
    .map((row: any) => ({
      subject: row.Subject.trim(),
      result: row.Result.trim().toUpperCase(),
      scaledScore: row['Scaled Score'] === 'null' ? 0 : parseFloat(row['Scaled Score'])
    }));

  return mappings;
};

/**
 * Calculates the scaled score for a given subject and result
 */
export const calculateScaledScore = (
  subject: string,
  rawResult: number | string
): ScalingResult => {
  try {
    // Validate input
    if (!subject || rawResult === undefined) {
      return { scaledScore: 0, error: 'Missing required parameters' };
    }

    // Find the subject parameters to determine type
    const subjectParams = generalScalingParams.find(p => 
      p.subject.trim().toLowerCase() === subject.trim().toLowerCase()
    );
    
    if (!subjectParams) {
      return { scaledScore: 0, error: `No parameters found for subject: ${subject}` };
    }

    // Handle General subjects
    if (subjectParams.subjectType === 'General') {
      const numericResult = typeof rawResult === 'string' ? parseFloat(rawResult) : rawResult;
      
      if (isNaN(numericResult)) {
        return { scaledScore: 0, error: 'General subjects require a valid numeric result' };
      }

      if (numericResult < 0 || numericResult > 100) {
        return { scaledScore: 0, error: 'General subject scores must be between 0 and 100' };
      }

      if (subjectParams.a === null || subjectParams.k === null) {
        return { scaledScore: 0, error: 'Missing scaling parameters for subject' };
      }

      const scaledScore = 100 / (1 + Math.exp(-(subjectParams.a * numericResult + subjectParams.k)));
      return { scaledScore: Math.round(scaledScore * 10) / 10 };
    }

    // Handle Applied and VET subjects
    if (subjectParams.subjectType === 'Applied' || subjectParams.subjectType === 'VET') {
      if (typeof rawResult !== 'string') {
        return { scaledScore: 0, error: 'Applied/VET subjects require a string result' };
      }

      const normalizedResult = rawResult.trim().toUpperCase();
      const mapping = appliedVetScalingMappings.find(m => 
        m.subject.trim().toLowerCase() === subject.trim().toLowerCase() && 
        m.result === normalizedResult
      );

      if (!mapping) {
        return { scaledScore: 0, error: `No scaling mapping found for ${subject} result: ${normalizedResult}` };
      }

      return { scaledScore: mapping.scaledScore };
    }

    return { scaledScore: 0, error: 'Invalid subject type' };
  } catch (error) {
    console.error('Error calculating scaled score:', error);
    return { scaledScore: 0, error: 'An unexpected error occurred' };
  }
}; 