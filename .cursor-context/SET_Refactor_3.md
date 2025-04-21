# Phase 3: Testing and Refinement

*   **Goal:** Ensure the new services (`setPlanCalculationService`, `scalingService`, `exportService`) are robust and verify their logic with unit tests, confirming adherence to architectural rules.
*   **Steps:**
    1.  **Write Unit Tests:**
        *   Create corresponding `.test.ts` or `.spec.ts` files for `setPlanCalculationService.ts`, `scalingService.ts`, and `exportService.ts` alongside the service files.
        *   Use Vitest (Rule 8) and mock data (Rule 9) for testing.
        *   **`setPlanCalculationService.test.ts`:** Test `getResultRangeFromRank`, `parseResultRange`, `formatDisplayScaledScore`, and any other public methods. Cover scenarios for General, Applied, and VET subjects, various rank inputs, and edge cases.
        *   **`scalingService.test.ts`:** Test `calculateScaledScore` by mocking the underlying utility or providing known input/output pairs based on the utility's expected behavior.
        *   **`exportService.test.ts`:** Test `generateSetPlanPdf`. Mock dependencies like `preparePdfSubjectData` and `generateStudentPDF`. Verify that these utilities are called with correctly transformed/prepared data based on the input `SetPlanPdfData`.
    2.  **Review and Refine:**
        *   Review the refactored `SETPlanCalculator.tsx` component and the newly created/modified service files (`setPlanCalculationService.ts`, `scalingService.ts`, `exportService.ts`).
        *   Ensure clarity, proper dependency injection (passing services/data via parameters), and adherence to all rules from `.cursor-context/cursorrules.json` (naming, comments, etc.).
        *   Confirm that no business logic remains directly within the component.
        *   Confirm that no direct utility calls bypass the service layer.
*   **Outcome:** Increased confidence in the refactored logic through comprehensive unit testing. The codebase fully aligns with the defined architectural rules (separation of concerns, service layer usage, testability). 