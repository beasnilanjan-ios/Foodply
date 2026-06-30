import React, {useMemo} from 'react';

import DeliveryOrderListComponent from './DeliveryOrderListComponent';
import {AssignedOrder} from '../Models/DeliveryDasboard/AssignedOrder';
import {MyOrderItemModel} from '../Models/MyOrdersModel';

type Props = {
  orders: MyOrderItemModel[];
  onPressItem?: (item: MyOrderItemModel) => void;
  onPressTrackOrder?: (item: MyOrderItemModel) => void;
  showTrackOrderButton?: boolean;
};

const mapToListOrder = (order: MyOrderItemModel): AssignedOrder => ({
  deliveryId: order.deliveryId,
  orderId: order.orderId,
  orderNumber: order.orderNumber,
  createdAt: order.createdAt,
  minutesAgo: order.minutesAgo,
  customerName: order.restaurantName || order.customerName || 'Restaurant',
  customerPhone: order.customerPhone,
  addressText: order.addressText,
  itemCount: order.itemCount,
  totalQuantity: order.totalQuantity || order.itemCount,
  finalAmount: order.finalAmount,
  paymentMethod: order.paymentMethod,
  paymentStatus: order.paymentStatus,
  deliveryStatus: order.deliveryStatus,
  orderStatus: order.status,
});

export default function CustomerOrderListComponent({
  orders,
  onPressItem,
  onPressTrackOrder,
  showTrackOrderButton = false,
}: Props) {
  const listOrders = useMemo(() => orders.map(mapToListOrder), [orders]);

  const findOrder = (orderId: number) =>
    orders.find(order => order.orderId === orderId);

  return (
    <DeliveryOrderListComponent
      orders={listOrders}
      showAmountInItemBadge
      showTrackOrderButton={showTrackOrderButton}
      onPressItem={item => {
        const order = findOrder(item.orderId);
        if (order) {
          onPressItem?.(order);
        }
      }}
      onPressTrackOrder={item => {
        const order = findOrder(item.orderId);
        if (order) {
          onPressTrackOrder?.(order);
        }
      }}
    />
  );
}
