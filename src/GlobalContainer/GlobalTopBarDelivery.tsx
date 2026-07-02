import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  Platform,
} from 'react-native';
import Colors from '../assets/Colors/Colors';
import GlobalStyles from '../assets/Styles/GlobalStyles';

const { width, height } = Dimensions.get('window');
const isTablet = Math.min(width, height) >= 600;

//Final changes
export default function GlobalTopBarDelivery({ navigation, notificationClick, text, subtitleText, isBackVisible, isOnlineVisible }: any) {
  return (
    <View style={styles.topBar}>
      <View style={styles.headerContainer}>
        {!!subtitleText && (
          <Text
            style={[
              styles.subtitle,
              isBackVisible ? styles.subtitleIndented : null,
            ]}>
            {subtitleText}
          </Text>
        )}

        <View style={styles.titleRow}>
          <View style={styles.row}>
            {isBackVisible && (
              <TouchableOpacity
                style={styles.backButton}
                activeOpacity={0.7}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                onPress={() => navigation?.goBack?.()}
              >
                <Image
                  source={require('../assets/images/Back.png')}
                  style={styles.backIcon}
                />
              </TouchableOpacity>
            )}
            <Text style={styles.title}>{text}</Text>
            {isOnlineVisible && (
              <View style={styles.curveBackground}>
                <View style={[styles.circle, { backgroundColor: 'green' }]} />
                <Text style={[styles.subtitle, { color: Colors.black }, { marginTop: 2 }]}>
                  Online
                </Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={styles.smallCircle}
            activeOpacity={0.8}
            onPress={notificationClick}>
            <Image
              source={require('../assets/images/notification.png')}
              style={styles.menuIcon}
            />
          </TouchableOpacity>
        </View>

        
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    width: '100%',
  
    marginTop:
      Platform.OS === 'ios'
        ? isTablet
          ? -65
          : -45
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
    marginHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
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
    marginLeft: 'auto', // 🔥 pushes to right
  },

  filterIconImage: {
    width: 14,
    height: 14,
    resizeMode: 'contain',
  },

  smallCircle: {
    width: 26,
    height: 26,
    borderRadius: 10,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },

 headerContainer: {
  marginTop: Platform.OS === 'ios' ? 8 : 6,
  width: '100%',
},

  titleRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  
    title: {
      flexShrink: 1,
      fontSize: isTablet ? 34 : 28,
      fontFamily: 'LeagueSpartan-Bold',
      color: '#fff',
      textAlign: 'left',
      includeFontPadding: false,
      marginTop: 0,
    },
  
    subtitle: {
      fontSize: isTablet ? 18 : 16,
      fontFamily: 'LeagueSpartan-Regular',
      color: '#fff',
      marginTop: 4,
      textAlign: 'left',
      includeFontPadding: false,
    },

    subtitleIndented: {
      marginLeft: 26,
    },

    row: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      marginRight: 8,
      justifyContent: 'flex-start',
    },

    backButton: {
      width: 40,
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 10,
      marginTop: -4,
      marginLeft: -15,
    },

    backIcon: {
      ...GlobalStyles.backIcon,
    },

    curveBackground: {
      borderRadius: 20,
      backgroundColor: Colors.lightGray,
      marginLeft: 10,
      paddingHorizontal: 12,
      maxHeight: 30,
      height: 24,
      justifyContent: 'center',
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 5,
    },

    circle:{
      width:10,
      height:10,
      borderRadius:5,
      marginRight:5,
    }
});