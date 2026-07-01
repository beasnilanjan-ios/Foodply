import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Alert, Linking } from 'react-native';
import Colors from '../assets/Colors/Colors';
import GlobalTopBarDelivery from '../GlobalContainer/GlobalTopBarDelivery';
import OrderItemsListComponent from '../GlobalContainer/DeliveryOrderItemsListComponent';
import { DeliveryGlobalStyles } from '../assets/Styles/GlobalStyles';
import { FontFamily } from '../assets/GlobalFont/GlobalFont';
import { DeliveryOrderDetailsResponse } from '../Models/DeliveryOrderDetails/DeliveryOrderDetailsResponse';
import GlobalLoginAuth from '../GlobalContainer/GlobalLoginAuth';
import GlobalApi from '../GlobalContainer/GlobalApi';
import { DeliveryOrderDetails } from '../Models/DeliveryOrderDetails/DeliveryOrderDetails';
import GlobalLoader from '../GlobalContainer/GlobalLoader';
import { ON_THE_WAY } from '../Utils/CommonUtil';

export default function DeliveryOrderDetail({ route , navigation }: any) {
const { orderId, from = 'Dashboard' } = route.params || {};
const [loading, setLoading] = useState(false);
const [orderData, setOrderData] =
    useState<DeliveryOrderDetails | null>(null);


useEffect(() => {
    console.log(from)
    getOrderDetails();
  }, []);

  const getOrderDetails = async () => {

    try {
      setLoading(true);

      const response = await fetch(
        `${GlobalApi.baseUrl}api/deliveries/me/orders/${orderId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${GlobalLoginAuth.accessToken}`,
          },
        }
      );

      const result: DeliveryOrderDetailsResponse =
        await response.json();

      console.log('Order Details:', result);

      if (!response.ok || !result.success) {
        Alert.alert(
          'FoodyPly',
          result.message || 'Failed to load order details'
        );
        return;
      }

      if(result.data.delivery.status === ON_THE_WAY) {
        navigation.replace('DeliveryStart', { orderDetail: result.data });
        return;
      }
      setOrderData(result.data);

    } catch (error) {

      console.log(error);

      Alert.alert(
        'FoodyPly',
        'Unable to connect to server'
      );

    } finally {

      setLoading(false);

    }
  };

   const updateOrderStatus = async (
    orderId: number,
    status: string,
    ) => {

    try {

        setLoading(true);

        const response = await fetch(
        `${GlobalApi.baseUrl}api/deliveries/me/orders/${orderId}/status`,
        {
            method: 'PATCH',
            headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${GlobalLoginAuth.accessToken}`,
            },
            body: JSON.stringify({
            status: status,
            }),
        }
        );

        const result: DeliveryOrderDetailsResponse =
                await response.json();

      console.log('Order Details:', result);

        console.log('Status Update Response:', result);

        if (!response.ok || !result.success) {

        Alert.alert(
            'FoodyPly',
            result.message || 'Failed to update status'
        );

        return;
        }

       if(result.data.delivery.status === ON_THE_WAY) {
        navigation.replace('DeliveryStart', { orderDetail: result.data });
        return;
      }
    } catch (error) {

        console.log(error);

        Alert.alert(
        'FoodyPly',
        'Unable to connect to server'
        );

    } finally {
        setLoading(false);
    }
};

 const makePhoneCall = (phoneNumber?: string) => {
      if (!phoneNumber) {
        Alert.alert('Error', 'Phone number not available');
        return;
      }

      Linking.openURL(`tel:${phoneNumber}`).catch(() => {
        Alert.alert('Error', 'Unable to make a phone call');
      });
    };

  return (
     <View style={styles.container}>
      <GlobalTopBarDelivery navigation={navigation} notificationClick={() => {}} text="Order Detail" subtitleText={`#${orderData?.order.orderNumber}`} isBackVisible={true} isOnlineVisible = {false} />
        <View style={styles.overlay}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{
                    paddingBottom: 40,
                }}
                >
                {/* Customer Information */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>
                    Customer Information
                    </Text>

                    <View style={styles.customerRow}>
                    <View style={styles.customerLeft}>
                        <Image
                          source={
                            orderData?.customer?.profileImageUrl
                              ? { uri: orderData.customer.profileImageUrl }
                              : require('../assets/images/customer_image.png')
                          }
                          style={styles.profileImage}
                        />

                        <View style={styles.customerInfo}>
                        <Text style={styles.customerName}>
                            {orderData?.customer.name}
                        </Text>
                        <View style={{ flexDirection: 'row', justifyContent: 'flex-start',alignItems: 'center', marginRight: 10, marginTop: 4 }}>
                            <Image style= {[DeliveryGlobalStyles.icon]} source={require('../assets/images/call.png')} />
                            <Text style={styles.smallText}> {orderData?.customer.phone}</Text>
                        </View>
                        <View style={{ flexDirection: 'row', justifyContent: 'flex-start',alignItems: 'flex-start', marginRight: 10, marginTop: 4 }}>
                            <Image style= {[DeliveryGlobalStyles.icon, {marginTop: 2}]} source={require('../assets/images/location.png')} />
                            <Text style={styles.smallText}> {orderData?.customer.address.address}</Text>
                        </View>
                        </View>
                    </View>

                    <View style={styles.actionButtons}>
                        {from === 'Dashboard' && (
                        <TouchableOpacity 
                            style={styles.iconButton} 
                            onPress={() => makePhoneCall(orderData?.customer.phone)}>
                            <Image style= {[DeliveryGlobalStyles.iconMedium]} source={require('../assets/images/call.png')} />
                        </TouchableOpacity>
                        )}
                        {/* {from === 'Dashboard' && (
                        <TouchableOpacity style={styles.iconButton}>
                            <Image style= {[DeliveryGlobalStyles.iconMedium]} source={require('../assets/images/send.png')} />
                        </TouchableOpacity>
                        )} */}
                    </View>
                    </View>
                </View>

                {/* Order Items */}
                <OrderItemsListComponent itemQty ={ orderData?.itemsSummary?.totalQuantity || 0} items={orderData?.items || []} />

                {/* Bottom Summary */}
                <View style={styles.summaryRow}>
                    {/* Order Summary */}
                    <View style={[styles.summaryCard, { flex: 1.1 }, {marginRight: 10}]}>
                    <Text style={styles.cardTitle}>
                        Order Summary
                    </Text>

                    <View style={styles.summaryItem}>
                        <Text style={styles.summaryLabel}>
                        Item Total
                        </Text>

                        <Text style={styles.summaryValue}>
                            ₹{orderData?.billing?.itemTotal?.toFixed(2)}                        
                        </Text>
                    </View>

                    <View style={styles.summaryItem}>
                        <Text style={styles.summaryLabel}>
                        Delivery Charges
                        </Text>

                        <Text style={styles.summaryValue}>
                        ₹{orderData?.billing?.deliveryCharge?.toFixed(2)}
                        </Text>
                    </View>

                    <View style={styles.summaryItem}>
                        <Text style={styles.summaryLabel}>
                        Packaging Charges
                        </Text>

                        <Text style={styles.summaryValue}>
                        ₹{orderData?.billing?.packagingCharge?.toFixed(2)}
                        </Text>
                    </View>
                    {orderData?.billing?.discountAmount && orderData.billing.discountAmount > 0 && (
                     <View style={styles.summaryItem}>
                        <Text style={styles.summaryLabel}>
                        Discount
                        </Text>

                        <Text style={styles.summaryValue}>
                        -₹{orderData?.billing?.discountAmount?.toFixed(2)}
                        </Text>
                    </View>
                    )}  
                    <View style={styles.divider} />

                    <View style={styles.summaryItem}>
                        <Text style={styles.totalText}>
                        Total Amount
                        </Text>

                        <Text style={styles.totalAmount}>
                        ₹{orderData?.billing?.finalAmount?.toFixed(2)}
                        </Text>
                    </View>

                    <View style={styles.codBadge}>
                        <Text style={styles.codText}>
                        Payment Status: {orderData?.billing?.paymentStatus}
                        </Text>
                    </View>
                    </View>

                    {/* Delivery Info */}
                    <View style={[styles.summaryCard1, { flex: 1 }]}>
                    <View style={styles.deliveryCard}>                    
                        <Text style={styles.cardTitle}>
                            Delivery Information
                        </Text>
                        <View style={styles.deliveryTop}>
                             {from === 'Dashboard' && (
                            <View style = {[{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }]}>
                            <View style={[styles.iconButton, { width: 32, height: 32, borderRadius: 16}]}>
                            <Image
                                style={[
                                    DeliveryGlobalStyles.iconLarge,
                                    { tintColor: Colors.greenDark },
                                ]}
                                source={require('../assets/images/scooter.png')}
                                />
                            </View>
                              
                            <View style={[{ alignItems: 'center'}, { marginLeft: 5 }]}>

                                <Text style={styles.deliveryTitle}>
                                Estimated Delivery Time
                                </Text>

                                <Text style={styles.deliveryTime}>
                                    {orderData?.delivery?.estimatedDeliveryWindow}
                                </Text>
                            </View>
                            </View>
                             )} 
                        </View>
                         {from === 'Dashboard' && (
                        <View style={styles.divider1} />
                         )}
                        <View style={styles.infoRow}>
                            <Text style={styles.summaryLabel}>
                            Distance
                            </Text>

                            <Text style={styles.summaryValue}>
                            {orderData?.delivery?.distanceKm?.toFixed(2)} km
                            </Text>
                        </View>
                        <View style={styles.divider1} />           
                        <View style={styles.infoRow}>
                            <Text style={styles.summaryLabel}>
                            Payment Type
                            </Text>

                            <View style={styles.paymentBadge}>
                            <Text style={styles.paymentText}>
                                {orderData?.billing?.paymentMethod}
                            </Text>
                            </View>
                        </View>
                        </View>
                    </View>
                </View>

                {/* Bottom Buttons */}
                {from === 'Dashboard' && (
                <View style={styles.buttonRow}>
                    {/* <TouchableOpacity
                    style={styles.callButton}
                    >
                    <Text style={styles.callButtonText}>
                        Call Customer
                    </Text>
                    </TouchableOpacity> */}

                    <TouchableOpacity
                        style={styles.acceptButton} onPress={() => updateOrderStatus(orderData?.order.id || 0, ON_THE_WAY)}
                    >
                    <Text style={styles.acceptButtonText}>
                       Start Delivery
                    </Text>
                    </TouchableOpacity>
                </View>
                )}
                </ScrollView>
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
 card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    },

    cardTitle: {
    fontSize: 20,
    color: Colors.textColor,
    marginBottom: 14,
    fontFamily: FontFamily.medium,
    },

    customerRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
    },

    customerLeft: {
        flexDirection: 'row',
        flex: 1,
        minWidth: 0,
    },

    customerInfo: {
        flex: 1,
        minWidth: 0,
        marginLeft: 12,
    },

    profileImage: {
        width: 56,
        height: 56,
        borderRadius: 14,
    },

    customerName: {
        fontSize: 16,
        color: Colors.textColor,
        fontFamily: FontFamily.medium,
    },

    smallText: {
        fontSize: 12,
        color: Colors.textBrown,
        fontFamily: FontFamily.regular,
        flexShrink: 1,
        },


    actionButtons: {
        justifyContent: 'space-between',
        marginLeft: 10,
        alignItems: 'center',
        flexShrink: 0,
    },

    iconButton: {
        width:30,
        height: 30,
        borderRadius: 15,
        backgroundColor: Colors.greenLight,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },

    iconText: {
    fontSize: 18,
    },

    summaryRow: {
        flexDirection: 'row',
        marginTop: 16,
    },

    summaryCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 10,
    },

    summaryCard1: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 8,
    },

    summaryItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },

     deliveryCard: {
        backgroundColor: Colors.greenLightCard,
        borderRadius: 20,
        padding: 8,
    },

    summaryLabel: {
        fontSize: 12,
        color: Colors.textColorLight,
        fontFamily: FontFamily.regular,
    },

    summaryValue: {
        fontSize: 12,
        fontFamily: FontFamily.medium,
        color: Colors.textColor,
    },

    divider: {
        height: 1,
        backgroundColor: '#EFEFEF',
        marginVertical: 10,
    },

     divider1: {
        height: 1,
        backgroundColor: '#EFEFEF',
        marginVertical: 5,
    },

    totalText: {
        fontSize: 14,
        fontFamily: FontFamily.medium,
        color: Colors.textColor,
    },

    totalAmount: {
        fontSize: 18,
        fontFamily: FontFamily.medium,
        color: Colors.primary,
    },

    codBadge: {
    backgroundColor: Colors.greenLight,
    paddingVertical: 6,
    borderRadius: 20,
    alignItems: 'center',
    marginTop: 10,
    },

    codText: {
        color: Colors.greenDark,
        fontSize: 12,
        fontFamily: FontFamily.medium,
    },

    deliveryTop: {
        alignItems: 'center',
        paddingLeft: 10,
    },

    deliveryIcon: {
    fontSize: 28,
    },

    deliveryTitle: {
    fontSize: 10,
    fontFamily: FontFamily.medium,
    },

    deliveryTime: {
        marginTop: 5,
        fontSize: 12,
        fontFamily: FontFamily.medium,    
        color: Colors.greenDark,
    },

    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
        marginTop: 10,
    },

    paymentBadge: {
        backgroundColor: Colors.lightBackground,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 20,
    },

    paymentText: {
    color: Colors.primary,
    fontSize: 12,
    fontFamily: FontFamily.medium,
    },

    buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 22,
    },

    callButton: {
    flex: 1,
    height: 40,
    borderRadius: 28,
    backgroundColor: '#FFE5D4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    },

    callButtonText: {
        color: Colors.primary,
        fontSize: 16,
        fontFamily: FontFamily.medium,
    },

    acceptButton: {
    flex: 1,
    height: 40,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    },

    acceptButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: FontFamily.medium,
    },
});