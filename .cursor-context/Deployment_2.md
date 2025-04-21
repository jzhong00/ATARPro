# Deployment Phase 2: Test Core Functionality (Test Keys)

**Goal:** Verify that the essential features of your application work correctly on the deployed Vercel environment using test credentials.

**Prerequisite:** Phase 1 completed successfully. You have a working Vercel deployment URL.

**Steps:**

1.  **Access Deployed App:**
    *   Open the Vercel deployment URL from Phase 1 in your browser.

2.  **Test Authentication:**
    *   Attempt to Sign Up for a new account using Supabase Auth.
    *   Log Out.
    *   Log In with the newly created account.
    *   Log Out again.
    *   *(Self-correction: Check Supabase dashboard to ensure user record was created/updated as expected)*

3.  **Test Core Feature:**
    *   Navigate to the main part of your application (e.g., the ATAR calculator).
    *   Perform typical actions and ensure they work as expected without errors.
    *   Test any data saving/loading features connected to Supabase.

4.  **Test Stripe Payment Flow (Test Mode):**
    *   Navigate to the section of your app where payment is required.
    *   Initiate the payment process.
    *   You should be redirected to a Stripe Checkout page clearly marked as **"Test mode"**.
    *   Use a [Stripe test card number](https://stripe.com/docs/testing#use-test-cards) (e.g., 4242 4242 4242 4242) with any future date and any 3-digit CVC.
    *   Complete the test purchase.
    *   Verify that you are redirected back to your application's success page.
    *   Verify that the application state reflects the successful payment (e.g., features are unlocked, user status updated). *(This might depend on the webhook in Phase 3)*

5.  **Check Logs:**
    *   While performing the above tests, keep an eye on the Vercel Runtime Logs (Project -> Deployments -> Select the deployment -> Logs -> Functions) for any errors related to your API routes or server-side functions.

**Success Check:**

*   [ ] Can successfully Sign Up, Log Out, and Log In.
*   [ ] Core application features (e.g., calculator) work correctly.
*   [ ] Can initiate Stripe checkout, which loads in **Test Mode**.
*   [ ] Can complete Stripe checkout using a test card.
*   [ ] Application correctly redirects after checkout (to success or appropriate page).
*   [ ] No critical errors found in Vercel runtime logs during these flows. 