// import React from 'react';
// import { View, Text, StyleSheet, ScrollView } from 'react-native';
// import GlobalBackButton from '../GlobalContainer/GlobalBackButton';
// import GlobalBottomBar from '../GlobalContainer/GlobalBottomBar';
// import Colors from '../assets/Colors/Colors';

// export default function TrackOrder({ navigation }: any) {
//   return (
//     <View style={styles.container}>
      
//       <GlobalBackButton onPress={() => navigation.goBack()} />
//       <Text style={styles.title}>Track Order</Text>

//       <View style={styles.overlay}>
        
//         <ScrollView
//           showsVerticalScrollIndicator={false}
//           contentContainerStyle={{ paddingBottom: 120 }} // ✅ fix overlap
//         >
//           {/* overlay content goes here */}
//         </ScrollView>

//         {/* 🔻 Bottom Bar */}
//         <GlobalBottomBar navigation={navigation} activeTab="MyOrders" />

//       </View>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     alignItems: 'center',
//     paddingTop: 100,
//     backgroundColor: Colors.primary,
//   },

//   title: {
//     color: '#fff',
//     fontSize: 28,
//     fontWeight: '700',
//   },

//   overlay: {
//     position: 'absolute',
//     bottom: 0,
//     width: '100%',
//     height: '90%',
//     backgroundColor: '#fff',
//     borderTopLeftRadius: 30,
//     borderTopRightRadius: 30,
//     padding: 16,
//   },

//   text: {
//     fontSize: 22,
//     fontWeight: '600',
//   },
// });



import React, { useEffect, useState } from 'react';
import getSocket, { connectSocket, disconnectSocket } from '../services/socketService';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ToastAndroid,
} from 'react-native';

import GlobalBackButton from '../GlobalContainer/GlobalBackButton';
import GlobalBottomBar from '../GlobalContainer/GlobalBottomBar';
import Colors from '../assets/Colors/Colors';
import { FontFamily } from '../assets/GlobalFont/GlobalFont';
import GlobalLoginAuth from '../GlobalContainer/GlobalLoginAuth';
import {Socket, DefaultEventsMap} from 'socket.io-client';

export default function TrackOrder({ navigation, route }: any) {

  // ✅ SHOW BOTTOM BAR ONLY WHEN FROM TAB
  const showBottomBar = route?.params?.fromTab === true;

  const [riderLocation, setRiderLocation] = useState<
    { latitude: number; longitude: number } | null
  >(null);


useEffect(() => {
  const trackedOrderId = 43;

  const socket = connectSocket();

  if (!socket) {
    console.log('Socket is null');
    return;
  }

  const onConnect = () => {
    console.log('✅ Connected:', socket.id);

    // Join tracking room
    socket.emit('track:join', {
      orderId: trackedOrderId,
    });

    console.log('track:join emitted');
  };

  const onSnapshot = (data: any) => {
    console.log('📍 Tracking Snapshot:', data);

    if (data?.latitude && data?.longitude) {
      setRiderLocation({
        latitude: data.latitude,
        longitude: data.longitude,
      });
    }
  };

  const onLocationUpdated = (data: any) => {
    console.log('🚚 Live Location:', data);

    ToastAndroid.show(
      'Location Updated',
      ToastAndroid.SHORT,
    );

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

  socket.onAny((event, ...args) => {
    console.log('EVENT =>', event, args);
  });

  socket.on('connect', onConnect);

  socket.on('tracking:snapshot', onSnapshot);

  socket.on('delivery:location:updated', onLocationUpdated);

  socket.on('tracking:error', onTrackingError);

  socket.on('disconnect', reason => {
    console.log('Disconnected:', reason);
  });

  socket.on('connect_error', err => {
    console.log('Connect Error:', err.message);
  });

  if (socket.connected) {
    onConnect();
  }

  return () => {
    socket.off('connect', onConnect);
    socket.off('tracking:snapshot', onSnapshot);
    socket.off('delivery:location:updated', onLocationUpdated);
    socket.off('tracking:error', onTrackingError);
    socket.offAny();

    disconnectSocket();
  };
}, []);


  return (
    <View style={styles.container}>
      
      {/* 🔙 Back */}
      <GlobalBackButton onPress={() => navigation.goBack()} />

      {/* 🔝 Title */}
      <Text style={styles.title}>Track Order</Text>

      {/* 🔽 Overlay */}
      <View style={styles.overlay}>
        
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingBottom: showBottomBar ? 140 : 40, // ✅ dynamic fix
          }}
        >

          {/* 📍 Shipping Address */}
          <Text style={styles.sectionTitle}>Shipping Address</Text>

          <View style={styles.addressBox}>
            <Text style={styles.addressText}>
              778 Locust View Drive Oakland, CA
            </Text>
          </View>

          {/* 🗺️ Map */}
          <Image
            source={require('../assets/images/map.png')}
            style={styles.mapImage}
          />

          {riderLocation && (
            <View style={styles.locationBox}>
              <Text style={styles.locationText}>
                Rider: {riderLocation.latitude.toFixed(6)}, {riderLocation.longitude.toFixed(6)}
              </Text>
            </View>
          )}

          {/* 🚚 Delivery Time */}
          <View style={styles.deliveryHeader}>
            <Text style={styles.deliveryTitle}>Delivery Time</Text>
            <Text style={styles.deliveryTitle}>25 mins</Text>
          </View>

          <Text style={styles.subText}>Estimated Delivery</Text>

          <View style={styles.divider} />

          {/* 📍 Timeline */}
          <View style={styles.timeline}>
            {[
              { title: 'Your order has been accepted', time: '2 min' },
              { title: 'The restaurant is preparing your order', time: '5 min' },
              { title: 'The delivery is on his way', time: '10 min' },
              { title: 'Your order has been delivered', time: '8 min' },
            ].map((item, index) => (
              <View key={index} style={styles.timelineRow}>
                
                <View style={styles.dot} />

                <View style={{ flex: 1 }}>
                  <Text style={styles.timelineText}>{item.title}</Text>
                </View>

                <Text style={styles.timeText}>{item.time}</Text>

              </View>
            ))}
          </View>

          {/* 🔘 Buttons */}
          <View style={styles.buttonRow}>
            
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => navigation.navigate('Dashboard')}
            >
              <Text style={styles.secondaryText}>Return Home</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => console.log('Tracking...')}
            >
              <Text style={styles.primaryText}>Track Order</Text>
            </TouchableOpacity>

          </View>

        </ScrollView>

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
    padding: 16,
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
});