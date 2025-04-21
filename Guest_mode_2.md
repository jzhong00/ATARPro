# Phase 2: Handle Missing `cohortData` and Guest-Specific Logic

**Goal:** Ensure the calculator functions correctly without `cohortData` (which guests won't have) and disable/adjust logic specific to logged-in users (like student import).

**Context:** Guest users won't have access to `cohortData` from Redux. The search and cohort export features rely on this. While the UI elements related to these features were hidden in Phase 1, we need to ensure the underlying code doesn't cause errors or unexpected behavior when `isGuestMode` is true.

**Steps:**

1.  **Modify `SingleStudentCalculator.tsx`:**
    *   **Student Search Hook:** Locate the `useStudentSearch` hook call. Pass `undefined` or `null` for the `students` option if `isGuestMode` is true. Example:
        ```typescript
        const { ... } = useStudentSearch({
          students: isGuestMode ? undefined : cohortData?.students,
          // ... other options
        });
        ```
    *   **Cohort Export Hook:** Locate the `useCohortExport` hook call. Similarly, pass `undefined` or `null` for the `students` option if `isGuestMode` is true:
        ```typescript
        const { ... } = useCohortExport({
          students: isGuestMode ? undefined : cohortData?.students,
          // ... other options
        });
        ```
    *   **URL Parameter Effects:** Locate the `useEffect` hooks that handle `triggerExport` and `preloadStudent` URL parameters (around lines 147 and 163).
        *   Add `if (isGuestMode) return;` at the beginning of each effect's callback function to prevent them from running for guests.
    *   **Clear All Functionality:** Review the `handleClearAll` function. The `clearSearchState()` part might try to access refs or state related to the search input (which is hidden). While likely harmless, you could conditionally call it:
        ```typescript
        const handleClearAll = useCallback(() => {
          clearSubjectsAndResults();
          if (!isGuestMode) {
            clearSearchState();
          }
        }, [clearSubjectsAndResults, clearSearchState, isGuestMode]);
        ```

**Testing:**

1.  Repeat the testing steps from Phase 1 (using the temporary `isGuestMode={true}` flag in `App.tsx`).
2.  **Verify:**
    *   All Phase 1 verifications still hold.
    *   Open the browser's developer console.
    *   There should be no new errors related to `cohortData`, `students`, searching, or exporting when loading or interacting with the guest mode calculator.
    *   The "Clear All" button should still clear the subject rows correctly.
3.  Remove the temporary `isGuestMode={true}` from `App.tsx` and verify the normal calculator still works for logged-in users, including search and clear all. 