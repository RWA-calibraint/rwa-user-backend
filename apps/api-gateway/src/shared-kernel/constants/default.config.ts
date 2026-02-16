export const DEFAULT_CONFIGS = {
  DATABASE: {
    MONGODB_URI: "mongodb://localhost:27017",
    MONGODB_NAME: "api-gateway-db",
    MONGODB_REPLICA_SET: "rs0",
  },
  PAYMENT_SERVICE: {
    HOST: "localhost",
    PORT: 3002,
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000,
    TIMEOUT: 5000,
    REQUEST_TIMEOUT: 5000,
  },
};
