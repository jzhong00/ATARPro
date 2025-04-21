# Phase 1: Centralize Calculation and Formatting Logic

*   **Goal:** Move the helper functions related to calculating/determining scaled scores, result ranges, and formatting display strings out of the `SETPlanCalculator.tsx` component and into a dedicated service.
*   **Steps:**
    1.  Create a new service file: `src/services/setPlanCalculationService.ts`.
    2.  Add the standard file header comment: `// ATAR Calculator – Greenfield architecture: follow utils/services/components separation and avoid legacy patterns.`
    3.  Move the following functions from `SETPlanCalculator.tsx` into `setPlanCalculationService.ts`:
        *   `getScaledScoreForResult`
        *   `getResultRangeFromRank`
        *   `parseResultRange`
        *   `getAppliedVetScaledRange`
    4.  Create a new function in `setPlanCalculationService.ts`, named `formatDisplayScaledScore`, encapsulating the logic from the component's `getFormattedScaledScore` function.
    5.  Refactor the moved functions and the new `formatDisplayScaledScore` in the service to accept necessary data (e.g., `row`, `scaledScoresMap`, subject type, `subjectMappingService`) as parameters instead of relying on component scope or hooks. Note that `getScaledScoreForResult` will temporarily call the `calculateScaledScore` utility directly.
    6.  In `SETPlanCalculator.tsx`:
        *   Import the new `setPlanCalculationService`.
        *   Remove the helper functions that were moved (`getScaledScoreForResult`, `getResultRangeFromRank`, `parseResultRange`, `getAppliedVetScaledRange`).
        *   Update `handleRankChange` to call the relevant methods from `setPlanCalculationService` (`getResultRangeFromRank`, `parseResultRange`).
        *   Update the component's `getFormattedScaledScore` function to primarily call `setPlanCalculationService.formatDisplayScaledScore`, passing in the required arguments.
*   **Outcome:** The component becomes leaner. Calculation and formatting logic is centralized in `setPlanCalculationService.ts`, adhering better to Rule 1 & 15. The app should remain functional. A temporary violation of Rule 2 (direct utility call from the new service) persists, to be addressed in Phase 2. 