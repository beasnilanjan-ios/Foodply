import React, { useEffect } from 'react';
import { View, StyleSheet, Text, Platform } from 'react-native';
import Colors from '../assets/Colors/Colors';
import GlobalBottomBar from '../GlobalContainer/GlobalBottomBar';
import GlobalTopBar from '../GlobalContainer/GlobalTopBar';
import GlobalLocationPermission from '../GlobalContainer/GlobalLocationPermission';


export default function Dashboard({ navigation, openDrawer }: any) {

  useEffect(() => {
    const getLocation = async () => {
      try {
        const status = await GlobalLocationPermission.request();

        if (status === 'granted') {
          const position = await GlobalLocationPermission.getCurrentLocation();

          console.log('Latitude:', position.coords.latitude);
          console.log('Longitude:', position.coords.longitude);
        } else {
          console.log('Permission denied');
        }

      } catch (error) {
        console.log('Location error:', error);
      }
    };

    getLocation();
  }, []);

  return (
    <View style={styles.container}>
      
      <GlobalTopBar openDrawer={openDrawer} />

      {/* 🔥 Header Text Section */}
      <View style={styles.headerTextContainer}>
        <Text style={styles.title}>Good Morning</Text>
        <Text style={styles.subtitle}>
          Rise And Shine! It's Breakfast Time
        </Text>
      </View>

      {/* 🔽 White Overlay Card */}
      <View style={styles.overlay}>
        <GlobalBottomBar navigation={navigation} activeTab="Home" />
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },

  headerTextContainer: {
    width: '100%',
    paddingHorizontal: 20,
    marginTop: 10,
  },

  title: {
    fontSize: 32,
    fontWeight: '800',
    fontFamily: 'LeagueSpartan-Bold',
    color: '#fff',
  },
  

  subtitle: {
    fontSize: 16,
    color: '#fff',
    fontFamily: 'LeagueSpartan-Regular',
    marginTop: 5,
  },

  overlay: {
    position: 'absolute',
    bottom: Platform.OS === 'android' ? 0 : 0, // 👈 move up only on Android
    width: '100%',
   height: Platform.OS === 'android' ? '78%' : '75%',
   
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