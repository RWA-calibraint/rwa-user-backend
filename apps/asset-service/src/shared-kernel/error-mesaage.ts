import { DOCUMENT_TYPE } from "./document-type";

export const ERROR_MESSAGES = {
  ASSET_NOT_FOUND: "Asset not found",
  EXCLUSIVE_ACCESS: {
    ALREADY_ACCESSED: "User already got the exclusive access",
  },
  NOT_ADMIN_ASSET: "Not an admin asset",
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
    ASSET_NOT_FOUND: (assetId: string) => `Asset #${assetId} not found`,
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
