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
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import Colors from '../assets/Colors/Colors';
import GlobalBottomBar from '../GlobalContainer/GlobalBottomBar';
import GlobalTopBar from '../GlobalContainer/GlobalTopBar';
import GlobalApi from '../GlobalContainer/GlobalApi';
import GlobalLoginAuth from '../GlobalContainer/GlobalLoginAuth';
import GlobalLoader from '../GlobalContainer/GlobalLoader';
import CustomerOrderListComponent from '../GlobalContainer/CustomerOrderListComponent';
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

const mergeOrders = (
  existing: MyOrderItemModel[],
  incoming: MyOrderItemModel[],
): MyOrderItemModel[] => {
  const seen = new Set(existing.map(order => order.orderId));
  const uniqueIncoming = incoming.filter(order => !seen.has(order.orderId));
  return [...existing, ...uniqueIncoming];
};

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

export default function Orders({ navigation, onMenuPress }: any) {
  const [activeTab, setActiveTab] = useState('Active');
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [orders, setOrders] = useState<MyOrderItemModel[]>([]);
  const [nextOffset, setNextOffset] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);

  const tabs = ['Active', 'Completed', 'Cancelled'];

  const fetchOrdersPage = useCallback(
    async (offset: number, reset: boolean) => {
      try {
        if (reset) {
          setLoading(true);
        } else {
          setLoadingMore(true);
        }

        await GlobalLoginAuth.loadAuthData();

        const token = GlobalLoginAuth.accessToken || GlobalLoginAuth.token;
        if (!token) {
          setOrders([]);
          setNextOffset(0);
          setHasNextPage(false);
          return;
        }

        const response = await fetch(
          `${GlobalApi.baseUrl}api/orders/my-orders?limit=${MY_ORDERS_LIMIT}&offset=${offset}`,
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
          if (reset) {
            setOrders([]);
            setNextOffset(0);
            setHasNextPage(false);
          }
          return;
        }

        const pageOrders = myOrdersResponse.data?.orders ?? [];
        setOrders(prev => (reset ? pageOrders : mergeOrders(prev, pageOrders)));
        setNextOffset(offset + pageOrders.length);
        setHasNextPage(myOrdersResponse.data?.hasNextPage ?? false);
      } catch (error) {
        console.log('fetchOrdersPage failed:', error);
        Alert.alert('FoodyPly', 'Unable to connect to server');
        if (reset) {
          setOrders([]);
          setNextOffset(0);
          setHasNextPage(false);
        }
      } finally {
        if (reset) {
          setLoading(false);
        } else {
          setLoadingMore(false);
        }
      }
    },
    [],
  );

  const fetchMyOrders = useCallback(() => {
    fetchOrdersPage(0, true);
  }, [fetchOrdersPage]);

  const loadMoreOrders = useCallback(() => {
    if (loading || loadingMore || !hasNextPage) {
      return;
    }
    fetchOrdersPage(nextOffset, false);
  }, [fetchOrdersPage, hasNextPage, loading, loadingMore, nextOffset]);

  useFocusEffect(
    useCallback(() => {
      navigation?.setOptions?.({
        gestureEnabled: false,
        fullScreenGestureEnabled: false,
      });
    }, [navigation]),
  );

  useFocusEffect(
    useCallback(() => {
      fetchMyOrders();
    }, [fetchMyOrders]),
  );

  const activeOrders = useMemo(
    () => orders.filter(order => isActiveOrderStatus(order.status)),
    [orders],
  );

  const completedOrders = useMemo(
    () => orders.filter(order => isCompletedOrderStatus(order.status)),
    [orders],
  );

  const cancelledOrders = useMemo(
    () => orders.filter(order => isCancelledOrderStatus(order.status)),
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
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
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
            <CustomerOrderListComponent
              orders={getOrders()}
              showTrackOrderButton={activeTab === 'Active'}
              onPressItem={item => {
                navigation.navigate('OrderDetails', {
                  orderId: item.orderId,
                  isReOrder: item.isReOrder,
                });
              }}
              onPressTrackOrder={item => {
                navigation.navigate('Trackorder', { orderId: item.orderId });
              }}
            />

            {hasNextPage ? (
              <TouchableOpacity
                style={styles.loadMoreButton}
                activeOpacity={0.8}
                disabled={loadingMore}
                onPress={loadMoreOrders}
              >
                {loadingMore ? (
                  <ActivityIndicator color={Colors.primary} />
                ) : (
                  <Text style={styles.loadMoreText}>Load More Orders</Text>
                )}
              </TouchableOpacity>
            ) : null}
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

  scrollContent: {
    paddingBottom: Platform.OS === 'ios' ? 110 : 100,
  },

  loadMoreButton: {
    marginTop: 8,
    marginBottom: 8,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },

  loadMoreText: {
    fontSize: 15,
    color: Colors.primary,
    fontFamily: 'LeagueSpartan-Medium',
  },
});
