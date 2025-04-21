import { ColumnDefinition } from '../store/slices/downloadableDataSlice';

/**
 * Escapes a value for CSV if it contains commas, quotes, or newlines.
 * Follows RFC 4180 standards (double quotes for escaping).
 */
const escapeCsvValue = (value: any): string => {
    const stringValue = value === null || value === undefined ? '' : String(value);
    if (/[,"\n\r]/.test(stringValue)) {
        // Enclose in double quotes and double up any existing double quotes
        return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
};

/**
 * Generates a CSV string from data and triggers a browser download.
 * @param filename The desired name for the downloaded file (e.g., "results.csv").
 * @param columns An array of column definitions ({ key: string, header: string }).
 * @param data An array of data objects matching the column keys.
 */
export const exportToCsv = (filename: string, columns: ColumnDefinition[], data: any[]) => {
    if (!data || data.length === 0) {
        console.warn('No data provided for CSV export.');
        // Optionally, alert the user or handle this case differently
        alert('There is no data to export.');
        return;
    }

    // Create header row
    const headerRow = columns.map(col => escapeCsvValue(col.header)).join(',');

    // Create data rows
    const dataRows = data.map(row => {
        return columns.map(col => {
            // Access nested keys if needed (e.g., 'student.name') - basic implementation for now
            // Consider a more robust way to handle nested keys if required later.
            const value = row[col.key];
            return escapeCsvValue(value);
        }).join(',');
    });

    // Combine header and data rows
    const csvString = [headerRow, ...dataRows].join('\r\n');

    // Create Blob and trigger download
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) { // Feature detection
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    } else {
        // Fallback or error for browsers that don't support the download attribute
        console.error('Browser does not support automatic CSV download.');
        alert('Your browser does not support automatic file downloads. Please try a different browser.');
    }
}; 