import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import GlobalBackButton from '../GlobalContainer/GlobalBackButton';
import Colors from '../assets/Colors/Colors';

export default function DeliveryAddress({ navigation }: any) {
  return (
    <View style={styles.container}>
      <GlobalBackButton onPress={() => navigation.goBack()} />
      <Text style={styles.title}>Delivery Address</Text>

      <View style={styles.overlay}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* overlay content goes here */}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 100,
    backgroundColor: Colors.primary,
  },
  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '700',
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
  text: {
    fontSize: 22,
    fontWeight: '600',
  },
  
});
