import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import Colors from '../assets/Colors/Colors';
import GlobalLoginAuth from './GlobalLoginAuth';

export default function GlobalBottomBarDelivery({ navigation, activeTab }: any) {
  const handleLogout = () => {
      navigation.replace('Login');
      GlobalLoginAuth.clear();
    }
  return (
    <View style={styles.bottomBar}>

      {/* HOME */}
      <TouchableOpacity
        style={styles.tabItem}
        onPress={() => navigation.navigate('DeliveryDashboard', { fromTab: true })}
        
      >
        <Image
          source={
            activeTab === 'Home'
              ? require('../assets/images/HomeNavBarSelect.png') // you can change to active icon if you have
              : require('../assets/images/HomeNavBar.png')
          }
          style={[
            styles.icon,
            activeTab === 'Home' && styles.activeIcon
          ]}
        />
        <Text
          style={[
            styles.tabText,
            activeTab === 'Home' && styles.activeText
          ]}
        >
          Home
        </Text>
      </TouchableOpacity>
        {/* MY ORDERS */}
      <TouchableOpacity
        style={styles.tabItem}
        onPress={() => navigation.navigate('DeliveryOrders')}
      >
        <Image
          source={
            activeTab === 'Orders'
              ? require('../assets/images/OrdersNavBarSelect.png') // you can change to active icon if you have
              : require('../assets/images/OrdersNavBar.png')
          }
          style={[
            styles.icon,
            activeTab === 'Orders' && styles.activeIcon
          ]}
        />
        <Text
          style={[
            styles.tabText,
            activeTab === 'Orders' && styles.activeText
          ]}
        >
          Orders
        </Text>
      </TouchableOpacity>

      {/* Profile */}
      <TouchableOpacity
        style={styles.tabItem}
       onPress={() => navigation.replace('DeliveryProfile')}
      >
        <Image
          source={
            activeTab === 'DeliveryProfile'
              ? require('../assets/images/profile_bottom_bar_active.png') // you can change to active icon if you have
              : require('../assets/images/profile_bottom_bar.png')
          }
          style={[
            styles.icon,
            activeTab === 'DeliveryProfile' && styles.activeIcon
          ]}
        />
        <Text
          style={[
            styles.tabText,
            activeTab === 'DeliveryProfile' && styles.activeText
          ]}
        >
          Profile
        </Text>
      </TouchableOpacity>

    
      {/* Logout */}
      <TouchableOpacity
        style={styles.tabItem}
        onPress={() => 
          handleLogout()}
      >
        <Image
          source={require('../assets/images/logout_bottom_bar.png')}
          style={[
            styles.icon,
            activeTab === 'Logout' && styles.activeIcon
          ]}
        />
        <Text
          style={[
            styles.tabText,
            activeTab === 'Logout' && styles.activeText
          ]}
        >
          Logout
        </Text>
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },

  tabItem: {
    flex: 1,
    alignItems: 'center',
  },

  icon: {
    width: 22,
    height: 22,
    resizeMode: 'contain',
    tintColor: Colors.white, // default color for icons
  },

  tabText: {
    fontSize: 12,
    color: Colors.white,
    marginTop: 5,
    fontFamily: 'LeagueSpartan-Regular',
  },

  // ✅ Active styles
  activeText: {
    color: Colors.white,
    fontFamily: 'LeagueSpartan-Bold',
  },

  activeIcon: {
    tintColor: Colors.white, // works if your icons allow tint
  },
});