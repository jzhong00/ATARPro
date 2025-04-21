# Deployment Phase 6: Prepare for Public Launch (Switch to Live Keys)

**Goal:** Transition your application from beta (using test keys) to being ready for real users and live payments.

**Prerequisite:** Phase 5 completed. Beta testing is concluded, and major issues have been addressed.

**Steps:**

1.  **Obtain Stripe Live Keys:**
    *   Go to your [Stripe Dashboard](https://dashboard.stripe.com/).
    *   Toggle **"Test mode"** OFF to switch to **Live Mode**.
    *   You may need to activate your Stripe account if you haven't already.
    *   Navigate to Developers -> API Keys.
    *   Copy your **Live** Publishable key (`pk_live_...`) and reveal/copy your **Live** Secret key (`sk_live_...`). Store these securely.
    *   Navigate to Products -> Select your product -> Copy the **Live Price ID** (`price_...`).

2.  **Configure Stripe Live Webhook:**
    *   While still in Live Mode, navigate to Developers -> Webhooks.
    *   Click "+ Add endpoint".
    *   **Endpoint URL:** Use the *same* webhook URL as in Phase 3 (e.g., `https://your-project-name.vercel.app/api/stripe-webhook`).
    *   **Listen to:** Select the *same* events as your test webhook.
    *   Click "Add endpoint".
    *   Reveal and copy the **Live** Signing secret (`whsec_...`). Store this securely.

3.  **Update Vercel Production Environment Variables:**
    *   Go to your Vercel Project Settings -> Environment Variables.
    *   Find your Stripe-related variables:
        *   `VITE_STRIPE_PUBLISHABLE_KEY`
        *   `STRIPE_SECRET_KEY`
        *   `STRIPE_PRICE_ID`
        *   `STRIPE_WEBHOOK_SECRET`
    *   For **each** of these variables:
        *   Edit the variable.
        *   **Important:** Change the Environment setting from "All Environments" (or wherever it was) to **"Production" ONLY**. This ensures Preview/Development deployments continue using Test keys.
        *   Paste the corresponding **LIVE** value (Live Publishable Key, Live Secret Key, Live Price ID, Live Webhook Secret) you obtained in steps 1 & 2.
        *   Save each variable.
    *   *(Self-correction: Ensure your Supabase keys are also set correctly for the Production environment if they differ from test)*.

4.  **(Optional) Disable Password Protection:**
    *   If you are ready for public access, go to Vercel Project Settings -> Security.
    *   Under "Deployment Protection", disable the password protection for the Production environment.
    *   *If you want a staged rollout or keep it private longer, leave this enabled for now.* 

5.  **Redeploy Production:**
    *   Go to the Deployments tab in Vercel.
    *   Find the latest deployment associated with your main branch (usually marked "Current" and "Production").
    *   Click the "..." menu and choose "Redeploy".

**Success Check:**

*   [ ] Live Stripe API Keys and Price ID obtained.
*   [ ] Live Stripe Webhook endpoint created and Signing Secret obtained.
*   [ ] Vercel Environment Variables (`VITE_STRIPE_PUBLISHABLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID`, `STRIPE_WEBHOOK_SECRET`) updated with **LIVE** values and scoped to **Production** environment only.
*   [ ] Production deployment successfully redeployed with new environment variables.
*   [ ] (If applicable) Vercel password protection disabled for Production.
*   **Crucial Test:** Perform a quick smoke test on the **Production URL**: 
    *   [ ] Can you still log in?
    *   [ ] Navigate to the payment section. Initiate checkout. You should now see the **LIVE Stripe Checkout** (no "Test Mode" banner).
    *   [ ] (Optional but recommended) Perform a real, small payment (or use a [live test card](https://stripe.com/docs/testing#cards-responses) if available and appropriate) to verify the end-to-end live flow, including webhook processing (check Stripe Live logs, Vercel logs, and application state). 