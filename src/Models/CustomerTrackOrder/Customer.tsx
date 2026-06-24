import { Address } from "./Address";

export interface Customer {
  id: number;
  name: string;
  phone: string;
  profileImageUrl: string;
  address: Address;
}
