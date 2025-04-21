// ATAR Calculator – Greenfield architecture: follow utils/services/components separation and avoid legacy patterns.

import { CohortData, Student, Subject, StudentResult, SubjectType, ValidationRule } from '../types/cohort';
import * as XLSX from 'xlsx';
import { UploadError } from '../types/upload';

export class ParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ParseError';
  }
}

export const parseExcelFile = async (file: File): Promise<CohortData> => {
  try {
    const { students, errors } = await DataLoader.parseExcelFile(file);
    
    // For now, we'll create dummy subject entries based on the results
    const subjects = new Set<string>();
    students.forEach(student => {
      student.results.forEach(result => {
        subjects.add(result.subject);
      });
    });
    
    // Create subject objects (we'll assume all are General type for now)
    const subjectList = Array.from(subjects).map(name => ({
      name,
      type: 'General' as SubjectType,
      validationType: '0 - 100' as ValidationRule
    }));
    
    if (errors.length > 0) {
      console.warn('Some rows had errors during parsing:', errors);
    }
    
    return {
      students,
      subjects: subjectList,
    };
  } catch (error) {
    throw new ParseError(error instanceof Error ? error.message : 'Failed to parse Excel file');
  }
};

const validateSubjectType = (type: string): SubjectType => {
  if (type === 'General' || type === 'Applied' || type === 'VET') {
    return type;
  }
  throw new ParseError(`Invalid subject type: ${type}. Must be General, Applied, or VET.`);
};

const getValidationRule = (type: SubjectType): ValidationRule => {
  switch (type) {
    case 'General':
      return '0 - 100';
    case 'Applied':
      return 'A - E';
    case 'VET':
      return 'Pass';
  }
};

const validateResult = (result: string, type: SubjectType): string | number => {
  switch (type) {
    case 'General':
      const num = Number(result);
      if (isNaN(num) || num < 0 || num > 100) {
        throw new ParseError(`Invalid result for General subject: ${result}. Must be between 0 and 100.`);
      }
      return num;
    case 'Applied':
      if (!['A', 'B', 'C', 'D', 'E'].includes(result)) {
        throw new ParseError(`Invalid result for Applied subject: ${result}. Must be A, B, C, D, or E.`);
      }
      return result;
    case 'VET':
      if (result !== 'Pass') {
        throw new ParseError(`Invalid result for VET subject: ${result}. Must be "Pass".`);
      }
      return result;
  }
};

export const parseCSVFile = async (file: File): Promise<CohortData> => {
  try {
    const text = await file.text();
    const lines = text.split('\n');
    
    if (lines.length < 2) {
      throw new ParseError('File is empty or has no data rows');
    }

    // Parse headers
    const headers = lines[0].trim().split(',');
    const requiredHeaders = ['Student Name', 'Subject', 'Subject Type', 'Result'];
    
    requiredHeaders.forEach(header => {
      if (!headers.includes(header)) {
        throw new ParseError(`Missing required header: ${header}`);
      }
    });

    // Parse data rows
    const studentsMap = new Map<string, Student>();
    const subjects = new Map<string, Subject>();

    lines.slice(1).forEach((line, index) => {
      if (!line.trim()) return;

      const values = line.trim().split(',');
      if (values.length !== headers.length) {
        throw new ParseError(`Invalid data format at line ${index + 2}`);
      }

      const rowData = Object.fromEntries(headers.map((h, i) => [h, values[i]]));
      
      // Validate and process subject type
      const subjectType = validateSubjectType(rowData['Subject Type']);
      const validationRule = getValidationRule(subjectType);
      
      // Validate and process result
      const result = validateResult(rowData['Result'], subjectType);

      // Create or update student
      const studentName = rowData['Student Name'];
      if (!studentsMap.has(studentName)) {
        studentsMap.set(studentName, {
          name: studentName,
          results: [],
        });
      }

      // Add subject result
      const studentResult: StudentResult = {
        subject: rowData['Subject'],
        rawResult: result,
      };

      studentsMap.get(studentName)!.results.push(studentResult);

      // Add or update subject
      if (!subjects.has(rowData['Subject'])) {
        subjects.set(rowData['Subject'], {
          name: rowData['Subject'],
          type: subjectType,
          validationType: validationRule,
        });
      }
    });

    return {
      students: Array.from(studentsMap.values()),
      subjects: Array.from(subjects.values()),
    };
  } catch (error) {
    if (error instanceof ParseError) {
      throw error;
    }
    throw new ParseError(error instanceof Error ? error.message : 'Failed to parse CSV file');
  }
};

export const parseFile = async (file: File): Promise<CohortData> => {
  const fileType = file.name.split('.').pop()?.toLowerCase();

  switch (fileType) {
    case 'csv':
      return parseCSVFile(file);
    case 'xlsx':
    case 'xls':
      return parseExcelFile(file);
    default:
      throw new ParseError('Unsupported file type. Please upload a CSV or Excel file.');
  }
};

export class DataLoader {
    private static validateHeaders(headers: string[]): void {
        const requiredHeaders = ['Student Name', 'Subject', 'Result'];
        const missingHeaders = requiredHeaders.filter(header => !headers.includes(header));
        
        if (missingHeaders.length > 0) {
            throw new ParseError(`Missing required columns: ${missingHeaders.join(', ')}`);
        }
    }

    public static parseExcelFile(file: File): Promise<{ students: Student[], errors: UploadError[] }> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e: ProgressEvent<FileReader>) => {
                try {
                    const data = new Uint8Array(e.target?.result as ArrayBuffer);
                    const workbook = XLSX.read(data, { type: 'array' });
                    
                    // Assume first sheet
                    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                    const jsonData = XLSX.utils.sheet_to_json(firstSheet);
                    
                    if (jsonData.length === 0) {
                        throw new ParseError('File is empty or has no data rows');
                    }

                    // Validate headers
                    this.validateHeaders(Object.keys(jsonData[0] as object));
                    
                    const studentMap = new Map<string, StudentResult[]>();
                    const errors: UploadError[] = [];
                    
                    jsonData.forEach((row: any, index: number) => {
                        if (row['Student Name'] && row['Subject'] && row['Result'] !== undefined) {
                            const studentName = row['Student Name'];
                            const result: StudentResult = {
                                subject: row['Subject'],
                                rawResult: row['Result'].toString()
                            };
                            
                            const studentResults = studentMap.get(studentName) || [];
                            studentResults.push(result);
                            studentMap.set(studentName, studentResults);
                        } else {
                            errors.push({
                                row: index + 2, // +2 because Excel is 1-based and we have header row
                                message: 'Missing required fields'
                            });
                        }
                    });
                    
                    const students: Student[] = Array.from(studentMap.entries()).map(([name, results]) => ({
                        name,
                        results
                    }));
                    
                    resolve({ students, errors });
                } catch (error) {
                    if (error instanceof ParseError) {
                        reject(error);
                    } else {
                        reject(new ParseError('Failed to parse Excel file'));
                    }
                }
            };
            
            reader.onerror = () => {
                reject(new ParseError('Failed to read file'));
            };
            
            reader.readAsArrayBuffer(file);
        });
    }
} 