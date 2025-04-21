# New Phase 3: Stripe Setup & Backend Checkout API

**Status: Not Started**

**Goal:** Create the backend endpoint that generates a Stripe Checkout session using TEST keys and prices.

**Prerequisites:**
*   Phase 1 & 2 Completed.
*   Supabase project setup.
*   Stripe Account created.

---

**Tasks:**

1.  **User Action: Stripe Setup (Test Mode)**
    *   Go to your [Stripe Dashboard](https://dashboard.stripe.com/test/dashboard). Ensure you are in **Test mode**.
    *   Navigate to Developers > API keys. Note down your **Publishable key** (`pk_test_...`) and **Secret key** (`sk_test_...`).
    *   Navigate to Products > Add product. Create a product (e.g., "ATAR Calc Pro Access - Test"). Add a one-time price to it. Note down the **Price ID** (`price_...`).

2.  **Configure Environment Variables (`.env`)**
    *   Open or create the `.env` file in your project root.
    *   Add your Stripe TEST keys and the TEST Price ID:
        ```env
        # .env
        # ... existing Supabase keys ...

        # Stripe Test Keys
        VITE_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_TEST_PUBLISHABLE_KEY
        STRIPE_SECRET_KEY=sk_test_YOUR_TEST_SECRET_KEY
        STRIPE_PRICE_ID=price_YOUR_TEST_PRICE_ID
        ```
    *   **Important:** Ensure `.env` is listed in your `.gitignore` file. The `STRIPE_SECRET_KEY` must *not* have the `VITE_` prefix.

3.  **Create API Directory**
    *   If it doesn't already exist, create an `api` directory in the root of your project. This is where Vercel looks for serverless functions.
        ```bash
        mkdir api
        ```

4.  **Install Stripe Node Library**
    *   In your terminal (project root):
        ```bash
        npm install stripe
        ```

5.  **Create Checkout Session API Endpoint**
    *   Create the file `api/create-checkout-session.ts`.
    *   Add the following code:
        ```typescript
        // api/create-checkout-session.ts
        import type { VercelRequest, VercelResponse } from '@vercel/node';
        import Stripe from 'stripe';

        // Ensure Stripe secret key and Price ID are loaded from environment variables
        const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
        const priceId = process.env.STRIPE_PRICE_ID;

        if (!stripeSecretKey || !priceId) {
          console.error('Stripe secret key or price ID is missing from environment variables.');
          throw new Error('Server configuration error: Missing Stripe credentials.');
        }

        // Initialize Stripe with the secret key
        const stripe = new Stripe(stripeSecretKey, {
          apiVersion: '2024-04-10', // Use a recent API version
          typescript: true,
        });

        export default async function handler(
          req: VercelRequest,
          res: VercelResponse
        ) {
          if (req.method !== 'POST') {
            res.setHeader('Allow', 'POST');
            return res.status(405).end('Method Not Allowed');
          }

          try {
            // Extract userId from the request body sent by the frontend
            const { userId } = req.body;

            if (!userId) {
              console.error('User ID missing from request body');
              return res.status(400).json({ error: 'User ID is required' });
            }

            // Define success and cancel URLs (relative to your frontend's domain)
            // These placeholders will redirect to pages created in a later phase
            const baseUrl = req.headers.origin || `http://${req.headers.host}`; // Vercel provides origin, fallback for local dev
            const successUrl = `${baseUrl}/payment-success?session_id={CHECKOUT_SESSION_ID}`;
            const cancelUrl = `${baseUrl}/payment-cancel`;

            console.log(`Creating Stripe session for user: ${userId} with price: ${priceId}`);

            // Create a Stripe Checkout Session
            const session = await stripe.checkout.sessions.create({
              payment_method_types: ['card'],
              line_items: [
                {
                  price: priceId, // Use the Price ID from .env
                  quantity: 1,
                },
              ],
              mode: 'payment', // Use 'payment' for one-time charges
              success_url: successUrl,
              cancel_url: cancelUrl,
              client_reference_id: userId, // Pass the Supabase user ID
            });

            // Return the session ID to the frontend
            console.log(`Stripe session created: ${session.id}`);
            res.status(200).json({ sessionId: session.id });

          } catch (error: any) {
            console.error('Error creating Stripe session:', error);
            res.status(500).json({ error: `Could not create checkout session: ${error.message}` });
          }
        }
        ```

---

**Testing:**

1.  **Start the development server with Vercel CLI:**
    *   Install Vercel CLI if you haven't: `npm install -g vercel`
    *   Run: `vercel dev`
    *   This command starts your Vite dev server (e.g., on `http://localhost:5173`) *and* makes the `/api` functions available (e.g., `http://localhost:5173/api/create-checkout-session`). Note the port Vercel uses.
2.  **Send a Test Request:**
    *   Use a tool like `curl` (command line) or Postman (GUI).
    *   Send a **POST** request to `http://localhost:PORT/api/create-checkout-session` (replace `PORT` with the port from `vercel dev`).
    *   Include a JSON body with a dummy `userId`: `{"userId": "test-user-123"}`.
    *   Set the `Content-Type` header to `application/json`.
    *   **Example curl command:**
        ```bash
        curl -X POST http://localhost:5173/api/create-checkout-session \
        -H "Content-Type: application/json" \
        -d '{"userId": "test-user-123"}'
        ```
3.  **Verify the Response:**
    *   Check the `vercel dev` terminal logs for any errors.
    *   The response from `curl`/Postman should be a JSON object containing a `sessionId` field, which looks like `{"sessionId": "cs_test_..."}`.
    *   If you see errors, check:
        *   Are the `.env` variables loaded correctly (did you restart `vercel dev` after adding them)?
        *   Are the Stripe keys and Price ID correct in `.env`?
        *   Is the request method POST? Is the body correctly formatted JSON? 

---

**Notes & Troubleshooting:**

*   **TypeScript Errors (`api/create-checkout-session.ts`):**
    *   Initial setup might show errors like `Cannot find module '@vercel/node'`.
    *   Fix: Install the necessary types: `npm install --save-dev @vercel/node`.
    *   Another error might relate to `apiVersion` (e.g., `Type '"2024-06-20"' is not assignable to type '"2025-03-31.basil"'`). This can happen if installed types expect a different (sometimes newer/beta) version than the latest stable one.
    *   Fix: We updated the `apiVersion` in the `Stripe` constructor to the specific string the linter requested (`'2025-03-31.basil'`) to resolve the type error, even though `'2024-06-20'` was the latest stable version at the time.

*   **TypeScript Configuration (`tsconfig.json`):**
    *   The `vercel dev` command initially failed due to incompatible settings in `tsconfig.json`.
    *   Errors included `TS5070: Option '--resolveJsonModule' cannot be specified without 'node' module resolution strategy`, `TS6046: Argument for '--moduleResolution' option must be...`, and `TS5023: Unknown compiler option 'allowImportingTsExtensions'`.
    *   Fix: Changed `"moduleResolution": "bundler"` to `"moduleResolution": "node"` and removed the line `"allowImportingTsExtensions": true`.

*   **Testing API with `curl` in PowerShell:**
    *   The standard `curl` command provided in the documentation may fail in Windows PowerShell because `curl` is often an alias for `Invoke-WebRequest`, which has different syntax.
    *   Initial Error: `Invoke-WebRequest : Cannot bind parameter 'Headers'. Cannot convert the "Content-Type: application/json" value of type "System.String" to type "System.Collections.IDictionary".`
    *   Later Error (with corrected syntax but potentially problematic header): `NotSupportedError: expect header not supported`.
    *   Workaround: Use the specific `Invoke-WebRequest` syntax:
        ```powershell
        Invoke-WebRequest -Uri http://localhost:PORT/api/create-checkout-session -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"userId": "test-user-123"}'
        ```
        (Replace `PORT` with the actual port used by `vercel dev`, e.g., 3000).
    *   Alternative: Use Git Bash or standard `curl.exe` if available, with the original `curl` command syntax.

*   **Stripe Session `mode` (`payment` vs. `subscription`):**
    *   An error `{"error":"Could not create checkout session: You specified 'payment' mode but passed a recurring price..."}` occurred during testing.
    *   Cause: The Price ID configured in Stripe (`price_...`) was for a recurring subscription, but the code was creating a session with `mode: 'payment'`.
    *   Fix: Changed the code in `api/create-checkout-session.ts` to use `mode: 'subscription'` to match the price type.

*   **Vercel Login:**
    *   Running `vercel dev` for the first time requires logging into a Vercel account. If no account exists, sign up at [vercel.com](https://vercel.com) first, then run `vercel login` or `vercel dev` again and follow the prompts. 