# Phase 8: Frontend Profile Fetching

**Status:** Completed (with workarounds)

**Goal:** Load the user's profile data (specifically the `is_subscribed` status) from the Supabase `users` table (`public.users`) into the frontend application state when the user is logged in.

**Prerequisites:**

*   Phase 6 Completed (`public.users` table exists with RLS policies allowing users to read their own profile).
*   Phase 7 Completed (Webhook updates `is_subscribed` field in `public.users`).
*   Supabase client initialized in the frontend (Phase 1).
*   Auth state (`session`, `loadingAuth`) is managed in the frontend (`src/App.tsx`) (Phase 1).
*   `scalingDataLoaded` state exists in `src/App.tsx`.

---

## Tasks

### 1. Define User Profile Type

*   Define an interface for the expected profile data. Use correct field names.
*   **Actual Implementation:** Placed in `src/types/index.ts` for better organization.

```typescript
// In src/types/index.ts
export interface UserProfile {
  id: string;           // Should match the auth.users.id
  is_subscribed: boolean; // Correct field name from public.users table
  // Add other fields from your 'users' table if needed
}
```

### 2. Add State for Profile Data in App

*   In `src/App.tsx`, add state variables for the fetched user profile and its loading status.

```typescript
// Inside App function component in src/App.tsx
import { useState } from 'react'; // Ensure useState is imported
import { UserProfile } from './types'; // Or wherever defined

function App() {
  // ... existing states (session, loadingAuth, scalingDataLoaded, etc.) ...
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true); // Initialize as true, will be false after first fetch attempt

  // ... rest of component ...
}
```

### 3. Create Function to Fetch Profile

*   Within `src/App.tsx`, create an async function to fetch the profile using the standard `supabase` client, respecting RLS. Use correct table and column names.

```typescript
import { User } from '@supabase/supabase-js'; // Ensure User type is imported if not already
import { supabase } from './services/supabaseClient'; // Ensure supabase client is imported

// Inside App function component in src/App.tsx
const fetchUserProfile = async (user: User | null, setUserProfile: React.Dispatch<React.SetStateAction<UserProfile | null>>) => {
  if (!user) {
    setUserProfile(null); // Clear profile if no user is logged in
    return;
  }

  try {
    console.log(`Fetching profile for user: ${user.id}`);
    const { data, error, status } = await supabase
      .from('users') // Correct table name (public.users)
      .select(`id, is_subscribed`) // Correct column name
      .eq('id', user.id)
      .single(); // Expect exactly one profile per user

    if (error && status !== 406) {
      // Status 406 means no row found (expected for new users before trigger runs).
      // Treat other errors as actual problems.
      console.error('Error fetching user profile:', error.message);
      setUserProfile(null);
    } else if (data) {
      console.log('Profile data received:', data);
      setUserProfile(data as UserProfile); // Set the fetched profile
    } else {
      // No error, but no data (status 406). Profile might not exist yet.
      console.log('No profile found for user (may be new or trigger delay).');
      setUserProfile(null);
    }
  } catch (error: any) {
    console.error('Exception fetching profile:', error.message);
    setUserProfile(null);
  }
};
```
*(Note: Consider passing `setUserProfile` as an argument if defining this outside the `App` component)*

### 4. Replace Auth `useEffect` to Integrate Profile Fetching

*   **CAUTION:** This step involves **replacing** the existing `useEffect` hook in `src/App.tsx`. The final implementation required significant adjustments compared to the initial plan due to a loading bug (see "Implementation Notes & Bugs" section below).
*   The final hook uses `setTimeout` to delay the initial auth check and listener setup, and `useRef` to manage the listener subscription for proper cleanup.

```typescript
// Final implementation in src/App.tsx (simplified for clarity):
import { useEffect, useState, useRef } from 'react'; // Import useRef
import { Session, User } from '@supabase/supabase-js';
import { UserProfile } from './types'; 
import { supabase } from './services/supabaseClient'; 

// ... fetchUserProfile function ...

function App() {
  // ... other state ...
  const [session, setSession] = useState<Session | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const authSubscriptionRef = useRef<ReturnType<typeof supabase.auth.onAuthStateChange>['data']['subscription'] | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    // Delay execution slightly to avoid potential race condition on load with existing session
    const timerId = setTimeout(() => {
      if (!isMounted) return;

      setLoadingAuth(true);
      setLoadingProfile(true);

      // Initial session check (primarily sets loadingAuth)
      supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
        if (!isMounted) return;
        setLoadingAuth(false);
        if (!initialSession) {
          setLoadingProfile(false);
        }
      }).catch(error => {
        if (!isMounted) return;
        console.error('App: Initial getSession failed:', error);
        setLoadingAuth(false);
        setLoadingProfile(false);
      });

      // Auth listener (handles all session updates and profile loading)
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (!isMounted) return;
        setSession(session);
        setLoadingAuth(false); // Ensure loadingAuth is false on any auth event

        if (session) {
          setLoadingProfile(true);
          await fetchUserProfile(session.user, setUserProfile);
          if (isMounted) {
            setLoadingProfile(false);
          }
        } else {
          setUserProfile(null);
          setLoadingProfile(false);
        }
      });
      authSubscriptionRef.current = subscription; // Store subscription in ref

    }, 50); // Small delay

    // Cleanup
    return () => {
      isMounted = false;
      clearTimeout(timerId);
      authSubscriptionRef.current?.unsubscribe(); // Unsubscribe via ref
    };
  }, []); 
  
  // ... rest of component ...
}
```

### 5. Update Overall Loading State

*   Modify the main loading check in `App.tsx` to include `loadingProfile`. Ensure `scalingDataLoaded` is included as it exists in the codebase.

```typescript
// Adjust the loading check in App.tsx
const isLoadingApp = loadingAuth || loadingProfile || !scalingDataLoaded;

if (isLoadingApp) {
  // Consider a more informative loading indicator if desired
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center text-xl">
      Loading application data...
    </div>
  );
}
```

### 6. Pass Profile State Down (Props or Context)

*   Pass `userProfile` and `loadingProfile` down to components that need them, consistent with how `session` is passed (likely via props to `Layout` and potentially other components).

```typescript
// Example: Passing via props to Layout in App.tsx's return statement:
<Route element={<ProtectedRoute session={session} loadingAuth={loadingAuth} />}>
    <Route
        path="/"
        element={(
            <Layout
                session={session}
                userProfile={userProfile}
                isLoadingProfile={loadingProfile}
                stripePromise={stripePromise}
            />
        )}
    >
        {/* ... nested routes ... */}
    </Route>
</Route>

// Remember to update LayoutProps in Layout.tsx and pass down further if needed.
```
*(Consider refactoring to use React Context for auth/profile state in a future phase if prop drilling becomes complex.)*

---

## Implementation Notes & Bugs Encountered

### 1. Loading Freeze on Refresh/Navigation When Logged In

*   **Symptom:** After logging in successfully, if the user performed a full page refresh (e.g., F5, retyping URL) or sometimes client-side navigation back to the root, the application would get stuck indefinitely on the "Loading application data..." screen.
*   **Cause:** Debugging revealed that when the application initialized with a valid session token already present in browser storage, both the initial `supabase.auth.getSession()` call and subsequent database queries (`supabase.from('users').select()`) within `fetchUserProfile` would hang indefinitely without completing or throwing an error. This prevented the `loadingAuth` and `loadingProfile` states from being set to `false`.
*   **Verification:** This occurred even in Incognito mode, ruling out browser extensions or corrupted storage as the primary cause, pointing towards an initialization race condition or subtle bug within the Supabase JS library under these specific circumstances.
*   **Solution (Workaround):** The core logic within the authentication `useEffect` hook was wrapped in a `setTimeout` with a small delay (50ms). This gives the Supabase client a brief moment after initialization (detecting the existing session) to stabilize before auth/database calls are made, preventing the hang.
*   **Refinement:** To ensure proper cleanup of the `onAuthStateChange` listener (which is now set up *inside* the `setTimeout`), `useRef` was implemented to hold the subscription object, allowing the cleanup function to access and call `.unsubscribe()` on it reliably.

### 2. `isMounted` Flag

*   The `isMounted` flag pattern was used throughout the `useEffect` hook, especially around `setState` calls following `await` operations, to prevent attempting state updates on an unmounted component if the user navigates away while an asynchronous operation is in progress.

---

## Testing Plan

1.  **Environment:**
    *   Start the application using `vercel dev` after implementing the changes.

2.  **Test Case 1: Non-Subscribed User Login**
    *   **Action:** Log in as a user whose `is_subscribed` field in the `public.users` table is `false`.
    *   **Expected Logs:** Check browser console for:
        *   `Fetching profile for user: <user-id>`
        *   `Profile data received: { id: '<user-id>', is_subscribed: false }`
    *   **Expected State (React DevTools):** Inspect `App` component's state:
        *   `userProfile`: `{ id: '<user-id>', is_subscribed: false }`
        *   `loadingProfile`: `false`
        *   `loadingAuth`: `false`

3.  **Test Case 2: Subscribed User Login**
    *   **Action:** Log out. Log in as a user whose `is_subscribed` is `true` (e.g., the user from successful Phase 7 testing).
    *   **Expected Logs:**
        *   `Fetching profile for user: <user-id>`
        *   `Profile data received: { id: '<user-id>', is_subscribed: true }`
    *   **Expected State (React DevTools):**
        *   `userProfile`: `{ id: '<user-id>', is_subscribed: true }`
        *   `loadingProfile`: `false`
        *   `loadingAuth`: `false`

4.  **Test Case 3: New User Signup**
    *   **Action:** Log out. Sign up as a completely new user.
    *   **Expected Logs:** Observe console immediately after signup/login:
        *   May initially see `No profile found for user (may be new or trigger delay).`
        *   Should eventually see (possibly after brief interaction): `Fetching profile...` followed by `Profile data received: { id: '<new-user-id>', is_subscribed: false }`.
    *   **Expected State (React DevTools):**
        *   `userProfile`: Might initially be `null`, updates to `{ id: '<new-user-id>', is_subscribed: false }` shortly after.
        *   `loadingProfile`: Becomes `false` after fetch attempt(s).

5.  **Test Case 4: Log Out**
    *   **Action:** Log out from any logged-in state.
    *   **Expected Logs:** Check console for `Auth state changed: SIGNED_OUT` (or similar), potentially followed by profile fetch attempts with `null` user.
    *   **Expected State (React DevTools):**
        *   `session`: `null`
        *   `userProfile`: `null`
        *   `loadingProfile`: `false`
        *   `loadingAuth`: `false`

6.  **Test Case 5: Refresh while Logged In**
    *   **Action:** While logged in (subscribed or not), refresh the browser page.
    *   **Expected Behavior:** App shows loading state briefly, then displays correctly with the user logged in and the correct profile state loaded (verify via logs/DevTools as per Test Cases 1 or 2).

---

**Note:** Thoroughly test the new `useEffect` hook logic, especially the `isMounted` flag, the `setTimeout` workaround, and the `useRef` cleanup function, to prevent memory leaks or state updates on unmounted components. Monitor for any regressions related to the loading behavior, particularly on refresh when logged in. 