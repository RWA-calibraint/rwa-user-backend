import { DOCUMENT_TYPE } from "../document-type";

export const ERROR_MESSAGES = {
  EMAIL: {
    REQUIRED: "Email id is required",
    VALID_EMAIL: "Please provide valid email",
  },
  PASSWORD: {
    REQUIRED: "Password is required ",
  },
  VERIFICATION_CODE: {
    REQUIRED: "Verification is required",
  },
  NAME: {
    REQUIRED: "User name is required",
    INVALID_NAME:
      "Username can only contain letters, numbers, and spaces, and must start with a letter or number.",
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
    IN_VALID: "Seller id is invalid",
  },
  BUYER_ID: {
    REQUIRED: "Buyer id is required",
    IN_VALID: "Buyer id is invalid",
  },
  ASSET_ID: {
    REQUIRED: "Asset is required",
    IN_VALID: "Asset id is invalid",
  },
  ASSET_NAME: {
    REQUIRED: "Name must not be empty or contain only spaces",
  },
  ASSET_DESCRIPTION: {
    REQUIRED: "Description must not be empty or contain only spaces",
  },
  ASSET_PRICE: {
    REQUIRED: "Price must not be empty or contain only spaces",
  },
  ASSET_CATEGORY: {
    REQUIRED: "Category must not be empty or contain only spaces",
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
    NOT_FOUND: "The payment with this session id not found",
  },
  OBJECT_ID: {
    VALID: "Invalid mongoDB objectId",
  },
  STRIPE: {
    ACCOUNT_ID: {
      REQUIRED: "Stipe account id is required",
      IS_STRING: "Stripe account is must be the string",
    },
  },
  ASSET: {
    ASSET_ID: {
      REQUIRED: "Asset is required",
      IN_VALID: "Asset id is invalid",
    },
    ASSET_NAME: {
      REQUIRED: "Name must not be empty or contain only spaces",
    },
    ASSET_DESCRIPTION: {
      REQUIRED: "Description must not be empty or contain only spaces",
    },
    ASSET_PRICE: {
      REQUIRED: "Price must not be empty or contain only spaces",
    },
    ASSET_CATEGORY: {
      REQUIRED: "Category must not be empty or contain only spaces",
    },
    ASSET_DOCUMENT_TYPE: {
      INVALID: `Document keys must be one of the predefined ${Object.values(DOCUMENT_TYPE)} values`,
    },
    CREATE_DOCUMENTS: {
      DOCUMENTS: {
        REQUIRED: "File must be required",
      },
      DOCUMENT_TYPE: {
        REQUIRED: "Document type is required",
      },
    },
  },
};
