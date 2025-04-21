# Phase 6: Setting Up User Profiles in Supabase

**Status: Not Started**

**Goal:** Create the necessary database structure (`profiles` table) and security rules (Row Level Security) in Supabase. This will allow us to store user-specific information securely, most importantly whether they have paid for access.

**Prerequisites:**

*   Your Supabase project is set up and you can access its dashboard.

---

## Creating the `profiles` Table

First, we need a dedicated table to hold information related to each authenticated user. We'll link this table directly to Supabase's built-in authentication system.

**Your Action:**

1.  **Navigate to Table Editor:** In your Supabase project dashboard, find the **Table Editor** section in the sidebar (it usually has an icon resembling a spreadsheet).
2.  **Create New Table:** Click the **"New table"** button.
3.  **Basic Settings:**
    *   Set the **Table Name** to `profiles`.
    *   Ensure the **Schema** is set to `public` (this is typically the default).
    *   **Crucially, make sure the "Enable Row Level Security (RLS)" checkbox is checked.** This is vital for ensuring users can only access their own data later.
4.  **Define Columns:** Add the following columns with the specified settings:
    *   **`id` Column:**
        *   Type: `uuid`
        *   Primary Key: Check the **"Is Primary Key"** box.
        *   Nullable: **Uncheck** (every profile must have an ID).
        *   Default Value: Select **"Expression"** from the dropdown and enter `auth.uid()`.
            *   *Explanation:* This automatically sets the `id` of a new profile row to the unique ID of the user creating it from Supabase's authentication system (`auth.users` table).
        *   Foreign Key Constraint: Click **"Add foreign key relation"**.
            *   Set **Foreign Table** to `users` (ensure you select the one under the **`auth`** schema, not `public`).
            *   Set **Column(s)** to `id`.
            *   Action on delete: Choose `Cascade`. This means if a user is deleted from `auth.users`, their corresponding profile in `public.profiles` will also be deleted automatically.
    *   **`created_at` Column:**
        *   Type: `timestamptz` (Timestamp with Time Zone).
        *   Default Value: Select **"Expression"** and enter `now()`. This automatically records when the profile row was created.
        *   Nullable: You can leave this checked or uncheck it (since it has a default value).
    *   **`has_paid` Column:**
        *   Type: `bool` (Boolean).
        *   Nullable: **Uncheck** (we always want to know if they've paid or not).
        *   Default Value: Enter `false`. New profiles will default to not having paid.
    *   **(Optional) `email` Column:**
        *   Type: `text`.
        *   Nullable: Check (or leave unchecked if the trigger always populates it).
        *   *Use:* This can be useful for display purposes or if you want a denormalized copy of the user's email.
5.  **Save the Table:** Click the **"Save"** button.

## Automating Profile Creation with a Trigger

To ensure every user who signs up gets a corresponding entry in our new `profiles` table, we can create a database trigger. This trigger will automatically run a function whenever a new user is added to Supabase's `auth.users` table.

**Your Action (Recommended):**

1.  **Navigate to Triggers:** In the Supabase dashboard sidebar, go to **Database** > **Triggers**.
2.  **Create New Trigger:** Click **"New Trigger"**.
3.  **Configure Trigger:**
    *   **Name:** Give it a descriptive name, like `create_profile_on_signup`.
    *   **Table:** **Crucially, select the `users` table from the `auth` schema** (not the `public` schema).
    *   **Events:** Check the `INSERT` box.
    *   **Trigger Type:** Choose `AFTER`.
    *   **Orientation:** Choose `ROW`.
4.  **Create Trigger Function:** Click the **"Create a new function"** button next to the "Function" dropdown.
    *   **Function Name:** Name it something like `handle_new_user`.
    *   **Schema:** Select `public`.
    *   **Return Type:** Set to `trigger`.
    *   **Definition (SQL Code):** Paste the following code into the definition box:
        ```sql
        begin
          insert into public.profiles (id, email)
          values (new.id, new.email);
          return new;
        end;
        ```
        *   *Explanation:* This SQL code runs after a new user (`new`) is inserted into `auth.users`. It then inserts a new row into `public.profiles`, setting the `id` and `email` columns based on the `id` and `email` of the newly created user (`new.id`, `new.email`).
    *   **Advanced Settings:** **Enable the "Run function as security definer" toggle.** This is essential because it allows the function to have the necessary permissions to insert into the `public.profiles` table, even though the user signing up might not have direct insert permissions.
    *   **Save Function:** Click **"Confirm"**.
5.  **Link Trigger to Function:** Back on the trigger creation screen, ensure your newly created `handle_new_user` function is selected in the "Function" dropdown.
6.  **Save Trigger:** Click **"Confirm"**.

## Securing Profile Data with Row Level Security (RLS)

Now that we have the table and automatic profile creation, we need to restrict access using Row Level Security (RLS). This ensures users can only interact with their *own* profile data, preventing them from seeing or modifying anyone else's.

**Your Action:**

1.  **Navigate to Policies:** In the Supabase dashboard sidebar, go to **Authentication** > **Policies**. Find the `profiles` table in the list and click it. (Alternatively, go back to the Table Editor, select `profiles`, and go to the "Policies" tab).
2.  **Create SELECT Policy:**
    *   Click **"New Policy"**.
    *   Choose **"Create a policy from scratch"**.
    *   **Policy Name:** Use a descriptive name like `Allow authenticated users read access to own profile`.
    *   **Allowed operation:** Select `SELECT`.
    *   **Target roles:** Choose `authenticated` (meaning only logged-in users).
    *   **USING expression:** Enter `auth.uid() = id`.
        *   *Explanation:* This rule allows a SELECT operation to proceed *only if* the ID (`id`) of the profile row being accessed matches the unique ID (`auth.uid()`) of the currently logged-in user making the request.
    *   **Review and Save:** Click **"Review"**, then **"Save policy"**.
3.  **(Optional) Create UPDATE Policy:** If you plan to allow users to update their own profile information (e.g., name, preferences, but likely not `has_paid` directly), create an UPDATE policy:
    *   Click **"New Policy"** > **"Create a policy from scratch"**.
    *   **Policy Name:** `Allow authenticated users update access to own profile`.
    *   **Allowed operation:** Select `UPDATE`.
    *   **Target roles:** Choose `authenticated`.
    *   **USING expression:** `auth.uid() = id` (Same as SELECT: only allow updates on their own row).
    *   **WITH CHECK expression:** `auth.uid() = id` (This is an additional check *before* the update is committed, preventing a user from trying to change the `id` field to someone else's ID).
    *   **Review and Save:** Click **"Review"**, then **"Save policy"**.

*Note:* The `has_paid` field will be updated by our backend webhook in the next phase. That process uses a special Supabase key (Service Role Key) that bypasses these RLS policies, so we don't need a specific RLS policy to allow the webhook to update the `has_paid` status.

---

## Testing the Setup

It's important to verify that the table, trigger, and RLS policies are working as expected.

1.  **Test the Trigger:**
    *   Go to your application's sign-up page (e.g., `/auth`).
    *   Create a **brand new user account** with a unique email address.
    *   Go back to the Supabase Table Editor and view the `profiles` table.
    *   You should see a new row corresponding to the user you just created. Verify that the `id` matches the new user's ID in the `auth.users` table, the `email` is populated, and crucially, `has_paid` is `false`.

2.  **Test RLS SELECT Policy:**
    *   Log in to your application as any user (the new one or an existing one).
    *   Open your browser's developer console.
    *   Assuming your initialized `supabase` client is accessible (check Phase 1 if unsure), run this command:
        ```javascript
        await supabase.from('profiles').select('*');
        ```
    *   **Check the result:** The command should execute successfully. The `data` returned should be an array containing **only one object**: the profile belonging to the user you are currently logged in as. If it fails or returns multiple profiles, double-check your SELECT RLS policy configuration.

3.  **Test RLS SELECT (Negative Case):**
    *   Log out of your application.
    *   In the developer console, run the same command again:
        ```javascript
        await supabase.from('profiles').select('*');
        ```
    *   **Check the result:** The command might still succeed (Supabase doesn't block anonymous SELECTs by default unless you add a specific policy for the `public` role), but the `data` array should be **empty**. If it returns *any* profiles, it indicates RLS is not enabled correctly on the table or the policy is misconfigured.

---

## Notes on Implementation (Actual Steps Taken)

During implementation, we followed the core goals but adapted the steps based on the existing project state and encountered several debugging scenarios:

1.  **Existing Table:** We discovered that a table named `public.users` already existed and served the intended purpose of the `profiles` table described above. It was already linked to `auth.users` and contained relevant columns like `is_subscribed`. We decided to use this existing table instead of creating a new `profiles` table.
2.  **Trigger Setup:**
    *   Testing confirmed that no trigger existed to automatically populate `public.users` upon signup.
    *   An attempt to create the trigger via the Supabase UI failed because the `auth.users` table was not visible in the trigger creation dropdown menu (possibly a UI glitch).
    *   The trigger function (`handle_new_user_public`) and the trigger itself (`create_public_profile_on_signup` attached to `auth.users` AFTER INSERT) were successfully created using the SQL Editor.
3.  **Trigger Debugging:**
    *   Initial tests after creating the trigger resulted in 500 errors during signup.
    *   The user record *was* appearing in `auth.users`, indicating the error occurred during the trigger function execution.
    *   We investigated potential causes:
        *   Checked if the `full_name` column in `public.users` allowed NULLs (it did).
        *   Attempted to find specific errors in Postgres logs but couldn't locate relevant entries easily.
        *   Considered simplifying the trigger function or checking permissions.
    *   The critical error message (`ERROR: column "email" of relation "users" does not exist`) was eventually found in the **Auth logs**.
    *   The trigger function (`handle_new_user_public`) was corrected via the SQL Editor to remove the attempt to insert into the non-existent `email` column in `public.users`.
    *   Subsequent testing confirmed successful signup and automatic profile creation in `public.users`.
4.  **RLS Configuration:**
    *   Testing RLS via the browser console (after temporarily exposing the `supabase` client to `window`) revealed:
        *   Logged-in users correctly saw only their own data (`data: Array(1)`).
        *   Logged-out (anonymous) users incorrectly saw data (`data: Array(1)`).
    *   Investigation of existing RLS policies on `public.users` showed policies for SELECT, INSERT, and UPDATE were applied to the `public` role.
    *   The `SELECT` policy was modified using the Supabase UI:
        *   Target Role was changed from `public` to `authenticated`.
        *   The existing `USING (auth.uid() = id)` expression was kept.
    *   The unnecessary `INSERT` and `UPDATE` policies targeting the `public` role were deleted.
    *   Final testing confirmed logged-out users correctly saw no data (`data: Array(0)`).

**Outcome:** Phase 6 implementation is complete, using the existing `public.users` table, with a functional trigger and correctly configured RLS for secure read access. 