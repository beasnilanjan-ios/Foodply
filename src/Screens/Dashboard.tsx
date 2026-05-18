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


import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  Platform,
  Text,
  Dimensions,
  Image,
  ImageSourcePropType,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import Colors from '../assets/Colors/Colors';
import GlobalBottomBar from '../GlobalContainer/GlobalBottomBar';
import GlobalTopBar from '../GlobalContainer/GlobalTopBar';
import GlobalLocationPermission from '../GlobalContainer/GlobalLocationPermission';
import GlobalApi from '../GlobalContainer/GlobalApi';
import GlobalLoginAuth from '../GlobalContainer/GlobalLoginAuth';
import { NearbyRestaurantsResponseModel } from '../Models/NearbyRestaurantsModel';
import {
  RestaurantMenuItemModel,
  RestaurantMenuResponseModel,
} from '../Models/RestaurantMenuModel';

const { width, height } = Dimensions.get('window');
const isTablet = Math.min(width, height) >= 600;
const overlayHorizontalPadding = 20;
const categoryMaxWidth = isTablet ? 600 : width - overlayHorizontalPadding * 2;
const categoryGap = isTablet ? 18 : 8;

type CategoryItem = {
  name: string;
  icon: ImageSourcePropType;
};

const categoryIcons: Record<string, ImageSourcePropType> = {
  snacks: require('../assets/images/Snacks.png'),
  snack: require('../assets/images/Snacks.png'),
  meal: require('../assets/images/Meals.png'),
  meals: require('../assets/images/Meals.png'),
  vegan: require('../assets/images/Vegan.png'),
  dessert: require('../assets/images/Desserts.png'),
  desserts: require('../assets/images/Desserts.png'),
  drinks: require('../assets/images/Drinks.png'),
  drink: require('../assets/images/Drinks.png'),
  beverages: require('../assets/images/Drinks.png'),
};

const getCategoryIcon = (name: string) =>
  categoryIcons[name.trim().toLowerCase()] ?? require('../assets/images/Meals.png');

export default function Dashboard({ navigation, openDrawer }: any) {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [bestSellerItems, setBestSellerItems] = useState<RestaurantMenuItemModel[]>([]);
  const categoryCount = Math.max(categories.length, 1);
  const categoryColumns = isTablet ? Math.min(categoryCount, 6) : Math.min(categoryCount, 5);
  const categoryItemWidth =
    (categoryMaxWidth - categoryGap * (categoryColumns - 1)) / categoryColumns;
  const categoryIconSize = Math.min(isTablet ? 78 : 72, categoryItemWidth);
  const categoryIconRadius = categoryIconSize * 0.28;
  const categoryNeedsScroll = categories.length > categoryColumns;

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
         // const testLatitude = 22.5726;
         // const testLongitude = 88.3639;

          console.log('Latitude:', latitude);
          console.log('Longitude:', longitude);
          console.log('Testing API with latitude:', latitude);
          console.log('Testing API with longitude:', longitude);

          const nearbyRestaurantsUrl =
            `${GlobalApi.baseUrl}api/restaurants/nearby?` +
            `lat=${latitude}&` +
            `lng=${longitude}&` +
            `latitude=${latitude}&` +
            `longitude=${longitude}&` +
            'radiusKm=10&' +
            'page=1&' +
            'limit=20';

          console.log('Calling nearby restaurants API:', nearbyRestaurantsUrl);

          try {
            const headers: Record<string, string> = {
              Accept: 'application/json',
              'X-Client-Type': 'mobile',
            };

            console.log('GlobalLoginAuth access token:', GlobalLoginAuth.accessToken);

            if (GlobalLoginAuth.accessToken) {
              headers.Authorization = `Bearer ${GlobalLoginAuth.accessToken}`;
            }

            const response = await fetch(nearbyRestaurantsUrl, {
              method: 'GET',
              headers,
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

           // const restaurantId = nearbyRestaurants.data[0]?.id;
            const restaurantId = 1

            if (!restaurantId) {
              console.log('No nearby restaurant id found');
              return;
            }

            console.log('Selected restaurant id:', restaurantId);

            const restaurantMenuUrl =
              `${GlobalApi.baseUrl}api/menu/restaurant/${restaurantId}?` +
              `lat=${latitude}&` +
              `lng=${longitude}&` +
              `latitude=${latitude}&` +
              `longitude=${longitude}`;

            console.log('Calling restaurant menu API:', restaurantMenuUrl);

            const menuResponse = await fetch(restaurantMenuUrl, {
              method: 'GET',
              headers,
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
            setCategories(
              menuCategoryNames.map(name => ({
                name,
                icon: getCategoryIcon(name),
              })),
            );
            const bestSellers = restaurantMenu.data?.items.filter(
              item => item.isBestSelling,
            ) ?? [];
            setBestSellerItems(
              (bestSellers.length > 0
                ? bestSellers
                : restaurantMenu.data?.items ?? []
              ).slice(0, 6),
            );

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
        <ScrollView
          horizontal={categoryNeedsScroll}
          showsHorizontalScrollIndicator={false}
          scrollEnabled={categoryNeedsScroll}
          style={[
            styles.categoryScroll,
            { height: categoryIconSize + 34 },
          ]}
          contentContainerStyle={[
            styles.categoryContainer,
            !categoryNeedsScroll && styles.categoryContainerStatic,
          ]}>
          {categories.map((item, index) => (
            <View
              key={item.name}
              style={[
                styles.categoryItem,
                {
                  width: categoryItemWidth,
                  marginRight:
                    categoryNeedsScroll && index < categories.length - 1
                      ? categoryGap
                      : 0,
                },
              ]}>
              
              <View
                style={[
                  styles.iconCircle,
                  {
                    width: categoryIconSize,
                    height: categoryIconSize,
                    borderRadius: categoryIconRadius,
                  },
                ]}>
                <Image
                  source={item.icon}
                  style={{
                    width: categoryIconSize * 0.46,
                    height: categoryIconSize * 0.46,
                    resizeMode: 'contain',
                  }}
                />
              </View>

              <Text style={styles.categoryText}>{item.name}</Text>
            </View>
          ))}
        </ScrollView>

        {/* Divider */}
        <View style={styles.divider} />

        <View style={styles.bestSellerSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Best Seller</Text>

            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.viewAllButton}
              onPress={() => console.log('View All best sellers pressed')}>
              <Text style={styles.viewAllText}>View All</Text>
              <Text style={styles.viewAllArrow}>{'>'}</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.bestSellerList}>
            {bestSellerItems.map(item => (
              <View key={item.id} style={styles.bestSellerCard}>
                <Image
                  source={
                    item.imageUrl
                      ? { uri: item.imageUrl }
                      : getCategoryIcon(item.category?.name ?? item.name)
                  }
                  style={styles.bestSellerImage}
                />

                <View style={styles.priceBadge}>
                  <Text style={styles.priceText}>Rs{item.price.toFixed(2)}</Text>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>

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
  categoryScroll: {
    width: categoryMaxWidth,
    alignSelf: 'center',
    marginTop: 16,
    flexGrow: 0,
  },

  categoryContainer: {
    flexDirection: 'row',
  },

  categoryContainerStatic: {
    width: categoryMaxWidth,
    justifyContent: 'space-between',
  },

  categoryItem: {
    alignItems: 'center',
  },

  iconCircle: {
    backgroundColor: '#E8D9A8',
    justifyContent: 'center',
    alignItems: 'center',
  },

  categoryText: {
    marginTop: 8,
    fontSize: isTablet ? 15 : 13,
    fontFamily: 'LeagueSpartan-Regular',
    color: '#333',
    textAlign: 'center',
    includeFontPadding: false,
  },

  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginTop: 10,
  },

  bestSellerSection: {
    marginTop: 14,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  sectionTitle: {
    fontSize: isTablet ? 32 : 26,
    fontFamily: 'LeagueSpartan-medium',
    color: '#202A3A',
    includeFontPadding: false,
  },

  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 36,
    paddingLeft: 12,
  },

  viewAllText: {
    fontSize: isTablet ? 20 : 16,
    fontFamily: 'LeagueSpartan-Bold',
    color: Colors.primary,
    includeFontPadding: false,
  },

  viewAllArrow: {
    marginLeft: 10,
    fontSize: isTablet ? 28 : 24,
    fontFamily: 'LeagueSpartan-Bold',
    color: Colors.primary,
    includeFontPadding: false,
  },

  bestSellerList: {
    paddingTop: 18,
    paddingBottom: 4,
  },

  bestSellerCard: {
    width: isTablet ? 145 : 122,
    height: isTablet ? 190 : 150,
    marginRight: isTablet ? 22 : 16,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#F2F2F2',
  },

  bestSellerImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },

  priceBadge: {
    position: 'absolute',
    right: 0,
    bottom: 24,
    minWidth: 62,
    height: 32,
    paddingHorizontal: 8,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },

  priceText: {
    fontSize: isTablet ? 18 : 16,
    fontFamily: 'LeagueSpartan-Regular',
    color: '#fff',
    includeFontPadding: false,
  },

});
