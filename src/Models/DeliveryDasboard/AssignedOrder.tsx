export interface AssignedOrder {
  deliveryId: number;
  orderId: number;
  orderNumber: string;
  createdAt: string;
  minutesAgo: number;
  customerName: string;
  customerPhone: string;
  addressText: string;
  itemCount: number;
  totalQuantity: number;
  finalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  deliveryStatus: string;
  orderStatus: string;
}