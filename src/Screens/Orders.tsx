import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Platform,  Dimensions,} from 'react-native';
import Colors from '../assets/Colors/Colors';
import GlobalBottomBar from '../GlobalContainer/GlobalBottomBar';
import GlobalTopBar from '../GlobalContainer/GlobalTopBar';
const { width, height } = Dimensions.get('window');
const isTablet = Math.min(width, height) >= 600;
export default function Orders({ navigation }: any) {
  return (
     <View style={styles.container}>
    
      <GlobalTopBar navigation={navigation} showSearch={false} />
        <View style={styles.overlay}>
        <GlobalBottomBar navigation={navigation} activeTab="Orders" />
         </View>
    </View>
    );
}

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
      height:
        Platform.OS === 'ios'
          ? isTablet
            ? '93%'   // iPad
            : '88%'   // iPhone
          : isTablet
          ? '78%'     // Android Tablet
          : '92%',    // Android Phone
      backgroundColor: '#fff',
      borderTopLeftRadius: 30,
      borderTopRightRadius: 30,
      padding: 20,
  
      shadowColor: '#000',
      shadowOpacity: 0.1,
      shadowRadius: 10,
      elevation: 5,
    },
 
  });
