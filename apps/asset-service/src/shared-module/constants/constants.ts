import { AssetStatus } from "src/shared-kernel/constants/asset-context";

export const getStatusByEnum = (status) => {
  switch (status) {
    case "submitted":
      return [AssetStatus.NEWLY_ADDED, AssetStatus.RESUBMISSION];
    case "adjustmentRequired":
      return [AssetStatus.ADJUSTMENT_REQUIRED];
    case "approved":
      return [AssetStatus.GOING_LIVE, AssetStatus.LIVE];
    case "rejected":
      return [AssetStatus.REJECTED];
    case "hold":
      return [AssetStatus.HOLD];
    case "delist":
      return [AssetStatus.DELIST];
    default:
      return [AssetStatus.NEWLY_ADDED];
  }
};
