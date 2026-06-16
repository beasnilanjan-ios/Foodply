// import React from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   Platform,
//   Dimensions,
// } from 'react-native';
// import Colors from '../assets/Colors/Colors';
// import GlobalBottomBar from '../GlobalContainer/GlobalBottomBar';
// import GlobalTopBar from '../GlobalContainer/GlobalTopBar';
// import GlobalBackButton from '../GlobalContainer/GlobalBackButton';

// const { width, height } = Dimensions.get('window');
// const isTablet = Math.min(width, height) >= 600;

// export default function Orders({ navigation }: any) {
//   return (
//     <View style={styles.container}>

//       {/* 🔝 TOP BAR */}
//       <GlobalTopBar navigation={navigation} showSearch={false} />

//       {/* 🎯 CENTERED BACK + TITLE */}
//       <View style={styles.headerCenter}>
//         <GlobalBackButton onPress={() => navigation.goBack()} />
//         <Text style={styles.title}>Cart</Text>
//       </View>

//       {/* 🔽 OVERLAY */}
//       <View style={styles.overlay}>
//         <GlobalBottomBar navigation={navigation} activeTab="Orders" />
//       </View>

//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     paddingTop: 100,
//     backgroundColor: Colors.primary,
//   },

//   // 🎯 CENTER GROUP
//   headerCenter: {
//     position: 'absolute',
//     top: Platform.OS === 'ios' ? 120 : 100,
//     width: '100%',
//     flexDirection: 'row',
//     justifyContent: 'center', // 👈 center whole group
//     alignItems: 'center',
//   },

//   title: {
//     color: '#fff',
//     fontSize: 32,
//     fontWeight: '700',
//     marginLeft: 10, // 👈 spacing from back button
//   },

//   overlay: {
//     position: 'absolute',
//     bottom: 0,
//     width: '100%',
//     height:
//       Platform.OS === 'ios'
//         ? isTablet
//           ? '93%'
//           : '88%'
//         : isTablet
//         ? '78%'
//         : '92%',
//     backgroundColor: '#fff',
//     borderTopLeftRadius: 30,
//     borderTopRightRadius: 30,
//     padding: 20,

//     shadowColor: '#000',
//     shadowOpacity: 0.1,
//     shadowRadius: 10,
//     elevation: 5,
//   },
// });


import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  Dimensions,
  ScrollView,
  TouchableOpacity,
} from 'react-native';

import Colors from '../assets/Colors/Colors';
import GlobalBottomBar from '../GlobalContainer/GlobalBottomBar';
import GlobalTopBar from '../GlobalContainer/GlobalTopBar';
import DeliveryOrderListComponent from '../GlobalContainer/DeliveryOrderListComponent';

const { width, height } = Dimensions.get('window');
const isTablet = Math.min(width, height) >= 600;

export default function Orders({ navigation, onMenuPress }: any) {
  const [activeTab, setActiveTab] = useState('Active');

  const tabs = ['Active', 'Completed', 'Cancelled'];

  // 🔥 Dummy Orders (replace with API later)
  const activeOrders = [
    {
      orderId: 1,
      orderNumber: '#12345',
      minutesAgo: 10,
      customerName: 'John Doe',
      finalAmount: 250,
      addressText: 'Kolkata, West Bengal',
      itemCount: 2,
      paymentMethod: 'COD',
    },
    {
      orderId: 2,
      orderNumber: '#12346',
      minutesAgo: 10,
      customerName: 'Jane Smith',
      finalAmount: 300,
      addressText: 'Mumbai, Maharashtra',
      itemCount: 2,
      paymentMethod: 'COD',
    },
    {
      orderId: 3,
      orderNumber: '#12347',
      minutesAgo: 10,
      customerName: 'Bob Johnson',
      finalAmount: 350,
      addressText: 'Chennai, Tamil Nadu',
      itemCount: 2,
      paymentMethod: 'COD',
    },
  ];

  const completedOrders = [
    {
      orderId: 2,
      orderNumber: '#12346',
      minutesAgo: 30,
      customerName: 'Rahul Sharma',
      finalAmount: 450,
      addressText: 'Barrackpore, Kolkata',
      itemCount: 3,
      paymentMethod: 'Paid',
    },
  ];

  const cancelledOrders: any[] = [];

  const getOrders = () => {
    if (activeTab === 'Active') return activeOrders;
    if (activeTab === 'Completed') return completedOrders;
    if (activeTab === 'Cancelled') return cancelledOrders;
    return [];
  };

  return (
    <View style={styles.container}>
      {/* 🔝 TOP BAR */}
      <GlobalTopBar navigation={navigation} onMenuPress={onMenuPress} />

      {/* 🔥 Header */}
      <View style={styles.headerContainer}>
        <Text style={styles.title}>My Order</Text>
      </View>

      {/* 🔽 OVERLAY */}
      <View style={styles.overlay}>
        <ScrollView showsVerticalScrollIndicator={false}>
          
          {/* 🔥 Tabs */}
          <View style={styles.tabContainer}>
            {tabs.map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[
                  styles.tab,
                  activeTab === tab && styles.activeTab,
                ]}
                onPress={() => setActiveTab(tab)}
              >
                <Text
                  style={[
                    styles.tabText,
                    activeTab === tab && styles.activeTabText,
                  ]}
                >
                  {tab}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* 🔥 Order List */}
          <View style={{ marginTop: 20 }}>
            <DeliveryOrderListComponent
              orders={getOrders()}
              onPressItem={(item) => {
                console.log('Clicked Order:', item);
                // navigation.navigate('OrderDetail', { item });
              }}
            />
          </View>

        </ScrollView>

        {/* 🔻 Bottom Bar */}
        <GlobalBottomBar navigation={navigation} activeTab="Orders" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 100,
    backgroundColor: Colors.primary,
  },

  headerContainer: {
    width: '100%',
    paddingHorizontal: 20,
    marginTop: Platform.OS === 'ios' ? 15 : 10,
  },

  title: {
    fontSize: isTablet ? 40 : 34,
    fontFamily: 'LeagueSpartan-Bold',
    color: '#fff',
  },

  overlay: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height:
      Platform.OS === 'ios'
        ? isTablet
          ? '93%'
          : '88%'
        : isTablet
        ? '78%'
        : '92%',
    backgroundColor: '#fff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 20,
  },

  /* 🔥 Tabs */
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    borderRadius: 30,
    padding: 5,
  },

  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 25,
    alignItems: 'center',
  },

  activeTab: {
    backgroundColor: '#ff6a00',
  },

  tabText: {
    fontSize: 16,
    color: '#ff6a00',
    fontFamily: 'LeagueSpartan-Medium',
  },

  activeTabText: {
    color: '#fff',
  },
});