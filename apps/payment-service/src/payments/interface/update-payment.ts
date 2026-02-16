import { PAYMENT_STATUS } from "src/shared-kernel/utils/constants/transactions";

export interface UpdatePayment {
  paymentStatus: PAYMENT_STATUS;
  checkoutSessionId: string;
}
