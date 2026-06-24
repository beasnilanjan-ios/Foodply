export interface OrderInfo {
  id: number;
  orderNumber: string;
  status: string;
  createdAt: string;
  acceptedAt: string | null;
  pickedUpAt: string | null;
  deliveredAt: string | null;
}
