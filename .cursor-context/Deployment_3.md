# Deployment Phase 3: Configure Stripe Webhook (Test Mode)

**Goal:** Ensure Stripe can send events (like successful payments) back to your deployed application, and your application handles them correctly using **Test Mode** data.

**Prerequisite:** Phase 2 completed. Stripe checkout flow works with test cards.

**Steps:**

1.  **Identify Webhook Handler URL:**
    *   Your webhook handler is located at `api/stripe-webhook.ts`.
    *   Based on Vercel's file-system routing, the correct URL path is `/api/stripe-webhook`.
    *   Your full webhook URL will be your Vercel deployment URL + this path (e.g., `https://your-project-name-abc.vercel.app/api/stripe-webhook`).

2.  **Configure Stripe Dashboard (Test Mode):**
    *   Go to your [Stripe Dashboard](https://dashboard.stripe.com/).
    *   Make sure **"Test mode"** is toggled ON.
    *   Navigate to Developers -> Webhooks.
    *   Click "+ Add endpoint".
    *   **Endpoint URL:** Paste the full webhook URL identified in Step 1.
    *   **Listen to:** Click "Select events". Your handler code (`api/stripe-webhook.ts`) specifically processes the **`checkout.session.completed`** event. Select this event under the "Checkout" category.
    *   Click "Add endpoint".

3.  **Get Webhook Signing Secret (Test):**
    *   After adding the endpoint, Stripe will display the details.
    *   Click to reveal the **Signing secret** (it will start with `whsec_...`).
    *   **Copy this secret.** This is your **Test** Webhook Secret.

4.  **Update Vercel Environment Variable:**
    *   Go back to your Vercel Project Settings -> Environment Variables.
    *   Find the `STRIPE_WEBHOOK_SECRET` variable.
    *   Edit its value and paste the **Test** Signing Secret you just copied from Stripe.
    *   Ensure this variable is still available to **all** environments (Production, Preview, Development) for now.
    *   **Trigger a redeploy** in Vercel (Go to Deployments tab, find the latest Production deployment, click the "..." menu, and choose "Redeploy") to ensure the updated environment variable is active.

5.  **Test End-to-End:**
    *   Repeat the test payment flow from Phase 2 (Step 4) using a test card.
    *   After successful checkout completion:
        *   Check the Stripe Dashboard -> Developers -> Webhooks -> Select your endpoint. You should see a recent event listed with a `200 OK` status, indicating Vercel received it.
        *   Check your Vercel Runtime Logs for your webhook handler function. Look for logs indicating successful event processing.
        *   Check your application/Supabase database to confirm the expected action occurred (e.g., the user account was marked as paid, subscription activated, etc.).

**Success Check:**

*   [ ] Stripe Test Webhook Endpoint added successfully, pointing to the correct Vercel URL.
*   [ ] Test Webhook Signing Secret updated in Vercel environment variables.
*   [ ] Redeployment triggered and completed.
*   [ ] Completing a test payment successfully triggers a webhook event in Stripe.
*   [ ] The event shows a `200 OK` status in the Stripe webhook logs.
*   [ ] Vercel function logs show the webhook was received and processed without errors.
*   [ ] Application state (e.g., in Supabase) is correctly updated based on the webhook event. 