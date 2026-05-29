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


import React, { useEffect, useRef, useState } from 'react';
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
const promoBannerWidth = isTablet ? categoryMaxWidth : 323;

type CategoryItem = {
  name: string;
  icon: ImageSourcePropType;
};

type PromoBannerItem = {
  id: number;
  image: ImageSourcePropType;
  title: string;
  subtitle: string;
  discountText: string;
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

const promoBanners: PromoBannerItem[] = [
  {
    id: 1,
    image: require('../assets/images/banner1.png'),
    title: 'Experience our',
    subtitle: 'delicious new dish',
    discountText: '30% OFF',
  },
  {
    id: 2,
    image: require('../assets/images/banner1.png'),
    title: 'Experience our',
    subtitle: 'delicious new dish',
    discountText: '30% OFF',
  },
  {
    id: 3,
    image: require('../assets/images/banner1.png'),
    title: 'Experience our',
    subtitle: 'delicious new dish',
    discountText: '30% OFF',
  },
];

export default function Dashboard({ navigation }: any) {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [bestSellerItems, setBestSellerItems] = useState<RestaurantMenuItemModel[]>([]);
  const [recommendedItems, setRecommendedItems] = useState<RestaurantMenuItemModel[]>([]);
  const [activeBannerIndex, setActiveBannerIndex] = useState(0);
  const bannerScrollRef = useRef<ScrollView>(null);
  const categoryCount = Math.max(categories.length, 1);
  const categoryColumns = isTablet ? Math.min(categoryCount, 6) : Math.min(categoryCount, 5);
  const categoryItemWidth =
    (categoryMaxWidth - categoryGap * (categoryColumns - 1)) / categoryColumns;
  const categoryIconSize = Math.min(isTablet ? 78 : 72, categoryItemWidth);
  const categoryIconRadius = categoryIconSize * 0.28;
  const categoryNeedsScroll = categories.length > categoryColumns;

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveBannerIndex((currentIndex) => {
        const nextIndex = (currentIndex + 1) % promoBanners.length;
        bannerScrollRef.current?.scrollTo({
          x: nextIndex * promoBannerWidth,
          animated: true,
        });
        return nextIndex;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const getLocation = async () => {
      try {
        console.log('Dashboard location flow started');
      
        const status = await GlobalLocationPermission.request();
        console.log('Location permission status:', status);

        if (status === 'granted') {
          console.log('Location permission granted, fetching current location');

          const position = await GlobalLocationPermission.getCurrentLocation();
          //const latitude = position.coords.latitude;
         // const longitude = position.coords.longitude;
          const latitude =  22.5726;
          const longitude = 88.3639;
         

          console.log('Latitude:', latitude);
          console.log('Longitude:', longitude);
          console.log('Testing API with latitude:', latitude);
          console.log('Testing API with longitude:', longitude);

          const nearbyRestaurantsUrl =
  `${GlobalApi.baseUrl}api/v1/restaurants/nearby?` +
  `lat=${latitude}&` +
  `lng=${longitude}&` +
  `latitude=${latitude}&` +
  `longitude=${longitude}&` +
  `radiusKm=10&` +
  `limit=20&` +
  `offset=0`;

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

            console.log('hwader:', headers);
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
  `${GlobalApi.baseUrl}api/v1/restaurants/${restaurantId}/menu?` +
  `lat=${latitude}&` +
  `lng=${longitude}&` +
  `latitude=${latitude}&` +
  `longitude=${longitude}&` +   // ✅ FIXED
  `limit=20&` +
  `offset=0`;

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
            setRecommendedItems((restaurantMenu.data?.items ?? []).slice(0, 4));

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
      <GlobalTopBar navigation={navigation} />

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

        <ScrollView
          showsVerticalScrollIndicator={false}
          style={styles.homeContentScroll}
          contentContainerStyle={styles.homeContentContainer}>
          <View style={styles.bestSellerSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Best Seller</Text>

              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.viewAllButton}
                onPress={() => navigation.navigate('ViewAll')}>
                <Text style={styles.viewAllText}>View All</Text>
                <Image
                  source={require('../assets/images/Next_icon _Arrow.png')}
                  style={styles.viewAllArrow}
                />
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

          <View style={styles.bannerSection}>
            <ScrollView
              ref={bannerScrollRef}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              style={styles.bannerScroll}
              onMomentumScrollEnd={(event) => {
                const nextIndex = Math.round(
                  event.nativeEvent.contentOffset.x / promoBannerWidth,
                );
                setActiveBannerIndex(nextIndex);
              }}>
              {promoBanners.map((banner) => (
                <View key={banner.id} style={styles.promoBanner}>
                  <View style={styles.bannerTextArea}>
                    <Text style={styles.bannerTitle}>{banner.title}</Text>
                    <Text style={styles.bannerSubtitle}>{banner.subtitle}</Text>
                    <Text style={styles.bannerDiscount}>{banner.discountText}</Text>
                  </View>

                  <Image source={banner.image} style={styles.bannerImage} />
                </View>
              ))}
            </ScrollView>

            <View style={styles.bannerDots}>
              {promoBanners.map((banner, index) => (
                <View
                  key={banner.id}
                  style={[
                    styles.bannerDot,
                    index === activeBannerIndex && styles.bannerDotActive,
                  ]}
                />
              ))}
            </View>
          </View>

          <View style={styles.recommendSection}>
            <Text style={styles.sectionTitle}>Recommend</Text>

            <ScrollView
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled
              style={styles.recommendScroll}
              contentContainerStyle={styles.recommendGrid}>
              {recommendedItems.map(item => (
                <View key={item.id} style={styles.recommendCard}>
                  <Image
                    source={
                      item.imageUrl
                        ? { uri: item.imageUrl }
                        : getCategoryIcon(item.category?.name ?? item.name)
                    }
                    style={styles.recommendImage}
                  />

                  <View style={styles.recommendRatingBadge}>
                    <Text style={styles.recommendRatingText}>
                      {(item.rating || 5).toFixed(1)}
                    </Text>
                    <Text style={styles.recommendStar}>★</Text>
                  </View>

                  <View style={styles.recommendHeartBadge}>
                    <Text style={styles.recommendHeart}>♥</Text>
                  </View>

                  <View style={styles.recommendPriceBadge}>
                    <Text style={styles.recommendPriceText}>
                      Rs{item.price.toFixed(1)}
                    </Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        </ScrollView>

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

  homeContentScroll: {
    flex: 1,
  },

  homeContentContainer: {
    paddingBottom: 110,
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
    fontSize: isTablet ? 23 : 19,
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
    fontSize: isTablet ? 20 : 14,
    fontFamily: 'LeagueSpartan-medium',
    color: Colors.primary,
    includeFontPadding: false,
  },

  viewAllArrow: {
    marginLeft: 3,
    marginTop: isTablet ? -2 : -2,
    width: isTablet ? 16 : 10,
    height: isTablet ? 24 : 15,
    resizeMode: 'contain',
  },

  bestSellerList: {
    paddingTop: 10,
    paddingBottom: 4,
  },

  bestSellerCard: {
    width: isTablet ? 145 : 71.68,
    height: isTablet ? 190 : 108,
    marginRight: isTablet ? 22 : 16,
    borderRadius: 16,
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
    bottom: 10,
    minWidth: 44,
    height: 22,
    paddingHorizontal: 5,
    borderTopLeftRadius: 11,
    borderBottomLeftRadius: 11,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },

  priceText: {
    fontSize: isTablet ? 16 : 12,
    fontFamily: 'LeagueSpartan-Regular',
    color: '#fff',
    includeFontPadding: false,
  },

  bannerSection: {
    marginTop: 18,
    alignItems: 'center',
  },

  bannerScroll: {
    width: promoBannerWidth,
    alignSelf: 'center',
  },

  promoBanner: {
    width: promoBannerWidth,
    height: isTablet ? 160 : 128,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    overflow: 'hidden',
    flexDirection: 'row',
  },

  bannerTextArea: {
    width: '48%',
    paddingLeft: isTablet ? 34 : 26,
    paddingTop: isTablet ? 34 : 25,
    zIndex: 2,
  },

  bannerTitle: {
    fontSize: isTablet ? 24 : 18,
    fontFamily: 'LeagueSpartan-Regular',
    color: '#fff',
    includeFontPadding: false,
  },

  bannerSubtitle: {
    marginTop: 2,
    fontSize: isTablet ? 24 : 18,
    fontFamily: 'LeagueSpartan-Regular',
    color: '#fff',
    includeFontPadding: false,
  },

  bannerDiscount: {
    marginTop: 18,
    fontSize: isTablet ? 48 : 38,
    fontFamily: 'LeagueSpartan-Bold',
    color: '#fff',
    includeFontPadding: false,
  },

  bannerImage: {
    position: 'absolute',
    right: 0,
    top: 0,
    width: '58%',
    height: '100%',
    resizeMode: 'cover',
  },

  bannerDots: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },

  bannerDot: {
    width: 34,
    height: 4,
    borderRadius: 12,
    backgroundColor: '#E8D9A8',
    marginHorizontal: 4,
  },

  bannerDotActive: {
    backgroundColor: Colors.primary,
  },

  recommendSection: {
    marginTop: 18,
  },

  recommendScroll: {
    maxHeight: isTablet ? 420 : 310,
  },

  recommendGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingTop: 16,
  },

  recommendCard: {
    width: isTablet ? (categoryMaxWidth - 20) / 2 : (categoryMaxWidth - 14) / 2,
    height: isTablet ? 190 : 140,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: '#F2F2F2',
    marginBottom: 16,
  },

  recommendImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },

  recommendRatingBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    height: 24,
    paddingHorizontal: 6,
    borderRadius: 12,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
  },

  recommendRatingText: {
    fontSize: isTablet ? 16 : 13,
    fontFamily: 'LeagueSpartan-Regular',
    color: '#202A3A',
    includeFontPadding: false,
  },

  recommendStar: {
    marginLeft: 3,
    fontSize: isTablet ? 15 : 12,
    color: '#F6B31A',
    includeFontPadding: false,
  },

  recommendHeartBadge: {
    position: 'absolute',
    top: 12,
    left: isTablet ? 72 : 58,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },

  recommendHeart: {
    fontSize: isTablet ? 15 : 12,
    color: Colors.primary,
    includeFontPadding: false,
  },

  recommendPriceBadge: {
    position: 'absolute',
    right: 0,
    bottom: 22,
    minWidth: 54,
    height: 28,
    paddingHorizontal: 8,
    borderTopLeftRadius: 14,
    borderBottomLeftRadius: 14,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },

  recommendPriceText: {
    fontSize: isTablet ? 17 : 14,
    fontFamily: 'LeagueSpartan-Regular',
    color: '#fff',
    includeFontPadding: false,
  },

});
