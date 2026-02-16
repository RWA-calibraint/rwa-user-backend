import Stripe from "stripe";

import { AssetDocument } from "src/assets/schemas/asset.schema";

export interface CreatePaymentDetails {
  assetDetails: AssetDocument;
  currency: string;
  tokenCount: number;
  stripeAccountId: string;
  price: number;
  buyerId: string;
  listingId?: string;
}

export interface WebhookHandlerInterface {
  requestPayload: Stripe.Event;
}
