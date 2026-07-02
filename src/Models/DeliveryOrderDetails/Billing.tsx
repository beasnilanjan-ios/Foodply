export interface Billing {
  itemTotal: number;
  deliveryCharge: number;
  packagingCharge: number;
  discountAmount: number;
  taxAmount: number;
  cgstAmount?: number;
  sgstAmount?: number;
  tipAmount?: number;
  totalAmount: number;
  finalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
}