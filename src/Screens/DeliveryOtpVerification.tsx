import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView } from 'react-native';
import Colors from '../assets/Colors/Colors';
import GlobalTopBarDelivery from '../GlobalContainer/GlobalTopBarDelivery';
import GlobalLoginAuth from '../GlobalContainer/GlobalLoginAuth';
import { DeliveryOrderDetails } from '../Models/DeliveryOrderDetails/DeliveryOrderDetails';
import { DeliveryGlobalStyles } from '../assets/Styles/GlobalStyles';
import { FontFamily } from '../assets/GlobalFont/GlobalFont';


const DeliveryOtpVerification = ({ route,
  navigation, }: any) => {
     const {
        orderDetail,
      }: {
        orderDetail: DeliveryOrderDetails;
      } = route.params;
    
  return (
     <View style={styles.container}>
      <GlobalTopBarDelivery navigation={navigation}
        notificationClick={() => {}}
        text="OTP Verification"
        subtitleText={`#${orderDetail?.order.orderNumber}`}
        isBackVisible={true}
        isOnlineVisible={false}
      />
       <View style={styles.overlay}>
        <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{
              paddingBottom: 40,
            }}>
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
                        {orderDetail?.customer.name}
                      </Text>
                      <View style={{ flexDirection: 'row', justifyContent: 'flex-start',alignItems: 'center', marginRight: 10, marginTop: 4 }}>
                        <Image style= {[DeliveryGlobalStyles.icon]} source={require('../assets/images/call.png')} />
                        <Text style={styles.smallText}> {orderDetail?.customer.phone}</Text>
                      </View>
                      <View style={{ flexDirection: 'row', justifyContent: 'flex-start',alignItems: 'flex-start', marginRight: 10, marginTop: 4 }}>
                        <Image style= {[DeliveryGlobalStyles.icon, {marginTop: 2}]} source={require('../assets/images/location.png')} />
                        <Text style={styles.smallText}> {orderDetail?.customer.address.address}</Text>
                      </View>
                    </View>
                  </View>
          
                  <View style={styles.actionButtons}>
                    <TouchableOpacity style={styles.iconButton}>
                      <Image style= {[DeliveryGlobalStyles.iconMedium]} source={require('../assets/images/call.png')} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </ScrollView>
      </View>
    </View>
    );
}

export default DeliveryOtpVerification;

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
});