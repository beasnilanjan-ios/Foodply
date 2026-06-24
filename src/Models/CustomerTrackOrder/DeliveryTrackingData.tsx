import {Customer} from '../CustomerTrackOrder/Customer'
import {Agent} from '../CustomerTrackOrder/Agent'
import {Order} from '../CustomerTrackOrder/Order'
import {TrackingLocation} from '../CustomerTrackOrder/TrackingLocation'

export interface DeliveryTrackingData {
  deliveryId: number;
  status: string;
  agent: Agent;
  customer: Customer;
  order: Order;
  latestLocation: TrackingLocation;
  trackingHistory: TrackingLocation[];
}