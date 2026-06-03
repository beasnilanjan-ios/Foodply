import React from 'react';
import {
  Dimensions,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import Colors from '../assets/Colors/Colors';

const { width, height } = Dimensions.get('window');
const isTablet = Math.min(width, height) >= 600;

type GlobalTopBarProps = {
  navigation?: {
    openDrawer?: () => void;
  };
  showMenu?: boolean;
  showSearch?: boolean;
  onMenuPress?: () => void;
};

export default function GlobalTopBar({
  navigation,
  showMenu = true,
  showSearch = true,
  onMenuPress,
}: GlobalTopBarProps) {
  const handleMenuPress = () => {
    if (onMenuPress) {
      onMenuPress();
    } else {
      navigation?.openDrawer?.();
    }
  };

  return (
    <View style={styles.topBar}>
      {showMenu && (
        <TouchableOpacity
          style={styles.circleButton}
          onPress={handleMenuPress}
        >
          <Image
            source={require('../assets/images/menu.png')}
            style={styles.menuIcon}
          />
        </TouchableOpacity>
      )}

      {showSearch && (
        <View
          style={[
            styles.searchContainer,
            showMenu ? styles.searchWithMenu : styles.searchWithoutMenu,
          ]}
        >
          <Text style={styles.searchText}>Search</Text>

          <TouchableOpacity style={styles.filterButton}>
            <Image
              source={require('../assets/images/Filtericon.png')}
              style={styles.filterIconImage}
            />
          </TouchableOpacity>
        </View>
      )}

      <View style={[styles.rightIcons, !showSearch && styles.rightIconsOnly]}>
        <TouchableOpacity style={styles.smallCircle}>
          <Image
            source={require('../assets/images/Cart.png')}
            style={styles.menuIcon}
          />
        </TouchableOpacity>

        <TouchableOpacity style={styles.smallCircle}>
          <Image
            source={require('../assets/images/notification.png')}
            style={styles.menuIcon}
          />
        </TouchableOpacity>

        <TouchableOpacity style={styles.smallCircle}>
          <Image
            source={require('../assets/images/Myprofile.png')}
            style={styles.menuIcon}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    marginTop: Platform.OS === 'ios'
      ? (isTablet ? -65 : -45)
      : -70,
  },

  circleButton: {
    width: 26,
    height: 26,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
  },

  menuIcon: {
    width: 22,
    height: 22,
    resizeMode: 'contain',
  },

  searchContainer: {
    flex: 1,
    height: 40,
    backgroundColor: '#eee',
    borderRadius: 25,
    marginRight: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },

  searchWithMenu: {
    marginLeft: 10,
  },

  searchWithoutMenu: {
    marginLeft: 0,
  },

  searchText: {
    color: '#777',
    fontSize: 14,
    fontFamily: 'LeagueSpartan-Regular',
  },

  filterButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 'auto',
  },

  filterIconImage: {
    width: 14,
    height: 14,
    resizeMode: 'contain',
  },

  rightIcons: {
    flexDirection: 'row',
  },

  rightIconsOnly: {
    marginLeft: 'auto',
  },

  smallCircle: {
    width: 26,
    height: 26,
    borderRadius: 10,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
});
