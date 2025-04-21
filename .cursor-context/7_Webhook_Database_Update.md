# Phase 7: Webhook Database Update

**Status: Completed**

**Goal:** Connect the Stripe webhook confirmation (`checkout.session.completed`) to the Supabase database, updating the user's record in the `public.users` table to mark them as subscribed (`is_subscribed = true`).

**Prerequisites:**
*   Phase 5 Completed (Webhook verifies events and extracts `userId`).
*   Phase 6 Completed (`public.users` table exists in Supabase, linked to `auth.users`).
*   `@supabase/supabase-js` installed.

---

**Implementation Steps:**

1.  **User Action: Get Supabase Service Role Key**
    *   **Done.** This key allows bypassing RLS policies, necessary for the backend webhook to update *any* user's profile.
    *   Obtained from Supabase project dashboard > Project Settings > API > Project API keys > `service_role` key.

2.  **Configure Service Role Key (`.env`)**
    *   **Done.** The Service Role Key was added to the `.env` file without the `VITE_` prefix.
        ```env
        # .env
        # ... other keys ...

        # Supabase Admin Key (for backend use ONLY - DO NOT add VITE_ prefix)
        SUPABASE_SERVICE_ROLE_KEY=*************************
        ```
    *   `vercel dev` server was restarted to load the new variable.

3.  **Initialize Supabase Admin Client in Webhook (`api/stripe-webhook.ts`)**
    *   **Done.** Modified `api/stripe-webhook.ts` to import `createClient` and initialize a *second* Supabase client instance specifically for admin operations using the Service Role Key.
        ```typescript
        // api/stripe-webhook.ts
        import type { VercelRequest, VercelResponse } from '@vercel/node';
        import Stripe from 'stripe';
        import { buffer } from 'micro';
        import { createClient } from '@supabase/supabase-js'; // <-- Added Import

        // ... Stripe key loading ...

        // Load Supabase URL and Service Key
        const supabaseUrl = process.env.VITE_SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // <-- Added Service Key loading

        // Validation for Supabase keys added...

        // Initialize Stripe client (existing)...
        const stripe = new Stripe(stripeSecretKey!, { /* ... */ });

        // Initialize Supabase Admin Client <-- Added Admin Client
        const supabaseAdmin = createClient(supabaseUrl!, supabaseServiceKey!, {
          auth: { persistSession: false } // Disable session persistence for server-side use
        });

        // ... rest of the file ...
        ```

4.  **Implement Profile Update Logic in Webhook (`api/stripe-webhook.ts`)**
    *   **Done.** Added the database update logic inside the `if (event.type === 'checkout.session.completed')` block, using the `supabaseAdmin` client.
        ```typescript
            // Inside the 'if (event.type === 'checkout.session.completed')' block
            const session = event.data.object as Stripe.Checkout.Session;
            const userId = session.client_reference_id;

            if (userId) {
              console.log(`✅ Payment successful for User ID: ${userId}. Attempting profile update...`);

              try {
                // Update the user's profile in Supabase using the admin client
                const { data, error } = await supabaseAdmin
                  .from('users') // Correct table name: public.users
                  .update({ is_subscribed: true }) // Correct column name and value
                  .eq('id', userId) // Match the user ID
                  .select('id, is_subscribed') // Select relevant columns for logging
                  .single(); // Expect only one row

                if (error) {
                  // Log Supabase-specific errors
                  console.error(`❌ DB Error: Failed to update profile for user ${userId}. Supabase error:`, error);
                } else {
                  // Log success and the updated data
                  console.log(`✅ DB Success: Successfully updated profile for user ${userId}. Profile data:`, data);
                }
              } catch (updateError) {
                // Catch any other exceptions during the update
                console.error(`❌ Exception during profile update for user ${userId}:`, updateError);
              }
            } else {
              console.warn(`⚠️ Webhook Warning: Payment successful but no userId found...`);
            }
          } // ... handle other events ...

          // Return 200 to Stripe regardless of DB update success/failure
          res.status(200).json({ received: true });
        }
        ```

---

**Testing & Verification:**

1.  **Environment Setup:**
    *   `vercel dev` running with the `SUPABASE_SERVICE_ROLE_KEY` loaded.
    *   `stripe listen --forward-to ...` running with the temporary webhook secret updated in `.env`.
2.  **Target User:** A user in the `public.users` table was selected whose `is_subscribed` status was `false`.
3.  **Test Payment:** Logged in as the target user and completed a payment using Stripe test card details.
4.  **`vercel dev` Logs Observed:**
    *   Webhook signature verification succeeded.
    *   `checkout.session.completed` event received.
    *   Log confirmed payment success for the correct `userId`.
    *   Log confirmed database update attempt.
    *   **Crucially, the log `✅ DB Success: Successfully updated profile for user <user-id>. Profile data: { id: '...', is_subscribed: true }` was observed.**
5.  **Database Verification:**
    *   Checked the Supabase dashboard > Table Editor > `public.users` table.
    *   Confirmed that the `is_subscribed` column for the target user changed from `false` to **`true`**.

---

**Outcome:**

Phase 7 implementation was successful. The Stripe webhook now correctly identifies the user upon successful payment (`checkout.session.completed`) and uses the Supabase Admin client (authenticated with the Service Role Key) to update the corresponding user's record in the `public.users` table, setting `is_subscribed` to `true`. Error handling and logging are in place for the database operation, while ensuring Stripe always receives a `200 OK` acknowledgment. 