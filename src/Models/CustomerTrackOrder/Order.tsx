import { ItemsSummary } from "../DeliveryOrderDetails/ItemsSummary";

export interface Order {
  id: number;
  orderNumber: string;
  status: string;
  finalAmount: number;
  paymentStatus: string;
  itemsSummary: ItemsSummary;
}
