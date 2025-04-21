# Phase 2: Connecting New State to ProtectedRoute

**Goal:** Make `ProtectedRoute` use the new, reliable state (`isLoadingAuth`, `newSession`, `newUserProfile`) introduced in Phase 1 to make its rendering and redirect decisions. The old state variables might still exist in `App.tsx` but will no longer be passed to or used by `ProtectedRoute`.

**Prerequisite:** Phase 1 completed successfully. The new state variables are being populated correctly.

**Steps:**

1.  **Update Prop Passing in `App.tsx`:**
    *   Locate the `Route` element that uses `ProtectedRoute` (around line 203 in the provided snippet).
    *   Change the props being passed to `ProtectedRoute`:
        *   Pass `isLoadingAuth` to the `isLoading` prop.
        *   Pass `newSession` to the `session` prop.
        *   Pass `newUserProfile` to the `userProfile` prop.
    *   The relevant part should look like this:
        ```typescript
        <Route element={(
          <ProtectedRoute
            session={newSession}        // <-- Use new state
            userProfile={newUserProfile}  // <-- Use new state
            isLoading={isLoadingAuth}   // <-- Use new state
            stripePromise={stripePromise}
          />
        )}>
          {/* ... child routes ... */}
        </Route>
        ```

2.  **(Optional) Rename Props in `ProtectedRoute.tsx`:**
    *   For clarity, you could rename the props within `ProtectedRoute.tsx` to match the new state names (e.g., `isLoadingAuth` instead of `isLoading`), but this is not strictly necessary as long as the correct values are passed from `App.tsx`.
    *   If you rename, update the component's `interface ProtectedRouteProps` and the destructuring assignment `({ session, userProfile, isLoading, stripePromise })`.

**Testing:**

1.  **Run the App:** Start the application.
2.  **Initial Load (Logged Out):**
    *   Verify the app shows the public landing page.
    *   Attempt to navigate to a protected route (e.g., `/app`, `/student`). Verify you are correctly redirected to `/auth`.
3.  **Login (Non-Subscribed User):**
    *   Log in as a user whose `userProfile.is_subscribed` is `false`.
    *   Verify you can access public routes.
    *   Attempt to navigate to a protected route. Verify the `PaymentPrompt` component is displayed instead of the route's content or a redirect to `/auth`.
    *   Refresh the page while on the protected route (viewing `PaymentPrompt`). Verify the session is restored, and the `PaymentPrompt` is shown again without being logged out.
4.  **Login (Subscribed User):**
    *   Log out and log in as a user whose `userProfile.is_subscribed` is `true`.
    *   Verify you can access public routes.
    *   Navigate to various protected routes (e.g., `/app`, `/student`). Verify you can access the content correctly.
    *   Refresh the page while on a protected route. Verify the session is restored, and you remain on the protected route viewing its content without being logged out.
5.  **Logout:**
    *   From any page (public or protected), click the logout button.
    *   Verify you are redirected to the public landing page (`/`) and can no longer access protected routes (should redirect to `/auth`).
6.  **Loading State:** Observe the initial load after login or refresh. Verify that the `Loading Application...` state (or similar defined in `ProtectedRoute`) is briefly visible while `isLoadingAuth` is true, preventing premature redirects or content display.

**Outcome:** At the end of this phase, the application's authentication flow and access control should be entirely driven by the new, simplified state (`isLoadingAuth`, `newSession`, `newUserProfile`). The core refresh/logout bug should be resolved. The old state variables in `App.tsx` are now redundant regarding `ProtectedRoute`'s functionality. 