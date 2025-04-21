# Phase 5: Handling Stripe Webhooks Securely

**Goal:** Set up a secure backend endpoint (a "webhook") that listens for payment events sent by Stripe, confirms they genuinely came from Stripe, and logs successful payments.

**Prerequisites:**

*   You've completed Phases 3 & 4 (your app can send users to Stripe Checkout).
*   The `stripe` Node.js library is installed (`npm install stripe`).
*   You have the Stripe CLI installed and logged in (`stripe login`).

---

## Setting Up Your Local Webhook Listener

To test webhooks locally, Stripe needs a way to send events to your development server running via `vercel dev`. The Stripe CLI acts as a bridge.

1.  **Start the Stripe CLI Listener:**
    *   Keep your `vercel dev` server running in its terminal.
    *   Open a **new, separate terminal window**.
    *   Find the port your `vercel dev` server is using (check its output, e.g., `localhost:5173`).
    *   Run the following command, replacing `5173` with your actual port:
        ```bash
        stripe listen --forward-to localhost:5173/api/stripe-webhook
        ```
        *   This tells the Stripe CLI to listen for events and forward them to the `/api/stripe-webhook` path on your local server.

2.  **Get Your Temporary Webhook Secret:**
    *   When `stripe listen` starts successfully, it will print a unique **webhook signing secret** (it looks like `whsec_...`).
    *   **Copy this secret.** It's temporary and only works while this specific `stripe listen` command is running. You'll need it in the next step.

3.  **Add the Secret to Your Environment:**
    *   Open your project's `.env` file.
    *   Add a new line for the webhook secret, pasting the value you copied:
        ```env
        # .env
        # ... your other environment variables ...

        # Temporary secret for local 'stripe listen' testing
        STRIPE_WEBHOOK_SECRET=whsec_YOUR_TEMPORARY_SECRET_FROM_STRIPE_LISTEN
        ```
    *   **Crucially:** Stop and restart your `vercel dev` server. This ensures your application loads the new environment variable.
    *   **Note for Deployment:** Remember that this `whsec_...` secret from `stripe listen` is temporary and only for local testing. For your deployed application (e.g., on Vercel), you will need to register a permanent webhook endpoint in your Stripe Dashboard and use its corresponding permanent signing secret as an environment variable in your Vercel project settings.

## Building the Webhook Endpoint

Now, let's create the actual API endpoint that will receive and process the events forwarded by the Stripe CLI.

4.  **Install `micro` (Optional but Recommended):**
    *   To verify the webhook signature, we need the raw, unmodified request body from Stripe. The `micro` library helps us get this easily within a Vercel serverless function.
        ```bash
        npm install micro
        ```

5.  **Create the Webhook Handler (`api/stripe-webhook.ts`):**
    *   Create a new file: `api/stripe-webhook.ts`.
    *   Add the following code to handle incoming POST requests, verify signatures, and process payment events:

        ```typescript
        // api/stripe-webhook.ts
        import type { VercelRequest, VercelResponse } from '@vercel/node';
        import Stripe from 'stripe';
        import { buffer } from 'micro'; // Helper to read the raw request body

        // --- Configuration ---

        // Fetch secrets from environment variables
        const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
        const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET; // The temporary one from 'stripe listen'

        // Basic validation
        if (!stripeSecretKey || !webhookSecret) {
          console.error('🔴 Error: Missing Stripe API key or Webhook Secret in .env');
          // Don't throw detailed errors in production, but this helps debugging
          throw new Error('Server configuration error: Stripe credentials missing.');
        }

        // Initialize the Stripe client
        const stripe = new Stripe(stripeSecretKey, {
          apiVersion: '2025-03-31.basil', // Use your desired API version
          typescript: true,
        });

        // --- Vercel Specific Configuration ---

        // Tell Vercel *not* to parse the request body automatically.
        // We need the raw body buffer to verify the Stripe signature.
        export const config = {
          api: {
            bodyParser: false,
          },
        };

        // --- Webhook Handler Logic ---

        export default async function handler(
          req: VercelRequest,
          res: VercelResponse
        ) {
          // Only allow POST requests
          if (req.method !== 'POST') {
            res.setHeader('Allow', 'POST');
            return res.status(405).end('Method Not Allowed');
          }

          // Get the signature from the request headers
          const signature = req.headers['stripe-signature'] as string;
          if (!signature) {
            console.warn('⚠️ Webhook received without a stripe-signature header.');
            return res.status(400).send('Missing stripe-signature header.');
          }

          let event: Stripe.Event;

          try {
            // Read the raw request body using the 'micro' helper
            const rawBody = await buffer(req);

            // Verify the event signature using the raw body and the webhook secret
            event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
            console.log('✅ Webhook signature verified.');

          } catch (err: any) {
            // Signature verification failed
            console.error(`❌ Webhook signature verification failed:`, err.message);
            return res.status(400).send(`Webhook Error: ${err.message}`);
          }

          // --- Handle Specific Stripe Events ---

          // Successfully handle the event
          console.log(`Received event: ${event.type}`);

          // Focus on the event indicating a completed checkout session
          if (event.type === 'checkout.session.completed') {
            const session = event.data.object as Stripe.Checkout.Session;

            // Retrieve the user ID we stored earlier
            const userId = session.client_reference_id;

            if (userId) {
              console.log(`✅ Payment successful for User ID: ${userId}`);
              // **Next Step (Phase 7):**
              // This is where you'll add logic to update your database,
              // granting the user access or marking the purchase as complete.
              // e.g., await grantUserAccess(userId);
            } else {
              // This shouldn't happen if client_reference_id was set correctly
              console.warn(`⚠️ Payment successful, but no userId found in session: ${session.id}`);
            }
          } else {
            // Log other events received (optional, good for debugging)
            console.log(`🪵 Received unhandled event type: ${event.type}`);
          }

          // --- Acknowledge Receipt ---

          // Send a 200 OK response back to Stripe to acknowledge receipt.
          // If Stripe doesn't receive this quickly, it will retry sending the event.
          res.status(200).json({ received: true });
        }
        ```

---

## Testing Your Webhook

Follow these steps to ensure everything is working correctly:

1.  **Check Your Setup:**
    *   Make sure `vercel dev` is running in one terminal.
    *   Make sure `stripe listen --forward-to ...` is running in the *other* terminal.
    *   Double-check that the `STRIPE_WEBHOOK_SECRET` in your `.env` file exactly matches the temporary secret shown by the `stripe listen` command.
    *   Confirm you restarted `vercel dev` after adding the secret to `.env`.

2.  **Simulate a Payment:**
    *   Open your web application in your browser.
    *   Log in as a test user.
    *   Click the payment button you created in Phase 4.
    *   Go through the Stripe Checkout process using Stripe's test card details.

3.  **Monitor the Terminals:**
    *   **`stripe listen` terminal:** You should see event notifications (like `POST /api/stripe-webhook --> 200 OK`) indicating that Stripe sent events and your local server responded successfully. Look for `checkout.session.completed`.
    *   **`vercel dev` terminal:** Check the logs from your `api/stripe-webhook.ts` handler. You should see:
        *   `✅ Webhook signature verified.`
        *   `Received event: checkout.session.completed`
        *   `✅ Payment successful for User ID: <the-actual-user-id>` (This ID should match the logged-in user).
        *   You might also see logs for other event types (`Received unhandled event type: ...`).

4.  **Test Failure Cases (Good Practice):**
    *   **Incorrect Secret:** Stop `vercel dev`, change the `STRIPE_WEBHOOK_SECRET` in `.env` to something invalid, and restart `vercel dev`. Make another test payment. Observe the `vercel dev` logs – you should now see `❌ Webhook signature verification failed: ...` and your endpoint should return a 400 error to Stripe. (Remember to fix the secret and restart `vercel dev` afterwards!).
    *   **Listener Down:** Stop the `stripe listen` process. Make another test payment. Notice that Stripe Checkout works, but your `vercel dev` logs won't show any webhook activity because the listener isn't forwarding events. This simulates what happens if your live webhook endpoint is down. Start `stripe listen` again to resume testing.

---

## Implementation Notes & Summary (Phase 5)

*   **Status:** Completed and Tested Successfully.
*   **Process:**
    *   User started `stripe listen --forward-to ...` in a separate terminal and copied the temporary `whsec_...` secret.
    *   The temporary `STRIPE_WEBHOOK_SECRET` was added to the `.env` file.
    *   `vercel dev` was restarted to load the new environment variable.
    *   The `micro` npm package was installed (`npm install micro`).
    *   The webhook handler file `api/stripe-webhook.ts` was created with logic for signature verification and handling the `checkout.session.completed` event.
*   **Difficulties Encountered:**
    *   The `stripe` command was not initially recognized in the terminal.
    *   TypeScript errors (`TS2322` for `apiVersion`, `TS2345` for `webhookSecret`) were present after initial code creation.
*   **Fixes Applied:**
    *   Installed Stripe CLI using `winget install --id=Stripe.StripeCli`.
    *   A system reboot was required for the terminal to recognize the `stripe` command after installation (likely due to PATH environment variable update timing).
    *   Corrected the `apiVersion` string in `api/stripe-webhook.ts` to match the one expected by the installed Stripe type definitions (`'2025-03-31.basil'`).
    *   Added a non-null assertion (`!`) to `webhookSecret` in the `stripe.webhooks.constructEvent` call to satisfy TypeScript, as the variable's existence was validated earlier in the code.
    *   A restart of `vercel dev` was needed for the TypeScript fixes to be correctly recognized and errors to disappear from the logs.
*   **Outcome:** The webhook successfully verifies incoming Stripe events using the temporary signing secret and logs the user ID upon receiving the `checkout.session.completed` event.

This phase ensures your backend can securely confirm payment success directly from Stripe, forming a crucial part of the payment flow. 