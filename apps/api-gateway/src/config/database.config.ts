import { registerAs } from "@nestjs/config";

import { DEFAULT_CONFIGS } from "src/shared-kernel/constants/default.config";

export default registerAs("database", () => ({
  uri: process.env.MONGODB_URI || DEFAULT_CONFIGS.DATABASE.MONGODB_URI,
  replicaSet:
    process.env.MONGODB_REPLICA_SET ||
    DEFAULT_CONFIGS.DATABASE.MONGODB_REPLICA_SET,
  writeConcern: {
    w: "majority" as const,
    wtimeout: 5000,
  },
  retryWrites: true,
}));
