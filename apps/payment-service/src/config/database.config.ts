import { registerAs } from "@nestjs/config";

export default registerAs("database", () => ({
  uri: process.env.MONGODB_URI || "mongodb://localhost:27017",
  database: process.env.MONGODB_DATABASE || "payment-service-db",
  replicaSet: process.env.MONGODB_REPLICA_SET || "rs0",
  writeConcern: {
    w: "majority" as const,
    wtimeout: 5000,
  },
  retryWrites: true,
}));
