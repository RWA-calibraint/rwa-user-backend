import { PAYMENT_STATUS } from "src/shared-kernel/utils/constants/transactions";

export interface GetOrdersParams {
  searchValue?: string;
  paymentStatus?: PAYMENT_STATUS;
  categories?: string[];
  from?: string;
  to?: string;
  userId: string;
  page?: number;
  size?: number;
}
