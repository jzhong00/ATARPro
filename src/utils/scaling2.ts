import Papa from 'papaparse';

export type SubjectType = 'General' | 'Applied' | 'VET';

export interface ScalingResult {
  scaledScore: number;
}

export interface GeneralScalingParameters {
  subject: string;
  subjectType: SubjectType;
  a: number;  // Logistic function parameter
  k: number;  // Logistic function parameter
}

export interface AppliedVetScalingMapping {
  subject: string;
  result: string;
  scaledScore: number;
}

let generalScalingParams: GeneralScalingParameters[] = [];
let appliedVetScalingMappings: AppliedVetScalingMapping[] = [];

export const loadScalingData = async (): Promise<void> => {
  if (generalScalingParams.length === 0) {
    const generalResponse = await fetch('/data/Subject_type_and_general_scaling.csv');
    const generalText = await generalResponse.text();
    generalScalingParams = parseGeneralScalingCSV(generalText);
  }
  
  if (appliedVetScalingMappings.length === 0) {
    const appliedVetResponse = await fetch('/data/applied_and_vet_scaling.csv');
    const appliedVetText = await appliedVetResponse.text();
    appliedVetScalingMappings = parseAppliedVetScalingCSV(appliedVetText);
  }
};

const parseGeneralScalingCSV = (csvText: string): GeneralScalingParameters[] => {
  const result = Papa.parse(csvText, { 
    header: true,
    skipEmptyLines: true,
    transformHeader: (header: string) => header.trim(),
    transform: (value: string) => value.trim()
  });

  return result.data.map((row: any) => ({
    subject: row.Subject_name.trim(),
    subjectType: row.Type.trim() as SubjectType,
    a: parseFloat(row.a),
    k: parseFloat(row.k)
  }));
};

const parseAppliedVetScalingCSV = (csvText: string): AppliedVetScalingMapping[] => {
  const result = Papa.parse(csvText, { 
    header: true,
    skipEmptyLines: true,
    transformHeader: (header: string) => header.trim(),
    transform: (value: string) => value.trim()
  });

  return result.data.map((row: any) => ({
    subject: row.Subject.trim(),
    result: row.Result.trim().toUpperCase(),
    scaledScore: parseFloat(row['Scaled Score'])
  }));
};

export const calculateScaledScore = (
  subject: string,
  rawResult: number | string
): ScalingResult => {
  const subjectParams = generalScalingParams.find(p => 
    p.subject.trim().toLowerCase() === subject.trim().toLowerCase()
  ) || { subjectType: 'General', a: 0, k: 0 };

  if (subjectParams.subjectType === 'General') {
    const numericResult = typeof rawResult === 'string' ? parseFloat(rawResult) : rawResult;
    const scaledScore = 100 / (1 + Math.exp(-(subjectParams.a * numericResult + subjectParams.k)));
    return { scaledScore: Math.round(scaledScore * 10) / 10 };
  }

  const normalizedResult = (rawResult as string).trim().toUpperCase();
  const mapping = appliedVetScalingMappings.find(m => 
    m.subject.trim().toLowerCase() === subject.trim().toLowerCase() && 
    m.result === normalizedResult
  ) || { scaledScore: 0 };

  return { scaledScore: mapping.scaledScore };
}; 