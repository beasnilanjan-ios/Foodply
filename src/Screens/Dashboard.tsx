import React, { useEffect } from 'react';
import { View, StyleSheet, Platform , Text} from 'react-native';
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

      <View style={styles.headerContainer}>
  <Text style={styles.title}>Good Morning</Text>
  <Text style={styles.subtitle}>
    Rise And Shine! It's Breakfast Time
  </Text>
</View>

      <View style={styles.overlay}>
        <GlobalBottomBar navigation={navigation} activeTab="Home" />
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
    height: Platform.OS === 'ios' ? '88%' : '90%',
    backgroundColor: '#fff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    alignItems: 'stretch',
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },

 headerContainer: {
  width: '100%',              // 🔥 ADD THIS (MOST IMPORTANT)
  paddingHorizontal: 20,
  marginTop: Platform.OS === 'ios' ? 15 : 10,
  alignItems: 'flex-start',
},

title: {
  fontSize: 34,
  fontFamily: 'LeagueSpartan-Bold',
  color: '#fff',
  textAlign: 'left', // ✅ this is correct
},

subtitle: {
  fontSize: 16,
  fontFamily: 'LeagueSpartan-Regular',
  color: '#fff',
  marginTop: 5,
  textAlign: 'left', // ✅ this is correct
},
});