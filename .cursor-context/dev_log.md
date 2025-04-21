# Development Log - ATAR Calculator V3

## Overview
This log tracks the development progress of the ATAR Calculator V3, a greenfield rebuild focusing on clean architecture and maintainability.

## Current Progress

### File Structure and Dependencies
- Initialized project with npm
- Installed required dependencies:
  - `xlsx` and `@types/xlsx` for Excel file handling

### Created Files

#### 1. Types (`src/types/`)
- `cohort.ts`: Core type definitions
  ```typescript
  - Student
  - StudentResult
  - Subject
  - SubjectType
  - ValidationRule
  - CohortData
  - ScalingParameters
  - CohortState
  ```
- `upload.ts`: Upload-specific types
  ```typescript
  - UploadError (for file upload validation)
  ```

#### 2. Services (`src/services/`)
- `dataLoader.ts`: Handles Excel file parsing
  - Implemented `DataLoader` class with `parseExcelFile` method
  - Validates required columns (Student Name, Subject, Result)
  - Groups results by student
  - Provides error handling and validation
- `subjectMappingService.ts`: Manages subject name mappings
  - Loads subject mappings from CSV file
  - Provides display names for subjects
  - Falls back to static mappings if file not available
  - Singleton pattern for app-wide access

#### 3. Components (`src/components/cohort/views/`)
- `UploadView.tsx`: File upload interface
  - Drag-and-drop support
  - Excel file (.xlsx, .xls) upload
  - Clear user instructions
  - Error handling and loading states
  - Redux integration for state management
  - Automatic navigation to results view after successful upload
- `StudentResultsView.tsx`: Displays student data after upload
  - Table with columns:
    - Student Name
    - Subject (mapped to display names)
    - Lower Result (based on variation)
    - Result
    - Upper Result (based on variation)
  - Result Variation input (values 0-10) with validation
  - Dynamic calculation of result ranges
  - Automatic updates when variation changes
  - Redux integration for state management

### Current State

1. **File Upload and Data Processing**
   - Users can upload Excel files via drag-and-drop or file picker
   - Only .xlsx and .xls files are accepted
   - Clear guidance on required file structure
   - Automatic navigation to results view upon successful upload

2. **Data Parsing**
   - Excel files are parsed into structured data
   - Results are grouped by student
   - Basic validation of required fields
   - Error handling for missing or invalid data

3. **Data Display**
   - Student results displayed in a clean table format
   - Subject names mapped to their display names from reference data
   - Result ranges calculated based on subject type:
     - General subjects: Integer results with range calculation (± variation)
     - Applied subjects: Letter grades (A-E) displayed as is
     - VET subjects: Pass/Fail results displayed as is
   - Lower and upper bounds clamped to valid ranges (0-100)
   - Integer precision for General subject results

4. **Result Variation Control**
   - Numeric input field (0-10) for result variation
   - Up/down controls for easy adjustment
   - Input validation to ensure valid range
   - Connected to Redux store for access across components
   - Real-time updates of result ranges when variation changes

5. **State Management**
   - Redux integration for managing application state
   - Loading states during file processing
   - Error handling and display
   - State persistence across view transitions

### Next Steps
1. **Scaling Implementation**
   - Design and implement scaling service
   - Add scaled score calculations for different subject types
   - Add scaled score columns to results view

2. **UI Enhancements**
   - Implement ATAR calculation and display
   - Add download functionality for results
   - Implement school summary view

3. **Calculation Features**
   - Implement TE score calculation
   - Implement ATAR conversion
   - Implement range-based calculations using variation parameter

### Notes for Developers
1. The application follows a clean architecture pattern:
   - Types define the core data structures
   - Services handle business logic
   - Components handle UI and user interaction
   - Redux manages application state

2. Key Design Decisions:
   - Simplified file upload to only require three columns
   - Subject type and validation rules are looked up from reference file
   - Using Redux for state management
   - Separation of display names from internal names

3. Important Files to Reference:
   - `.cursor-context/architecture.md`: Overall architecture design
   - `.cursor-context/dev_guide.md`: Development guidelines and rules
   - `data/Subject_type_and_general_scaling.csv`: Subject reference data
   - `data/applied_vet_scaling.csv`: Applied and VET scaling data
   - `public/data/Subject_type_and_general_scaling.csv`: Copy of subject data for runtime access

## Known Issues and TODOs

### Scaling Function Implementation
- Current implementation in `src/utils/scaling.ts` is using placeholder values and incorrect scaling logic:
  - General subjects: Using linear scaling (raw score = scaled score) instead of the logistic function with a/k parameters from `Subject_type_and_general_scaling.csv`
  - Applied subjects: Using hardcoded values (A=90, B=80, etc.) instead of actual mappings from `applied_and_vet_scaling.csv`
  - VET subjects: Using hardcoded value (Pass=75) instead of actual mappings from `applied_and_vet_scaling.csv`

### Required Fixes
1. Update `calculateScaledScore` to use proper logistic function for General subjects:
   - Load a/k parameters from `Subject_type_and_general_scaling.csv`
   - Implement formula: scaled = 100 / (1 + e^-(ax + k))
   - Where x is the raw score, a and k are subject-specific parameters

2. Update Applied/VET scaling:
   - Load actual mappings from `applied_and_vet_scaling.csv`
   - Use exact scaled scores from the mappings instead of hardcoded values
   - Ensure proper error handling for missing mappings

3. Data Loading:
   - Ensure CSV files are properly loaded and parsed
   - Add validation for required parameters and mappings
   - Add error handling for missing or invalid data 

## Recent Updates

### Scaling Function Improvements
- **Error Handling and Logging:**
  - Introduced development-only logging to reduce console noise in production.
  - Simplified error messages to be more user-friendly and concise.
  - Ensured all critical validation checks are maintained while removing redundant logs.

- **CSV Parsing Enhancements:**
  - Improved CSV parsing by adding `skipEmptyLines` and trimming headers and values.
  - Enhanced null value handling for `a` and `k` parameters in `GeneralScalingParameters`.

- **Code Structure:**
  - Cleaned up the code by removing unnecessary comments and redundant debug logs.
  - Maintained all essential functionality while improving readability and maintainability.

### Next Steps
- Continue monitoring the scaling functionality to ensure stability.
- Further refine logging and error handling as needed based on user feedback.

### TE Score Calculation Enhancements
- Implemented TE score calculation with eligibility checks.
  - Students must have at least 5 General subjects or 4 General subjects with 1 Applied/VET subject to be eligible.
  - TE scores are calculated using the top 5 General scores or top 4 General scores plus the best Applied score.
  - Added 'ATAR Ineligible' status for students not meeting eligibility criteria.
- Implemented TE calculations for Lower TE and Upper TE using lower and upper scaled scores.
  - Lower TE and Upper TE are calculated similarly to TE but using lower and upper scaled scores respectively.
- Updated the StudentResultsView to display TE, Lower TE, and Upper TE scores.
  - Scores are formatted to one decimal place.
  - Eligibility status is clearly indicated in the results table.

### Recent Updates

- Implemented `TE_to_ATAR_conversion` function to convert TE scores to ATAR using a 6th degree polynomial.
- Added handling for 'ATAR Ineligible' cases in the `TE_to_ATAR_conversion` function, returning 'ATAR Ineligible' when applicable.
- Updated `StudentResultsView.tsx` to correctly handle TE scores and display ATAR values, ensuring proper handling of 'ATAR Ineligible' cases.
- Fixed issues related to string and numeric input handling in the conversion logic.

## [11/4 9:53pm] - Scaled Score Chart Implementation

- **Goal:** Replaced placeholder in `SingleStudentCalculator` with an interactive `recharts`-based bar chart visualizing scaled scores.
- **Architecture Adherence:**
  - Created new service `src/services/chartService.ts` containing `prepareScaledScoreChartData` function.
    - This function fetches scaled scores (using `utils/scaling`), calculates dynamic axis bounds (`xAxisMin`, `xAxisMax`), sorts data, and formats it specifically for the chart component.
  - Created new component `src/components/calculators/ScaledScoreChart.tsx`.
    - This component is purely presentational, receiving pre-processed data (`chartData`, `xAxisMin`, `xAxisMax`, `rangeMode`) via props.
    - It renders the `ResponsiveContainer`, `BarChart`, axes, tooltips, and bars.
  - Created new types in `src/types/chart.ts` (`ScaledScoreChartDataPoint`, `ScaledScoreChartProps`) and `src/types/calculator.ts` (`SubjectRow` refactored).
- **Features & Logic:**
  - Displays horizontal bars (subjects on Y-axis, scores on X-axis).
  - Sorts subjects by scaled score (descending).
  - Dynamically calculates X-axis range (`xAxisMin` rounded down to nearest 10, `xAxisMax` rounded up to nearest 10, capped 0-100).
  - Implements two display modes based on `rangeMode` prop:
    - **Non-Range:** Single dark blue bar representing the `middleValue`.
    - **Range:** Stacked bars (transparent base, light blue middle segment, dark blue upper segment) representing `lowerValue` to `upperValue`.
  - Added visual offset (`BAR_VISUAL_OFFSET`) to ensure single-point entries (where lower=middle=upper) are visible as small bars in range mode.
  - Custom, typed tooltip shows subject and relevant scores (lower/middle/upper or just middle).
  - Vertical grid lines enabled and styled.
- **Integration:**
  - `SingleStudentCalculator` uses `useMemo` to call `prepareScaledScoreChartData` based on `subjectRows` and `rangeMode`.
  - Conditionally renders `<ScaledScoreChart>` in the right panel, passing necessary props.
- **Styling:** Added `ScaledScoreChart.css` for basic chart container, tooltip, and gridline styling.
- **Dependencies:** Added `recharts` and `@types/recharts`.
- **TODO:** Add Vitest unit tests for `prepareScaledScoreChartData` in `src/services/chartService.test.ts`.

## [11/4 10:05pm]

- Refactored main calculation logic from `StudentResultsView` into a reusable hook `useCohortCalculatedData`.
- Centralized subject mapping loading in `CohortTabs` to prevent repeated loading in child views. State (`mappingsLoaded`, `mappingError`) is now managed in `CohortTabs` and passed down.
- Created individual view components based on the calculated data:
    - `ResultsTableView`: Displays Student Name, Subject, Result, Scaled, TE, ATAR.
    - `RangedResultsView`: Displays Student Name, Subject, Result Range, Scaled Range, ATAR Range. Includes variation input.
    - `AtarsView`: Displays unique Student Name, TE, ATAR.
    - `RangedAtarsView`: Displays unique Student Name, TE Range, ATAR Range. Includes variation input.
- Updated `CohortTabs` to dynamically render the appropriate view component based on the active tab.
- Implemented table sorting functionality in all four view components (`ResultsTableView`, `RangedResultsView`, `AtarsView`, `RangedAtarsView`):
    - Added state for `sortKey` and `sortOrder`.
    - Implemented `useMemo` for sorting data based on state.
    - Created `handleSort` function for header clicks.
    - Added `parseValueForSort` helper to handle numeric/string/range/special value comparisons (treating non-numeric as 0).
    - Updated `renderSortArrow` helper to show default `↕` indicator and active `▲`/`▼` indicators.
- Restored `Upload Data` and `School Summary` tabs in `CohortTabs` using placeholders.
- Fixed UI issues related to placeholder rendering in `CohortTabs`.

## [11/4 10:05pm] - Continued

- **Default Table Sorting Update:**
    - Updated the `useSortableTable` hook to accept an `initialSortCriteria` array, replacing `initialSortKey` and `initialSortOrder`.
    - Configured default sorting for the four main table views:
        - `ResultsTableView`: Student Name (asc) primary, Scaled (desc) secondary.
        - `RangedResultsView`: Student Name (asc) primary, Scaled Range (desc) secondary.
        - `AtarsView`: Student Name (asc) primary only.
        - `RangedAtarsView`: Student Name (asc) primary only.

## 9 April 2025

- **Multi-Column Sorting:**
    - Refactored `useSortableTable` hook (`src/hooks/useSortableTable.tsx`) to support persistent, multi-column sorting.
    - State now holds an array of `sortCriteria` ({ key, order }) instead of single `sortKey`/`sortOrder`.
    - `handleSort` updated to prepend new keys or toggle primary key order.
    - Sorting logic in `sortedData` memo now iterates through `sortCriteria` to break ties.
    - `renderSortArrow` updated to only show direction for the primary sort column.
    - Updated components using the hook (implicitly, as the hook's return signature changed but usage was adapted).

- **School Summary View Implementation:**
    - Created `SchoolSummaryView.tsx` component (`src/components/cohort/views/SchoolSummaryView.tsx`).
    - Enabled routing for the view in `CohortCalculator.tsx`.
    - Used `useCohortCalculatedData` hook to fetch data.
    - Implemented logic to calculate:
        - Total ATAR eligible students.
        - Median ATAR.
        - ATAR distribution across thresholds (99, 95, 90, 80, 70, 60).
    - Built UI matching the design spec (cards for count/median, distribution table), excluding CSV download and duplicate header.
    - Handled loading, error, and empty states.

- **UI Refinements & Bug Fixes:**
    - **Variation Input Arrows:** Identified and fixed double arrows on `type="number"` inputs in `RangedResultsView` and `RangedAtarsView` by adding CSS in `src/index.css` to hide default browser spinners (`::-webkit-outer-spin-button`, `::-webkit-inner-spin-button`, `-moz-appearance: textfield`).
    - **Variation Input Enter Key:** Added `onKeyDown` handler to variation inputs in `RangedResultsView` and `RangedAtarsView` to `blur()` the input field when the Enter key is pressed, improving UX.

- **Code Redundancy Refactor (ATAR Calculation):**
    - Identified duplication in the logic used to call `TE_to_ATAR_conversion` and handle results/errors across multiple view components.
    - **Centralized Logic:**
        - Created new utility functions `calculateAndFormatAtar` and `calculateAndFormatAtarRange` in `src/utils/teCalculator.ts` to encapsulate the full process (eligibility check, parsing, conversion, error handling, formatting).
        - Refactored `useCohortCalculatedData` hook to use these new utilities.
The hook now calculates and returns display-ready `displayAtar` and `displayAtarRange` values within its `processedStudentScores` object and `tableData` rows.
    - **Simplified Views:**
        - Removed local ATAR/range calculation logic (`useMemo` blocks, direct calls to `TE_to_ATAR_conversion`) from `AtarsView.tsx`, `RangedResultsView.tsx`, `RangedAtarsView.tsx`, and `SchoolSummaryView.tsx`.
        - Updated these views to directly use the pre-calculated `displayAtar` / `displayAtarRange` fields provided by the refactored `useCohortCalculatedData` hook.
    - **Bug Fix:** Corrected a runtime error (`TypeError: Cannot read properties of undefined`) in `ResultsTableView.tsx` caused by the refactor, ensuring it correctly accessed the updated data structure from the hook. 

## 9/4/25 10:21pm

- **Student Search Functionality (Multi-Select Filter):**
    - Added a student search input below the main tabs in `CohortCalculator.tsx`.
    - Implemented multi-select functionality allowing users to filter for multiple specific students.
    - Search uses autocomplete suggestions based on unique student names in the loaded cohort data.
    - Selected students are displayed as "pills" in the search input area.
    - Each pill has an "X" button to remove that student from the filter.
    - Pressing Backspace when the input is empty removes the last added student pill.
    - Updated Redux state (`cohortSlice.ts`) to store an array of `selectedStudentNames` instead of a single `searchQuery`.
    - Added Redux actions (`addSelectedStudent`, `removeSelectedStudent`, `clearSelectedStudents`) to manage the selected names array.
    - Modified all four main view components (`ResultsTableView`, `RangedResultsView`, `AtarsView`, `RangedAtarsView`) to filter data based on the `selectedStudentNames` array from Redux.
    - Updated empty state and footer messages in view components to reflect the multi-select filter status.
    - Input field now blurs on Enter press.
    - Adjusted search input width to half of its container.
    - Relocated "Clear Data" button from `CohortTabs.tsx` to `CohortCalculator.tsx`, placing it on the same row as the search input, justified right.
- **Linter Fix:** Resolved a transient module resolution error for `SchoolSummaryView` by restarting the TS Server. 

## 10 April 2025

- **Single Student Calculator Initialization:**
    - Reviewed project context documents (`.cursor-context/`) to understand requirements for the Single Student Calculator.
    - Discussed UI mockup for Single Student Calculator and its integration points with the Cohort Calculator.
    - Defined a phased development plan for the `SingleStudentCalculator` component.
    - Created the initial component file `src/components/calculators/SingleStudentCalculator.tsx`.
    - Implemented the basic static layout structure (JSX with Tailwind CSS) in `SingleStudentCalculator.tsx`, mirroring the mockup's functional areas (controls, import, input table, summary, graph placeholder) and aligning with the app's visual style.

**10 April 2025 - 3:52pm**

*   **Component:** `src/components/calculators/SingleStudentCalculator.tsx`
*   **Summary:** Implemented core state management and input handling for the subject results table.
*   **Details:**
    *   Initialized `subjectRows` state using `useState`, based on `StudentResult` type plus a unique `id`.
    *   Implemented dynamic table row rendering via `map`.
    *   Added `handleAddRow` and `handleDeleteRow` functions.
    *   Created common components `src/components/common/SubjectInput.tsx` and `src/components/common/ResultInput.tsx`.
    *   Integrated `subjectMappingService`:
        *   Loaded mappings asynchronously in `useEffect`.
        *   Added `getMappingByDisplayName` method to service for flexible lookup.
    *   Implemented `SubjectInput` using `<datalist>` populated from `subjectMappingService`, ensuring display names (`Subject_display`) are shown and used as the primary value.
    *   Implemented `ResultInput` validation logic based on `validationRule` prop fetched via `subjectMappingService`.
    *   Refined `handleSubjectChange` to correctly resolve display names (including those with asterisks), fetch validation rules, clear results, and handle empty inputs/clearing.
    *   Added `onKeyDown` handler to `SubjectInput` to improve Backspace clearing and ensure Enter key processes the input.
*   **Next Steps:** Implement calculation logic (Scaled Scores, TE, ATAR). 

## 10 April 2025 - 4:43pm

- **Single Student Calculations (Scaling & TE/ATAR):**
  - **Scaling:**
    - Added `useEffect` to load scaling data using `loadScalingData` on mount, tracking state with `isScalingDataLoaded` and `scalingDataError`.
    - Implemented `scaledScoresMap` `useMemo` hook:
      - Depends on `subjectRows` and `isScalingDataLoaded`.
      - Uses `subjectMappingService.getMappingByDisplayName` to get the mapping.
      - Includes helper function `parseAndScale` to parse `lowerResult`, `rawResult`, `upperResult` based on `validationRule` and call `calculateScaledScore` with the *canonical* subject name.
      - Stores results in map: `Map<string, { lower: ScalingResult | null, result: ScalingResult | null, upper: ScalingResult | null }>`. 
    - Updated table display to show scaled score/range based on `rangeMode` and the new `scaledScoresMap` structure, handling errors/nulls.
  - **TE/ATAR:**
    - Added state `teScore`, `atar`.
    - Implemented `calculatedTotals` `useMemo` hook:
      - Depends on `scaledScoresMap`, `subjectRows`, `rangeMode`.
      - Extracts valid `scaledScore`, `lowerScaledScore`, `upperScaledScore`, and `subjectType` from `scaledScoresMap`.
      - Calls `calculateStudentTEScores` with the extracted scores.
      - Calls `calculateAndFormatAtarRange` or `calculateAndFormatAtar` based on `rangeMode`.
      - Formats TE display string based on `rangeMode`.
    - Added `useEffect` to update `teScore`/`atar` state from `calculatedTotals`.
    - Updated summary table to display `teScore`/`atar` (or ranges).
  - **TE Calculation Bug Fix:**
    - Identified bug in `calculateStudentTEScores` (`teCalculator.ts`) where VET scores were ignored in the Top 4+1 rule.
    - Fixed `calculateStudentTEScores` by refactoring the inner calculation helper to correctly find `max(bestApplied, bestVet)` and use the appropriate score set (lower/result/upper) for each bound calculation. 

## 11 April 2024 18:17

- **Single Student Calculator Enhancements (`src/components/calculators/SingleStudentCalculator.tsx`)**:
    - **Result Input Buttons:** Added increment/decrement buttons directly within the `ResultInput` component (`src/components/common/ResultInput.tsx`).
        - Logic handles numeric (`0-100`), grade (`A-E`), and pass/fail (`Pass`) validation rules correctly.
        - Uses SVGs for small triangle buttons.
    - **Range Input:**
        - Modified the numeric "Range" input (for Quick Range) to allow clearing (backspace sets value to null instead of 0).
        - Added increment/decrement buttons to the "Range" input (0-20 bounds).
    - **Quick Range Button:** Implemented the `onClick` functionality:
        - Applies the numeric `rangeValue` (defaults to 0 if empty) to `rawResult` for General subjects (`0-100`) to calculate `lowerResult` and `upperResult`, clamping between 0-100.
        - If `rawResult` for a General subject is invalid/empty, its `lowerResult` and `upperResult` remain unchanged.
        - For Applied/VET subjects (`A-E`, `Pass`), sets `lowerResult` and `upperResult` equal to `rawResult`.
    - **Clear Button:** Implemented the `onClick` functionality:
        - Resets subject rows to 6 empty rows.
        - Clears calculated TE/ATAR values.
        - Clears the "Search student to import..." input field (state added for this).
        - Does *not* reset Range Mode checkbox or Range input value. 

## 2024-04-11 19:10

-   **SingleStudentCalculator:**
    -   Implemented student search/import functionality using cohort data from Redux.
    -   Added a searchable dropdown with autocomplete for student names.
    -   Added an "Import" button that appears when a student is selected.
    -   Implemented the "Import" button functionality:
        -   Fetches selected student's results from cohort data.
        -   Calculates lower/upper results based on cohort's `resultVariation`.
        -   Populates the calculator rows with imported data.
        -   Sorts imported subjects by scaled score (descending) before populating.
    -   Updated the search input placeholder text to be conditional based on cohort data availability. 

## 11 April 2024 9:14pm

- **SingleStudentCalculator - Rubber-Band Logic Implementation:**
    - **Goal:** Implement 'Rubber-Band Logic' to enforce `L <= R <= U` constraints for Lower/Result/Upper inputs in the Single Student Calculator, specifically for 'General' and 'Applied' subjects (not 'VET').
    - **Challenge Addressed:** Prevented incorrect adjustments caused by intermediate values during user typing (e.g., typing '81' triggering logic on '8').
    - **Approach:** Decided to trigger logic `onBlur` instead of `onChange` for robustness and simplicity, after discussing UX trade-offs (live feedback vs. guaranteed final value).
    - **Utility Function:** Created `src/utils/rubberband.ts` with `applyRubberBandConstraints` function.
        - Handles parsing/validation for numeric (0-100) and grade (A-E) inputs.
        - Implements cascading adjustment rules (e.g., L affecting R, then R affecting U).
        - Converts values back to strings for state updates.
        - Ignores 'VET' subjects.
    - **ResultInput Component (`src/components/common/ResultInput.tsx`):**
        - Added internal state (`inputValue`) to manage typing independently.
        - Added `onBlur` prop.
        - Updated `handleChange` to only modify internal state.
        - Added `handleBlur` to validate/normalize the final value and call the parent's `onBlur` prop.
        - Modified increment/decrement handlers to update internal state and call `onBlur` directly.
        - Updated validation effect to work with internal state.
    - **SingleStudentCalculator Component (`src/components/calculators/SingleStudentCalculator.tsx`):**
        - Updated `handleLowerResultChange`, `handleResultChange`, `handleUpperResultChange` type signatures to accept `string | null`.
        - Modified JSX to pass these handlers to the `ResultInput`'s `onBlur` prop (passing a no-op to `onChange`).
        - Integrated `applyRubberBandConstraints` call within the handlers, checking subject type before applying. 

## [11/4 10:05pm] - Single Student Calculator Import/Clear Logic

- **Goal:** Improve user experience in `SingleStudentCalculator` when importing students.
- **Changes:**
    - Created `clearSubjectsAndResults` helper function to reset subject rows, TE/ATAR, and range mode state.
    - Modified `handleImportStudentData` to call `clearSubjectsAndResults` at the beginning, ensuring previous results are cleared before importing new ones.
    - Modified `handleSearchInputChange` to call `clearSubjectsAndResults` whenever the user starts typing in the search box if a student was previously selected (`selectedStudentName` is not null). This provides immediate feedback by clearing old results.
    - Adjusted function order to define `clearSubjectsAndResults` before `handleImportStudentData` to resolve linter warnings related to `useCallback` dependencies. 