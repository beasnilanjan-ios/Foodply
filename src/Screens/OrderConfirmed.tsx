import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';

import GlobalBackButton from '../GlobalContainer/GlobalBackButton';
import Colors from '../assets/Colors/Colors';

export default function OrderConfirmed({ navigation, route }: any) {
  const orderId = route?.params?.orderId;

  return (
    <View style={styles.container}>
      
      {/* 🔙 Back Button */}
      <GlobalBackButton onPress={() => navigation.goBack()} />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        
        {/* ✅ GIF CHECKMARK */}
        <View style={styles.circleWrap}>
          <Image
            source={require('../assets/images/orangecheckmark.gif')}
            style={styles.checkGif}
          />
        </View>

        {/* 🔥 TEXT */}
        <Text style={styles.heading}>¡Order Confirmed!</Text>

        <Text style={styles.sub}>
          Your order has been placed successfully
        </Text>

        <Text style={styles.delivery}>
          Delivery by Thu, 29th, 4:00 PM
        </Text>

        {/* 🔘 TRACK BUTTON */}
        <TouchableOpacity
          style={styles.trackButton}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('Trackorder', { orderId })}
        >
          <Text style={styles.trackText}>Track my order</Text>
        </TouchableOpacity>

        <View style={styles.bottomSpacer} />

        {/* 🧾 HELP TEXT */}
        <Text style={styles.help}>
          If you have any questions, please reach out directly to our customer support
        </Text>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },

  content: {
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 24,
    paddingBottom: 60,
  },

  circleWrap: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 24,
  },

  /* ✅ GIF */
  checkGif: {
    width: 180,
    height: 180,
    resizeMode: 'contain',
  },

  heading: {
    fontSize: 32,
    fontFamily: 'LeagueSpartan-Bold',
    color: '#1f2937',
    marginTop: 8,
    marginBottom: 8,
    textAlign: 'center',
  },

  sub: {
    fontSize: 16,
    color: '#1f2937',
    fontFamily: 'LeagueSpartan-Regular',
    textAlign: 'center',
    marginBottom: 18,
  },

  delivery: {
    fontSize: 16,
    color: '#1f2937',
    fontFamily: 'LeagueSpartan-Regular',
    marginTop: 12,
    marginBottom: 18,
  },

  trackButton: {
    paddingVertical: 10,
    paddingHorizontal: 8,
  },

  trackText: {
    color: Colors.primary,
    fontSize: 20,
    fontFamily: 'LeagueSpartan-Medium',
  },

  bottomSpacer: {
    height: 80,
  },

  help: {
    textAlign: 'center',
    color: '#1f2937',
    fontSize: 14,
    lineHeight: 22,
    fontFamily: 'LeagueSpartan-Regular',
    marginTop: 40,
  },
});