import { AssignedOrder } from '../Models/DeliveryDasboard/AssignedOrder';
import { DeliveryHistorySummary } from './DeliveryHistorySummary';

export interface DeliveryHistoryData {
  selectedDate: string;
  summary: DeliveryHistorySummary;
  items: AssignedOrder[];
  page: number;
  pageSize: number;
  totalPages: number;
  total: number;
}