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


import React, { useEffect, useMemo, useRef, useState } from 'react';
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
  Modal,
  FlatList,
} from 'react-native';
import Colors from '../assets/Colors/Colors';
import GlobalBottomBar from '../GlobalContainer/GlobalBottomBar';
import GlobalTopBar from '../GlobalContainer/GlobalTopBar';
import GlobalLocationPermission from '../GlobalContainer/GlobalLocationPermission';
import GlobalApi from '../GlobalContainer/GlobalApi';
import GlobalCart from '../GlobalContainer/GlobalCart';
import GlobalLoginAuth from '../GlobalContainer/GlobalLoginAuth';
import FavoriteButton from '../components/FavoriteButton';
import GlobalFavorites from '../GlobalContainer/GlobalFavorites';
import {
  NearbyRestaurantModel,
  NearbyRestaurantsResponseModel,
} from '../Models/NearbyRestaurantsModel';
import {
  RestaurantMenuItemModel,
  RestaurantMenuResponseModel,
} from '../Models/RestaurantMenuModel';
import { BestSellingResponseModel } from '../Models/BestSellingModel';

const { width, height } = Dimensions.get('window');
const isTablet = Math.min(width, height) >= 600;
const overlayHorizontalPadding = 20;
const categoryMaxWidth = isTablet ? 600 : width - overlayHorizontalPadding * 2;
const categoryGap = isTablet ? 18 : 8;
const promoBannerWidth = isTablet ? categoryMaxWidth : 323;

type CategoryItem = {
  id: number | string | 'all';
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

const getApiHeaders = (): Record<string, string> => {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'X-Client-Type': 'web',
  };

  const token = GlobalLoginAuth.accessToken || GlobalLoginAuth.token;
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
};

const getBestSellingHeaders = (): Record<string, string> => {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'X-Client-Type': 'mobile',
  };

  const token = GlobalLoginAuth.accessToken || GlobalLoginAuth.token;
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
};

const enrichMenuItemsWithMenuData = (
  items: RestaurantMenuItemModel[],
  menuItems: RestaurantMenuItemModel[],
): RestaurantMenuItemModel[] => {
  if (!items.length || !menuItems.length) {
    return items;
  }

  const menuById = new Map(menuItems.map(menuItem => [menuItem.id, menuItem]));

  return items.map(item => {
    const fullItem = menuById.get(item.id);
    if (!fullItem) {
      return item;
    }

    return RestaurantMenuItemModel.fromJson({
      ...item,
      description: fullItem.description ?? item.description,
      ingredients: fullItem.ingredients ?? item.ingredients,
      addonGroups: fullItem.addonGroups?.length
        ? fullItem.addonGroups
        : item.addonGroups,
      restaurantId: item.restaurantId || fullItem.restaurantId,
      category: item.category ?? fullItem.category,
      isFavorite: fullItem.isFavorite ?? item.isFavorite,
    });
  });
};

const formatPrice = (value: number | null | undefined, fallback = 0) =>
  Number(value ?? fallback).toFixed(2);

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

export default function Dashboard({ navigation, onMenuPress }: any) {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [allMenuItems, setAllMenuItems] = useState<RestaurantMenuItemModel[]>([]);
  const [bestSellerItems, setBestSellerItems] = useState<RestaurantMenuItemModel[]>([]);
  const allMenuItemsRef = useRef<RestaurantMenuItemModel[]>([]);
  const [recommendedItems, setRecommendedItems] = useState<RestaurantMenuItemModel[]>([]);
  const [nearbyRestaurants, setNearbyRestaurants] = useState<NearbyRestaurantModel[]>([]);
  const [selectedRestaurantIndex, setSelectedRestaurantIndex] = useState(0);
  const [selectedRestaurantName, setSelectedRestaurantName] = useState('');
  const [selectedRestaurantAddress, setSelectedRestaurantAddress] = useState('');
  const [restaurantId, setRestaurantId] = useState<number | null>(null);
  const [restaurantModalVisible, setRestaurantModalVisible] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | string | 'all'>('all');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [activeBannerIndex, setActiveBannerIndex] = useState(0);
  const bannerScrollRef = useRef<ScrollView>(null);
  const categoryCount = Math.max(categories.length, 1);
  const categoryColumns = isTablet ? Math.min(categoryCount, 6) : Math.min(categoryCount, 5);
  const categoryItemWidth =
    (categoryMaxWidth - categoryGap * (categoryColumns - 1)) / categoryColumns;
  const categoryIconSize = Math.min(isTablet ? 78 : 72, categoryItemWidth);
  const categoryIconRadius = categoryIconSize * 0.28;
  const categoryNeedsScroll = categories.length > categoryColumns;

  const filteredMenuItems = useMemo(() => {
    if (selectedCategoryId === 'all') {
      return allMenuItems;
    }
    if (typeof selectedCategoryId === 'number') {
      return allMenuItems.filter(item => item.categoryId === selectedCategoryId);
    }
    return allMenuItems.filter(
      item => item.category?.name?.trim() === selectedCategoryId,
    );
  }, [allMenuItems, selectedCategoryId]);

  const fetchBestSellingItems = async (
    selectedRestaurantId: number,
    lat: number,
    lng: number,
    categoryId?: number,
  ) => {
    try {
      let bestSellingUrl =
        `${GlobalApi.baseUrl}api/menu/best-selling?` +
        `lat=${lat}&` +
        `lng=${lng}&` +
        `limit=18&` +
        `restaurantId=${selectedRestaurantId}`;

      if (categoryId && categoryId > 0) {
        bestSellingUrl += `&categoryId=${categoryId}`;
      }

      console.log('Calling best selling API:', bestSellingUrl);

      const response = await fetch(bestSellingUrl, {
        method: 'GET',
        headers: getBestSellingHeaders(),
      });

      const result = await response.json();
      const bestSellingResponse = BestSellingResponseModel.fromJson(result);

      if (!response.ok) {
        console.log(
          'Best selling error:',
          JSON.stringify(bestSellingResponse, null, 2),
        );
        setBestSellerItems([]);
        return;
      }

      console.log(
        'Best selling items:',
        JSON.stringify(bestSellingResponse.data, null, 2),
      );
      const enrichedBestSellers = enrichMenuItemsWithMenuData(
          bestSellingResponse.data,
          allMenuItemsRef.current,
        );
      setBestSellerItems(enrichedBestSellers);
      GlobalFavorites.syncFromMenuItems(enrichedBestSellers);
    } catch (error) {
      console.log('fetchBestSellingItems failed:', error);
      setBestSellerItems([]);
    }
  };

  const fetchRestaurantMenu = async (
    selectedRestaurantId: number,
    lat: number,
    lng: number,
  ) => {
    try {
      const menuUrl =
        `${GlobalApi.baseUrl}api/v1/restaurants/${selectedRestaurantId}/menu?` +
        `lat=${lat}&` +
        `lng=${lng}&` +
        `latitude=${lat}&` +
        `longitude=${lng}&` +
        `limit=20&` +
        `offset=0`;

      const menuResponse = await fetch(menuUrl, {
        method: 'GET',
        headers: getApiHeaders(),
      });

      const menuResult = await menuResponse.json();
      const restaurantMenu = RestaurantMenuResponseModel.fromJson(menuResult);

      if (!menuResponse.ok) {
        console.log('Restaurant menu error:', JSON.stringify(restaurantMenu, null, 2));
        return;
      }

      const responseItems = restaurantMenu.data?.items ?? [];
      const categoryItems =
        restaurantMenu.data?.categories.flatMap(category => category.items) ??
        [];
      const itemsById = new Map<number, RestaurantMenuItemModel>();
      [...responseItems, ...categoryItems].forEach(item => {
        itemsById.set(item.id, item);
      });
      const items = Array.from(itemsById.values());
      console.log('Raw menuResult.data.items length:', menuResult?.data?.items?.length ?? 'undefined');
      console.log('Raw menuResult.data.categories length:', menuResult?.data?.categories?.length ?? 'undefined');
      console.log('Parsed restaurantMenu.data.items length:', responseItems.length);
      console.log('Parsed category item length:', categoryItems.length);
      console.log('Final items array length before setAllMenuItems:', items.length);
      setAllMenuItems(items);
      allMenuItemsRef.current = items;
      GlobalFavorites.syncFromMenuItems(items);
      setBestSellerItems(prev =>
        enrichMenuItemsWithMenuData(prev, items),
      );

      const categoryMap = new Map<number | string, CategoryItem>();
      const categoryNames = new Set<string>();
      const addCategory = (id: number | string, name: string) => {
        const categoryName = name.trim();
        const categoryKey = categoryName.toLowerCase();
        if (!categoryName || categoryMap.has(id) || categoryNames.has(categoryKey)) {
          return;
        }
        categoryNames.add(categoryKey);
        categoryMap.set(id, {
          id,
          name: categoryName,
          icon: getCategoryIcon(categoryName),
        });
      };

      if (Array.isArray(menuResult?.data?.categories)) {
        menuResult.data.categories.forEach((category: any) => {
          const categoryName =
            typeof category === 'string'
              ? category
              : String(category?.name ?? '').trim();
          const rawCategoryId =
            typeof category === 'string'
              ? undefined
              : category?.id ?? category?.categoryId;
          const numericCategoryId = Number(rawCategoryId);
          const matchedItem = items.find(
            item => item.category?.name?.trim() === categoryName,
          );
          const categoryId =
            Number.isFinite(numericCategoryId) && numericCategoryId > 0
              ? numericCategoryId
              : matchedItem?.categoryId || categoryName;

          addCategory(categoryId, categoryName);
        });
      }

      items.forEach(item => {
        const categoryId = item.categoryId;
        const categoryName = item.category?.name?.trim() || `Category ${categoryId}`;
        if (categoryId > 0) {
          addCategory(categoryId, categoryName);
        }
      });

      const finalCategories: CategoryItem[] = [
        { id: 'all', name: 'All Items', icon: getCategoryIcon('All Items') },
        ...Array.from(categoryMap.values()),
      ];

      setCategories(finalCategories);
      setSelectedCategoryId('all');
        console.log('Categories (with All Items) count:', finalCategories.length);
        console.log('Menu items count:', items.length);

      setRecommendedItems(items.slice(0, 4));
    } catch (error) {
      console.log('fetchRestaurantMenu failed:', error);
    }
  };

  const onSelectRestaurant = (index: number) => {
    const selected = nearbyRestaurants[index];
    if (!selected) {
      return;
    }

    setSelectedRestaurantIndex(index);
    setRestaurantId(selected.id);
    setSelectedRestaurantName(selected.name);
    setSelectedRestaurantAddress(selected.address);
    setRestaurantModalVisible(false);

    if (latitude !== null && longitude !== null) {
      fetchRestaurantMenu(selected.id, latitude, longitude);
    }
  };

  useEffect(() => {
    if (restaurantId && restaurantId > 0) {
      GlobalCart.setRestaurantId(restaurantId);
    }
  }, [restaurantId]);

  useEffect(() => {
    if (restaurantId === null || latitude === null || longitude === null) {
      return;
    }

    const categoryId =
      typeof selectedCategoryId === 'number' ? selectedCategoryId : undefined;

    fetchBestSellingItems(restaurantId, latitude, longitude, categoryId);
  }, [restaurantId, latitude, longitude, selectedCategoryId]);

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

        await GlobalLoginAuth.loadAuthData();
      
        const status = await GlobalLocationPermission.request();
        console.log('Location permission status:', status);

        if (status === 'granted') {
          console.log('Location permission granted, fetching current location');

          const position = await GlobalLocationPermission.getCurrentLocation();
          const latitude = position.coords.latitude;
          const longitude = position.coords.longitude;
         // const latitude =  22.57545;
         // const longitude = 88.43226;

          setLatitude(latitude);
          setLongitude(longitude);

          const nearbyRestaurantsUrl =
            `${GlobalApi.baseUrl}api/v1/restaurants/nearby?` +
            `lat=${latitude}&` +
            `lng=${longitude}&` +
            `latitude=${latitude}&` +
            `longitude=${longitude}&` +
            'radiusKm=10&' +
            'limit=20&' +
            'offset=0';

          console.log('Calling nearby restaurants API:', nearbyRestaurantsUrl);

          try {
            const headers = getApiHeaders();

            console.log('GlobalLoginAuth access token:', GlobalLoginAuth.accessToken);

            console.log('header:', headers);
            const response = await fetch(nearbyRestaurantsUrl, {
              method: 'GET',
              headers,
            });

            console.log('Nearby restaurants status:', response.status);

            const result = await response.json();
            console.log('Raw nearby restaurants response:', JSON.stringify(result, null, 2));
            try {
              console.log(
                'Nearby restaurants response headers:',
                Array.from((response.headers || new Headers()).entries()),
              );
            } catch (e) {
              console.log('Could not read response headers', e);
            }

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

            const restaurants = nearbyRestaurants.data;
            setNearbyRestaurants(restaurants);

            const initializeSelection = (items: NearbyRestaurantModel[], index = 0) => {
              const selected = items[index];
              if (!selected) {
                return;
              }
              setSelectedRestaurantIndex(index);
              setRestaurantId(selected.id);
              setSelectedRestaurantName(selected.name);
              setSelectedRestaurantAddress(selected.address);
            };

            if (restaurants.length === 0) {
              console.log('No nearby restaurants returned');
              return;
            }

            initializeSelection(restaurants, 0);
            const selectedRestaurantId = restaurants[0]?.id;

            if (!selectedRestaurantId) {
              console.log('No nearby restaurant id found');
              return;
            }

            console.log('Selected restaurant id:', selectedRestaurantId);
            await fetchRestaurantMenu(selectedRestaurantId, latitude, longitude);
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
      <GlobalTopBar
        navigation={navigation}
        onMenuPress={onMenuPress}
        searchPlaceholder="Search dishes..."
        onSearchPress={() =>
          navigation.navigate('Search', {
            scope: 'home',
            restaurantId,
            latitude,
            longitude,
            menuItems: allMenuItems,
          })
        }
      />

      {/* 🔥 Header Text */}
      <View style={styles.headerContainer}>
        <View style={styles.selectorRow}>
          <Text
            style={[styles.title, styles.selectorTitle]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.85}>
            {selectedRestaurantName || 'Select Restaurant'}
          </Text>
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.selectorIconButton}
            onPress={() => setRestaurantModalVisible(true)}>
            <Image
              source={require('../assets/images/Writeicon.png')}
              style={styles.selectorIcon}
            />
          </TouchableOpacity>
        </View>
        <Text
          style={styles.subtitle}
          numberOfLines={2}
          adjustsFontSizeToFit
          minimumFontScale={0.8}>
          {selectedRestaurantAddress || 'Choose from nearby restaurants'}
        </Text>
      </View>

      {/* 🔽 Overlay */}
      <View style={styles.overlay}>

        {/* 🔥 Category Section */}
        <ScrollView
          horizontal={true}
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
          {categories.map((item, index) => {
            const isSelected = item.id === selectedCategoryId;
            return (
              <TouchableOpacity
                key={`${item.name}-${item.id}`}
                activeOpacity={0.8}
                onPress={() => setSelectedCategoryId(item.id)}
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
                      backgroundColor: isSelected ? Colors.primary : '#E8D9A8',
                    },
                  ]}>
                  <Image
                    source={item.icon}
                    style={{
                      width: categoryIconSize * 0.46,
                      height: categoryIconSize * 0.46,
                      resizeMode: 'contain',
                      tintColor: isSelected ? '#fff' : Colors.primary,
                    }}
                  />
                </View>

                <Text
                  style={[
                    styles.categoryText,
                    { color: isSelected ? Colors.primary : '#333' },
                  ]}>
                  {item.name}
                </Text>
              </TouchableOpacity>
            );
          })}
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
                onPress={() =>
                  navigation.navigate('ViewAll', {
                    bestSellerItems,
                    restaurantId,
                    latitude,
                    longitude,
                  })
                }>
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

                  <View style={styles.bestSellerNameBadge}>
                    <Text style={styles.bestSellerNameText} numberOfLines={2}>
                      {item.name}
                    </Text>
                  </View>

                  <View style={styles.priceBadge}>
                    <Text style={styles.priceText}>
                      Rs{formatPrice(item.discountPrice, item.price)}
                    </Text>
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
              {filteredMenuItems.map(item => (
                <TouchableOpacity
                  key={item.id}
                  activeOpacity={0.8}
                  style={styles.recommendCard}
                  onPress={() =>
                    navigation.navigate('MenuDetails', {
                      item,
                      restaurantId: restaurantId ?? item.restaurantId,
                      latitude,
                      longitude,
                    })
                  }>
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

                  <FavoriteButton
                    itemId={item.id}
                    buttonStyle={styles.recommendHeartBadge}
                    iconStyle={styles.recommendHeart}
                    activeIconStyle={styles.recommendHeartActive}
                  />

                  <View style={styles.recommendNameBadge}>
                    <Text style={styles.recommendNameText} numberOfLines={2}>
                      {item.name}
                    </Text>
                  </View>

                  <View style={styles.recommendPriceBadge}>
                    <Text style={styles.recommendPriceText}>
                      Rs{formatPrice(item.discountPrice, item.price)}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </ScrollView>

        {/* Restaurant selector modal */}
        <Modal
          visible={restaurantModalVisible}
          animationType="slide"
          transparent>
          <View style={styles.modalBackdrop}>
            <TouchableOpacity
              style={styles.modalOverlay}
              activeOpacity={1}
              onPress={() => setRestaurantModalVisible(false)}
            />
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Choose Restaurant</Text>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setRestaurantModalVisible(false)}>
                  <Text style={styles.modalCloseText}>Close</Text>
                </TouchableOpacity>
              </View>

              <FlatList
                data={nearbyRestaurants}
                keyExtractor={(item) => String(item.id)}
                contentContainerStyle={styles.modalListContent}
                ItemSeparatorComponent={() => <View style={styles.itemSeparator} />}
                renderItem={({ item, index }) => {
                  const isSelected = index === selectedRestaurantIndex;
                  return (
                    <TouchableOpacity
                      activeOpacity={0.8}
                      style={[
                        styles.restaurantItem,
                        isSelected && styles.restaurantItemSelected,
                      ]}
                      onPress={() => {
                        onSelectRestaurant(index);
                      }}>
                      <View style={styles.restaurantItemText}>
                        <Text
                          style={[
                            styles.restaurantItemTitle,
                            isSelected && styles.restaurantItemTitleSelected,
                          ]}
                          numberOfLines={1}>
                          {item.name}
                        </Text>
                        <Text style={styles.restaurantItemAddress} numberOfLines={2}>
                          {item.address}
                        </Text>
                        <Text style={styles.restaurantItemDistance}>
                          {item.distanceKm?.toFixed(2)} km away
                        </Text>
                      </View>
                      {isSelected && (
                        <Text style={styles.restaurantItemSelectedLabel}>
                          Selected
                        </Text>
                      )}
                    </TouchableOpacity>
                  );
                }}
              />
            </View>
          </View>
        </Modal>

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

  bestSellerNameBadge: {
    position: 'absolute',
    left: 0,
    bottom: isTablet ? 48 : 34,
    maxWidth: isTablet ? 104 : 52,
    minHeight: isTablet ? 26 : 20,
    paddingHorizontal: isTablet ? 8 : 5,
    borderTopRightRadius: isTablet ? 13 : 10,
    borderBottomRightRadius: isTablet ? 13 : 10,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
  },

  bestSellerNameText: {
    fontSize: isTablet ? 15 : 10,
    lineHeight: isTablet ? 17 : 11,
    fontFamily: 'LeagueSpartan-SemiBold',
    color: Colors.white,
    includeFontPadding: false,
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

  restaurantCardWrapper: {
    paddingHorizontal: 0,
    marginTop: 10,
    marginBottom: 14,
  },

  restaurantCard: {
    backgroundColor: '#fff',
    borderRadius: 22,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },

  restaurantCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  restaurantIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#F5F7FB',
    justifyContent: 'center',
    alignItems: 'center',
  },

  restaurantIcon: {
    width: 18,
    height: 18,
    resizeMode: 'contain',
  },

  restaurantTextBlock: {
    flex: 1,
    marginLeft: 14,
    marginRight: 10,
  },

  restaurantTitle: {
    fontSize: isTablet ? 17 : 15,
    fontFamily: 'LeagueSpartan-Bold',
    color: '#202A3A',
    includeFontPadding: false,
  },

  restaurantSubtitle: {
    marginTop: 4,
    fontSize: isTablet ? 14 : 12,
    fontFamily: 'LeagueSpartan-Regular',
    color: '#6B7280',
    includeFontPadding: false,
  },

  selectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },

  selectorIconButton: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: '#F5F7FB',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },

  selectorIcon: {
    width: 16,
    height: 16,
    resizeMode: 'contain',
  },

  selectorTitle: {
    flex: 1,
    marginRight: 8,
    minWidth: 0,
  },

  changeIconButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: '#F5F7FB',
    justifyContent: 'center',
    alignItems: 'center',
  },

  changeIcon: {
    width: 18,
    height: 18,
    resizeMode: 'contain',
  },

  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },

  modalOverlay: {
    ...StyleSheet.absoluteFill,
  },

  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 32,
    maxHeight: '78%',
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },

  modalTitle: {
    fontSize: 20,
    fontFamily: 'LeagueSpartan-Bold',
    color: '#202A3A',
    includeFontPadding: false,
  },

  modalCloseText: {
    fontSize: 14,
    fontFamily: 'LeagueSpartan-Medium',
    color: Colors.primary,
    includeFontPadding: false,
  },

  modalListContent: {
    paddingBottom: 24,
  },

  restaurantItem: {
    backgroundColor: '#F7F9FC',
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  restaurantItemSelected: {
    borderWidth: 1,
    borderColor: Colors.primary,
    backgroundColor: '#EFF6FF',
  },

  restaurantItemText: {
    flex: 1,
    paddingRight: 10,
  },

  restaurantItemTitle: {
    fontSize: 15,
    fontFamily: 'LeagueSpartan-medium',
    color: '#202A3A',
    includeFontPadding: false,
  },

  restaurantItemTitleSelected: {
    color: Colors.primary,
    fontFamily: 'LeagueSpartan-Bold',
  },

  restaurantItemAddress: {
    marginTop: 6,
    fontSize: 13,
    fontFamily: 'LeagueSpartan-Regular',
    color: '#6B7280',
    includeFontPadding: false,
  },

  restaurantItemDistance: {
    marginTop: 6,
    fontSize: 12,
    fontFamily: 'LeagueSpartan-Regular',
    color: Colors.primary,
    includeFontPadding: false,
  },

  restaurantItemSelectedLabel: {
    color: Colors.primary,
    fontSize: 12,
    fontFamily: 'LeagueSpartan-Bold',
    includeFontPadding: false,
  },

  itemSeparator: {
    height: 10,
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
    right: 12,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },

  recommendHeart: {
    fontSize: isTablet ? 15 : 12,
    includeFontPadding: false,
  },

  recommendHeartActive: {},

  recommendNameBadge: {
    position: 'absolute',
    left: 0,
    right: 70,
    bottom: 22,
    minHeight: 28,
    paddingHorizontal: 8,
    borderTopRightRadius: 14,
    borderBottomRightRadius: 14,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
  },

  recommendNameText: {
    fontSize: isTablet ? 18 : 14,
    lineHeight: isTablet ? 20 : 15,
    fontFamily: 'LeagueSpartan-SemiBold',
    color: Colors.white,
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
