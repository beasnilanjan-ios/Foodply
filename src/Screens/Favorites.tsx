import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  Dimensions,
} from 'react-native';

import GlobalStyles from '../assets/Styles/GlobalStyles';
import GlobalBottomBar from '../GlobalContainer/GlobalBottomBar';
import GlobalTopBar from '../GlobalContainer/GlobalTopBar';

const { width, height } = Dimensions.get('window');
const isTablet = Math.min(width, height) >= 600;

export default function Favorites({ navigation }: any) {
  return (
    <View style={[GlobalStyles.screenBackgroundPrimary, styles.container]}>
      <GlobalTopBar navigation={navigation} />

      <View style={styles.headerContainer}>
        <Text style={styles.title}>Favorites</Text>
      </View>

      <View style={[GlobalStyles.overlayCard, styles.overlay]}>
        <GlobalBottomBar navigation={navigation} activeTab="Favorites" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 100,
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
    height:
      Platform.OS === 'ios'
        ? isTablet
          ? '93%'
          : '88%'
        : isTablet
        ? '78%'
        : '92%',
    padding: 20,
  },
});
