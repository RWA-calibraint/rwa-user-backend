export interface CreatePayment {
  currency: string;
  assetId: string;
  tokenCount: number;
  userId: string;
  listingId?: string;
}
