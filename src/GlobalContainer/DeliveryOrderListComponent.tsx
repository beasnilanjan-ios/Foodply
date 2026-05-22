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

type Props = {
  orders: any[];
  onPressItem?: (item: any) => void;
};

const OrderCard = ({ item, onPressItem }: any) => {
  return (
    <TouchableOpacity
      style={styles.orderCard}
      onPress={() => onPressItem?.(item)}
    >
      <View style={styles.orderLeft}>
        <Text style={styles.orderId}>{item.orderId}</Text>
        <Text style={styles.orderTime}>{item.time}</Text>
      </View>

      <View style={styles.orderCenter}>
        <View style={styles.rowBetween}>
          <Text style={styles.customerName}>{item.customer}</Text>

          <Text style={styles.amount}>₹{item.amount}</Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Image style={styles.icon} source={require('../assets/images/location.png')} />
            <Text style={styles.address}>{item.address}</Text>
        </View>
        <View style={styles.bottomRow}>
          <View style={styles.codBadge}>
              <Text style={styles.itemText}>{item.items}</Text>
          </View>

          <View style={styles.codBadge}>
            <Text style={styles.codText}>COD</Text>
          </View>

          <TouchableOpacity style={styles.viewButton}>
            <Text style={styles.viewButtonText}>View Details</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default function DeliveryOrderListComponent({
  orders,
  onPressItem,
}: Props) {
  return (
    <FlatList
      data={orders}
      keyExtractor={(item) => item.id}
      scrollEnabled={false}
      renderItem={({ item }) => (
        <OrderCard item={item} onPressItem={onPressItem} />
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
    justifyContent: 'center',
    alignItems: 'center',
  },

  orderLeft: {
    width: 110,
    height: 80,
    justifyContent: 'center',
    backgroundColor: Colors.lightOrange,
    borderRadius: 10,       
    padding: 10,
    alignItems: 'center',
  },

  orderId: {
    color: Colors.primary,
    fontFamily: FontFamily.medium,
    fontSize: 16,
  },

  orderTime: {
    color: Colors.textBrown,
    fontSize: 12,
    marginTop: 5,
  },

  orderCenter: {
    flex: 1,
    marginLeft: 10,
  },

  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  customerName: {
    fontSize: 16,
    fontFamily: FontFamily.medium,
    color: Colors.textColor,
  },

  amount: {
    fontSize: 16,
    fontFamily: FontFamily.medium,
    color: Colors.primary,
  },

  address: {
    fontSize: 12,
    color: Colors.textBrown,
  },

  icon: {
    width: 14,
    height: 14,
    marginRight: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },

  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
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
    marginLeft: 8,
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
    marginLeft: 'auto',
  },

  viewButtonText: {
    color: Colors.white,
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