let stripeModule: typeof import('stripe') | null = null;

export const getStripe = async () => {
  if (!stripeModule) {
    stripeModule = await import('stripe');
  }
  return stripeModule.default; // default is the Stripe constructor
};