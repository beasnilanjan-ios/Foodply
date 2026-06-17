export interface Billing {
  itemTotal: number;
  deliveryCharge: number;
  packagingCharge: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  finalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
}