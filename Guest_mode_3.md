# Phase 3: Routing and Component Integration

**Goal:** Create a publicly accessible route where the guest version of the calculator will live.

**Context:** Currently, `SingleStudentCalculator` is only rendered within the protected routes section of the application. We need a new, *public* route that anyone can access.

**Steps:**

1.  **Modify `src/App.tsx`:**
    *   Locate the `<Routes>` definition within the `AppRoutes` component (around line 169).
    *   Find the public routes defined *outside* the `<Route element={<ProtectedRoute ... />}>` wrapper. These typically include the `LandingPage` (`/`) and `AuthPage` (`/auth`).
    *   Add a new public `<Route>` for the guest calculator. Choose a path, for example, `/guest-calculator`.
    *   Render the `SingleStudentCalculator` component on this route, explicitly passing the `isGuestMode={true}` prop.

    ```typescript
    // Inside AppRoutes component, within <Routes> but OUTSIDE <ProtectedRoute>
    <Routes>
      <Route index element={<LandingPage session={session} />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/payment-success" element={<PaymentSuccess />} />
      <Route path="/payment-cancel" element={<PaymentCancel />} />

      {/* Add the new public route here */}
      <Route 
        path="/guest-calculator" 
        element={<SingleStudentCalculator isGuestMode={true} />} 
      />

      {/* Protected routes remain below */}
      <Route element={(
        <ProtectedRoute
          session={session}
          // ... other props
        />
      )}>
        <Route path="/" element={<Layout ... />}>
          {/* ... protected child routes like /app, /student etc. */}
        </Route>
      </Route>
    </Routes>
    ```

**Testing:**

1.  Ensure you have **undone** the temporary change from Phase 1/2 (i.e., the original `<SingleStudentCalculator />` without the `isGuestMode` prop should be back inside the protected `/student` route).
2.  Run the application.
3.  Navigate your browser directly to `/guest-calculator`.
4.  **Verify:**
    *   The simplified guest version of the calculator loads correctly (no search, range, print, export).
    *   The calculator is functional (can add rows, select subjects, enter results, see TE/ATAR).
    *   You can access this page even when logged out.
5.  Navigate to `/student` while logged in.
6.  **Verify:** The full, original version of the calculator loads with all features (search, range, print, export). 