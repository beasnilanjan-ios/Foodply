// import React from 'react';
// import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions, Platform } from 'react-native';
// import Colors from '../assets/Colors/Colors';

// const { width, height } = Dimensions.get('window');
// const isTablet = Math.min(width, height) >= 600;

// export default function GlobalTopBar({ navigation }: any) {
//   return (
//     <View style={styles.topBar}>
    
//             {/* Left Menu */}
//             <TouchableOpacity style={styles.circleButton}>
//               <Image
//                     source={require('../assets/images/menu.png')}
//                     style={styles.menuIcon}
//                 />
//             </TouchableOpacity>
    
//             {/* Search Bar */}
//             <View style={styles.searchContainer}>
//               <Text style={styles.searchText}>Search</Text>
    
//               <TouchableOpacity style={styles.filterButton}>
//                <Image
//                     source={require('../assets/images/Filtericon.png')}
//                     style={styles.menuIcon}
//                 />
//               </TouchableOpacity>
//             </View>
    
//             {/* Right Icons */}
//             <View style={styles.rightIcons}>
//               <TouchableOpacity style={styles.smallCircle}>
//                <Image
//                     source={require('../assets/images/Cart.png')}
//                     style={styles.menuIcon}
//                 />
//               </TouchableOpacity>
    
//               <TouchableOpacity style={styles.smallCircle}>
//                 <Image
//                     source={require('../assets/images/notification.png')}
//                     style={styles.menuIcon}
//                 />
//               </TouchableOpacity>
    
//               <TouchableOpacity style={styles.smallCircle}>
//                 <Image
//                     source={require('../assets/images/Myprofile.png')}
//                     style={styles.menuIcon}
//                 />
//               </TouchableOpacity>
//             </View>
    
//           </View>
//   );
// }

// const styles = StyleSheet.create({
//   topBar: {
//   width: '100%',
//   flexDirection: 'row',
//   alignItems: 'center',
//   justifyContent: 'space-between',
//   paddingHorizontal: 15,
//   marginTop: Platform.OS === 'ios'
//     ? (isTablet ? 0 : -45)
//     : 25,
// },

// circleButton: {
//   width: 26,
//   height: 26,
//  // borderRadius: 40,
//   backgroundColor: '#fff',
//   justifyContent: 'center',
//   alignItems: 'center',
//   borderTopLeftRadius: 10,
//   borderTopRightRadius: 10,
//   borderBottomLeftRadius: 10,
//   borderBottomRightRadius: 10,
// },

// menuIcon: {
//   width: 22,
//   height: 22,
//   resizeMode: 'contain',
// },

// searchContainer: {
//   flex: 1,
//   height: 26,

//   backgroundColor: '#eee',
//   borderRadius: 25,
//   marginHorizontal: 10,
//   flexDirection: 'row',
//   alignItems: 'center',
//   justifyContent: 'space-between',
//   paddingHorizontal: 15,
// },

// searchText: {
//   color: '#777',
//   fontSize: 14,
//   fontFamily: 'LeagueSpartan-Regular',
// },

// filterButton: {
//   width: 20,
//   height: 20,
//   borderRadius: 15,
//   backgroundColor: Colors.primary,
//   justifyContent: 'center',
//   alignItems: 'center',
   
// },

// filterIcon: {
//   color: '#fff',
//   fontSize: 14,
  
// },

// rightIcons: {
//   flexDirection: 'row',
// },

// smallCircle: {
//   width: 26,
//   height: 26,
//   borderRadius: 20,
//   backgroundColor: '#fff',
//   justifyContent: 'center',
//   alignItems: 'center',
//   marginLeft: 8,
//   borderTopLeftRadius: 10,
//   borderTopRightRadius: 10,
//   borderBottomLeftRadius: 10,
//   borderBottomRightRadius: 10,
// },

//   });



// import React from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   TouchableOpacity,
//   Image,
//   Dimensions,
//   Platform,
// } from 'react-native';
// import Colors from '../assets/Colors/Colors';

// const { width, height } = Dimensions.get('window');
// const isTablet = Math.min(width, height) >= 600;

// export default function GlobalTopBar({ openDrawer }: any) {
//   return (
//     <View style={styles.topBar}>

//       {/* 🔥 MENU BUTTON (OPEN DRAWER) */}
//       <TouchableOpacity style={styles.circleButton} onPress={openDrawer}>
//         <Image
//           source={require('../assets/images/menu.png')}
//           style={styles.menuIcon}
//         />
//       </TouchableOpacity>

//       {/* 🔍 SEARCH BAR */}
//       <View style={styles.searchContainer}>
        
//         {/* LEFT TEXT */}
//         <Text style={styles.searchText}>Search</Text>

//         {/* RIGHT FILTER */}
//         <TouchableOpacity style={styles.filterButton}>
//           <Image
//             source={require('../assets/images/Filtericon.png')}
//             style={styles.filterIconImage}
//           />
//         </TouchableOpacity>

//       </View>

//       {/* RIGHT ICONS */}
//       <View style={styles.rightIcons}>
//         <TouchableOpacity style={styles.smallCircle}>
//           <Image
//             source={require('../assets/images/Cart.png')}
//             style={styles.menuIcon}
//           />
//         </TouchableOpacity>

//         <TouchableOpacity style={styles.smallCircle}>
//           <Image
//             source={require('../assets/images/notification.png')}
//             style={styles.menuIcon}
//           />
//         </TouchableOpacity>

//         <TouchableOpacity style={styles.smallCircle}>
//           <Image
//             source={require('../assets/images/Myprofile.png')}
//             style={styles.menuIcon}
//           />
//         </TouchableOpacity>
//       </View>

//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   topBar: {
//     width: '100%',
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     paddingHorizontal: 15,
//     // marginTop: Platform.OS === 'ios'
//     //   ? (isTablet ? 0 : 60)
//     //   : 30,
//        marginTop: Platform.OS === 'ios'
//     ? (isTablet ? -65 : -45)
//     : -70,
//   },

//   circleButton: {
//     width: 26,
//     height: 26,
//     backgroundColor: '#fff',
//     justifyContent: 'center',
//     alignItems: 'center',
//     borderRadius: 10,
//   },

//   menuIcon: {
//     width: 22,
//     height: 22,
//     resizeMode: 'contain',
//   },

//   searchContainer: {
//     flex: 1,
//     height: 40,
//     backgroundColor: '#eee',
//     borderRadius: 25,
//     marginHorizontal: 10,
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingHorizontal: 12,
//   },

//   searchText: {
//     color: '#777',
//     fontSize: 14,
//     fontFamily: 'LeagueSpartan-Regular',
//   },

//   filterButton: {
//     width: 30,
//     height: 30,
//     borderRadius: 15,
//     backgroundColor: Colors.primary,
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginLeft: 'auto', // 🔥 pushes to right
//   },

//   filterIconImage: {
//     width: 14,
//     height: 14,
//     resizeMode: 'contain',
//   },

//   rightIcons: {
//     flexDirection: 'row',
//   },

//   smallCircle: {
//     width: 26,
//     height: 26,
//     borderRadius: 10,
//     backgroundColor: '#fff',
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginLeft: 8,
//   },
// });

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

type GlobalTopBarProps = {
  navigation?: {
    openDrawer?: () => void;
  };
  showSearch?: boolean;
};

export default function GlobalTopBar({
  navigation,
  showSearch = true, // 👈 CONTROL SEARCH VISIBILITY
}: GlobalTopBarProps) {
  return (
    <View style={styles.topBar}>

      {/* 🔥 MENU BUTTON */}
      <TouchableOpacity
        style={styles.circleButton}
        onPress={() => navigation?.openDrawer?.()}
      >
        <Image
          source={require('../assets/images/menu.png')}
          style={styles.menuIcon}
        />
      </TouchableOpacity>

      {/* 🔍 SEARCH BAR (CONDITIONAL) */}
      {showSearch && (
        <View style={styles.searchContainer}>
          <Text style={styles.searchText}>Search</Text>

          <TouchableOpacity style={styles.filterButton}>
            <Image
              source={require('../assets/images/Filtericon.png')}
              style={styles.filterIconImage}
            />
          </TouchableOpacity>
        </View>
      )}

      {/* 🔥 RIGHT ICONS */}
      <View style={[styles.rightIcons, !showSearch && { marginLeft: 'auto' }]}>
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

  // 🔍 SEARCH
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
    marginLeft: 'auto',
  },

  filterIconImage: {
    width: 14,
    height: 14,
    resizeMode: 'contain',
  },

  // 🔥 RIGHT ICONS
  rightIcons: {
    flexDirection: 'row',
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
