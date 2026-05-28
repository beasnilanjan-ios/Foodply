import React, {useEffect, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Easing,
} from 'react-native';
import GlobalBackButton from '../GlobalContainer/GlobalBackButton';
import Colors from '../assets/Colors/Colors';

export default function OrderConfirmed({ navigation }: any) {
  const scaleAnim = useRef(new Animated.Value(0.6)).current;
  const leftAnim = useRef(new Animated.Value(0.01)).current;
  const rightAnim = useRef(new Animated.Value(0.01)).current;

  useEffect(() => {
    const leftTiming = Animated.timing(leftAnim, {
      toValue: 1,
      duration: 240,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    });
    const rightTiming = Animated.timing(rightAnim, {
      toValue: 1,
      duration: 260,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    });

    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 450,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.stagger(80, [leftTiming, rightTiming]),
    ]).start();
  }, [scaleAnim, leftAnim, rightAnim]);

  return (
    <View style={styles.container}>
      <GlobalBackButton onPress={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.circleWrap}>
          <Animated.View style={[styles.circle, {transform: [{scale: scaleAnim}]}]}>
            <Animated.View
              style={[
                styles.checkArm,
                styles.checkArmLeft,
                {
                  transform: [
                    {translateX: -35},
                    {scaleX: leftAnim},
                    {rotate: '45deg'},
                    {translateX: 35},
                  ],
                },
              ]}
            />
            <Animated.View
              style={[
                styles.checkArm,
                styles.checkArmRight,
                {
                  transform: [
                    {translateX: -60},
                    {scaleX: rightAnim},
                    {rotate: '-45deg'},
                    {translateX: 60},
                  ],
                },
              ]}
            />
          </Animated.View>
        </View>

        <Text style={styles.heading}>¡Order Confirmed!</Text>
        <Text style={styles.sub}>Your order has been placed succesfully</Text>

        <Text style={styles.delivery}>Delivery by Thu, 29th, 4:00 PM</Text>

        <TouchableOpacity style={styles.trackButton} activeOpacity={0.8} onPress={() => {}}>
          <Text style={styles.trackText}>Track my order</Text>
        </TouchableOpacity>

        <View style={styles.bottomSpacer} />

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
    backgroundColor: '#f5c85a',
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
  circle: {
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 12,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkArm: {
    position: 'absolute',
    height: 10,
    backgroundColor: Colors.primary,
    borderRadius: 6,
    transform: [{scaleX: 0}],
  },
  checkArmLeft: {
    width: 70,
    left: '28%',
    top: '58%',
  },
  checkArmRight: {
    width: 120,
    left: '42%',
    top: '52%',
  },
  heading: {
    fontSize: 32,
    fontWeight: '800',
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
    fontWeight: '700',
    fontFamily: 'LeagueSpartan-Medium',
  },
  bottomSpacer: { height: 80 },
  help: {
    textAlign: 'center',
    color: '#1f2937',
    fontSize: 14,
    lineHeight: 22,
    fontFamily: 'LeagueSpartan-Regular',
    marginTop: 40,
  },
});