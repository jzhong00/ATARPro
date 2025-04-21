# Phase 3: Removing Old Logic & Cleanup

**Goal:** Remove all the old, complex authentication logic and state variables from `App.tsx`, leaving only the new, simplified implementation based on `onAuthStateChange` and the `isLoadingAuth`, `session`, `userProfile` states (after renaming).

**Prerequisite:** Phase 2 completed successfully. The application's authentication flow is correctly driven by the new state variables passed to `ProtectedRoute`.

**Steps:**

1.  **Remove Old State Variables in `App.tsx`:**
    *   Delete the state variable declarations for `loadingAuth`, `loadingProfile`.
    *   Delete the `profileLoadedRef`.
    *   Rename `newSession` to `session` and `newUserProfile` to `userProfile` (and update their respective setter functions `setNewSession` -> `setSession`, `setNewUserProfile` -> `setUserProfile`). Update all usages within the `useEffect` and component body.
    *   *Alternative:* If you kept the original `session` and `userProfile` state and updated them in Phase 1, you can now delete the temporary `newSession` and `newUserProfile` states.

2.  **Simplify the Authentication `useEffect` in `App.tsx`:**
    *   Remove the entire `setTimeout` wrapper.
    *   Remove the manual `supabase.auth.getSession()` call and its `.then()`/`.catch()` block.
    *   Remove the `isMounted` variable declaration and all checks using it.
    *   Remove any remaining logic that sets the old `loadingAuth` or `loadingProfile` states.
    *   Remove any logic that reads or writes to `profileLoadedRef`.
    *   Change the dependency array of the `useEffect` from `[scalingDataLoaded]` to `[]` so it runs only once on mount.
    *   Ensure the `onAuthStateChange` listener logic *only* updates the final state variables (`session`, `userProfile`, `isLoadingAuth`) as per the original simplified plan.

3.  **Update Global Loading State in `App.tsx`:**
    *   Find the line defining `isLoadingApp` (around line 221 in the current `App.tsx`):
        ```typescript
        const isLoadingApp = loadingAuth || loadingProfile || !scalingDataLoaded;
        ```
    *   Update it to use only the new loading state, simplifying the dependency:
        ```typescript
        const isLoadingApp = isLoadingAuth;
        ```
    *   *Consider:* Does the entire app *need* to wait for `scalingDataLoaded`? If not, you could potentially simplify further to `const isLoadingApp = isLoadingAuth;`. Evaluate if any part of the app outside protected routes breaks if `scalingDataLoaded` is false.

4.  **Update Other Prop Passing (Layout Component):**
    *   Locate where props are passed to the `Layout` component (around line 270 in the current `App.tsx`).
    *   It currently receives `isLoadingProfile={loadingProfile}`.
    *   Since `loadingProfile` is being removed, update the prop passed to `Layout` to use the primary authentication loading state:
        ```typescript
        <Layout
          session={session} // This will be the renamed session state
          userProfile={userProfile} // This will be the renamed userProfile state
          // isLoadingProfile={loadingProfile} // Remove this old prop
          isLoadingAuth={isLoadingAuth} // Pass the main auth loading state
          stripePromise={stripePromise}
        />
        ```
    *   *(Note: If `Layout` specifically needs different behavior based on this prop, further adjustments inside `Layout.tsx` might be needed later, but for this phase, we just update the prop being passed).* 

5.  **Remove Cleanup:**
    *   Remove the `clearTimeout(timerId);` line from the `useEffect`'s cleanup function.
    *   Ensure the `authSubscriptionRef.current.unsubscribe();` logic remains correctly implemented.

6.  **Clean Up Logs:**
    *   Remove any temporary console logs added during Phase 1 or 2 (e.g., logs starting with `[Phase 1 Log]`).

**Testing:**

1.  **Run the App:** Start the application.
2.  **Full Regression Test:** Repeat all testing scenarios from Phase 2 thoroughly:
    *   Initial load (logged out), accessing public/protected routes.
    *   Login (non-subscribed), accessing public/protected routes, refresh behavior.
    *   Login (subscribed), accessing public/protected routes, refresh behavior.
    *   Logout behavior.
    *   Verify loading indicators appear correctly and briefly (now driven solely by `isLoadingAuth` for the initial load).
3.  **Check Console:** Ensure there are no errors related to removed variables or logic. Ensure no excessive logging remains.
4.  **Code Review:** Briefly review the `App.tsx` `useEffect` hook to confirm it matches the simple structure outlined in the original plan.

**Outcome:** At the end of this phase, `App.tsx` will contain a clean, simple, and robust authentication handling mechanism. The old complex logic will be completely removed, and the application should function correctly and reliably across all authentication states and refresh scenarios. The original refresh/logout bug should be definitively fixed. 