import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  Dimensions,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import Colors from '../assets/Colors/Colors';
import GlobalBottomBar from '../GlobalContainer/GlobalBottomBar';
import GlobalTopBar from '../GlobalContainer/GlobalTopBar';
import GlobalApi from '../GlobalContainer/GlobalApi';
import GlobalLoginAuth from '../GlobalContainer/GlobalLoginAuth';
import GlobalLoader from '../GlobalContainer/GlobalLoader';
import DeliveryOrderListComponent from '../GlobalContainer/DeliveryOrderListComponent';
import { AssignedOrder } from '../Models/DeliveryDasboard/AssignedOrder';
import {
  isActiveOrderStatus,
  isCancelledOrderStatus,
  isCompletedOrderStatus,
  MyOrderItemModel,
  MyOrdersResponseModel,
} from '../Models/MyOrdersModel';

const { width, height } = Dimensions.get('window');
const isTablet = Math.min(width, height) >= 600;

const MY_ORDERS_LIMIT = 20;
const MY_ORDERS_OFFSET = 0;

const getApiHeaders = (): Record<string, string> => {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'X-Client-Type': 'mobile',
  };

  const token = GlobalLoginAuth.accessToken || GlobalLoginAuth.token;
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
};

const mapToAssignedOrder = (order: MyOrderItemModel): AssignedOrder => ({
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

export default function Orders({ navigation, onMenuPress }: any) {
  const [activeTab, setActiveTab] = useState('Active');
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<MyOrderItemModel[]>([]);

  const tabs = ['Active', 'Completed', 'Cancelled'];

  const fetchMyOrders = useCallback(async () => {
    try {
      setLoading(true);
      await GlobalLoginAuth.loadAuthData();

      const token = GlobalLoginAuth.accessToken || GlobalLoginAuth.token;
      if (!token) {
        setOrders([]);
        return;
      }

      const response = await fetch(
        `${GlobalApi.baseUrl}api/orders/my-orders?limit=${MY_ORDERS_LIMIT}&offset=${MY_ORDERS_OFFSET}`,
        {
          method: 'GET',
          headers: getApiHeaders(),
        },
      );

      const result = await response.json();
      console.log('My orders response:', JSON.stringify(result, null, 2));

      const myOrdersResponse = MyOrdersResponseModel.fromJson(result);

      if (!response.ok || myOrdersResponse.success === false) {
        Alert.alert(
          'FoodyPly',
          myOrdersResponse.message || 'Failed to load orders',
        );
        setOrders([]);
        return;
      }

      setOrders(myOrdersResponse.data?.orders ?? []);
    } catch (error) {
      console.log('fetchMyOrders failed:', error);
      Alert.alert('FoodyPly', 'Unable to connect to server');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchMyOrders();
    }, [fetchMyOrders]),
  );

  const activeOrders = useMemo(
    () =>
      orders
        .filter(order => isActiveOrderStatus(order.status))
        .map(mapToAssignedOrder),
    [orders],
  );

  const completedOrders = useMemo(
    () =>
      orders
        .filter(order => isCompletedOrderStatus(order.status))
        .map(mapToAssignedOrder),
    [orders],
  );

  const cancelledOrders = useMemo(
    () =>
      orders
        .filter(order => isCancelledOrderStatus(order.status))
        .map(mapToAssignedOrder),
    [orders],
  );

  const getOrders = () => {
    if (activeTab === 'Active') {
      return activeOrders;
    }
    if (activeTab === 'Completed') {
      return completedOrders;
    }
    if (activeTab === 'Cancelled') {
      return cancelledOrders;
    }
    return [];
  };

  return (
    <View style={styles.container}>
      <GlobalLoader visible={loading} text="Please Wait" />

      <GlobalTopBar
        navigation={navigation}
        onMenuPress={onMenuPress}
        searchPlaceholder="Search orders..."
        onSearchPress={() =>
          navigation.navigate('Search', { scope: 'orders' })
        }
      />

      <View style={styles.headerContainer}>
        <Text style={styles.title}>My Order</Text>
      </View>

      <View style={styles.overlay}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.tabContainer}>
            {tabs.map(tab => (
              <TouchableOpacity
                key={tab}
                style={[styles.tab, activeTab === tab && styles.activeTab]}
                onPress={() => setActiveTab(tab)}
              >
                <Text
                  style={[
                    styles.tabText,
                    activeTab === tab && styles.activeTabText,
                  ]}
                >
                  {tab}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={{ marginTop: 20 }}>
            <DeliveryOrderListComponent
              orders={getOrders()}
              showAmountInItemBadge
              showTrackOrderButton={activeTab === 'Active'}
              onPressItem={item => {
                navigation.navigate('OrderDetails', { orderId: item.orderId });
              }}
              onPressTrackOrder={item => {
                const orderId = item.orderId;
                navigation.navigate('Trackorder', { orderId });
              }}
            />
          </View>
        </ScrollView>

        <GlobalBottomBar navigation={navigation} activeTab="Orders" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 100,
    backgroundColor: Colors.primary,
  },

  headerContainer: {
    width: '100%',
    paddingHorizontal: 20,
    marginTop: Platform.OS === 'ios' ? 15 : 10,
  },

  title: {
    fontSize: isTablet ? 40 : 34,
    fontFamily: 'LeagueSpartan-Bold',
    color: '#fff',
  },

  overlay: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height:
      Platform.OS === 'ios'
        ? isTablet
          ? '93%'
          : '88%'
        : isTablet
          ? '78%'
          : '92%',
    backgroundColor: '#fff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 20,
  },

  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    borderRadius: 30,
    padding: 5,
  },

  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 25,
    alignItems: 'center',
  },

  activeTab: {
    backgroundColor: '#ff6a00',
  },

  tabText: {
    fontSize: 16,
    color: '#ff6a00',
    fontFamily: 'LeagueSpartan-Medium',
  },

  activeTabText: {
    color: '#fff',
  },
});
