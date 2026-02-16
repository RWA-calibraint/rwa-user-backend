export enum TransferStatus {
  PLACED = "placed",
  SUCCEEDED = "succeeded",
  CANCELLED = "cancelled",
}

export enum AssetStatus {
  NEWLY_ADDED = "Newly added",
  HOLD = "Hold",
  REJECTED = "Rejected",
  APPROVED = "Approved",
  SUBMISSION = "Submitted",
  ADJUSTMENT_REQUIRED = "AdjustmentRequired",
  RESUBMISSION = "Re-submitted",
  LIVE = "Live",
  GOING_LIVE = "Going Live",
  DELIST = "Delisted",
  SOLD = "Sold",
  PENDING = "Pending",
  TRANSFERRED = "Transferred",
  DELETE = "delete",
}

interface StatusCount {
  count: string;
  status: string;
}

export const constructAssetStatus = (data: StatusCount[]) => {
  const statusMapping: { [key: string]: string } = {
    "Newly added": "Submitted",
    AdjustmentRequired: "AdjustmentRequired",
    "Going Live": "Approved",
    "Re-submitted": "Submitted",
    Live: "Approved",
    Delisted: "Delist",
  };
  const result: { [key: string]: number } = {};

  data.forEach(({ count, status }: StatusCount) => {
    const newStatus =
      statusMapping[status as keyof typeof statusMapping] || status;
    result[newStatus] = (result[newStatus] || 0) + parseInt(count, 10);
  });

  return Object.entries(result).map(([status, count]) => ({ status, count }));
};

export enum COLLECTION_TYPE {
  AssetCollected = "AssetCollected",
  AssetSold = "AssetSold",
  AssetListed = "AssetListed",
}
