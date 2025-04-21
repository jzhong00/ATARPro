# Phase 1: Introduce `isGuestMode` Prop and Hide UI Elements

**Goal:** Modify `SingleStudentCalculator` to accept an `isGuestMode` prop and conditionally hide the Search, Range Mode controls, Print/Export buttons, and the Scaled Score Chart. Add a promotional container for guest mode.

**Steps:**

1.  **Modify `SingleStudentCalculator.tsx`:**
    *   Add a new prop `isGuestMode?: boolean;` to the component's definition: `const SingleStudentCalculator = ({ isGuestMode = false }: { isGuestMode?: boolean }) => {`. Set a default value of `false`.
    *   Wrap the `div` containing the student search input/suggestions list (starts around line 324) with a conditional render: `{!isGuestMode && ( ... search div ... )}`.
    *   Wrap the `div` containing the "Select Range Mode" label and the conditional "Quick Range" input/button (starts around line 364) with a conditional render: `{!isGuestMode && ( ... range mode controls div ... )}`. (Note: This was found to be directly in `SingleStudentCalculator`, not `ControlsPanel`).
    *   Wrap the `div` containing the `<ScaledScoreChartContainer />` (starts around line 435) with a conditional render: `{!isGuestMode && ( ... chart container div ... )}`.
    *   **Immediately after** the chart's conditional rendering block, add an `else` block for guest mode: `{isGuestMode && ( ... promo container div ... )}`.
        *   Inside this block, add a styled `div` with:
            *   Headline: "Unlock Advanced Features"
            *   Descriptive text about subscription benefits.
            *   A list of features (Search, Range Mode, Print, Export, Charts, etc.).
            *   A "Subscribe Now" button that navigates to `/auth` using `navigate('/auth')`.
    *   Pass the `isGuestMode` prop down to the `ActionButtonsBar` component: `<ActionButtonsBar ... isGuestMode={isGuestMode} />`.

2.  **Modify `src/components/calculators/panels/ActionButtonsBar.tsx`:**
    *   Add `isGuestMode?: boolean;` to its `ActionButtonsBarProps` interface.
    *   Destructure `isGuestMode = false` from the component props.
    *   Wrap the "Print" button (`<button onClick={onPrint} ...>`) with `{!isGuestMode && ( ... print button ... )}`.
    *   Wrap the "Export Cohort" button section (`{!hideExport && ... }`) with an additional check for guest mode: `{!hideExport && !isGuestMode && ( ... export button ... )}`.

**Testing:**

1.  Temporarily modify `src/App.tsx` where `<SingleStudentCalculator />` is rendered within the protected routes (around line 198). Change it to `<SingleStudentCalculator isGuestMode={true} />`.
2.  Run the app and navigate to `/student` (you'll need to be logged in for this test, or modify routes temporarily if needed).
3.  **Verify:**
    *   The student search bar is hidden.
    *   The "Range Mode" checkbox and "Quick Range" input/button are hidden.
    *   The "Print" button is hidden.
    *   The "Export Cohort" button is hidden.
    *   The "Scaled Score Distribution" chart is hidden.
    *   The promotional container with the headline, feature list, and "Subscribe Now" button is visible where the chart used to be.
    *   Clicking the "Subscribe Now" button navigates to the `/auth` page.
    *   The rest of the calculator (subject table, results panel) appears and basic functionality (adding rows, entering results, clearing) still works.
4.  Remove the temporary `isGuestMode={true}` from `App.tsx` and verify the normal calculator view (search, range mode, print, export, chart visible, promo hidden) is restored for logged-in users. 