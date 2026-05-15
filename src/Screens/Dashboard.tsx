// import React, { useEffect } from 'react';
// import { View, StyleSheet, Platform , Text, Dimensions, Image} from 'react-native';
// import Colors from '../assets/Colors/Colors';
// import GlobalBottomBar from '../GlobalContainer/GlobalBottomBar';
// import GlobalTopBar from '../GlobalContainer/GlobalTopBar';
// import GlobalLocationPermission from '../GlobalContainer/GlobalLocationPermission';
// const { width, height } = Dimensions.get('window');
// const isTablet = Math.min(width, height) >= 600;
// const categories = [
//   { name: 'Snacks', icon: require('../assets/images/Snacks.png') },
//   { name: 'Meal', icon: require('../assets/images/Meal.png') },
//   { name: 'Vegan', icon: require('../assets/images/Vegan.png') },
//   { name: 'Dessert', icon: require('../assets/images/Dessert.png') },
//   { name: 'Drinks', icon: require('../assets/images/Drinks.png') },
// ];
// export default function Dashboard({ navigation, openDrawer }: any) {

//   useEffect(() => {
//     const getLocation = async () => {
//       try {
//         const status = await GlobalLocationPermission.request();

//         if (status === 'granted') {
//           const position = await GlobalLocationPermission.getCurrentLocation();

//           console.log('Latitude:', position.coords.latitude);
//           console.log('Longitude:', position.coords.longitude);
//         } else {
//           console.log('Permission denied');
//         }

//       } catch (error) {
//         console.log('Location error:', error);
//       }
//     };

//     getLocation();
//   }, []);

//   return (
//     <View style={styles.container}>
//       <GlobalTopBar openDrawer={openDrawer} />

//       <View style={styles.headerContainer}>
//   <Text style={styles.title}>Good Morning</Text>
//   <Text style={styles.subtitle}>
//     Rise And Shine! It's Breakfast Time
//   </Text>
// </View>

//       <View style={styles.overlay}>

// <View style={styles.categoryContainer}>
//   {categories.map((item, index) => (
//     <View key={index} style={styles.categoryItem}>
      
//       <View style={styles.iconCircle}>
//         <Image source={item.icon} style={styles.icon} />
//       </View>

//       <Text style={styles.categoryText}>{item.name}</Text>

//     </View>
//   ))}
// </View>

// <View style={styles.divider} />

//         <GlobalBottomBar navigation={navigation} activeTab="Home" />
//       </View>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     justifyContent: 'flex-start',
//     alignItems: 'center',
//     paddingTop: 100,
//     backgroundColor: Colors.primary,
//   },

//   overlay: {
//     position: 'absolute',
//     bottom: 0,
//     width: '100%',
//     height:
//     Platform.OS === 'ios'
//       ? isTablet
//         ? '93%'   // 👈 iPad (shorter looks better)
//         : '88%'   // 👈 iPhone
//       : isTablet
//       ? '78%'     // 👈 Android Tablet
//       : '92%',    // 👈 Android Phone
//     backgroundColor: '#fff',
//     borderTopLeftRadius: 30,
//     borderTopRightRadius: 30,
//     alignItems: 'stretch',
//     padding: 20,
//     shadowColor: '#000',
//     shadowOpacity: 0.1,
//     shadowRadius: 10,
//     elevation: 5,
//   },

//  headerContainer: {
//   width: '100%',              // 🔥 ADD THIS (MOST IMPORTANT)
//   paddingHorizontal: 20,
//   marginTop: Platform.OS === 'ios' ? 15 : 10,
//   alignItems: 'flex-start',
// },

// title: {
//   fontSize: 34,
//   fontFamily: 'LeagueSpartan-Bold',
//   color: '#fff',
//   textAlign: 'left',
//   includeFontPadding: false, // 🔥 fix Android spacing
// },

// subtitle: {
//   fontSize: 16,
//   fontFamily: 'LeagueSpartan-Regular',
//   color: '#fff',
//   marginTop: 5,
//   textAlign: 'left',
//   includeFontPadding: false, // 🔥 fix Android spacing
// },

// categoryContainer: {
//   flexDirection: 'row',
//   justifyContent: 'space-between',
//   marginTop: 10,
// },

// categoryItem: {
//   alignItems: 'center',
// },

// iconCircle: {
//   width: 70,
//   height: 70,
//   borderRadius: 35,
//   backgroundColor: '#E8D9A8', // 👈 light yellow
//   justifyContent: 'center',
//   alignItems: 'center',
// },

// icon: {
//   width: 35,
//   height: 35,
//   resizeMode: 'contain',
// },

// categoryText: {
//   marginTop: 8,
//   fontSize: 14,
//   fontFamily: 'LeagueSpartan-Regular',
//   color: '#333',
// },

// divider: {
//   height: 1,
//   backgroundColor: '#E0E0E0',
//   marginTop: 15,
// },


// });


import React, { useEffect } from 'react';
import {
  View,
  StyleSheet,
  Platform,
  Text,
  Dimensions,
  Image,
} from 'react-native';
import Colors from '../assets/Colors/Colors';
import GlobalBottomBar from '../GlobalContainer/GlobalBottomBar';
import GlobalTopBar from '../GlobalContainer/GlobalTopBar';
import GlobalLocationPermission from '../GlobalContainer/GlobalLocationPermission';
import GlobalApi from '../GlobalContainer/GlobalApi';
import { NearbyRestaurantsResponseModel } from '../Models/NearbyRestaurantsModel';
import { RestaurantMenuResponseModel } from '../Models/RestaurantMenuModel';

const { width, height } = Dimensions.get('window');
const isTablet = Math.min(width, height) >= 600;

// 🔥 Category Data
const categories = [
  { name: 'Snacks', icon: require('../assets/images/Snacks.png') },
  { name: 'Meal', icon: require('../assets/images/Meals.png') },
  { name: 'Vegan', icon: require('../assets/images/Vegan.png') },
  { name: 'Dessert', icon: require('../assets/images/Desserts.png') },
  { name: 'Drinks', icon: require('../assets/images/Drinks.png') },
];

export default function Dashboard({ navigation, openDrawer }: any) {

  useEffect(() => {
    const getLocation = async () => {
      try {
        console.log('Dashboard location flow started');
      
        const status = await GlobalLocationPermission.request();
        console.log('Location permission status:', status);

        if (status === 'granted') {
          console.log('Location permission granted, fetching current location');

          const position = await GlobalLocationPermission.getCurrentLocation();
          const latitude = position.coords.latitude;
          const longitude = position.coords.longitude;
          const testLatitude = 22.5726;
          const testLongitude = 88.3639;

          console.log('Latitude:', latitude);
          console.log('Longitude:', longitude);
          console.log('Testing API with latitude:', testLatitude);
          console.log('Testing API with longitude:', testLongitude);

          const nearbyRestaurantsUrl =
            `${GlobalApi.baseUrl}api/v1/restaurants/nearby?` +
            `lat=${testLatitude}&` +
            `lng=${testLongitude}&` +
            `latitude=${testLatitude}&` +
            `longitude=${testLongitude}&` +
            'radiusKm=10&' +
            'page=1&' +
            'limit=20';

          console.log('Calling nearby restaurants API:', nearbyRestaurantsUrl);

          try {
            const response = await fetch(nearbyRestaurantsUrl, {
              method: 'GET',
              headers: {
                Accept: 'application/json',
              },
            });

            console.log('Nearby restaurants status:', response.status);

            const result = await response.json();
            const nearbyRestaurants =
              NearbyRestaurantsResponseModel.fromJson(result);

            if (!response.ok) {
              console.log(
                'Nearby restaurants error:',
                JSON.stringify(nearbyRestaurants, null, 2),
              );
              return;
            }

            console.log(
              'Nearby restaurants:',
              JSON.stringify(nearbyRestaurants, null, 2),
            );

            //const restaurantId = nearbyRestaurants.data[0]?.id;
            const restaurantId = 1

            if (!restaurantId) {
              console.log('No nearby restaurant id found');
              return;
            }

            console.log('Selected restaurant id:', restaurantId);

            const restaurantMenuUrl =
              `${GlobalApi.baseUrl}api/menu/restaurant/${restaurantId}`;

            console.log('Calling restaurant menu API:', restaurantMenuUrl);

            const menuResponse = await fetch(restaurantMenuUrl, {
              method: 'GET',
              headers: {
                Accept: 'application/json',
              },
            });

            console.log('Restaurant menu status:', menuResponse.status);

            const menuResult = await menuResponse.json();
            const restaurantMenu =
              RestaurantMenuResponseModel.fromJson(menuResult);

            if (!menuResponse.ok) {
              console.log(
                'Restaurant menu error:',
                JSON.stringify(restaurantMenu, null, 2),
              );
              return;
            }

            const menuCategoryNames = Array.from(
              new Set(
                restaurantMenu.data?.items
                  .map(item => item.category?.name)
                  .filter((name): name is string => Boolean(name)) ?? [],
              ),
            );

            console.log('Menu category names:', menuCategoryNames);
            console.log('Menu category names count:', menuCategoryNames.length);

            console.log(
              'Restaurant menu:',
              JSON.stringify(restaurantMenu, null, 2),
            );
          } catch (apiError) {
            console.log('Nearby restaurants request failed:', {
              url: nearbyRestaurantsUrl,
              error: apiError,
            });
          }
        } else {
          console.log('Permission denied');
        }

      } catch (error) {
        console.log('Location error:', error);
      }
    };

    getLocation();
  }, []);

  return (
    <View style={styles.container}>
      
      {/* 🔝 Top Bar */}
      <GlobalTopBar openDrawer={openDrawer} />

      {/* 🔥 Header Text */}
      <View style={styles.headerContainer}>
        <Text style={styles.title}>Good Morning</Text>
        <Text style={styles.subtitle}>
          Rise And Shine! It's Breakfast Time
        </Text>
      </View>

      {/* 🔽 Overlay */}
      <View style={styles.overlay}>

        {/* 🔥 Category Section */}
        <View style={styles.categoryContainer}>
          {categories.map((item) => (
            <View key={item.name} style={styles.categoryItem}>
              
              <View style={styles.iconCircle}>
                <Image source={item.icon} style={styles.icon} />
              </View>

              <Text style={styles.categoryText}>{item.name}</Text>
            </View>
          ))}
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Bottom Bar */}
        <GlobalBottomBar navigation={navigation} activeTab="Home" />

      </View>
    </View>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    justifyContent: 'flex-start',
    // ❌ removed alignItems center (important)
    paddingTop: 100,
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
    includeFontPadding: false, // 🔥 Android fix
  },

  subtitle: {
    fontSize: isTablet ? 18 : 16,
    fontFamily: 'LeagueSpartan-Regular',
    color: '#fff',
    marginTop: 5,
    textAlign: 'left',
    includeFontPadding: false, // 🔥 Android fix
  },

  overlay: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height:
      Platform.OS === 'ios'
        ? isTablet
          ? '93%'   // iPad
          : '88%'   // iPhone
        : isTablet
        ? '78%'     // Android Tablet
        : '92%',    // Android Phone
    backgroundColor: '#fff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 20,

    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },

  // 🔥 Category UI
  categoryContainer: {
  flexDirection: 'row',
  justifyContent: 'space-between',

  width: isTablet ? 600 : '100%',   // 👈 LIMIT WIDTH ON iPad
  alignSelf: 'center',              // 👈 CENTER IT

  marginTop: 10,
},

 categoryItem: {
  alignItems: 'center',
  marginHorizontal: isTablet ? 10 : 5, // 👈 balanced spacing
},

  iconCircle: {
    width: isTablet ? 70 : 65,
    height: isTablet ? 70 : 65,
    borderRadius: 25,
    backgroundColor: '#E8D9A8',
    justifyContent: 'center',
    alignItems: 'center',
  },

  icon: {
    width: isTablet ? 40 : 30,
    height: isTablet ? 40 : 30,
    resizeMode: 'contain',
  },

  categoryText: {
    marginTop: 8,
    fontSize: 14,
    fontFamily: 'LeagueSpartan-Regular',
    color: '#333',
  },

  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginTop: 15,
  },

});
