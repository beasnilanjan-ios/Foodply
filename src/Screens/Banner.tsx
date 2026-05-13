
import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  StatusBar,
  Image,
  Platform,
  Text,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import Colors from '../assets/Colors/Colors';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';

export default function Banner() {
  const [counter, setCounter] = useState(0);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <View style={styles.container}>
      
      <StatusBar
        barStyle="light-content"
        backgroundColor={Colors.primary}
      />

      {/* 🔥 IMAGE */}
      <Image
        source={counter >= 2 ? require('../assets/images/banner3.png') : (counter >= 1 ? require('../assets/images/banner2.png') : require('../assets/images/banner1.png'))}
        style={styles.image}
      />

      {/* 🔥 SKIP BUTTON */}
      <Text style={styles.skip}>Skip {'>'}</Text>

      {/* 🔥 BOTTOM OVERLAY */}
      <View style={styles.overlay}>

        {/* ICON */}
        <Image
          source={counter >= 1 ? require('../assets/images/Deliver_Boy_Icon.png') : require('../assets/images/transfer_icon.png')}
          style={styles.icon}
        />

  {/* TITLE */}
  <Text style={styles.title}>{counter >= 1 ? 'Fast Delivery' : 'Order For Food'}</Text>

        {/* DESCRIPTION */}
        <Text style={styles.desc}>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna.
        </Text>

        {/* DOTS */}
        <View style={styles.dotsContainer}>
          {(() => {
            const activeIndex = Math.min(Math.max(counter, 0), 2); // 0 -> first, 1 -> middle, 2 -> last
            return [0, 1, 2].map(i => (
              <View key={i} style={[styles.dot, i === activeIndex && styles.activeDot]} />
            ));
          })()}
        </View>

        {/* BUTTON */}
        <TouchableOpacity
          style={styles.button}
          onPress={() => {
            if (counter > 1) {
              navigation.navigate('Login');
            } else {
              setCounter(prev => (prev < 2 ? prev + 1 : prev));
            }
          }}
        >
          <Text style={styles.buttonText}>{counter > 1 ? 'Getting Started' : 'Next'}</Text>
        </TouchableOpacity>

      </View>

    </View>
  );
}

  // detect tablet (simple heuristic: smallest dimension >= 600 dp)
  const { width, height } = Dimensions.get('window');
  const isTablet = Math.min(width, height) >= 600;

  const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },

  image: {
    width: '100%',
    height: '75%',
    // For iOS use a larger margin on tablets; Android keeps original 25
    marginTop: Platform.OS === 'ios' ? (isTablet ? 25 : 55) : 25,
    resizeMode: 'cover',
  },

  skip: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 30,
    right: 20,
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  overlay: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: '45%',
    backgroundColor: '#fff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    alignItems: 'center',
    padding: 20,

    // shadow (iOS)
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,

    // shadow (Android)
    elevation: 5,
  },

  icon: {
    width: 31,
    height: 36,
    marginBottom: 15,
    resizeMode: 'contain',
    marginTop: Platform.OS === 'ios' ? (isTablet ? 75 : 10) : 10,
  },

  title: {
    fontSize: 22,
    fontWeight: '700',
    marginTop: 10,
    color: Colors.primary,
    // use League Spartan if available
    fontFamily: 'LeagueSpartan',
    marginBottom: 10,
  },

  desc: {
    textAlign: 'center',
    color: '#444',
    marginTop: 10,
    fontSize: 14,
    marginHorizontal: 10,
    marginBottom: 20,
  },

  dotsContainer: {
    flexDirection: 'row',
    marginTop: 10,
    marginBottom: 20,
  },

  dot: {
    width: 20,
    height: 5,
    borderRadius: 5,
    backgroundColor: '#ddd',
    marginHorizontal: 4,
  },

  activeDot: {
    backgroundColor: Colors.primary,
    width: 25,
  },

  button: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    marginTop: 10,
    // Fixed width to match the "Getting Started" label so the button doesn't resize
    width: 220,
    paddingHorizontal: 0,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },

  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'LeagueSpartan',
  },
});