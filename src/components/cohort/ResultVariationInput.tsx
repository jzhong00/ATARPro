import { useState, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import { setResultVariation } from '../../store/slices/cohortSlice';

const ResultVariationInput = () => {
  const dispatch = useDispatch();
  const currentVariation = useSelector((state: RootState) => state.cohort.filters.resultVariation);
  
  // Local state for the input field value, initialized from Redux store
  const [inputValue, setInputValue] = useState(currentVariation.toString());
  const [validationError, setValidationError] = useState<string | null>(null);

  // Update local state when Redux state changes (e.g., initial load or reset)
  // Note: This might cause a re-render loop if not careful. 
  // A more robust solution might involve useEffect with dependencies.
  // However, for this specific case, it should be fine if the parent component handles conditional rendering.
  if (inputValue !== currentVariation.toString() && validationError === null) {
      setInputValue(currentVariation.toString());
  }

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);

    if (value === '') {
      setValidationError(null);
      // Optionally set a default value (e.g., 0) or leave it, depending on desired behavior
      // dispatch(setResultVariation(0)); 
      return;
    }

    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue < 0 || numValue > 10) {
      setValidationError(numValue < 0 || numValue > 10 ? 'Value must be 0-10' : 'Invalid number');
      return; // Don't dispatch invalid value
    }

    setValidationError(null);
    dispatch(setResultVariation(numValue));
  }, [dispatch]);

  const updateVariation = useCallback((increment: number) => {
    const currentNum = parseFloat(inputValue);
    let newValue = isNaN(currentNum) ? 0 : currentNum; // Default to 0 if input is NaN
    newValue += increment;
    newValue = Math.max(0, Math.min(10, newValue)); // Clamp between 0 and 10
    
    setInputValue(newValue.toString());
    setValidationError(null); // Clear any validation error
    dispatch(setResultVariation(newValue));
  }, [dispatch, inputValue]);

  return (
    // Apply border, padding, shadow, and conditional error border to the main container
    <div className={`flex items-center ml-4 p-2 border rounded-md shadow-sm ${ 
      validationError ? 'border-red-500' : 'border-gray-300'
    }`}>
      <label htmlFor="result-variation" className="mr-2 text-sm text-gray-700 whitespace-nowrap">
        Result Variation: <span className="text-xs text-gray-500">(0-10)</span>
      </label>
      <div className="relative w-20"> 
        <input
          id="result-variation"
          type="number"
          min="0"
          max="10"
          step="1"
          // Remove border/rounding from input, add bg-transparent and focus outline none
          className={`w-full px-2 text-center text-sm bg-transparent focus:outline-none ${ 
            validationError ? 'text-red-600' : 'text-gray-900' // Optionally change text color on error
          }`}
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              (e.target as HTMLInputElement).blur();
            }
          }}
        />
        {/* Spinner buttons */}
        <div className="absolute right-0 top-0 h-full flex flex-col">
          <button 
            className="h-1/2 px-1 text-gray-500 hover:text-gray-700 flex items-center justify-center text-xs"
            onClick={() => updateVariation(1)}
          >
            ▲
          </button>
          <button 
            className="h-1/2 px-1 text-gray-500 hover:text-gray-700 flex items-center justify-center text-xs"
            onClick={() => updateVariation(-1)}
          >
            ▼
          </button>
        </div>
      </div>
      {/* Error message is now outside the bordered container visually, which might be okay or need adjustment */}
      {/* Let's keep it as is first */} 
      {validationError && (
        <p className="ml-2 text-xs text-red-500 whitespace-nowrap self-center">{validationError}</p> // Added self-center
      )}
    </div>
  );
};

export default ResultVariationInput; 