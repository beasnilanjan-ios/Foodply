import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  ImageBackground,
  Dimensions,
  Alert,
} from 'react-native';

import Colors from '../assets/Colors/Colors';
import GlobalTopBarDelivery from '../GlobalContainer/GlobalTopBarDelivery';
import GlobalBottomBarDelivery from '../GlobalContainer/GlobalBottomBarDelivery';
import DeliveryOrderListComponent from '../GlobalContainer/DeliveryOrderListComponent';
import { FontFamily } from '../assets/GlobalFont/GlobalFont';
import GlobalLoginAuth from '../GlobalContainer/GlobalLoginAuth';
import GlobalApi from '../GlobalContainer/GlobalApi';
import { DeliveryDashboardResponse }  from '../Models/DeliveryDasboard/DeliveryDashboardResponse';
import { AssignedOrder } from '../Models/DeliveryDasboard/AssignedOrder';
import { DashboardData } from '../Models/DeliveryDasboard/DashboardData';
import GlobalLoader from '../GlobalContainer/GlobalLoader';
import { getGreeting } from '../Utils/CommonUtil';

const { width, height } = Dimensions.get('window');
const isTablet = Math.min(width, height) >= 600;

export default function DeliveryDashboard({ navigation }: any) {

  const [loading, setLoading] = useState(false);

  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);

  const [assignedOrders, setAssignedOrders] = useState<AssignedOrder[]>([]);

  useEffect(() => {
    getDashboardData();
  }, []);

  const getDashboardData = async () => {
    try {
      setLoading(true);
      console.log('Fetching dashboard data with token:', GlobalLoginAuth.refreshToken);
      const response = await fetch(
        `${GlobalApi.baseUrl}api/deliveries/me/dashboard`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${GlobalLoginAuth.accessToken}`,
          },
        }
      );

      const result = await response.json();
      const dashboardResponse = result as DeliveryDashboardResponse; // ✅ Type assertion to ensure it matches our model

      console.log('Dashboard Response:', result);

      if (!response.ok) {
        Alert.alert('FoodyPly', result.message || 'Failed to load dashboard');
        return;
      }

      setDashboardData(dashboardResponse.data);

      // if orders available from API
      if (dashboardResponse.data?.assignedOrders) {
        setAssignedOrders(dashboardResponse.data.assignedOrders);
      }

    } catch (error) {
      console.log(error);
      Alert.alert('FoodyPly', 'Unable to connect to server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <GlobalTopBarDelivery
        navigation={navigation}
        notificationClick={() => {}}
        text={GlobalLoginAuth.user.name}
        subtitleText={getGreeting()}
        isBackVisible={false}
        isOnlineVisible={true}
      />

      <View style={styles.overlay}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 140 }}
        >

          {/* Top Stats Card */}
          <View style={styles.statsMainCard}>

            <View style={styles.statItem}>
              <View style={styles.iconCircle}>
                <Image
                  style={styles.icon}
                  source={require('../assets/images/MyOrdersNavBar.png')}
                />
              </View>

              <Text style={styles.statCount}>
                {dashboardData?.stats?.assigned || 0}
              </Text>

              <Text style={styles.statTitle}>Assigned</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.statItem}>
              <View style={styles.iconCircle}>
                <Image
                  style={[styles.icon, { width: 40, height: 35 }]}
                  source={require('../assets/images/scooter.png')}
                />
              </View>

              <Text style={styles.statCount}>
                {dashboardData?.stats?.onTheWay || 0}
              </Text>

              <Text style={styles.statTitle}>On The Way</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.statItem}>
              <View style={styles.iconCircle}>
                <Image
                  style={[styles.icon, { width: 35, height: 35 }]}
                  source={require('../assets/images/tick.png')}
                />
              </View>

              <Text style={styles.statCount}>
                {dashboardData?.stats?.delivered || 0}
              </Text>

              <Text style={styles.statTitle}>Delivered</Text>
            </View>

          </View>

          {/* Assigned Orders Header */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Assigned Orders</Text>
          </View>

          {/* Orders List */}
          {assignedOrders.length > 0 ? (
            <DeliveryOrderListComponent
              orders={assignedOrders}
              onPressItem={(order) => {
                navigation.navigate('DeliveryOrderDetail', { orderId: order.orderId });
              }}
            />
          ) : (
            <View style={styles.noOrderContainer}>
              <Text style={styles.noOrderText}>
                No Orders Available
              </Text>
            </View>
          )}

          {/* Banner */}
          <ImageBackground
            source={require('../assets/images/delivery_banner.png')}
            style={styles.bannerImageStyle}
            imageStyle={styles.imageStyle}
            resizeMode="contain"
          >
            <View style={{ flex: 1 }} />
          </ImageBackground>

        </ScrollView>
      </View>

      <View style={styles.bottomContainer}>
        <GlobalBottomBarDelivery
          navigation={navigation}
          activeTab="Home"
        />
      </View>
      <GlobalLoader visible={loading} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
    paddingTop: 100,
  },

  overlay: {
    flex: 1,
    backgroundColor: '#F8F8F8',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 16,
    paddingTop: 18,
    marginTop: 20,
  },

  statsMainCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },

  statItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },

  divider: {
    width: 2,
    height: 90,
    backgroundColor: Colors.deviderColor,
  },

  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.lightOrange,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },

  icon: {
    height: 42,
    width: 30,
    tintColor: Colors.primary,
    padding: 4,
  },

  statCount: {
    fontSize: 30,
    color: Colors.black,
    fontFamily: FontFamily.bold,
  },

  statTitle: {
    fontSize: 15,
    color: Colors.textBrown,
    marginTop: 4,
    fontFamily: FontFamily.regular,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },

  sectionTitle: {
    fontSize: 18,
    color: Colors.black,
    fontFamily: FontFamily.medium,
  },

  viewAll: {
    color: Colors.primary,
    fontFamily: FontFamily.semiBold,
    fontSize: 13,
  },

  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 14,
    marginBottom: 14,
    flexDirection: 'row',
    elevation: 2,
  },

  orderLeft: {
    width: 90,
    justifyContent: 'center',
  },

  orderId: {
    color: '#FF7A00',
    fontWeight: '700',
    fontSize: 16,
  },

  orderTime: {
    color: '#777',
    fontSize: 12,
    marginTop: 5,
  },

  orderCenter: {
    flex: 1,
  },

  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  customerName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#000',
  },

  amount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FF7A00',
  },

  address: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },

  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },

  itemText: {
    color: '#FF7A00',
    fontWeight: '600',
    fontSize: 12,
  },

  codBadge: {
    backgroundColor: '#FFF1D6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    marginLeft: 8,
  },

  codText: {
    color: '#FF9800',
    fontSize: 10,
    fontWeight: '700',
  },

  viewButton: {
    backgroundColor: '#FF7A00',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    marginLeft: 'auto',
  },

  viewButtonText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },

  noOrderContainer: {
    backgroundColor: '#fff',
    padding: 30,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },

  noOrderText: {
    fontSize: 15,
    color: '#888',
    fontWeight: '600',
  },

  bannerContainer: {
    backgroundColor: '#FFE9D6',
    borderRadius: 22,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 24,
  },

  bannerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },

  bannerSubTitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 6,
    lineHeight: 18,
  },

  profileButton: {
    backgroundColor: '#FF7A00',
    marginTop: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },

  profileButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },

  deliveryImage: {
    width: 90,
    height: 90,
    resizeMode: 'contain',
  },

  quickActionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
  },

  quickCard: {
    backgroundColor: '#fff',
    width: '31%',
    borderRadius: 18,
    paddingVertical: 18,
    alignItems: 'center',
    elevation: 2,
  },

  quickIcon: {
    fontSize: 28,
    marginBottom: 8,
  },

  quickText: {
    fontSize: 12,
    color: '#444',
    fontWeight: '600',
  },

  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    alignSelf: 'center',
  },
  bannerImageStyle: {
    height: isTablet ? 260 : 120,
    width: '100%',
    justifyContent: 'center',
    marginTop: -10,
  },

  imageStyle: {
    borderRadius: 15,
  },
});