import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Alert, Platform, RefreshControl } from 'react-native';
import Colors from '../assets/Colors/Colors';
import GlobalTopBarDelivery from '../GlobalContainer/GlobalTopBarDelivery';
import GlobalBottomBarDelivery from '../GlobalContainer/GlobalBottomBarDelivery';
import GlobalLoginAuth from '../GlobalContainer/GlobalLoginAuth';
import { formatDate, getGreeting, today } from '../Utils/CommonUtil';
import DeliveryOrderListComponent from '../GlobalContainer/DeliveryOrderListComponent';
import { FontFamily } from '../assets/GlobalFont/GlobalFont';
import GlobalApi from '../GlobalContainer/GlobalApi';
import { DeliveryHistoryResponse } from '../Models/DeliveryHistory/DeliveryHistoryResponse';
import { AssignedOrder } from '../Models/DeliveryDasboard/AssignedOrder';
import GlobalLoader from '../GlobalContainer/GlobalLoader';
import DateTimePicker from '@react-native-community/datetimepicker';


const DeliveryOrders = ({ navigation }: any) => {
const [loading, setLoading] = useState(false);
const [assignedOrders, setAssignedOrders] = useState<AssignedOrder[]>([]);
const [showPicker, setShowPicker] = useState(false);
const [selectedDate, setSelectedDate] = useState<Date>(new Date());
const [refreshing, setRefreshing] = useState(false);

 useEffect(() => {
    getOrderList();
  }, []);  

  const onRefresh = async () => {
      try {
        setRefreshing(true);
        await  getOrderList();
      } catch (error) {
        console.log(error);
      } finally {
        setRefreshing(false);
      }
    };


    const getOrderList = async (date: Date = selectedDate) => {
        try {
          setLoading(true);
          const selectedDateQuery = formatDate(date, undefined, 'YYYY-MM-DD');
          console.log('Fetching dashboard data with token:', GlobalLoginAuth.refreshToken);
          console.log(`${GlobalApi.baseUrl}api/deliveries/me/order-history?date=${selectedDateQuery}&page=1`);
          const response = await fetch(
            `${GlobalApi.baseUrl}api/deliveries/me/order-history?date=${selectedDateQuery}&page=1`,
            {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${GlobalLoginAuth.accessToken}`,
              },
            }
          );

          const result = await response.json();
          const deleiveryResponse = result as DeliveryHistoryResponse; // ✅ Type assertion to ensure it matches our model

          console.log('Dashboard Response:', result);

          if (!response.ok) {
            Alert.alert('FoodyPly', result.message || 'Failed to load dashboard');
            return;
          }

          // if orders available from API
          if (deleiveryResponse.data?.items) {
            setAssignedOrders(deleiveryResponse.data.items);
          }

        } catch (error) {
          console.log(error);
          Alert.alert('FoodyPly', 'Unable to connect to server');
        } finally {
          setLoading(false);
        }
      };

  const onChange = (event: any, date?: Date) => {
    setShowPicker(false);

    if (date) {
      const formattedDate = formatDate(date, undefined, 'DD MMM, YY');

      setSelectedDate(date);
      console.log('Selected Date:', formattedDate);

      getOrderList(date);
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
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[Colors.primary]}      // Android
                tintColor={Colors.primary}     // iOS
              />
            }
          >
           {/* My Orders Header */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                Order on {formatDate(selectedDate, undefined, 'DD MMM, YY')}
              </Text>
               {/* RIGHT ICONS */}
              <View style={styles.rightIcons}>
                <TouchableOpacity 
                  style={styles.smallCircle}
                  onPress={() => setShowPicker(true)}>
                  <Image
                    source={require('../assets/images/calendar.png')}
                    style={styles.menuIcon}
                  />
                </TouchableOpacity>

                  {showPicker && (
                  <DateTimePicker
                    value={selectedDate}
                    mode="date"
                    display="default"
                    maximumDate={new Date()} // Prevent future dates
                    onValueChange={onChange}
                  />
                )}
              </View>
            </View>
          
            {/* Orders List */}
            {assignedOrders.length > 0 ? (
              <DeliveryOrderListComponent
                orders={assignedOrders}
                onPressItem={(order) => {
                  navigation.navigate('DeliveryOrderDetail', { orderId: order.orderId , from: 'Order'});
                }}
              />
            ) : (
                <View style={styles.noOrderContainer}>
                  <Text style={styles.noOrderText}>
                    No Orders Available
                  </Text>
                </View>
            )}
        </ScrollView>
      </View>
        <View style={styles.bottomContainer}>
            <GlobalBottomBarDelivery
              navigation={navigation}
              activeTab="Orders"
            />
          </View>
          <GlobalLoader visible={loading} />
    </View>
    );
}

export default DeliveryOrders;

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
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    alignSelf: 'center',
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

  rightIcons: {
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    marginTop: 10,
    marginLeft: 'auto',
    flexShrink: 0,
},
  smallCircle: {
    width: 30,
    height: 30,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
   menuIcon: {
    width: 30,
    height: 30,
    resizeMode: 'contain',
    tintColor: Colors.primary,
  },
  });