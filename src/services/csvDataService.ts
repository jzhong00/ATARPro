// ATAR Calculator – Centralized CSV data loading service
import Papa from 'papaparse';
import { ScalingResult, GeneralScalingParameters, AppliedVetScalingMapping, SubjectType } from '../utils/scaling';
import { ScalingRow } from '../utils/scalingDataUtils';

// Track the loading status of each data category
type LoadingStatus = {
  core: boolean;
  scaling: boolean;
  equivalentScores: boolean;
  setPlanData: boolean;
  scalingGraphs: boolean;
};

// Cache for all data
let generalScalingParams: GeneralScalingParameters[] = [];
let appliedVetScalingMappings: AppliedVetScalingMapping[] = [];
let equivalentSubjects: string[] = [];
let equivalentSubjectData: Record<string, number[]> = {};
let scalingGraphData: ScalingRow[] | null = null;
let setPlanData: any = null;
let setPlanRankOptions: any = null;

// Loading status
const dataLoaded: LoadingStatus = {
  core: false,
  scaling: false,
  equivalentScores: false,
  setPlanData: false,
  scalingGraphs: false,
};

/**
 * Loads essential core data needed for all calculators
 * Includes subject types and general scaling parameters
 */
export const loadCoreData = async (): Promise<void> => {
  if (dataLoaded.core) return;
  
  try {
    console.log('Loading core CSV data...');
    
    // Load general scaling parameters
    const generalResponse = await fetch('/data/Subject_type_and_general_scaling.csv');
    if (!generalResponse.ok) {
      throw new Error(`Failed to fetch general scaling data: ${generalResponse.statusText}`);
    }
    const generalText = await generalResponse.text();
    generalScalingParams = parseGeneralScalingCSV(generalText);

    // Load Applied/VET scaling mappings
    const appliedVetResponse = await fetch('/data/applied_and_vet_scaling.csv');
    if (!appliedVetResponse.ok) {
      throw new Error(`Failed to fetch Applied/VET scaling data: ${appliedVetResponse.statusText}`);
    }
    const appliedVetText = await appliedVetResponse.text();
    appliedVetScalingMappings = parseAppliedVetScalingCSV(appliedVetText);
    
    dataLoaded.core = true;
    dataLoaded.scaling = true; // Core data includes scaling data
    console.log('Core CSV data loaded successfully');
  } catch (err) {
    console.error('Error loading core CSV data:', err);
    throw err;
  }
};

/**
 * Loads the data needed for the Equivalent Calculator
 */
export const loadEquivalentData = async (): Promise<void> => {
  if (dataLoaded.equivalentScores) return;
  
  try {
    console.log('Loading equivalent score calculator data...');
    
    const response = await fetch('/data/Equivalent_score_calculator_data.csv');
    if (!response.ok) {
      throw new Error(`Failed to fetch equivalent score data: ${response.statusText}`);
    }
    
    const text = await response.text();
    const lines = text.split('\n');
    
    // Process each subject's data
    equivalentSubjectData = {};
    equivalentSubjects = [];
    
    lines.slice(1).forEach(line => {
      const [subject, ...values] = line.split(',');
      if (subject && subject.trim()) {
        equivalentSubjects.push(subject.trim());
        equivalentSubjectData[subject.trim()] = values.map(v => Number(v.trim()));
      }
    });
    
    dataLoaded.equivalentScores = true;
    console.log('Equivalent Calculator data loaded successfully');
  } catch (err) {
    console.error('Error loading equivalent score calculator data:', err);
    throw err;
  }
};

/**
 * Loads the data needed for the SET Plan Calculator
 */
export const loadSetPlanData = async (): Promise<void> => {
  if (dataLoaded.setPlanData) return;
  
  try {
    console.log('Loading SET Plan calculator data...');
    
    // Load SET Plan Calculator data
    const response = await fetch('/data/SET_Plan_Calculator_Data.csv');
    if (!response.ok) {
      throw new Error(`Failed to fetch SET Plan data: ${response.statusText}`);
    }
    
    const csvText = await response.text();
    const result = Papa.parse(csvText, { 
      header: true,
      skipEmptyLines: true,
      transformHeader: (header: string) => header.trim(),
      transform: (value: string) => value.trim()
    });

    if (result.errors && result.errors.length > 0) {
      throw new Error(`CSV parsing errors: ${result.errors.map(e => e.message).join(', ')}`);
    }

    setPlanData = result.data;
    
    // Load SET Plan rank options
    const rankOptionsResponse = await fetch('/data/SET_Plan_Rank_List.csv');
    if (!rankOptionsResponse.ok) {
      throw new Error(`Failed to fetch SET Plan rank options: ${rankOptionsResponse.statusText}`);
    }
    
    const rankCsvText = await rankOptionsResponse.text();
    const lines = rankCsvText.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);
    
    setPlanRankOptions = {
      General: [],
      Applied: [],
      VET: []
    };
    
    // Process each line
    for (const line of lines) {
      const parts = line.split(',').map(part => part.trim());
      if (parts[0] === 'General') {
        setPlanRankOptions.General = parts.slice(1).filter(val => val !== '');
      } else if (parts[0] === 'Applied') {
        setPlanRankOptions.Applied = parts.slice(1).filter(val => val !== '');
      } else if (parts[0] === 'VET') {
        setPlanRankOptions.VET = parts.slice(1).filter(val => val !== '');
      }
    }
    
    dataLoaded.setPlanData = true;
    console.log('SET Plan Calculator data loaded successfully');
  } catch (err) {
    console.error('Error loading SET Plan Calculator data:', err);
    throw err;
  }
};

/**
 * Loads the data needed for the Scaling Graphs
 */
export const loadScalingGraphsData = async (): Promise<ScalingRow[]> => {
  if (dataLoaded.scalingGraphs && scalingGraphData) {
    return scalingGraphData;
  }
  
  try {
    console.log('Loading scaling graph data...');
    
    const response = await fetch('/data/Scaling_graph_data.csv');
    if (!response.ok) {
      throw new Error(`Failed to fetch scaling graph data: ${response.statusText}`);
    }
    
    const text = await response.text();
    
    // Parse the CSV manually
    const lines = text.split('\n').filter(line => line.trim());
    
    const headerLine = lines[0];
    const headers = headerLine.split(',').map(h => h.trim());
    
    // Process each data row
    scalingGraphData = [];
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      const values = line.split(',');
      
      // Skip rows with too few values
      if (values.length < 4) continue;
      
      const year = values[0]?.trim() || '';
      const subject = values[1]?.trim() || '';
      
      // Skip rows with no year or subject
      if (!year || !subject) continue;
      
      const rowData: ScalingRow = { 
        Year: year,
        Subject: subject
      };
      
      // Explicitly add the Available column (index 2)
      if (values.length > 2) {
        rowData['Available'] = values[2]?.trim() || '';
      }
      
      // Add all the score mappings
      for (let j = 3; j < headers.length && j < values.length; j++) {
        const headerKey = headers[j];
        if (headerKey !== undefined && headerKey !== '') {
          rowData[headerKey] = values[j]?.trim() || '';
        }
      }
      
      if (scalingGraphData) {
        scalingGraphData.push(rowData);
      }
    }
    
    dataLoaded.scalingGraphs = true;
    console.log('Scaling Graphs data loaded successfully');
    return scalingGraphData || [];
  } catch (err) {
    console.error('Error loading scaling graph data:', err);
    throw err;
  }
};

// Helper function to parse general scaling parameters CSV
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

// Helper function to parse Applied/VET scaling mappings CSV
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
 * (Extracted from scaling.ts to use our cached scaling parameters)
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

/**
 * Gets the SET Plan data including subject performance percentiles
 */
export const getSetPlanData = () => {
  return setPlanData;
};

/**
 * Gets the SET Plan rank options for subject types
 */
export const getSetPlanRankOptions = () => {
  return setPlanRankOptions;
};

/**
 * Gets the list of subjects for the Equivalent Calculator
 */
export const getEquivalentSubjects = () => {
  return equivalentSubjects;
};

/**
 * Gets the subject data for the Equivalent Calculator
 */
export const getEquivalentSubjectData = () => {
  return equivalentSubjectData;
};

/**
 * Checks if core data is loaded
 */
export const isCoreDataLoaded = () => {
  return dataLoaded.core;
};

/**
 * Checks if scaling data is loaded
 */
export const isScalingDataLoaded = () => {
  return dataLoaded.scaling;
};

/**
 * Checks if equivalent calculator data is loaded
 */
export const isEquivalentDataLoaded = () => {
  return dataLoaded.equivalentScores;
};

/**
 * Checks if SET Plan calculator data is loaded
 */
export const isSetPlanDataLoaded = () => {
  return dataLoaded.setPlanData;
};

/**
 * Checks if scaling graph data is loaded
 */
export const isScalingGraphsDataLoaded = () => {
  return dataLoaded.scalingGraphs;
};

/**
 * Exports the API for the centralized CSV data service
 */
const csvDataService = {
  // Loading methods
  loadCoreData,
  loadEquivalentData,
  loadSetPlanData,
  loadScalingGraphsData,
  
  // Data accessors
  calculateScaledScore,
  getSetPlanData,
  getSetPlanRankOptions,
  getEquivalentSubjects,
  getEquivalentSubjectData,
  
  // Status checkers
  isCoreDataLoaded,
  isScalingDataLoaded,
  isEquivalentDataLoaded,
  isSetPlanDataLoaded,
  isScalingGraphsDataLoaded
};

export default csvDataService; 