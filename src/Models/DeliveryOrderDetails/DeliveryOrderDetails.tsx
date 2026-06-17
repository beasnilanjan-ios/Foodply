import { OrderInfo } from './OrderInfo';
import { Customer } from './Customer';
import { Restaurant } from './Restaurant';
import { ItemsSummary } from './ItemsSummary';
import { OrderItem } from './OrderItem';
import { Billing } from './Billing';
import { Delivery } from './Delivery';
import { DeliveryActions } from './DeliveryActions';

export interface DeliveryOrderDetails {
  order: OrderInfo;
  customer: Customer;
  restaurant: Restaurant;
  itemsSummary: ItemsSummary;
  items: OrderItem[];
  billing: Billing;
  delivery: Delivery;
  actions: DeliveryActions;
}