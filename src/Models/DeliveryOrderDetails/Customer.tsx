import { CustomerAddress } from './CustomerAddress';

export interface Customer {
  id: number;
  name: string;
  phone: string;
  profileImageUrl: string;
  address: CustomerAddress;
}