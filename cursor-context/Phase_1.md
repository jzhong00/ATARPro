# Phase 1: State Simplification & Initial Listener Setup

**Goal:** Introduce the new, simplified state variables (`isLoadingAuth`, `userProfile`, `session`) and set up the core `onAuthStateChange` listener structure alongside the existing logic. The application's visible behavior should not change significantly in this phase, but the new state should be correctly populated behind the scenes.

**Steps:**

1.  **Define New State Variables in `App.tsx`:**
    *   Add the following state variables near the existing `session`, `userProfile`, `loadingAuth`, `loadingProfile` states:
        ```typescript
        const [isLoadingAuth, setIsLoadingAuth] = useState<boolean>(true); 
        // Keep existing session/userProfile state for now if needed for comparison,
        // or rename the old ones if you prefer. The goal is to eventually *replace* them.
        // Let's assume for now we add NEW ones and keep old ones temporarily:
        const [newSession, setNewSession] = useState<Session | null>(null);
        const [newUserProfile, setNewUserProfile] = useState<UserProfile | null>(null);
        ```
    *   *Note:* We initialize `isLoadingAuth` to `true`.

2.  **Modify the Authentication `useEffect` in `App.tsx`:**
    *   Keep the existing `useEffect(() => { ... }, [scalingDataLoaded]);` structure for now.
    *   **Inside** the `useEffect`, before the existing `setTimeout`:
        *   Ensure `setIsLoadingAuth(true)` is called when the effect runs (or re-runs based on its current dependency).
    *   **Inside** the `onAuthStateChange` callback:
        *   After processing each event (`SIGNED_OUT`, `INITIAL_SESSION`, `SIGNED_IN`), update the *new* state variables (`setNewSession`, `setNewUserProfile`). Use the logic from the approved plan.
        *   Crucially, **after** the session and potential profile fetch logic is complete for *any* event path within the callback (including the `else if (!session)` case), add:
            ```typescript
            if (isMounted) { // Still need isMounted check temporarily if cleanup relies on it
               setIsLoadingAuth(false); 
            }
            ```
            *Self-correction: The plan aims to remove `isMounted`. Let's adjust. Add `setIsLoadingAuth(false)` unconditionally at the end of processing each event path within the listener's callback, *before* any `return` statements within the callback.*
             ```typescript
            // Example for SIGNED_OUT path:
            if (_event === 'SIGNED_OUT') {
                // ... (set existing state: setSession(null), setUserProfile(null) etc.)
                setNewSession(null);
                setNewUserProfile(null);
                setIsLoadingAuth(false); // Set new loading state
                // ... (navigate('/'))
                return; 
            }
            // Example for SIGNED_IN / INITIAL_SESSION path:
            if (session && (_event === 'INITIAL_SESSION' || ...)) {
                 // ... (set existing state: setSession(session), etc.)
                 setNewSession(session);
                 setLoadingAuth(false); // Keep existing state updates for now
                 setLoadingProfile(true); 
                 await fetchUserProfile(session.user, setNewUserProfile); // Fetch into NEW profile state
                 if (isMounted) { // Temporary check
                    setLoadingProfile(false); 
                    profileLoadedRef.current = true; 
                    setIsLoadingAuth(false); // Set new loading state AFTER profile fetch
                 } 
            } else if (!session) { 
                 // ... (set existing state)
                 setNewSession(null);
                 setNewUserProfile(null);
                 setIsLoadingAuth(false); // Set new loading state
            } else if (session) { 
                 // ... (set existing state)
                 setNewSession(session);
                 // If profile wasn't re-fetched here, what should newUserProfile be? 
                 // It should likely persist from the last fetch or be null if never fetched.
                 // We might only need to fetch profile on INITIAL_SESSION or SIGNED_IN.
                 setIsLoadingAuth(false); // Set new loading state
            }
            ```

3.  **Add Logging:**
    *   Inside the `onAuthStateChange` callback, log the `_event`, `session`, and the *new* state values (`newSession`, `newUserProfile`) after they are set.
    *   In the main `AppRoutes` component body, log the values of `isLoadingAuth`, `newSession`, and `newUserProfile`.

**Testing:**

1.  **Run the App:** Start the application.
2.  **Initial Load (Logged Out):** Check the console logs. Verify `isLoadingAuth` starts `true` and becomes `false`. Verify `newSession` and `newUserProfile` are `null`. The app should load the public landing page as before.
3.  **Login:** Go to `/auth` and log in. Check console logs. Verify the `SIGNED_IN` event fires, `newSession` gets populated, `fetchUserProfile` is called (and updates `newUserProfile`), and `isLoadingAuth` becomes `false`. The app should redirect and function as it did before (likely showing `PaymentPrompt` or protected content based on the *old* state still driving `ProtectedRoute`).
4.  **Refresh (Logged In):** Refresh the page while logged in. Check console logs. Verify the `INITIAL_SESSION` event fires, `newSession` and `newUserProfile` are correctly restored, and `isLoadingAuth` becomes `false`. The app should retain the session and show the same content as before the refresh (again, driven by old state).
5.  **Logout:** Click the logout button. Check console logs. Verify the `SIGNED_OUT` event fires, `newSession`, `newUserProfile` become `null`, and `isLoadingAuth` becomes `false`. The app should redirect to `/` as before.

**Outcome:** At the end of this phase, the application should still function identically to how it did before, but the new state variables (`isLoadingAuth`, `newSession`, `newUserProfile`) should accurately reflect the user's authentication and profile status according to the simplified logic. 