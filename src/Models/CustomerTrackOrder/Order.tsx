import { ItemsSummary } from "../DeliveryOrderDetails/ItemsSummary";

export interface Order {
  id: number;
  orderNumber: string;
  status: string;
  totalAmount: number;
  paymentStatus: string;
  itemsSummary: ItemsSummary;
}
