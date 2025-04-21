# Phase 2: Introduce Service Layer for Utilities & Exporting

*   **Goal:** Eliminate direct calls to utility functions (`calculateScaledScore`, `preparePdfSubjectData`, `generateStudentPDF`) from the component and the `setPlanCalculationService`. Encapsulate PDF generation logic.
*   **Steps:**
    1.  **Create/Identify Services:**
        *   Ensure `src/services/scalingService.ts` exists (create if necessary with standard header). Add a method, e.g., `calculateScaledScore(subject: string, result: string | number): ScalingResult`, that wraps the call to the `calculateScaledScore` utility function from `src/utils/scaling.ts`.
        *   Ensure `src/services/exportService.ts` exists (create if necessary with standard header).
    2.  **Refactor `setPlanCalculationService`:**
        *   Import `scalingService` into `setPlanCalculationService.ts`.
        *   Modify the internal `getScaledScoreForResult` function (and any other function calling the utility, like `getAppliedVetScaledRange`) within `setPlanCalculationService.ts` to use `scalingService.calculateScaledScore` instead of the utility function directly.
    3.  **Refactor PDF Generation:**
        *   In `exportService.ts`, create a new method, e.g., `generateSetPlanPdf(data: SetPlanPdfData)`. Define an appropriate interface `SetPlanPdfData` containing fields like `subjectRows`, `scaledScoresMap`, `chartContainerElement`, `atarRange`, `teScoreRange`, `pdfStudentName`, `explanatoryText`, `imagePath`, etc.
        *   Move the logic from `handlePrint` in `SETPlanCalculator.tsx` responsible for preparing `pdfSubjectResults` (using `preparePdfSubjectData`) and calling `generateStudentPDF` into this new `exportService.generateSetPlanPdf` method. The service method will call the utilities internally.
    4.  **Update Component (`SETPlanCalculator.tsx`):**
        *   Import `exportService`.
        *   Simplify the `handlePrint` function:
            *   Set `isPrinting` state.
            *   Gather all necessary data required by `exportService.generateSetPlanPdf` into a `SetPlanPdfData` object.
            *   Call `exportService.generateSetPlanPdf(data)`.
            *   Handle the success/error result and reset `isPrinting`.
        *   Remove the direct imports for `preparePdfSubjectData` and `generateStudentPDF` utilities.
        *   Ensure the `calculateScaledScore` utility is no longer imported or called directly anywhere in the component.
*   **Outcome:** Direct calls to utilities from the component and services are removed, satisfying Rule 2. PDF generation logic is cleanly encapsulated in `exportService`. The app should still function correctly. 