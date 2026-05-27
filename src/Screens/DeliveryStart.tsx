import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Image, ScrollView } from 'react-native';
import Colors from '../assets/Colors/Colors';
import GlobalTopBar from '../GlobalContainer/GlobalTopBar';
import GlobalTopBarDelivery from '../GlobalContainer/GlobalTopBarDelivery';
import { DeliveryOrderDetails } from '../Models/DeliveryOrderDetails/DeliveryOrderDetails';


export default function DeliveryStart({ route, navigation }: any) {
  const { orderDetail }: { orderDetail: DeliveryOrderDetails } = route.params;
  console.log("orderDetailStartDelivery", orderDetail);

  return (
     <View style={styles.container}>
     <GlobalTopBarDelivery navigation={navigation} notificationClick={() => {}} text="Start Delivery" subtitleText={`#${orderDetail?.order.orderNumber}`} isBackVisible={true} isOnlineVisible = {false} />
        <View style={styles.overlay}>
           <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{
              paddingBottom: 40,
            }}
          >
          {/* Map */}
            <View style={styles.card}>
              {/* Implement map using maplibra */}
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
 
  });