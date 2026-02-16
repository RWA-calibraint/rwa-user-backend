import Stripe from "stripe";

export interface CreateStripeAccount {
  email: string;
}

export interface CreateStripeAccountResponse {
  accountExist: boolean;
  url?: string;
  stripeAccountId?: string;
}

export interface AccountStatusResponse {
  accountId: string;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
  requirements: {
    currentlyDue: string[];
    eventuallyDue: string[];
    pastDue: string[];
    pendingVerification: string[];
  };
  capabilities: Stripe.Account.Capabilities;
}
