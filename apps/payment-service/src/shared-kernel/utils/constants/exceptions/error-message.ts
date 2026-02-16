import { MAX_AMOUNT } from "src/stripe/constants/max-amount";

export const ERROR_MESSAGES = {
  EMAIL: {
    REQUIRED: "Email id is required",
    VALID_EMAIL: "Please provide valid email",
  },
  CURRENCY: {
    REQUIRED: "Currency is required",
  },
  AMOUNT: {
    REQUIRED: "Amount is required",
  },
  PRODUCT_NAME: {
    REQUIRED: "Product name is required",
  },
  QUANTITY: {
    REQUIRED: "Quantity is required",
  },
  SELLER_ID: {
    REQUIRED: "Seller id is required",
  },
  BUYER_ID: {
    REQUIRED: "Buyer id is required",
  },
  ASSET_ID: {
    REQUIRED: "Asset is required",
  },
  COUNTRY: {
    REQUIRED: "Country is required",
    STRING: "Country must be string",
  },
  SELLER_STRIPE_ID: {
    REQUIRED: "Seller stripe id is required",
  },
  CHECKOUT_SESSION_ID: {
    REQUIRED: "Checkout session id is required",
  },
  RESPONSES: {
    SELLER_NOT_FOUND: "Seller not found ",
    BUYER_NOT_FOUND: "Buyer not found",
    ASSET_NOT_FOUND: "Asset not found",
    USER_NOT_FOUND: "User not found",
    STRIPE: {
      PAYMENT_NOT_COMPLETED: "Payment not completed yet",
      PAYMENT_NOT_FOUND: "Payment not found",
      NEGATIVE_AMOUNT: "Amount must be greater than zero",
      MAX_AMOUNT: `Amount exceeds maximum limit of ${MAX_AMOUNT / 100} USD`,
    },
    TOKEN: {
      TOKEN_UNAVAILABLE: "Token is unavailable for that asset",
    },
  },
};
