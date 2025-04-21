# Phase 5: Cleanup and Refinement (Optional)

**Goal:** Optimize the `SingleStudentCalculator` for guest mode by conditionally excluding hooks and logic that are completely unused by guests.

**Context:** While the previous phases achieved the functional goal by hiding UI and preventing errors, the code for guest users still *includes* and potentially *initializes* hooks related to search (`useStudentSearch`), cohort export (`useCohortExport`), and export modals (`useExportModals`), even though they aren't used. This phase makes the guest mode slightly more efficient and cleaner by avoiding this unused logic.

**Steps:**

1.  **Modify `SingleStudentCalculator.tsx`:**
    *   **Conditionally Call Hooks:** Instead of just passing `undefined` to hooks like `useStudentSearch` and `useCohortExport`, we can avoid calling them altogether in guest mode. React hooks **must** be called unconditionally at the top level, so we *cannot* simply wrap them in `if (!isGuestMode) { ... }`. The standard way to handle this is to create a small wrapper component or move the hook call into a sub-component that is only rendered for logged-in users.

        *Alternative (Simpler if hooks are self-contained):* If the hooks are designed to handle `null`/`undefined` inputs gracefully and essentially become no-ops (doing minimal work), the changes in Phase 2 might be sufficient. However, truly skipping the hook execution is cleaner.

        *Recommended Approach (if feasible):* Create internal components for features that need these hooks.
        Example Sketch (Conceptual - requires refactoring):
        ```typescript
        // Inside SingleStudentCalculator
        
        // ... other state and base hooks (useSubjectRows, useTeAtarCalculator, etc.) ...
        
        return (
          <div className="...">
            {/* ... common layout ... */} 
            
            {!isGuestMode && 
              <StudentSearchAndExportFeatures 
                cohortData={cohortData} 
                resultVariation={resultVariation}
                subjectMappingService={subjectMappingService}
                isScalingDataLoaded={isScalingDataLoaded}
                // Pass necessary callbacks like setRowsFromData, clearSubjectsAndResults
                onStudentImport={setRowsFromData}
                onClearResults={clearSubjectsAndResults} 
                chartContainerRef={chartContainerRef} // If needed by print
                subjectRows={subjectRows} // If needed by print
                scaledScoresMap={scaledScoresMap} // If needed by print
                rangeMode={rangeMode} // If needed by print
                atar={atar} // If needed by print
                teScore={teScore} // If needed by print
              />
            }
            
            {/* ... rest of the UI like SubjectTable, ResultsPanel, Chart ... */} 
            {/* These parts use the base hooks */} 
            
          </div>
        );
        
        // Define StudentSearchAndExportFeatures component in the same file or separate
        const StudentSearchAndExportFeatures = (props) => {
          // Now, call the hooks *inside* this component
          const { handlePrint, isPrinting } = usePrintLogic(props); // Custom hook extracting print logic
          const { handleCohortExport, isCohortExporting, ... } = useCohortExportAndModals(props); // Custom hook combining export + modals
          const { handleSearchInputChange, ... } = useStudentSearch(props);
          
          return (
            <>
              {/* Render the search bar UI here */}
              {/* Render the ActionButtonsBar here, passing props like isPrinting, isCohortExporting, handlePrint, handleCohortExport */}
              {/* Render the ConfirmationModals here */}
            </>
          );
        };
        ```
        (This is a significant refactor and might be overkill if Phase 2 is deemed sufficient).

    *   **Review Other Logic:** Double-check if any other minor logic (state variables like `isPrinting`, helper functions only used by hidden features) can be conditionally defined or avoided if `isGuestMode` is true.

**Testing:**

1.  Thoroughly re-test **both** the guest mode (`/guest-calculator`) and the logged-in mode (`/student`).
2.  **Verify (Guest Mode):**
    *   All previous guest mode functionality works as expected.
    *   Check the browser's developer console for any new errors.
    *   Optionally, use React DevTools to inspect the component tree and verify that hooks related to search/export are not active.
3.  **Verify (Logged-in Mode):**
    *   All previous logged-in functionality works (search, import, range mode, print, export, clear all).
    *   Check the console for errors.

**Note:** This phase provides refinement. If the complexity of refactoring (like creating wrapper components for hooks) is high, you might decide to stick with the outcome of Phase 4, as the functional goal is already met. 