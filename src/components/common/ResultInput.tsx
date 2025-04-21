import React, { useState, useEffect } from 'react';

interface ResultInputProps {
  value: string | null;
  onChange: (value: string) => void;
  onBlur: (value: string | null) => void;
  validationRule: string | null;
  rangeMode?: boolean;
}

// Define the grade order for increment/decrement
const gradeOrder: string[] = ['E', 'D', 'C', 'B', 'A'];

const ResultInput: React.FC<ResultInputProps> = ({ value, onChange, onBlur, validationRule, rangeMode = false }) => {
  // Internal state to manage the input value during typing
  const [inputValue, setInputValue] = useState<string>(value ?? '');
  const [isValid, setIsValid] = useState(true);
  const [internalValue, setInternalValue] = useState<string | null>(value);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Effect to sync internal state when the external value prop changes
  useEffect(() => {
    setInputValue(value ?? '');
  }, [value]);

  // Effect to validate the *internal* value as the user types
  useEffect(() => {
    if (inputValue === null || inputValue === '') {
        setIsValid(true);
        return;
    }

    let currentValidity = true;
    const trimmedValue = inputValue.trim();

    switch (validationRule) {
      case '0 - 100':
        const num = Number(trimmedValue);
        currentValidity = !isNaN(num) && num >= 0 && num <= 100;
        break;
      case 'A - E':
        // Allow partial typing like 'a'
        currentValidity = /^[a-e]$/i.test(trimmedValue);
        break;
      case 'Pass':
        // Allow partial typing like 'p', 'pa', 'pas'
        currentValidity = /^p$|^pa$|^pas$|^pass$/i.test(trimmedValue);
        break;
      default:
        currentValidity = true;
        break;
    }
    setIsValid(currentValidity);
    // We don't call onChange/onBlur here, just validate display
  }, [inputValue, validationRule]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    // Update internal state only
    setInputValue(event.target.value);
    // Optionally call original onChange if needed for other purposes, but it won't trigger rubber band
    // onChange(event.target.value);
  };

  // New blur handler
  const handleBlur = () => {
    // Validate final value on blur
    const trimmedValue = inputValue.trim();
    let finalValue: string | null = trimmedValue;
    let finalValidity = true;

    switch (validationRule) {
      case '0 - 100':
        const num = Number(trimmedValue);
        if (trimmedValue === '' || trimmedValue === null) {
            finalValue = null;
            finalValidity = true;
        } else if (isNaN(num) || num < 0 || num > 100) {
            finalValue = trimmedValue; // Keep invalid input for display
            finalValidity = false;
        } else {
            finalValue = String(num); // Normalize valid number
            finalValidity = true;
        }
        break;
      case 'A - E':
        const upperGrade = trimmedValue.toUpperCase();
        if (trimmedValue === '' || trimmedValue === null) {
            finalValue = null;
            finalValidity = true;
        } else if (gradeOrder.includes(upperGrade)) {
            finalValue = upperGrade; // Normalize to uppercase
            finalValidity = true;
        } else {
            finalValue = trimmedValue;
            finalValidity = false;
        }
        break;
      case 'Pass':
         if (trimmedValue === '' || trimmedValue === null) {
            finalValue = null;
            finalValidity = true;
         } else if (/^pass$/i.test(trimmedValue)) {
            finalValue = 'Pass'; // Normalize casing
            finalValidity = true;
         } else {
            finalValue = trimmedValue;
            finalValidity = false;
         }
        break;
      default:
        finalValue = trimmedValue === '' ? null : trimmedValue;
        finalValidity = true;
        break;
    }

    setIsValid(finalValidity); // Update final validity state
    setInputValue(finalValue ?? ''); // Update internal input display value (e.g., for normalization)

    // Call the parent's onBlur handler with the potentially normalized/validated final value
    if (value !== finalValue) { // Only call if the value actually changed from parent perspective
        onBlur(finalValue);
    }
  };

  const handleIncrement = () => {
    let currentValue = inputValue.trim();
    let nextValue = currentValue;

    switch (validationRule) {
      case '0 - 100': {
        const num = parseInt(currentValue);
        const nextNum = !isNaN(num) ? Math.min(num + 1, 100) : 0; // Default to 0 if invalid/empty
        nextValue = String(nextNum);
        break;
      }
      case 'A - E': {
        const upperCaseValue = currentValue.toUpperCase();
        const currentIndex = gradeOrder.indexOf(upperCaseValue);
        if (currentIndex === -1 && currentValue === '') {
          nextValue = gradeOrder[0]; // Start from 'E' if empty
        } else if (currentIndex !== -1 && currentIndex < gradeOrder.length - 1) {
          nextValue = gradeOrder[currentIndex + 1];
        }
        break;
      }
      case 'Pass': {
        if (currentValue === '') {
          nextValue = 'Pass';
        }
        break;
      }
    }

    if (nextValue !== currentValue) {
      setInputValue(nextValue); // Update internal state
      // Call onBlur directly as this is a discrete change
      onBlur(nextValue);
      // Optionally call original onChange
      // onChange(nextValue);
    }
  };

  const handleDecrement = () => {
    let currentValue = inputValue.trim();
    let prevValue: string | null = currentValue;

    switch (validationRule) {
      case '0 - 100': {
        const num = parseInt(currentValue);
        const prevNum = !isNaN(num) ? Math.max(num - 1, 0) : 0; // Default to 0 if invalid
        if (!isNaN(num) && num === 0) {
            prevValue = null; // Allow decrementing from 0 to empty
        } else {
            prevValue = String(prevNum);
        }
        break;
      }
      case 'A - E': {
        const upperCaseValue = currentValue.toUpperCase();
        const currentIndex = gradeOrder.indexOf(upperCaseValue);
        if (currentIndex > 0) {
          prevValue = gradeOrder[currentIndex - 1];
        } else if (currentIndex === 0) {
            prevValue = null; // Decrementing from 'E' goes to empty/null
        }
        break;
      }
      case 'Pass': {
        if (/^pass$/i.test(currentValue)) {
          prevValue = null; // Decrementing from Pass goes to empty/null
        }
        break;
      }
    }

    const finalPrevValue = prevValue === null ? null : String(prevValue);

    if (finalPrevValue !== currentValue) {
      setInputValue(finalPrevValue ?? ''); // Update internal state
      // Call onBlur directly as this is a discrete change
      onBlur(finalPrevValue);
      // Optionally call original onChange
      // onChange(finalPrevValue ?? '');
    }
  };

  const inputClasses = [
    // Reduced right padding to make space for buttons
    "w-full pl-2 pr-6 py-1 border rounded shadow-sm text-sm",
    (!isValid && inputValue !== '')
      ? "border-red-500 text-red-700 focus:border-red-500 focus:ring-red-500"
      : "border-gray-300 focus:border-blue-500 focus:ring-blue-500",
  ].join(' ');

  // Disable buttons if validationRule is null or unrecognized
  const buttonsDisabled = !validationRule;

  return (
    <div className="relative w-full">
      <input
        type="text"
        value={inputValue}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={rangeMode ? "Enter Result..." : "Result..."}
        className={inputClasses}
        aria-invalid={!isValid}
        style={{ fontSize: '0.875rem' }}
      />
      {/* Buttons Container - Only show if there is a validation rule */}
      {validationRule && (
        <div className="absolute inset-y-0 right-0 flex flex-col items-center justify-center pr-1">
          {/* Increment Button (Up Triangle) */}
          <button
            type="button"
            onClick={handleIncrement}
            disabled={buttonsDisabled}
            className="h-1/2 w-5 flex items-center justify-center text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Increment result"
            tabIndex={-1} // Prevent tabbing to buttons
          >
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 6l-4 4h8z" />
            </svg>
          </button>
          {/* Decrement Button (Down Triangle) */}
          <button
            type="button"
            onClick={handleDecrement}
            disabled={buttonsDisabled}
            className="h-1/2 w-5 flex items-center justify-center text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Decrement result"
            tabIndex={-1} // Prevent tabbing to buttons
          >
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 14l-4 -4h8z" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};

export default ResultInput; 