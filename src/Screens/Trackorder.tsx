import React, { useEffect, useState, useRef } from 'react';
import { connectSocket, disconnectSocket } from '../services/socketService';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ToastAndroid,
  Alert,
} from 'react-native';

import GlobalBackButton from '../GlobalContainer/GlobalBackButton';
import GlobalBottomBar from '../GlobalContainer/GlobalBottomBar';
import Colors from '../assets/Colors/Colors';
import { FontFamily } from '../assets/GlobalFont/GlobalFont';
import GlobalLoginAuth from '../GlobalContainer/GlobalLoginAuth';
import { Socket } from 'socket.io-client';
import { ON_THE_WAY } from '../Utils/CommonUtil';
import {
  Map,
  Camera,
  Marker,
  GeoJSONSource,
  Layer,
} from '@maplibre/maplibre-react-native';
import { OSM_STYLE } from '../GlobalContainer/mapStyle';
import { DeliveryTrackingData } from '../Models/CustomerTrackOrder/DeliveryTrackingData';
import { DeliveryTrackingResponse } from '../Models/CustomerTrackOrder/DeliveryTrackingResponse'
import GlobalApi from '../GlobalContainer/GlobalApi';

export default function TrackOrder({ navigation, route }: any) {

  // ✅ SHOW BOTTOM BAR ONLY WHEN FROM TAB
  const showBottomBar = route?.params?.fromTab === true;
  const [showDetailsCard, setShowDetailsCard] = useState(true);
  const [orderDetail, setOrderDetail] = useState<DeliveryTrackingData>();
  const [loading, setLoading] = useState(false);
  const [currentIndex, setcurrentIndex] = useState<number>(0);
  const [currentLive, setCurrentLive] = useState<{
    icon: any;
    message: string;
  }>({
    icon: require('../assets/images/check.png'),
    message: '',
  });  

const steps = [
      { label: 'Accepted', status: 'ACCEPTED' },
      { label: 'Preparing', status: 'PREPARING' },
      { label: 'On The Way', status: 'ON_THE_WAY' },
      { label: 'Delivered', status: 'DELIVERED' },
    ];

  const trackedOrderId = 43;
let cleanup: (() => void) | undefined;  

  const [riderLocation, setRiderLocation] = useState<
    { latitude: number; longitude: number } | null
  >(null);


const socket = useRef<Socket | null>(null);
const handleSocket = (trackedOrderId: number) => {
  socket.current = connectSocket();

  if (!socket.current) {
    console.log('Socket is null');
    return () => {};
  }

  const onConnect = () => {
    console.log('✅ Connected:', socket.current?.id);

    socket.current?.emit('track:join', {
      orderId: trackedOrderId,
    });

    console.log('track:join emitted');
  };

  const onSnapshot = (data: any) => {
    console.log('📍 Tracking Snapshot:', data);

    if (
      data?.status === 'ON_THE_WAY' &&
      data?.latestLocation
    ) {
      const {latitude, longitude} = data.latestLocation;

      console.log('Lat:', latitude);
      console.log('Lng:', longitude);

      //setcurrentIndex(2);
      //setCurrentLive(getLiveStatus('ON_THE_WAY'));

      setRiderLocation({
        latitude,
        longitude,
      });
    }
  };

  const onLocationUpdated = (data: any) => {
    console.log('🚚 Live Location:', data);

    if (data?.latitude && data?.longitude) {
      setRiderLocation({
        latitude: data.latitude,
        longitude: data.longitude,
      });
    }
  };

  const onTrackingError = (err: any) => {
    console.log('Tracking Error:', err);
  };

  socket.current.onAny((event, ...args) => {
    console.log('EVENT =>', event, args);
  });

  socket.current.on('connect', onConnect);
  socket.current.on('tracking:snapshot', onSnapshot);
  socket.current.on('delivery:location:updated', onLocationUpdated);
  socket.current.on('tracking:error', onTrackingError);

  socket.current.on('disconnect', reason => {
    console.log('Disconnected:', reason);
  });

  socket.current.on('connect_error', err => {
    console.log('Connect Error:', err.message);
  });

  if (socket.current.connected) {
    onConnect();
  }

  // Return cleanup
  return () => {
    socket.current?.off('connect', onConnect);
    socket.current?.off('tracking:snapshot', onSnapshot);
    socket.current?.off('delivery:location:updated', onLocationUpdated);
    socket.current?.off('tracking:error', onTrackingError);
    socket.current?.offAny();

    disconnectSocket();
    socket.current = null;
  };
}


const getOrderDetails = async (trackedOrderId: number) => {

    try {
      setLoading(true);

      const response = await fetch(
        `${GlobalApi.baseUrl}api/deliveries/order/${trackedOrderId}/track`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${GlobalLoginAuth.accessToken}`,
          },
        }
      );

      const result: DeliveryTrackingResponse =
        await response.json();

      console.log('Order Details:', result);

      if (!response.ok || !result.success) {
        Alert.alert(
          'FoodyPly',
          result.message || 'Failed to load order details'
        );
        return;
      }

      setOrderDetail(result.data);
     
      const currentStatus = result.data?.order?.status ?? '';

      setcurrentIndex(steps.findIndex(
          item => item.status === currentStatus,
        ));

      console.log("CurrentStatus", result.data?.status);

      cleanup = handleSocket(trackedOrderId);

    
    } catch (error) {

      console.log(error);

      Alert.alert(
        'FoodyPly',
        'Unable to connect to server'
      );

    } finally {

      setLoading(false);

    }
  }

useEffect(() => {
  getOrderDetails(trackedOrderId)
 return () => {
    cleanup?.();
  };
}, []);


const getStepIcon = (status: string, isCurrent: boolean) => {
  if (!isCurrent) {
    return require('../assets/images/check.png');
  }

  switch (status) {
    case 'PREPARING':
      return require('../assets/images/preparing.png');

    case 'ON_THE_WAY':
      return require('../assets/images/scooter.png');

    default:
      return require('../assets/images/check.png');
  }
};

const getStepIconStyle = (
  status: string,
  isCurrent: boolean,
  isActive: boolean,
) => {
  if (isCurrent) {
    switch (status) {
      case 'PREPARING':
        return styles.preparingIcon;

      case 'ON_THE_WAY':
        return styles.scooterIcon;

      default:
        return [
          styles.checkIcon,
          {
            tintColor: Colors.primary,
          },
        ];
    }
  }
  return [
    styles.checkIcon,
    {
      tintColor: isActive ? Colors.primary : '#bbb',
    },
  ];
};

const getLiveStatus = (status: string) => {
      switch (status) {
         case 'PENDING':
          return {
            icon: require('../assets/images/check.png'),
            message: 'Please wait while your order is being accepted',
          };

        case 'PREPARING':
          return {
            icon: require('../assets/images/preparing.png'),
            message: 'Your order is being prepared',
          };

        case 'ON_THE_WAY':
          return {
            icon: require('../assets/images/scooter.png'),
            message: 'Your order is on the way',
          };

        case 'DELIVERED':
          return {
            icon: require('../assets/images/check.png'),
            message: 'Your order has been delivered',
          };

        case 'ACCEPTED':
        default:
          return {
            icon: require('../assets/images/check.png'),
            message: 'Your order has been accepted',
          };
      }
    };

  useEffect(() => {
    setCurrentLive(getLiveStatus(orderDetail?.order?.status ?? ''));
  }, [orderDetail?.order?.status]);

  return (
        <View style={styles.container}>
          
          {/* 🔙 Back */}
          <GlobalBackButton onPress={() => navigation.goBack()} />

          {/* 🔝 Title */}
          <Text style={styles.title}>Track Order</Text>

          {/* 🔽 Overlay */}
          <View style={styles.overlay}>
            
            <View style={styles.mapContainer}>
              <Map
                style={styles.map}
                mapStyle={OSM_STYLE}
                logo={false}
                compass={false}
                onTouchStart={() => {         
                }}></Map>


                {/* FLOATING CARD */}
                {showDetailsCard ? (
                  <View style={styles.card1}>
                    {/* USER INFO */}
                    {orderDetail?.order?.status !== 'PENDING' ? (
                      <View style={styles.header}>
                        <Image 
                          source={ orderDetail?.customer?.profileImageUrl ? 
                          { uri: orderDetail?.customer?.profileImageUrl } : 
                          require('../assets/images/customer_image.png') } 
                          style={styles.avatar} 
                        />

                        <View style={{ flex: 1 }}>
                          <Text style={styles.name}>
                            {orderDetail?.agent?.name || ''}
                          </Text>

                          <Text style={styles.address}>
                            {orderDetail?.agent?.vehicle?.brand} •{' '}
                            {orderDetail?.agent?.vehicle?.vehicleNumber}
                          </Text>
                        </View>

                        <View style={styles.iconColumn}>
                          <TouchableOpacity
                            style={styles.circleBtn}
                            onPress={() => {
                              // Call action
                            }}>
                            <Image
                              source={require('../assets/images/call.png')}
                              style={styles.smallIcon}
                            />
                          </TouchableOpacity>
                        </View>
                      </View>
                    ) : (
                      <View style={styles.header1}>
                        <Text style={styles.name}>Delivery person not assigned</Text>
                      </View>
                    )}

                    {/* ORDER INFO */}
                    <View style={styles.orderRow}>
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 5,
                        }}
                      >
                        <Image
                          source={require('../assets/images/shopping_bag.png')}
                          style={styles.smallIconOrange}
                        />

                        <View>
                          <Text style={styles.smallLabel}>
                            {orderDetail?.order?.itemsSummary.itemCount} Items • {orderDetail?.order?.itemsSummary.totalQuantity} Qty
                          </Text>
                          <View
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              gap: 4,
                              marginTop: 2,
                            }}
                          >
                            <Text style={styles.smallLabel}>Payment Status</Text>
                            <View style={styles.codBadge}>
                              <Text style={styles.codText}>
                                {orderDetail?.order.paymentStatus}
                              </Text>
                            </View>
                          </View>
                        </View>
                      </View>
                      <View>
                        <Text style={styles.smallLabel}>Order Amount</Text>
                        <Text style={styles.amount}>
                          ₹{orderDetail?.order.totalAmount.toFixed(2)}
                        </Text>
                      </View>
                    </View>

                    {/* LIVE STATUS */}
                    <View style={styles.liveBox}>
                      <View style={styles.iconCircle}>
                        <Image
                          source={currentLive.icon}
                          style={
                            orderDetail?.order?.status === 'ON_THE_WAY'
                              ? styles.bikeIcon
                              : orderDetail?.order?.status === 'PREPARING'
                              ? styles.preparingIcon
                              : styles.checkIcon
                          }
                        />
                      </View>

                      <View style={{ marginLeft: 10 }}>
                        <Text style={styles.liveTitle}>Live Status</Text>
                        <Text style={styles.liveText}>{currentLive.message}</Text>
                      </View>
                    </View>

                    {/* PROGRESS */}
                    <View style={{ marginTop: 20 }}>
                      <Text style={styles.progressTitle}>Order Progress</Text>

                      <View style={styles.progressRow}>
                      {steps.map((step, index) => {
                          const isCompleted = index < currentIndex;
                          const isCurrent = index === currentIndex;

                          return (
                            <View key={index} style={styles.stepContainer}>
                              <View
                                style={[
                                  styles.stepCircle,
                                  (isCompleted || isCurrent) && styles.activeStep,
                                  isCurrent &&
                                    step.status === 'ON_THE_WAY' &&
                                    styles.onWayStep,
                                ]}>
                                <Image
                                  source={getStepIcon(step.status, isCurrent)}
                                  style={getStepIconStyle(
                                    step.status,
                                    isCurrent,
                                    isCompleted || isCurrent,
                                  )}
                                />
                              </View>

                              <Text
                                style={[
                                  styles.stepText,
                                  (isCompleted || isCurrent) && {
                                    color: Colors.primary,
                                    fontWeight: '600',
                                  },
                                ]}>
                                {step.label}
                              </Text>

                              {index < steps.length - 1 && (
                                <View
                                  style={[
                                    styles.line,
                                    index < currentIndex && styles.activeLine,
                                  ]}
                                />
                              )}
                            </View>
                          );
                        })}
                      </View>
                    </View>

                    {/* BUTTONS */}
                    <View style={styles.buttonRow}>
                      <TouchableOpacity
                        style={styles.mapBtn}
                        onPress={() => setShowDetailsCard(false)}
                      >
                        <Text style={styles.mapBtnText}>Open in Maps</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <TouchableOpacity
                    activeOpacity={0.8}
                    style={styles.floatingShowButton}
                    onPress={() => setShowDetailsCard(true)}
                  >
                    <Image
                      source={require('../assets/images/shopping_bag.png')}
                      style={styles.floatingArrow}
                    />
                  </TouchableOpacity>
                )}
            </View>
            {/* ✅ CONDITIONAL BOTTOM BAR */}
            {showBottomBar && (
              <GlobalBottomBar navigation={navigation} activeTab="MyOrders" />
            )}

          </View>
        </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 100,
    backgroundColor: Colors.primary,
    alignItems: 'center',
  },

   mapContainer: {
    flex: 1,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },

  map: {
    flex: 1,
  },

  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '700',
    fontFamily: 'LeagueSpartan-Medium',
  },

  overlay: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: '90%',
    backgroundColor: '#fff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },

  deliveryTitle: {
    fontSize: 20,
    lineHeight: 20,
    color: '#1F2937',
    fontFamily: 'LeagueSpartan-Medium',
  },

  sectionTitle: {
    fontSize: 24,
    lineHeight: 26,
    color: '#1F2937',
    fontFamily: 'LeagueSpartan-Bold',
    marginBottom: 12,
  },

  addressBox: {
    backgroundColor: '#E8DFAE',
    padding: 12,
    borderRadius: 20,
    marginBottom: 15,
  },

  addressText: {
    fontSize: 16,
    lineHeight: 18,
    color: '#1F2937',
    fontFamily: 'LeagueSpartan-Regular',
  },

  mapImage: {
    width: '100%',
    height: 180,
    borderRadius: 20,
    marginBottom: 20,
  },

  deliveryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  subText: {
    fontSize: 14,
    lineHeight: 14,
    color: '#1F2937',
    fontFamily: 'LeagueSpartan-Light',
    marginBottom: 10,
  },

  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginBottom: 15,
  },

  timeline: {
    marginBottom: 20,
  },

  timelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },

  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FFB199',
    marginRight: 10,
  },

  timelineText: {
    fontSize: 14,
    lineHeight: 14,
    color: '#1F2937',
    fontFamily: 'LeagueSpartan-Light',
  },

  timeText: {
    fontSize: 14,
    lineHeight: 14,
    color: '#1F2937',
    fontFamily: FontFamily.regular,
  },

  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },

  primaryButton: {
    flex: 1,
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: 46,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },

  primaryText: {
    fontSize: 16,
    lineHeight: 16,
    color: '#FFFFFF',
    fontFamily: FontFamily.medium,
  },

  secondaryButton: {
    flex: 1,
    backgroundColor: '#FFDECF',
    paddingVertical: 12,
    borderRadius: 46,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  secondaryText: {
    fontSize: 16,
    lineHeight: 16,
    color: Colors.primary,
    fontFamily: FontFamily.medium,
  },
  locationBox: {
    backgroundColor: '#F3F7FF',
    padding: 8,
    borderRadius: 8,
    marginBottom: 12,
  },

  locationText: {
    color: '#0B3B2E',
    fontSize: 14,
    fontFamily: FontFamily.regular,
  },

  card1: {
    position: 'absolute',
    bottom: 80,
    left: 15,
    right: 15,
    backgroundColor: '#fff',
    borderRadius: 25,
    padding: 18,

    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 5,
    },
    elevation: 8,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },

   header1: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  avatar: {
    width: 60,
    height: 60,
    borderRadius: 20,
    marginRight: 12,
  },

  name: {
    fontSize: 18,
    fontFamily: FontFamily.medium,
    color: Colors.textColor,
  },

  phone: {
    color: Colors.textBrown,
    fontFamily: FontFamily.regular,
    marginTop: 2,
    fontSize: 12,
  },

  address: {
    color: Colors.textBrown,
    marginTop: 2,
    fontSize: 12,
    fontFamily: FontFamily.regular,
  },

  iconColumn: {
    gap: 0,
  },

  circleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#7bc043',
    justifyContent: 'center',
    alignItems: 'center',
  },

  orderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },

  smallLabel: {
    color: Colors.textBrown,
    fontSize: 14,
    fontFamily: FontFamily.regular,
  },

  boldText: {
    fontFamily: FontFamily.bold,
    marginTop: 2,
    fontSize: 14,
  },

  amount: {
    color: Colors.primary,
    fontSize: 18,
    fontFamily: FontFamily.regular,
    marginTop: 2,
  },

  liveBox: {
    flexDirection: 'row',
    backgroundColor: '#FEF6F3',
    padding: 6,
    borderRadius: 10,
    marginTop: 18,
    alignItems: 'center',
  },

  liveTitle: {
    color: Colors.textColor,
    fontFamily: FontFamily.medium,
  },

  liveText: {
    color: Colors.textBrown,
    marginTop: 3,
    fontSize: 12,
    fontFamily: FontFamily.regular,
  },

  progressTitle: {
    fontFamily: FontFamily.medium,
    marginBottom: 15,
    color: Colors.textColor,
  },

  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  stepContainer: {
    alignItems: 'center',
    flex: 1,
    position: 'relative',
    justifyContent: 'flex-start',
  },

  stepCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#e5e5e5',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  activeStep: {
    backgroundColor: Colors.lightOrange,
  },
  mapBtn: {
    flex: 1,
    backgroundColor: Colors.buttonLight,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },

  deliverBtn: {
    flex: 1,
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },

  mapBtnText: {
    color: Colors.primary,
    fontFamily: FontFamily.regular,
    fontSize: 16,
  },
  codBadge: {
    backgroundColor: Colors.lightBackground,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    marginLeft: 2,
  },

  codText: {
    color: Colors.primary,
    fontSize: 12,
    fontFamily: FontFamily.semiBold,
  },
  onWayStep: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.lightOrange,

    justifyContent: 'center',
    alignItems: 'center',

    zIndex: 3,
  },

  scooterIcon: {
    width: 20,
    height: 20,
    tintColor: Colors.primary,
  },
  preparingIcon: {
    width: 20,
    height: 20,
    tintColor: Colors.primary,
  },
  hideButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },

  hideIcon: {
    width: 16,
    height: 16,
    tintColor: Colors.textColor,
  },

  floatingShowButton: {
    position: 'absolute',
    bottom: 90,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,

    backgroundColor: Colors.primary,

    justifyContent: 'center',
    alignItems: 'center',

    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 4,
    },

    elevation: 10,
  },

  floatingArrow: {
    width: 24,
    height: 24,
    tintColor: '#fff',
    
  },
  checkIcon: {
    width: 16,
    height: 16,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.lightOrange,
    justifyContent: 'center',
    alignItems: 'center',
  },
  smallIconOrange: {
    width: 30,
    height: 30,
    tintColor: Colors.primary,
  },
  smallIcon: {
    width: 18,
    height: 18,
    tintColor: '#fff',
  },
stepText: {
    fontSize: 10,
    marginTop: 10,
    color: Colors.textBrown,
    textAlign: 'center',
    fontFamily: FontFamily.regular,
  },
   line: {
    position: 'absolute',
    top: 12,
    left: '50%',
    width: '100%',
    height: 3,
    backgroundColor: '#ddd',
    zIndex: 1,
  },

  activeLine: {
    backgroundColor: Colors.primary,
  },
  bikeIcon: {
    width: 24,
    height: 24,
    tintColor: Colors.primary,
  },

});