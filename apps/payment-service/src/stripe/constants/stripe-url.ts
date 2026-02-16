// TODO: Need to use front redirect url and cancel url, once frontend completed
export const STRIPE_URLS = {
  CHECKOUT: {
    RETURN_URL: "http://localhost:3004",
    REFRESH_URL: "https://www.google.com",
    CANCEL_URL: "http://localhost:3004/orders?payment=failed",
    SUCCESS_URL: "http://localhost:3004/orders?payment=success",
  },
};

export const STRIP_WEBHOOK_EVENTS = {
  PAYMENTS_INTENT_SUCCEEDED: "payment_intent.succeeded",
  PAYMENTS_INTENT_FAILED: "payment_intent.payment_failed",
};
