export interface StudentResult {
    studentName: string;
    subject: string;
    result: string;  // Using string to handle both numeric and letter grades
}

export interface UploadError {
    row: number;
    message: string;
} 