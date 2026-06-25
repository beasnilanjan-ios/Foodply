import React from 'react';
import {
  FlatList,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import Colors from '../assets/Colors/Colors';
import { FontFamily } from '../assets/GlobalFont/GlobalFont';
import { AssignedOrder } from '../Models/DeliveryDasboard/AssignedOrder';
import { getTimeAgo } from '../Utils/CommonUtil';

type Props = {
  orders: AssignedOrder[];
  onPressItem?: (item: AssignedOrder) => void;
  onPressTrackOrder?: (item: AssignedOrder) => void;
  showAmountInItemBadge?: boolean;
  showTrackOrderButton?: boolean;
};

const formatOrderAmount = (value: number) =>
  `₹${Number(value || 0).toFixed(2)}`;

const OrderCard = ({
  item,
  onPressItem,
  onPressTrackOrder,
  showAmountInItemBadge = false,
  showTrackOrderButton = false,
}: {
  item: AssignedOrder;
  onPressItem?: (item: AssignedOrder) => void;
  onPressTrackOrder?: (item: AssignedOrder) => void;
  showAmountInItemBadge?: boolean;
  showTrackOrderButton?: boolean;
}) => {
  return (
    <TouchableOpacity
      style={styles.orderCard}
      activeOpacity={0.9}
      onPress={() => onPressItem?.(item)}
    >
      <View style={styles.orderLeft}>
        <Text style={styles.orderId}>{item.orderNumber}</Text>
        <Text style={styles.orderTime}>{getTimeAgo(item.minutesAgo)}</Text>
      </View>

      <View style={styles.orderCenter}>
        <View style={styles.rowBetween}>
          <Text style={styles.customerName} numberOfLines={1}>
            {item.customerName}
          </Text>

          {!showAmountInItemBadge ? (
            <Text style={styles.amount}>
              {formatOrderAmount(item.finalAmount)}
            </Text>
          ) : null}
        </View>

        {item.addressText?.trim() ? (
          <View style={styles.addressRow}>
            <Image
              style={styles.icon}
              source={require('../assets/images/location.png')}
            />
            <Text style={styles.address} numberOfLines={2}>
              {item.addressText}
            </Text>
          </View>
        ) : null}

        <View style={styles.bottomRow}>
          <View style={styles.badgesRow}>
            <View style={styles.codBadge}>
              <Text style={styles.itemText}>
                {showAmountInItemBadge
                  ? formatOrderAmount(item.finalAmount)
                  : `${item.itemCount} item`}
              </Text>
            </View>

            {item.paymentStatus ? (
              <View style={styles.codBadge}>
                <Text style={styles.codText}>{item.paymentStatus}</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.viewButton}
              activeOpacity={0.8}
              onPress={() => onPressItem?.(item)}
            >
              <Text style={styles.viewButtonText}>View Details</Text>
            </TouchableOpacity>

            {showTrackOrderButton ? (
              <TouchableOpacity
                style={styles.trackButton}
                onPress={() => onPressTrackOrder?.(item)}
              >
                <Text style={styles.trackButtonText}>Track Order</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default function DeliveryOrderListComponent({
  orders,
  onPressItem,
  onPressTrackOrder,
  showAmountInItemBadge = false,
  showTrackOrderButton = false,
}: Props) {
  return (
    <FlatList
      data={orders}
      keyExtractor={(item) => String(item.orderId)}
      scrollEnabled={false}
      renderItem={({ item }) => (
        <OrderCard
          item={item}
          onPressItem={onPressItem}
          onPressTrackOrder={onPressTrackOrder}
          showAmountInItemBadge={showAmountInItemBadge}
          showTrackOrderButton={showTrackOrderButton}
        />
      )}
      ListEmptyComponent={
        <View style={styles.noOrderContainer}>
          <Text style={styles.noOrderText}>No Orders Available</Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  orderCard: {
    backgroundColor: Colors.white,
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    flexDirection: 'row',
    elevation: 2,
    borderWidth: 2,
    borderColor: Colors.deviderColor,
    alignItems: 'flex-start',
  },

  orderLeft: {
    width: 110,
    minHeight: 80,
    justifyContent: 'center',
    backgroundColor: Colors.lightOrange,
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
    alignSelf: 'stretch',
  },

  orderId: {
    color: Colors.primary,
    fontFamily: FontFamily.medium,
    fontSize: 16,
    textAlign: 'center',
  },

  orderTime: {
    color: Colors.textBrown,
    fontSize: 12,
    marginTop: 5,
  },

  orderCenter: {
    flex: 1,
    minWidth: 0,
    marginLeft: 10,
  },

  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },

  customerName: {
    flex: 1,
    fontSize: 16,
    fontFamily: FontFamily.medium,
    color: Colors.textColor,
  },

  amount: {
    flexShrink: 0,
    fontSize: 16,
    fontFamily: FontFamily.medium,
    color: Colors.primary,
  },

  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 6,
  },

  address: {
    flex: 1,
    fontSize: 12,
    color: Colors.textBrown,
  },

  icon: {
    width: 14,
    height: 14,
    marginRight: 1,
    marginTop: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  bottomRow: {
    marginTop: 10,
    gap: 8,
  },

  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },

  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },

  itemText: {
    color: Colors.primary,
    fontFamily: FontFamily.semiBold,
    fontSize: 12,
  },

  codBadge: {
    backgroundColor: Colors.lightBackground,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },

  codText: {
    color: Colors.primary,
    fontSize: 12,
    fontFamily: FontFamily.semiBold,
  },

  viewButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
  },

  viewButtonText: {
    color: Colors.white,
    fontSize: 12,
    fontFamily: FontFamily.medium,
  },

  trackButton: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
  },

  trackButtonText: {
    color: Colors.primary,
    fontSize: 12,
    fontFamily: FontFamily.medium,
  },

  noOrderContainer: {
    backgroundColor: Colors.white,
    padding: 30,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },

  noOrderText: {
    fontSize: 15,
    color: Colors.textColor,
    fontFamily: FontFamily.medium,
  },
});