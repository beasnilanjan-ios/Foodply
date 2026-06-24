import { DeliveryProfile } from './DeliveryProfile';
import { DeliveryStats } from './DeliveryStats';
import { AssignedOrder } from './AssignedOrder';

export interface DashboardData {
  profile: DeliveryProfile;
  stats: DeliveryStats;
  assignedOrders: AssignedOrder[];
}
