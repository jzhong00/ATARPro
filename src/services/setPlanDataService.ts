import Papa from 'papaparse';

// Interface for the SET Plan Calculator data
export interface SubjectPercentileData {
  subject: string;
  raw: {
    '25%': number;
    '50%': number;
    '75%': number;
    '90%': number;
    '99%': number;
  };
  scaled: {
    '25%': number;
    '50%': number;
    '75%': number;
    '90%': number;
    '99%': number;
  };
}

// Map rank names to percentile ranges
export const RANK_PERCENTILE_RANGES = {
  'Best': ['90%', '99%'],
  'Great': ['75%', '90%'],
  'Above Average': ['50%', '75%'],
  'Below Average': ['25%', '50%']
};

class SetPlanDataService {
  private subjectData: Map<string, SubjectPercentileData> = new Map();
  private initialized = false;
  
  // Load the SET Plan data from the CSV file
  public async loadData(): Promise<void> {
    try {
      
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

      if (result.errors.length > 0) {
        throw new Error(`CSV parsing errors: ${result.errors.map(e => e.message).join(', ')}`);
      }

      const data = result.data;      
      // Group data by subject
      const subjectRows: Record<string, any[]> = {};
      data.forEach((row: any) => {
        const subject = row.Subject;
        if (!subjectRows[subject]) {
          subjectRows[subject] = [];
        }
        subjectRows[subject].push(row);
      });
      
      // Process each subject
      Object.entries(subjectRows).forEach(([subject, rows]) => {
        const rawRow = rows.find((row) => row.Raw_or_Scaled === 'Raw');
        const scaledRow = rows.find((row) => row.Raw_or_Scaled === 'Scaled');
        
        if (rawRow && scaledRow) {
          this.subjectData.set(subject, {
            subject,
            raw: {
              '25%': parseFloat(rawRow['25%']),
              '50%': parseFloat(rawRow['50%']),
              '75%': parseFloat(rawRow['75%']),
              '90%': parseFloat(rawRow['90%']),
              '99%': parseFloat(rawRow['99%'])
            },
            scaled: {
              '25%': parseFloat(scaledRow['25%']),
              '50%': parseFloat(scaledRow['50%']),
              '75%': parseFloat(scaledRow['75%']),
              '90%': parseFloat(scaledRow['90%']),
              '99%': parseFloat(scaledRow['99%'])
            }
          });
        }
      });
      
      this.initialized = true;
            
    } catch (error) {
      console.error('Error loading SET Plan Calculator data:', error);
      throw error;
    }
  }
  
  // Check if the service is initialized
  public isInitialized(): boolean {
    return this.initialized;
  }
  
  // Get data for a specific subject
  public getSubjectData(subjectName: string): SubjectPercentileData | undefined {
    return this.subjectData.get(subjectName);
  }
  
  // Get all subject data
  public getAllSubjectData(): SubjectPercentileData[] {
    return Array.from(this.subjectData.values());
  }
  
  // Calculate result range for a subject based on rank
  public calculateResultRange(subjectName: string, rank: string): string | null {
    if (!this.initialized || !subjectName || !rank) {
      return null;
    }
    
    const subjectData = this.subjectData.get(subjectName);
    if (!subjectData) {
      return null;
    }
    
    const percentileRange = RANK_PERCENTILE_RANGES[rank as keyof typeof RANK_PERCENTILE_RANGES];
    if (!percentileRange) {
      return null;
    }
    
    const lowerPercentile = percentileRange[0] as keyof typeof subjectData.raw;
    const upperPercentile = percentileRange[1] as keyof typeof subjectData.raw;
    
    const lowerValue = subjectData.raw[lowerPercentile];
    const upperValue = subjectData.raw[upperPercentile];
    
    return `${lowerValue}-${upperValue}`;
  }
  
  // Calculate scaled score range for a subject based on rank
  public calculateScaledRange(subjectName: string, rank: string): [number, number] | null {
    if (!this.initialized || !subjectName || !rank) {
      return null;
    }
    
    const subjectData = this.subjectData.get(subjectName);
    if (!subjectData) {
      return null;
    }
    
    const percentileRange = RANK_PERCENTILE_RANGES[rank as keyof typeof RANK_PERCENTILE_RANGES];
    if (!percentileRange) {
      return null;
    }
    
    const lowerPercentile = percentileRange[0] as keyof typeof subjectData.scaled;
    const upperPercentile = percentileRange[1] as keyof typeof subjectData.scaled;
    
    const lowerValue = subjectData.scaled[lowerPercentile];
    const upperValue = subjectData.scaled[upperPercentile];
    
    return [lowerValue, upperValue];
  }
}

// Create a singleton instance
const setPlanDataService = new SetPlanDataService();

export default setPlanDataService; 