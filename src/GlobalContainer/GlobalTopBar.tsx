import React, { useCallback, useEffect, useState } from 'react';
import {
  Dimensions,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import Colors from '../assets/Colors/Colors';
import GlobalStyles, { FontStyles } from '../assets/Styles/GlobalStyles';
import GlobalCart from './GlobalCart';

const { width, height } = Dimensions.get('window');
const isTablet = Math.min(width, height) >= 600;

type GlobalTopBarProps = {
  navigation?: {
    openDrawer?: () => void;
    navigate?: (screen: string, params?: Record<string, unknown>) => void;
  };
  showMenu?: boolean;
  showSearch?: boolean;
  searchPlaceholder?: string;
  onMenuPress?: () => void;
  onSearchPress?: () => void;
};

export default function GlobalTopBar({
  navigation,
  showMenu = true,
  showSearch = true,
  searchPlaceholder = 'Search',
  onMenuPress,
  onSearchPress,
}: GlobalTopBarProps) {
  const [cartCount, setCartCount] = useState(GlobalCart.itemCount);

  useEffect(() => {
    return GlobalCart.subscribe(setCartCount);
  }, []);

  useFocusEffect(
    useCallback(() => {
      GlobalCart.refreshCount();
    }, []),
  );

  const handleMenuPress = () => {
    if (onMenuPress) {
      onMenuPress();
    } else {
      navigation?.openDrawer?.();
    }
  };

  const handleSearchPress = () => {
    if (onSearchPress) {
      onSearchPress();
    }
  };

  const handleCartPress = () => {
    navigation?.navigate?.('Cart');
  };

  return (
    <View style={styles.topBar}>
      {showMenu && (
        <TouchableOpacity
          style={[styles.circleButton, GlobalStyles.iconButtonWhite]}
          onPress={handleMenuPress}
        >
          <Image
            source={require('../assets/images/menu.png')}
            style={styles.menuIcon}
          />
        </TouchableOpacity>
      )}

      {showSearch && (
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleSearchPress}
          style={[
            GlobalStyles.searchInput,
            styles.searchContainer,
            showMenu ? styles.searchWithMenu : styles.searchWithoutMenu,
          ]}
        >
          <Text style={GlobalStyles.searchTextMuted}>{searchPlaceholder}</Text>

          <TouchableOpacity
            style={GlobalStyles.filterButton}
            onPress={handleSearchPress}
          >
            <Image
              source={require('../assets/images/Filtericon.png')}
              style={styles.filterIconImage}
            />
          </TouchableOpacity>
        </TouchableOpacity>
      )}

      <View style={[styles.rightIcons, !showSearch && styles.rightIconsOnly]}>
        <TouchableOpacity
          style={[styles.smallCircle, GlobalStyles.iconButtonWhite]}
          onPress={handleCartPress}
        >
          <View style={styles.cartIconWrapper}>
            <Image
              source={require('../assets/images/Cart.png')}
              style={styles.menuIcon}
            />
            {cartCount > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>
                  {cartCount > 99 ? '99+' : cartCount}
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.smallCircle, GlobalStyles.iconButtonWhite]}>
          <Image
            source={require('../assets/images/notification.png')}
            style={styles.menuIcon}
          />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.smallCircle, GlobalStyles.iconButtonWhite]}>
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
  },

  menuIcon: {
    width: 22,
    height: 22,
    resizeMode: 'contain',
  },

  searchContainer: {
    flex: 1,
    marginRight: 10,
  },

  searchWithMenu: {
    marginLeft: 10,
  },

  searchWithoutMenu: {
    marginLeft: 0,
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

  cartIconWrapper: {
    width: 22,
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },

  cartBadge: {
    position: 'absolute',
    top: -6,
    right: -8,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },

  cartBadgeText: {
    color: Colors.primary,
    fontSize: 9,
    fontFamily: FontStyles.medium,
    lineHeight: 11,
    textAlign: 'center',
  },
});
