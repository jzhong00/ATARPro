# Deployment Phase 1: Preparation & Initial Vercel Deploy (Test Keys)

**Goal:** Get the application running on a Vercel deployment URL using your Stripe & Supabase **test** credentials.

**Steps:**

1.  **Ensure Git Ready:**
    *   Confirm your latest code is committed to your local Git repository.
    *   Confirm your `.gitignore` file includes `/node_modules` and `.env`.
    *   Push your code to your remote Git provider (GitHub, GitLab, Bitbucket).

2.  **Vercel Project Setup:**
    *   Log in to your Vercel account.
    *   Click "Add New..." -> "Project".
    *   Import your Git repository.
    *   Vercel should automatically detect "Vite" as the framework. If not, select it.

3.  **Configure Build Settings:**
    *   **Framework Preset:** Verify it's `Vite`.
    *   **Build Command:** Verify it's `tsc && vite build` or `vite build`. Override if necessary.
    *   **Output Directory:** Verify it's `dist`. Override if necessary.
    *   **Install Command:** Verify it's `npm install` (or `yarn install` if you use Yarn).
    *   **Root Directory:** Should likely be the default (repository root).

4.  **Configure Environment Variables (Test Keys):**
    *   Navigate to Project Settings -> Environment Variables.
    *   Add **ALL** the variables from your local `.env` file. Use their current **TEST** values.
        *   `VITE_SUPABASE_URL`
        *   `VITE_SUPABASE_ANON_KEY`
        *   `VITE_STRIPE_PUBLISHABLE_KEY` (Test Key)
        *   `STRIPE_SECRET_KEY` (Test Key)
        *   `STRIPE_PRICE_ID` (Test Price ID)
        *   `STRIPE_WEBHOOK_SECRET` (Test Webhook Secret, if you have one set locally already)
        *   `SUPABASE_SERVICE_ROLE_KEY`
    *   **Important:** For each variable, ensure it's available in **all** environments (Production, Preview, Development) for now. We will change Production later. Make sure Vercel correctly identifies `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, and `SUPABASE_SERVICE_ROLE_KEY` as Secret Keys (they should not have the `VITE_` prefix).

5.  **Deploy:**
    *   Click the "Deploy" button.
    *   Monitor the build logs in the Vercel dashboard.

**Success Check:**

*   [ ] Vercel build completes successfully without errors.
*   [ ] A Vercel deployment URL (e.g., `your-project-name-abc.vercel.app`) is generated.
*   [ ] Visiting the Vercel deployment URL loads your application's landing page or login screen.
*   [ ] Check Vercel Runtime logs (under the "Logs" tab for the deployment) for any immediate function errors on load. 