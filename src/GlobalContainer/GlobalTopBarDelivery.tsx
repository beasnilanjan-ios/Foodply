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

const { width, height } = Dimensions.get('window');
const isTablet = Math.min(width, height) >= 600;

export default function GlobalTopBarDelivery({ navigation, notificationClick, text, subtitleText, isBackVisible, isOnlineVisible }: any) {
  return (
    <View style={styles.topBar}>

       <View style={styles.headerContainer}>
          <Text style={[styles.subtitle, { marginLeft: isBackVisible ? 18 : 0 }]}>
            {subtitleText}
          </Text>
        <View style={styles.row}>
          {isBackVisible && (
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Image
                source={require('../assets/images/Back.png')}
                style={{
                  width: 20,
                  height: 20,
                  padding: 4,
                  marginRight: 2,
                  marginLeft: -2,
                }}
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
        </View>
      {/* RIGHT ICONS */}
      <View style={styles.rightIcons}>
        <TouchableOpacity style={styles.smallCircle} onPress={notificationClick}>
          <Image
            source={require('../assets/images/notification.png')}
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
  height: isTablet ? 100 : 80,
  flexDirection: 'row',
  alignItems: 'flex-end',
  justifyContent: 'space-between',
  paddingHorizontal: 15,
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

 rightIcons: {
  justifyContent: 'flex-start',
  alignItems: 'flex-end',
  marginTop: 10,
  marginLeft: 'auto',
  flexShrink: 0,
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

 headerContainer: {
  marginTop: Platform.OS === 'ios' ? 15 : 10,
  alignItems: 'flex-start',
},
  
    title: {
      fontSize: isTablet ? 34 : 28,
      fontFamily: 'LeagueSpartan-Bold',
      color: '#fff',
      textAlign: 'left',
      includeFontPadding: false, // 🔥 Android fix
      marginTop: 5,
    },
  
    subtitle: {
      fontSize: isTablet ? 18 : 16,
      fontFamily: 'LeagueSpartan-Regular',
      color: '#fff',
      marginTop: 5,
      textAlign: 'left',
      includeFontPadding: false, // 🔥 Android fix
    },

    row: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
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