export interface OrderItem {
  id: number;
  menuItemId: number;
  name: string;
  imageUrl: string;
  variantName: string;
  addons: string[];
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}