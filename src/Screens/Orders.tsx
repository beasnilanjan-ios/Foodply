// import React from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   Platform,
//   Dimensions,
// } from 'react-native';
// import Colors from '../assets/Colors/Colors';
// import GlobalBottomBar from '../GlobalContainer/GlobalBottomBar';
// import GlobalTopBar from '../GlobalContainer/GlobalTopBar';
// import GlobalBackButton from '../GlobalContainer/GlobalBackButton';

// const { width, height } = Dimensions.get('window');
// const isTablet = Math.min(width, height) >= 600;

// export default function Orders({ navigation }: any) {
//   return (
//     <View style={styles.container}>

//       {/* 🔝 TOP BAR */}
//       <GlobalTopBar navigation={navigation} showSearch={false} />

//       {/* 🎯 CENTERED BACK + TITLE */}
//       <View style={styles.headerCenter}>
//         <GlobalBackButton onPress={() => navigation.goBack()} />
//         <Text style={styles.title}>Cart</Text>
//       </View>

//       {/* 🔽 OVERLAY */}
//       <View style={styles.overlay}>
//         <GlobalBottomBar navigation={navigation} activeTab="Orders" />
//       </View>

//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     paddingTop: 100,
//     backgroundColor: Colors.primary,
//   },

//   // 🎯 CENTER GROUP
//   headerCenter: {
//     position: 'absolute',
//     top: Platform.OS === 'ios' ? 120 : 100,
//     width: '100%',
//     flexDirection: 'row',
//     justifyContent: 'center', // 👈 center whole group
//     alignItems: 'center',
//   },

//   title: {
//     color: '#fff',
//     fontSize: 32,
//     fontWeight: '700',
//     marginLeft: 10, // 👈 spacing from back button
//   },

//   overlay: {
//     position: 'absolute',
//     bottom: 0,
//     width: '100%',
//     height:
//       Platform.OS === 'ios'
//         ? isTablet
//           ? '93%'
//           : '88%'
//         : isTablet
//         ? '78%'
//         : '92%',
//     backgroundColor: '#fff',
//     borderTopLeftRadius: 30,
//     borderTopRightRadius: 30,
//     padding: 20,

//     shadowColor: '#000',
//     shadowOpacity: 0.1,
//     shadowRadius: 10,
//     elevation: 5,
//   },
// });


import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  Dimensions,
} from 'react-native';
import Colors from '../assets/Colors/Colors';
import GlobalBottomBar from '../GlobalContainer/GlobalBottomBar';
import GlobalTopBar from '../GlobalContainer/GlobalTopBar';

const { width, height } = Dimensions.get('window');
const isTablet = Math.min(width, height) >= 600;

export default function Orders({ navigation }: any) {
  return (
    <View style={styles.container}>

      {/* 🔝 TOP BAR */}
      
      <GlobalTopBar navigation={navigation} />

      {/* 🔥 Header Text */}
      <View style={styles.headerContainer}>
        <Text style={styles.title}>My Order</Text>
        <Text style={styles.subtitle}>
        </Text>
      </View>

      {/* 🔽 OVERLAY */}
      <View style={styles.overlay}>
        <GlobalBottomBar navigation={navigation} activeTab="Orders" />
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 100, // 👈 already spacing top
    backgroundColor: Colors.primary,
  },

  headerContainer: {
    width: '100%',
    paddingHorizontal: 20,
    marginTop: Platform.OS === 'ios' ? 15 : 10,
    alignItems: 'flex-start',
  },

  title: {
    fontSize: isTablet ? 40 : 34,
    fontFamily: 'LeagueSpartan-Bold',
    color: '#fff',
    textAlign: 'left',
    includeFontPadding: false,
  },

  subtitle: {
    fontSize: isTablet ? 18 : 16,
    fontFamily: 'LeagueSpartan-Regular',
    color: '#fff',
    marginTop: 5,
    textAlign: 'left',
    includeFontPadding: false,
  },

  overlay: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height:
      Platform.OS === 'ios'
        ? isTablet
          ? '93%'
          : '88%'
        : isTablet
        ? '78%'
        : '92%',
    backgroundColor: '#fff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 20,

    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
});
