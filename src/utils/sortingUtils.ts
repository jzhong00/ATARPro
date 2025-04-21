// Utility function to parse values for robust sorting, handling strings, numbers, ranges, and specific keywords.
export const parseValueForSort = (value: any): number => {
    if (value === null || value === undefined || value === "N/A" || value === "ATAR Ineligible") {
        return -Infinity; // Ensure N/A, Ineligible are consistently sorted low (or high if needed)
    }
    if (typeof value === 'number') {
        return value;
    }
    if (typeof value === 'string') {
        // Check for ranges like "X - Y"
        const rangeMatch = value.match(/^(-?\d*\.?\d+)\s*-\s*(-?\d*\.?\d+)$/);
        if (rangeMatch && rangeMatch[1]) {
            const lowerBound = parseFloat(rangeMatch[1]);
            return isNaN(lowerBound) ? -Infinity : lowerBound; // Sort ranges by lower bound
        }
        // Try parsing as float
        const num = parseFloat(value);
        if (!isNaN(num)) {
            return num;
        }
        // Handle specific strings like "Pass", "Invalid TE", "Calculation Error"
        // Assigning very low numbers ensures they sort below actual numeric values.
        const lowerCaseValue = value.toLowerCase();
        if (lowerCaseValue === 'pass') {
             return -Infinity + 1; // Slightly above the absolute bottom
        }
        if (lowerCaseValue === 'invalid te' || lowerCaseValue === 'calculation error') {
            return -Infinity + 2; // Slightly higher
        }
        // If it's a non-numeric string not handled above, treat as very low
        return -Infinity;
    }
    return -Infinity; // Default for other types
}; 