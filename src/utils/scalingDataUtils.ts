import { useState, useEffect } from 'react';

// Type Definitions
export interface Selection {
  subject: string;
  year: string;
}

export interface ScalingRow {
  Year: string;
  Subject: string;  // This is actually Subject_name in the CSV
  [key: string]: string | undefined;
}

export interface DataPoint {
  rawScore: number;
  [key: string]: number;
}

// Constants
export const YEARS = ['2020', '2021', '2022', '2023', '2024'];

// Cache for scaling data
let cachedData: ScalingRow[] | null = null;

/**
 * Loads scaling data for the graphs from CSV
 */
export async function loadScalingGraphData(): Promise<ScalingRow[]> {
  if (cachedData) {
    return cachedData;
  }

  try {
    console.log('Fetching scaling graph data from CSV...');
    const response = await fetch('/data/Scaling_graph_data.csv');
    
    if (!response.ok) {
      throw new Error(`Failed to fetch CSV: ${response.status} ${response.statusText}`);
    }
    
    const text = await response.text();
    console.log('CSV data received, length:', text.length);
    
    // Parse the CSV manually
    const lines = text.split('\n').filter(line => line.trim());
    console.log(`Found ${lines.length} lines in CSV`);
    
    if (lines.length < 2) {
      throw new Error('CSV file has no data rows');
    }
    
    const headerLine = lines[0];
    const headers = headerLine.split(',').map(h => h.trim());
    
    console.log('Headers:', headers);
    console.log('Available column header:', headers[2]);
    
    // Process each data row
    cachedData = [];
    
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
      
      cachedData.push(rowData);
    }
    
    console.log(`Processed ${cachedData.length} valid data rows`);
    
    if (cachedData.length > 0) {
      console.log('First subject:', cachedData[0].Subject);
      // console.log('First row sample:', cachedData[0]); // Keep console cleaner
    }
    
    return cachedData;
  } catch (error) {
    console.error('Error loading scaling data:', error);
    return [];
  }
}

/**
 * Checks if data exists for a specific subject and year
 */
export function hasDataForSubjectAndYear(data: ScalingRow[], subject: string, year: string): boolean {
  // Special case for Arabic 2024 (as per CSV)
  if (subject === 'Arabic' && year === '2024') {
    return false; 
  }

  const row = data.find(r => 
    r.Subject === subject && 
    r.Year === year
  );
  
  if (!row) {
    return false;
  }
  
  // First check the Available column - if it's explicitly FALSE, return false
  if (row['Available'] === 'FALSE') {
    return false;
  }
  
  // Check if any scaling score exists (not empty) besides metadata
  const hasScores = Object.entries(row).some(([key, value]) => {
    // Skip Year, Subject, and Available columns
    if (key === 'Year' || key === 'Subject' || key === 'Available') return false;
    // Check if the key is a number (representing a raw score) and has a non-empty value
    return !isNaN(parseInt(key, 10)) && value !== undefined && value !== '';
  });
  
  return hasScores;
}

/**
 * Gets unique subjects from scaling data that have actual score data for at least one year
 */
export async function getUniqueSubjects(data?: ScalingRow[]): Promise<string[]> {
  const loadedData = data || await loadScalingGraphData();
  
  if (loadedData.length === 0) {
    console.error('No data provided or loaded for getUniqueSubjects');
    return [];
  }
  
  // Filter subjects based on whether they have *actual score data* for at least one year
  const subjectsWithData = new Set<string>();
  const checkedSubjects = new Set<string>();

  loadedData.forEach(row => {
      if (!row.Subject || checkedSubjects.has(row.Subject)) {
          return; // Skip empty subjects or already processed ones
      }
      
      // Check if this subject has data for *any* year present in the data
      const hasAnyData = YEARS.some(year => hasDataForSubjectAndYear(loadedData, row.Subject, year));
      
      if (hasAnyData) {
          subjectsWithData.add(row.Subject);
      }
      checkedSubjects.add(row.Subject); // Mark as processed
  });

  const sortedSubjects = Array.from(subjectsWithData).sort();
  
  console.log('Unique subjects with available data found:', sortedSubjects.length);
  
  return sortedSubjects;
}

// Add DataPoint type if it's used by components importing from here
// (It's primarily used within ScalingGraph, which will be moved later)
// export interface DataPoint {
//   rawScore: number;
//   [key: string]: number;
// } 