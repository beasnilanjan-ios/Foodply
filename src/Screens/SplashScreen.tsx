// src/screens/SplashScreen.tsx

import React, { useEffect } from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

// 🔥 Define all routes here (you can move this later to a separate file)
type RootStackParamList = {
  Splash: undefined;
  Banner: undefined;
};

// 🔥 Navigation type for this screen
type SplashScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Splash'
>;

// 🔥 Props type
type Props = {
  navigation: SplashScreenNavigationProp;
};

export default function SplashScreen({ navigation }: Props) {

  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.replace('Banner');
    }, 2000);

    return () => clearTimeout(timer); // cleanup
  }, [navigation]);

  return (
    <View style={styles.container}>
      <Image
        source={require('../assets/images/Splash.png')}
        style={styles.image}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover', // full screen image
  },
});