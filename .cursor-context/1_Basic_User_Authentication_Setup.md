# Phase 1: Basic User Authentication Setup (Supabase)

This phase focuses on setting up Supabase and integrating its authentication features into the React application.

**Status: Phase Complete & Tested Successfully**

---

1.  **Setup Supabase Project:**
    *   Go to [Supabase.io](https://supabase.io) and create a new project.
    *   Navigate to Project Settings > API.
    *   Note down your **Project URL** and the **`anon` public key**.
    *   **(TO DO - User Action):** Ensure you have these details ready.

2.  **Install Supabase Client:**
    *   **(TO DO):** Open your terminal in the project root directory.
    *   **(TO DO):** Run the command: `npm install @supabase/supabase-js`

3.  **Initialize Supabase Client:**
    *   **(TO DO):** Create a new directory `src/services` if it doesn't exist.
    *   **(TO DO):** Inside `src/services`, create a new file named `supabaseClient.ts`.
    *   **(TO DO):** Add the following code to initialize the client, using the environment variables already set up:
        ```typescript
        import { createClient } from '@supabase/supabase-js';

        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseAnonKey) {
          // Check if the variables are actually loaded
          console.error('Supabase URL or Anon Key is missing. Check your .env file and ensure the Vite server is running.');
          throw new Error('Supabase environment variables not found. Ensure .env is configured and accessible.');
        }

        export const supabase = createClient(supabaseUrl, supabaseAnonKey);
        ```

4.  **Create `.gitignore`:** (Crucial Step)
    *   **(DONE):** Created `.gitignore` in the root directory.
    *   **(DONE):** Populated with standard Node.js/Vite ignores, including `.env`.

5.  **Environment Variables:**
    *   **(DONE):** Created the `.env` file in the root directory.
    *   **(DONE - User Action):** User has updated `.env` with actual Supabase credentials.
    *   *Note: Vite automatically loads environment variables prefixed with `VITE_` and makes them available in your frontend code via `import.meta.env`.*

6.  **Authentication UI:**
    *   **(TO DO):** Install the Supabase pre-built React Auth UI components:
        `npm install @supabase/auth-ui-react @supabase/auth-ui-shared`
    *   **(TO DO):** Create a new component directory `src/components/Auth` if it doesn't exist.
    *   **(TO DO):** Create a new component for handling authentication, e.g., `src/components/Auth/AuthPage.tsx`.
    *   **(TO DO):** Implement the Supabase Auth UI component within `AuthPage.tsx` (using example code from the plan).
    *   **(TO DO):** Add a new route in `src/App.tsx` to display this component, for example, at the path `/auth`.

7.  **Auth State Management:**
    *   **(TO DO):** Modify `src/App.tsx` (or create a dedicated context) to listen for authentication changes and manage the user session (using example code from the plan).
    *   **(TO DO):** Update your `Header` component (`src/components/common/Header.tsx`) to conditionally display "Login" or "Logout" buttons based on the `session` state.

**(Test Point 1: Users should be able to navigate to `/auth`, sign up using email/password or a social provider, get redirected to `/app`, log out using the logout button, and log back in. The UI should reflect the logged-in/logged-out state.)** 