import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView } from 'react-native';
import Colors from '../assets/Colors/Colors';
import GlobalTopBarDelivery from '../GlobalContainer/GlobalTopBarDelivery';
import OrderItemsListComponent from '../GlobalContainer/DeliveryOrderItemsListComponent';
import { DeliveryGlobalStyles } from '../assets/Styles/GlobalStyles';
import { FontFamily } from '../assets/GlobalFont/GlobalFont';

export default function DeliveryOrderDetail({ navigation }: any) {
const orderItems = [
  {
    id: 1,
    name: 'Margherita Pizza',
    desc: 'Regular • Classic Crust',
    qty: 1,
    price: 250,
    image: require('../assets/images/food.png'),
  },
  {
    id: 2,
    name: 'Veg Burger',
    desc: 'No Onion • Extra Cheese',
    qty: 2,
    price: 220,
    image: require('../assets/images/food.png'),
  },
  {
    id: 3,
    name: 'French Fries',
    desc: 'Medium Fries',
    qty: 2,
    price: 120,
    image: require('../assets/images/food.png'),
  },
  {
    id: 4,
    name: 'Coke',
    desc: '500ml',
    qty: 3,
    price: 90,
    image: require('../assets/images/food.png'),
  },
];

  return (
     <View style={styles.container}>
      <GlobalTopBarDelivery navigation={navigation} notificationClick={() => {}} text="Order Detail" subtitleText="#ORD-1234" isBackVisible={true} isOnlineVisible = {false} />
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
                            source={require('../assets/images/customer_image.png')}
                            style={styles.profileImage}
                            />

                        <View style={styles.customerInfo}>
                        <Text style={styles.customerName}>
                            Rahul Sharma
                        </Text>
                        <View style={{ flexDirection: 'row', justifyContent: 'flex-start',alignItems: 'center', marginRight: 10, marginTop: 4 }}>
                            <Image style= {[DeliveryGlobalStyles.icon]} source={require('../assets/images/call.png')} />
                            <Text style={styles.smallText}>+91 98765 43210</Text>
                        </View>
                        <View style={{ flexDirection: 'row', justifyContent: 'flex-start',alignItems: 'flex-start', marginRight: 10, marginTop: 4 }}>
                            <Image style= {[DeliveryGlobalStyles.icon, {marginTop: 2}]} source={require('../assets/images/location.png')} />
                            <Text style={styles.smallText}>Salt Lake, Sector 1, Block - B Kolkata - 700064, West Bengal</Text>
                        </View>
                        </View>
                    </View>

                    <View style={styles.actionButtons}>
                        <TouchableOpacity style={styles.iconButton}>
                            <Image style= {[DeliveryGlobalStyles.iconMedium]} source={require('../assets/images/call.png')} />
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.iconButton}>
                            <Image style= {[DeliveryGlobalStyles.iconMedium]} source={require('../assets/images/send.png')} />
                        </TouchableOpacity>
                    </View>
                    </View>
                </View>

                {/* Order Items */}
                <OrderItemsListComponent items={orderItems} />

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
                        ₹690.00
                        </Text>
                    </View>

                    <View style={styles.summaryItem}>
                        <Text style={styles.summaryLabel}>
                        Delivery Charges
                        </Text>

                        <Text style={styles.summaryValue}>
                        ₹40.00
                        </Text>
                    </View>

                    <View style={styles.summaryItem}>
                        <Text style={styles.summaryLabel}>
                        Packaging Charges
                        </Text>

                        <Text style={styles.summaryValue}>
                        ₹20.00
                        </Text>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.summaryItem}>
                        <Text style={styles.totalText}>
                        Total Amount
                        </Text>

                        <Text style={styles.totalAmount}>
                        ₹900.00
                        </Text>
                    </View>

                    <View style={styles.codBadge}>
                        <Text style={styles.codText}>
                        Payment Method: COD
                        </Text>
                    </View>
                    </View>

                    {/* Delivery Info */}
                    <View style={[styles.summaryCard1, { flex: 1 }]}>
                    <View style={styles.deliveryCard}>
                        <View style={styles.deliveryTop}>
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
                                12:45 PM - 1:00 PM
                                </Text>
                            </View>
                            </View>
                        </View>
                        <View style={styles.divider1} />
                        <View style={styles.infoRow}>
                            <Text style={styles.summaryLabel}>
                            Distance
                            </Text>

                            <Text style={styles.summaryValue}>
                            3.2 km
                            </Text>
                        </View>
                        <View style={styles.divider1} />           
                        <View style={styles.infoRow}>
                            <Text style={styles.summaryLabel}>
                            Payment Type
                            </Text>

                            <View style={styles.paymentBadge}>
                            <Text style={styles.paymentText}>
                                COD
                            </Text>
                            </View>
                        </View>
                        </View>
                    </View>
                </View>

                {/* Bottom Buttons */}
                <View style={styles.buttonRow}>
                    <TouchableOpacity
                    style={styles.callButton}
                    >
                    <Text style={styles.callButtonText}>
                        Call Customer
                    </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                    style={styles.acceptButton}
                    >
                    <Text style={styles.acceptButtonText}>
                        Accept Order
                    </Text>
                    </TouchableOpacity>
                </View>
                </ScrollView>
        </View>
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
        fontSize: 14,
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