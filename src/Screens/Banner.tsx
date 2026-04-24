// // import React from 'react';
// // import { View, StyleSheet, StatusBar, Image, Platform } from 'react-native';
// // import Colors from '../assets/Colors/Colors';

// // export default function Banner() {
// //   return (
// //     <View style={styles.container}>
      
// //       <StatusBar
// //         barStyle="light-content"
// //         backgroundColor={Colors.primary}
// //       />

// //       {/* 🔥 Image Container */}
// //       <View style={styles.imageContainer}>
// //         <Image
// //           source={require('../assets/images/banner1.png')}
// //           style={styles.image}
// //         />

// //         {/* 🔥 Overlay View (starts from 50%) */}
// //         <View style={styles.overlay} />
// //       </View>

// //     </View>
// //   );
// // }

// // const styles = StyleSheet.create({
// //   container: {
// //     flex: 1,
// //     backgroundColor: Colors.primary,
// //   },

// //   imageContainer: {
// //     width: '100%',
// //     height: '100%',
// //   },

// //   image: {
// //     width: '100%',
// //     height: '100%',
// //     marginTop: Platform.OS === 'ios' ? 55 : 70,
// //    // resizeMode: 'cover',
// //      bottom: Platform.OS === 'ios' ? 70 : 45,
// //   },

// //   overlay: {
// //     position: 'absolute',
// //     top: '60%', // 👈 START FROM MIDDLE
// //     left: 0,
// //     right: 0,
// //     bottom: 0,
// //     backgroundColor: '#fff', // or any color
// //     borderTopLeftRadius: 20,
// //     borderTopRightRadius: 20,
// //   },
// // });


// import React from 'react';
// import {
//   View,
//   StyleSheet,
//   StatusBar,
//   Image,
//   Platform,
//   Text,
// } from 'react-native';
// import Colors from '../assets/Colors/Colors';

// export default function Banner() {
//   return (
//     <View style={styles.container}>
      
//       <StatusBar
//         barStyle="light-content"
//         backgroundColor={Colors.primary}
//       />

//       {/* 🔥 IMAGE */}
//       <Image
//         source={require('../assets/images/banner1.png')}
//         style={styles.image}
//       />

//       {/* 🔥 SKIP BUTTON */}
//       <Text style={styles.skip}>Skip {'>'}</Text>

//       {/* 🔥 BOTTOM OVERLAY */}
//       <View style={styles.overlay}>
//         {/* Put your content here */}
//       </View>

//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: Colors.primary,
//   },

//   image: {
//     width: '100%',
//     height: '75%',
//     marginTop: Platform.OS === 'ios' ? 55 : 25,
//     resizeMode: 'cover',
//   },

//   skip: {
//     position: 'absolute',
//     top: Platform.OS === 'ios' ? 60 : 30,
//     right: 20,
//     color: '#fff',
//     fontSize: 16,
//     fontWeight: '600',
//   },

//   overlay: {
//     position: 'absolute',
//     bottom: 0,
//     width: '100%',
//     height: '45%', // 👈 controls how much card comes up
//     backgroundColor: '#fff',
//     borderTopLeftRadius: 30,
//     borderTopRightRadius: 30,

//     // shadow (iOS)
//     shadowColor: '#000',
//     shadowOpacity: 0.1,
//     shadowRadius: 10,

//     // shadow (Android)
//     elevation: 5,
//   },
// });

import React from 'react';
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

export default function Banner() {
  return (
    <View style={styles.container}>
      
      <StatusBar
        barStyle="light-content"
        backgroundColor={Colors.primary}
      />

      {/* 🔥 IMAGE */}
      <Image
        source={require('../assets/images/banner1.png')}
        style={styles.image}
      />

      {/* 🔥 SKIP BUTTON */}
      <Text style={styles.skip}>Skip {'>'}</Text>

      {/* 🔥 BOTTOM OVERLAY */}
      <View style={styles.overlay}>

        {/* ICON */}
        <Image
          source={require('../assets/images/transfer_icon.png')} // 👈 add your icon here
          style={styles.icon}
        />

        {/* TITLE */}
        <Text style={styles.title}>Order For Food</Text>

        {/* DESCRIPTION */}
        <Text style={styles.desc}>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna.
        </Text>

        {/* DOTS */}
        <View style={styles.dotsContainer}>
          <View style={[styles.dot, styles.activeDot]} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>

        {/* BUTTON */}
        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>Next</Text>
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
    paddingHorizontal: 60,
    borderRadius: 25,
  },

  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'LeagueSpartan',
  },
});