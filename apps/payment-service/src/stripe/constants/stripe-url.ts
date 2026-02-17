// TODO: Need to use front redirect url and cancel url, once frontend completed
const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3004";

export const STRIPE_URLS = {
  CHECKOUT: {
    RETURN_URL: `${frontendUrl}/sell`,
    REFRESH_URL: `${frontendUrl}/sell`,
    CANCEL_URL: `${frontendUrl}/orders?payment=failed`,
    SUCCESS_URL: `${frontendUrl}/orders?payment=success`,
  },
};

export const STRIP_WEBHOOK_EVENTS = {
  PAYMENTS_INTENT_SUCCEEDED: "payment_intent.succeeded",
  PAYMENTS_INTENT_FAILED: "payment_intent.payment_failed",
};
