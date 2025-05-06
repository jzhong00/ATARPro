// ATAR Calculator – Greenfield architecture: follow utils/services/components separation and avoid legacy patterns.

import Papa from 'papaparse';

// Interface for the subject mapping data
export interface SubjectMapping {
  Subject_name: string;
  Subject_display: string;
  Type: string;
  Validation: string;
  a?: number;  // Optional because not all subjects have scaling parameters
  k?: number;  // Optional because not all subjects have scaling parameters
}

// Type for datalist options
export interface DatalistOption {
  label: string;
  value: string;
}

class SubjectMappingService {
  private mappings: Map<string, SubjectMapping> = new Map();

  // Load the subject mappings from the CSV file
  public async loadMappings(): Promise<void> {
    try {
      
      // Load subject type and general scaling data
      const subjectTypeResponse = await fetch('/data/Subject_type_and_general_scaling.csv');
      if (!subjectTypeResponse.ok) {
        throw new Error(`Failed to fetch subject type data: ${subjectTypeResponse.statusText}`);
      }
      
      const subjectTypeText = await subjectTypeResponse.text();
      const result = Papa.parse(subjectTypeText, { 
        header: true,
        skipEmptyLines: true,
        transformHeader: (header: string) => header.trim(),
        transform: (value: string) => value.trim()
      });

      if (result.errors.length > 0) {
        throw new Error(`CSV parsing errors: ${result.errors.map(e => e.message).join(', ')}`);
      }

      const subjectTypeData = result.data;
      
      // Process each subject
      subjectTypeData.forEach((row: any) => {
        if (!row.Subject_name || !row.Type || !row.Validation) {
          console.warn('Skipping invalid row:', row);
          return;
        }

        const subjectName = row.Subject_name.trim();
        this.mappings.set(subjectName, {
          Subject_name: subjectName,
          Subject_display: row.Subject_display?.trim() || subjectName,
          Type: row.Type.trim(),
          Validation: row.Validation.trim(),
          a: row.a === 'null' ? undefined : parseFloat(row.a),
          k: row.k === 'null' ? undefined : parseFloat(row.k)
        });
      });
            
    } catch (error) {
      console.error('Error loading mappings:', error);
      throw error;
    }
  }

  // Get the display name for a subject
  public getSubjectDisplay(subjectName: string): string {
    const normalizedName = subjectName.trim();
    const mapping = this.mappings.get(normalizedName);
    return mapping?.Subject_display || normalizedName;
  }

  // Get all subject mappings
  public getAllMappings(): SubjectMapping[] {
    return Array.from(this.mappings.values());
  }

  // Check if a subject exists in the mappings
  public subjectExists(subjectName: string): boolean {
    return this.mappings.has(subjectName.trim());
  }

  // Get subject type (General, Applied, or VET)
  public getSubjectType(subjectName: string): string | undefined {
    const mapping = this.mappings.get(subjectName.trim());
    return mapping?.Type;
  }

  // Get subject validation rule
  public getSubjectValidation(subjectName: string): string | undefined {
    const mapping = this.mappings.get(subjectName.trim());
    return mapping?.Validation;
  }

  // Find a mapping by its display name
  public getMappingByDisplayName(displayName: string): SubjectMapping | undefined {
    const trimmedDisplayName = displayName.trim();
    for (const mapping of this.mappings.values()) {
      if (mapping.Subject_display === trimmedDisplayName) {
        return mapping;
      }
    }
    return undefined; // Not found
  }

  // Generate options for DatalistInput
  public getSubjectOptionsForDatalist(): DatalistOption[] {
    const options: DatalistOption[] = [];
    for (const mapping of this.mappings.values()) {
      options.push({
        label: mapping.Subject_display, // Use display name for both label and value
        value: mapping.Subject_display
      });
    }
    // Sort options alphabetically by label
    options.sort((a, b) => a.label.localeCompare(b.label));
    return options;
  }
}

// Create a singleton instance
const subjectMappingService = new SubjectMappingService();

export default subjectMappingService; 