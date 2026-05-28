import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import Colors from '../assets/Colors/Colors';
import GlobalTopBarDelivery from '../GlobalContainer/GlobalTopBarDelivery';
import GlobalBottomBarDelivery from '../GlobalContainer/GlobalBottomBarDelivery';
import GlobalLoginAuth from '../GlobalContainer/GlobalLoginAuth';


const DeliveryOrders = ({ navigation }: any) => {
  return (
     <View style={styles.container}>
      <GlobalTopBarDelivery notificationClick={() => {
          
        }} />
       <View style={styles.overlay}>
          <GlobalBottomBarDelivery navigation={navigation} activeTab="Orders" />
      </View>
    </View>
    );
}

export default DeliveryOrders;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 100,
    backgroundColor: Colors.primary,
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: '90%',
    backgroundColor: '#fff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    alignItems: 'stretch',
    padding: 20,
    // shadow (iOS)
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    // shadow (Android)
    elevation: 5,
  },
 
  });