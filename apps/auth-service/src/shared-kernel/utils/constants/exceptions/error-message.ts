import { USER_STATUS } from "../user-enums";

export const ERROR_MESSAGES = {
  EMAIL: {
    REQUIRED: "Email id is required",
    VALID_EMAIL: "Please provide valid email",
    ALREADY_JOINED: "User already joined",
  },
  NAME: {
    REQUIRED: "User name is required",
    INVALID_NAME:
      "Username can only contain letters, numbers, and spaces, and must start with a letter or number.",
  },
  PASSWORD: {
    REQUIRED: "Password is required ",
  },
  VERIFICATION_CODE: {
    REQUIRED: "Verification is required",
  },
  RESPONSES: {
    USER: {
      INACTIVE_USER: (status: USER_STATUS) => `User was ${status}`,
      NOT_FOUND: "User not found.",
      WALLET_ALREADY_USED: "Address was already in use ",
    },
  },
};
