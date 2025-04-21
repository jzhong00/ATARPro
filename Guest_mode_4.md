# Phase 4: Add Header Link

**Goal:** Add a link to the new guest calculator route (`/guest-calculator`) in the main site header, visible only to logged-out users.

**Context:** We need to make the new guest calculator easily discoverable for visitors who are not logged in.

**Steps:**

1.  **Modify `src/components/common/Header.tsx`:**
    *   Locate the section that renders content for logged-out users (the `else` block of the `session ? (...) : (...)` conditional, around line 87).
    *   Within this block, alongside the existing "Login" and "Get Started" links, add a new link using `react-router-dom`'s `Link` component.
    *   Point the `Link` to `/guest-calculator`.
    *   Give it appropriate text, e.g., "Try Calculator" or "Guest Calculator".
    *   Apply similar styling as the other buttons/links in that section (e.g., `secondaryButtonStyle` or `primaryButtonStyle`, imported or defined in the component).

    ```typescript
    // Inside Header component, within the logged-out user section
    {
      session ? (
        // Logged-in user content...
      ) : (
        // User is not logged in
        <>
          {/* Add the new link here */}
          <Link to="/guest-calculator" className={secondaryButtonStyle}> {/* Or primaryButtonStyle */}
            Try Calculator
          </Link>
          <Link to="/auth?view=sign_in" className={secondaryButtonStyle}>
            Login
          </Link>
          <Link to="/auth?view=sign_up" className={primaryButtonStyle}>
            Get Started
          </Link>
        </>
      )
    }
    ```

**Testing:**

1.  Run the application.
2.  **Logged-out state:**
    *   Ensure you are logged out.
    *   Navigate to the home page (`/`) or any other page where the main header is visible.
    *   **Verify:** The new "Try Calculator" (or similar) link appears in the header alongside "Login" and "Get Started".
    *   Click the "Try Calculator" link.
    *   **Verify:** You are navigated to `/guest-calculator` and the guest version loads.
3.  **Logged-in state:**
    *   Log in to the application.
    *   Navigate to the main app page (`/app`) or any other page with the header.
    *   **Verify:** The "Try Calculator" link is *not* present in the header. Only the logged-in navigation links and user info/logout button are shown.
    *   Verify the standard navigation link for the logged-in calculator (e.g., "Single Student Calculator" pointing to `/student`) is still present and works. 