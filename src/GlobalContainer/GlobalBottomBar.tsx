import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import Colors from '../assets/Colors/Colors';

export default function GlobalBottomBar({ navigation, activeTab }: any) {
  return (
    <View style={styles.bottomBar}>

      {/* HOME */}
      <TouchableOpacity
        style={styles.tabItem}
        onPress={() => navigation.navigate('Dashboard', { fromTab: true })}
        
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

      {/* ORDERS */}
      <TouchableOpacity
        style={styles.tabItem}
       // onPress={() => navigation.replace('Orders')}
        onPress={() => navigation.navigate('Orders', { fromTab: true })
}
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

      {/* FAVORITES */}
      <TouchableOpacity
        style={styles.tabItem}
        onPress={() => navigation.navigate('Favorites')}
      >
        <Image
          source={require('../assets/images/FavouritesNavBar.png')}
          style={[
            styles.icon,
            activeTab === 'Favorites' && styles.activeIcon
          ]}
        />
        <Text
          style={[
            styles.tabText,
            activeTab === 'Favorites' && styles.activeText
          ]}
        >
          Favorites
        </Text>
      </TouchableOpacity>

      {/* MY ORDERS */}
      <TouchableOpacity
        style={styles.tabItem}
        onPress={() => navigation.navigate('MyOrders')}
      >
        <Image
          source={require('../assets/images/MyOrdersNavBar.png')}
          style={[
            styles.icon,
            activeTab === 'MyOrders' && styles.activeIcon
          ]}
        />
        <Text
          style={[
            styles.tabText,
            activeTab === 'MyOrders' && styles.activeText
          ]}
        >
          My Orders
        </Text>
      </TouchableOpacity>

      {/* SUPPORT */}
      <TouchableOpacity
        style={styles.tabItem}
        onPress={() => navigation.navigate('Support')}
      >
        <Image
          source={require('../assets/images/SupportNavBar.png')}
          style={[
            styles.icon,
            activeTab === 'Support' && styles.activeIcon
          ]}
        />
        <Text
          style={[
            styles.tabText,
            activeTab === 'Support' && styles.activeText
          ]}
        >
          Support
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