# Phase 4: Frontend Stripe Redirect

**Status: Not Started**

**Goal:** This phase focuses on implementing the frontend logic required to initiate the Stripe Checkout process. We will create a user interface element (like a button) that, when clicked by a logged-in user, calls the backend API endpoint created in Phase 3 (`/api/create-checkout-session`). Upon receiving a valid session ID from the backend, the frontend will redirect the user to the secure Stripe Checkout page to complete their payment.

**Prerequisites:**
*   Phase 3 must be completed, ensuring the backend API at `/api/create-checkout-session` is functional and tested.
*   The Stripe publishable key must be correctly configured as `VITE_STRIPE_PUBLISHABLE_KEY` in the `.env` file.

---

## Implementation Steps

### 1. Install Stripe.js Library

First, we need to add the official Stripe.js library to our frontend project. This library provides the necessary tools to interact with Stripe elements and securely handle redirects. Open your terminal in the project's root directory and run:

```bash
npm install @stripe/stripe-js
```

### 2. Load Stripe.js Instance

To use Stripe.js, we need to load it with our publishable key. It's crucial to load Stripe.js only once for performance reasons. A good place to do this is in a central location like the main `src/App.tsx` file or within a dedicated context provider if you have one set up for billing or Stripe integration. This ensures the `stripePromise` (a promise that resolves with the Stripe object) is readily available when needed.

```typescript
// Example placement near the top of src/App.tsx
import { loadStripe, Stripe } from '@stripe/stripe-js';
// ... other imports

const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
if (!stripePublishableKey) {
  console.error('Stripe Publishable Key is missing. Check your .env file.');
  throw new Error('Missing Stripe Publishable Key');
}
// Load Stripe and keep the promise accessible
const stripePromise = loadStripe(stripePublishableKey);

function App() {
  // ... rest of App component logic ...
  // You might pass stripePromise down via props or context
}
```

### 3. Create the Payment Button Component

Next, we'll create a dedicated React component to handle the checkout initiation. Create a new directory `src/components/Billing` if it doesn't already exist, and inside it, create the file `src/components/Billing/PaymentButton.tsx`.

This component will render a button (e.g., "Upgrade to Pro"). Its core logic resides in an `async` click handler (`handleCheckout`). This handler performs the following actions:

1.  **Check Authentication:** Ensures a user is logged in (e.g., by checking for a valid `session` object). If not logged in, it displays an error and stops.
2.  **Get User ID:** Retrieves the unique ID (`userId`) of the logged-in user from the session.
3.  **Call Backend API:** Sends a POST request to our `/api/create-checkout-session` endpoint. The request body includes the `userId` in JSON format.
4.  **Handle API Response:** Parses the JSON response from the backend. It expects a `sessionId` field. If there's an error or no `sessionId`, it throws an error.
5.  **Redirect to Stripe:** If a `sessionId` is received, it uses the loaded Stripe.js instance (`await stripePromise`) and calls `stripe.redirectToCheckout({ sessionId })`. This function securely redirects the user away from our site to the Stripe-hosted checkout page.
6.  **State Management:** The component includes basic loading and error states to provide feedback to the user during the process.

```typescript
// src/components/Billing/PaymentButton.tsx
import React, { useState } from 'react';
// Adapt based on how you manage auth state (Context or Props)
import { Session } from '@supabase/supabase-js';
import { loadStripe } from '@stripe/stripe-js'; // Ideally, get stripePromise from context/props

// Re-loading here for simplicity, but prefer loading once centrally.
const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
if (!stripePublishableKey) throw new Error('Missing Stripe Key'); // Added check
const stripePromise = loadStripe(stripePublishableKey);

interface PaymentButtonProps {
  session: Session | null; // Pass session via props or use context
}

const PaymentButton: React.FC<PaymentButtonProps> = ({ session }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheckout = async () => {
    setError(null);
    setLoading(true);

    if (!session?.user) {
      setError('You must be logged in to make a payment.');
      setLoading(false);
      return;
    }
    const userId = session.user.id;

    try {
      // 1. Call backend API
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: userId }),
      });

      const { sessionId, error: apiError } = await response.json();

      if (!response.ok || apiError) {
        throw new Error(apiError || 'Failed to create checkout session.');
      }
      if (!sessionId) {
        throw new Error('No session ID returned from backend.');
      }

      // 2. Redirect to Stripe Checkout
      const stripe = await stripePromise;
      if (!stripe) {
         throw new Error('Stripe.js failed to load.');
      }

      const { error: stripeError } = await stripe.redirectToCheckout({ sessionId });

      // This point is only reached if redirectToCheckout fails immediately
      if (stripeError) {
        console.error('Stripe redirect error:', stripeError);
        setError(`Payment Error: ${stripeError.message}`);
      }
    } catch (err: any) {
      console.error('Checkout process error:', err);
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={handleCheckout}
        disabled={loading || !session}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Processing...' : 'Upgrade to Pro'}
      </button>
      {error && <p className="text-red-500 mt-2">Error: {error}</p>}
    </div>
  );
};

export default PaymentButton;
```
*Note: This example passes the `session` as a prop. Adapt this if you're using a shared authentication context (`useAuth`). Remember the recommendation to load `stripePromise` centrally rather than inside this component.*

### 4. Create Placeholder Payment Result Pages

After the user interacts with the Stripe Checkout page, Stripe will redirect them back to one of two URLs we specified when creating the session in Phase 3: a success URL or a cancel URL. We need to create simple placeholder pages for these redirects.

Create two components: `src/components/Billing/PaymentSuccess.tsx` and `src/components/Billing/PaymentCancel.tsx`. For now, these can just display a confirmation or cancellation message and provide a link back to the main application dashboard.

```typescript
// src/components/Billing/PaymentSuccess.tsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom'; // Added useLocation

const PaymentSuccess: React.FC = () => {
  const location = useLocation();
  // Example: Extract session_id if needed for future verification
  const sessionId = new URLSearchParams(location.search).get('session_id');

  return (
    <div className="p-4 text-center">
      <h2 className="text-2xl font-bold text-green-600">Payment Successful!</h2>
      <p>Thank you for your purchase. Your access should be updated shortly.</p>
      {/* sessionId can be used later if needed */}
      {sessionId && <p className="text-sm text-gray-500">Session ID: {sessionId}</p>}
      <Link to="/app" className="text-blue-600 hover:underline mt-4 inline-block">Go to Dashboard</Link>
    </div>
  );
};
export default PaymentSuccess;
```

```typescript
// src/components/Billing/PaymentCancel.tsx
import React from 'react';
import { Link } from 'react-router-dom';

const PaymentCancel: React.FC = () => (
  <div className="p-4 text-center">
    <h2 className="text-2xl font-bold text-red-600">Payment Cancelled</h2>
    <p>Your payment process was cancelled. You have not been charged.</p>
    <Link to="/app" className="text-blue-600 hover:underline mt-4 inline-block">Return to Dashboard</Link>
  </div>
);
export default PaymentCancel;
```

Next, add routes for these components in your main router setup (`src/App.tsx`). These routes should typically be public (outside any protected route wrappers) as the user might not have an active session immediately upon returning from Stripe.

```typescript
// Inside <Routes> in src/App.tsx
import PaymentSuccess from './components/Billing/PaymentSuccess';
import PaymentCancel from './components/Billing/PaymentCancel';

// ... other routes ...
<Route path="/payment-success" element={<PaymentSuccess />} />
<Route path="/payment-cancel" element={<PaymentCancel />} />
// ... protected routes wrapper if applicable ...
```

### 5. Temporarily Display the Payment Button for Testing

To test the flow, we need to place the `<PaymentButton />` component somewhere in the UI that is accessible *only* to logged-in users. A suitable location might be within the main application `Layout` component or on a user dashboard page (like `FrontPage`). Ensure you pass the necessary props (like the `session` object) to the button component.

```typescript
// Example: Inside src/components/layout/Layout.tsx
import PaymentButton from '../Billing/PaymentButton';
// ... other imports ...

// Assuming LayoutProps includes session
interface LayoutProps {
    session: Session | null;
    // ... other props
}


const Layout: React.FC<LayoutProps> = ({ session /* ... other props */ }) => {
  // ... existing layout code ...
  return (
    <div className="flex flex-col min-h-screen"> {/* Example layout structure */}
      {/* ... Header ... */}
      {/* Temporarily add payment button for testing */}
      {session && (
        <div className="p-4 bg-yellow-100 border border-yellow-300 text-center my-4 mx-auto max-w-md rounded">
          <p className="font-semibold mb-2">Testing Phase 4: Payment Button</p>
          <PaymentButton session={session} />
        </div>
      )}
      <main className="flex-grow">
        <Outlet /> {/* Renders the nested route component */}
      </main>
      {/* ... Footer ... */}
    </div>
  );
};

export default Layout;
```

---

## Testing Procedure

1.  **Start Development Server:** Run `vercel dev` in your terminal. Ensure the backend API from Phase 3 is running and accessible.
2.  **Log In:** Open your application in the browser and log in using the Supabase authentication you set up earlier.
3.  **Trigger Payment:** Navigate to the part of your application where you temporarily placed the `<PaymentButton />`. Click the "Upgrade to Pro" (or similarly labeled) button.
4.  **Verify Redirect:** You should be redirected away from your application to the Stripe Checkout page. This page will display Stripe branding and the details of the test product you configured in Phase 3.
5.  **Test Success Scenario:** On the Stripe Checkout page, enter Stripe's standard test card details (e.g., card number `4242 4242 4242 4242`, any valid future expiration date, any 3-digit CVC like `123`, and any postal code like `12345`). Complete the mock payment process. After successful completion, Stripe should redirect you back to your application's `/payment-success` route, where you should see the success message.
6.  **Test Cancel Scenario:** Initiate the payment process again by clicking the button. On the Stripe Checkout page, find and click the link or button provided by Stripe to cancel the payment or go back to your site. Stripe should redirect you back to your application's `/payment-cancel` route, displaying the cancellation message.
7.  **Check Logs:** Throughout the testing process, monitor your browser's developer console for any frontend JavaScript errors. Also, keep an eye on the terminal running `vercel dev` for any potential errors logged by the `/api/create-checkout-session` backend function.
 

---

## Notes on Implementation

*   **TypeScript Configuration:** Several TypeScript linter errors were encountered initially:
    *   `Cannot find module...`: Errors appeared when importing components (`PaymentButton`, `PaymentSuccess`, `PaymentCancel`) before their files were created or recognized.
    *   `import.meta.env`: Accessing Vite environment variables required adding `"vite/client"` to the `types` array in `tsconfig.json`'s `compilerOptions`.
    *   React Import (`allowSyntheticDefaultImports`): Issues with default React imports were resolved by setting `"esModuleInterop": true` and `"allowSyntheticDefaultImports": true` in `tsconfig.json`'s `compilerOptions`.
*   **Stripe Promise Loading:** The implementation followed the recommendation to load the `stripePromise` once in `App.tsx` and pass it down via props (`Layout` -> `PaymentButton`) rather than reloading it within the `PaymentButton` component itself.
*   **Cancel URL UX:** It was observed that using the browser's back button while on the Stripe Checkout page redirects the user to the mandatory `cancel_url` (`/payment-cancel`). To improve user experience, the messaging on the `PaymentCancel.tsx` component was updated to clarify that the checkout process was left incomplete, rather than explicitly cancelled by the user.
 