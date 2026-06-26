import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  Dimensions,
  ScrollView,
  Image,
  TouchableOpacity,
  ImageSourcePropType,
} from 'react-native';

import Colors from '../assets/Colors/Colors';
import GlobalStyles from '../assets/Styles/GlobalStyles';
import GlobalBottomBar from '../GlobalContainer/GlobalBottomBar';
import GlobalTopBar from '../GlobalContainer/GlobalTopBar';
import {
  MenuItemCategoryModel,
  RestaurantMenuItemModel,
} from '../Models/RestaurantMenuModel';

const { width, height } = Dimensions.get('window');
const isTablet = Math.min(width, height) >= 600;

const SCREEN_WIDTH = Dimensions.get('window').width;
const OVERLAY_HORIZONTAL_PADDING = 40;
const CARD_GAP = 10;
const CARD_WIDTH = (SCREEN_WIDTH - OVERLAY_HORIZONTAL_PADDING - CARD_GAP) / 2;

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

const formatPrice = (value: number | null | undefined, fallback = 0) =>
  `Rs${Number(value ?? fallback).toFixed(2)}`;

const hasDiscount = (item: RestaurantMenuItemModel) =>
  item.discountPrice != null && item.discountPrice < item.price;

const favoriteItems: RestaurantMenuItemModel[] = [
  new RestaurantMenuItemModel({
    id: 1,
    name: 'Chicken Biryani',
    price: 249,
    discountPrice: 199,
    rating: 4.5,
    restaurantId: 1,
    category: new MenuItemCategoryModel({ id: 1, name: 'Meals' }),
    imageUrl: null,
  }),
  new RestaurantMenuItemModel({
    id: 2,
    name: 'Paneer Butter Masala',
    price: 179,
    discountPrice: null,
    rating: 4.2,
    restaurantId: 1,
    category: new MenuItemCategoryModel({ id: 2, name: 'Meals' }),
    imageUrl: null,
  }),
  new RestaurantMenuItemModel({
    id: 3,
    name: 'Veg Hakka Noodles',
    price: 149,
    discountPrice: 129,
    rating: 4.0,
    restaurantId: 1,
    category: new MenuItemCategoryModel({ id: 3, name: 'Snacks' }),
    imageUrl: null,
  }),
  new RestaurantMenuItemModel({
    id: 4,
    name: 'Chocolate Brownie',
    price: 99,
    discountPrice: null,
    rating: 4.8,
    restaurantId: 1,
    category: new MenuItemCategoryModel({ id: 4, name: 'Desserts' }),
    imageUrl: null,
  }),
];

const STATIC_RESTAURANT_ID = 1;
const STATIC_LATITUDE = 22.5726;
const STATIC_LONGITUDE = 88.3639;

export default function Favorites({ navigation }: any) {
  return (
    <View style={[GlobalStyles.screenBackgroundPrimary, styles.container]}>
      <GlobalTopBar navigation={navigation} />

      <View style={styles.headerContainer}>
        <Text style={styles.title}>Favorites</Text>
      </View>

      <View style={[GlobalStyles.overlayCard, styles.overlay]}>
        <Text style={styles.overlayTitle}>
          Search your favorite dishes by name, category, or ingredients.
        </Text>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.cardsContainer}>
          {favoriteItems.map(item => (
            <View key={item.id} style={styles.card}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() =>
                  navigation.navigate('MenuDetails', {
                    item,
                    restaurantId: item.restaurantId ?? STATIC_RESTAURANT_ID,
                    latitude: STATIC_LATITUDE,
                    longitude: STATIC_LONGITUDE,
                  })
                }>
                <View style={styles.cardImageContainer}>
                  <Image
                    source={
                      item.imageUrl
                        ? { uri: item.imageUrl }
                        : require('../assets/images/banner1.png')
                    }
                    style={styles.cardImage}
                  />

                  <View style={styles.categoryBadge}>
                    <Image
                      source={getCategoryIcon(item.category?.name ?? item.name)}
                      style={styles.categoryIcon}
                    />
                  </View>

                  <TouchableOpacity style={styles.favoriteButton}>
                    <Text style={styles.favoriteIcon}>♥</Text>
                  </TouchableOpacity>

                  <View style={styles.ratingBadge}>
                    <Text style={styles.ratingText}>
                      {(item.rating || 4.0).toFixed(1)}
                    </Text>
                    <Text style={styles.ratingStar}>★</Text>
                  </View>
                </View>

                <Text style={styles.cardTitle} numberOfLines={2}>
                  {item.name}
                </Text>

                <Text style={styles.cardDescription} numberOfLines={2}>
                  {item.category?.name || 'Favorite item'}
                </Text>
              </TouchableOpacity>

              <View style={styles.cardFooter}>
                {hasDiscount(item) ? (
                  <>
                    <Text
                      style={styles.originalPriceText}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.85}>
                      {formatPrice(item.price)}
                    </Text>
                    <Text
                      style={styles.priceText}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.85}>
                      {formatPrice(item.discountPrice)}
                    </Text>
                  </>
                ) : (
                  <Text
                    style={styles.priceText}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.85}>
                    {formatPrice(item.price)}
                  </Text>
                )}
              </View>
            </View>
          ))}
        </ScrollView>

        <GlobalBottomBar navigation={navigation} activeTab="Favorites" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 100,
  },

  headerContainer: {
    width: '100%',
    paddingHorizontal: 20,
    marginTop: Platform.OS === 'ios' ? 15 : 10,
  },

  title: {
    fontSize: isTablet ? 40 : 34,
    fontFamily: 'LeagueSpartan-Bold',
    color: '#fff',
  },

  overlay: {
    height:
      Platform.OS === 'ios'
        ? isTablet
          ? '93%'
          : '88%'
        : isTablet
        ? '78%'
        : '92%',
    padding: 20,
  },

  overlayTitle: {
    color: Colors.primary,
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 18,
  },

  cardsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingBottom: 140,
  },

  card: {
    width: CARD_WIDTH,
    marginBottom: 18,
    borderRadius: 20,
    backgroundColor: '#fff',
  },

  cardImageContainer: {
    height: 120,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    overflow: 'hidden',
  },

  cardImage: {
    width: '100%',
    height: '100%',
  },

  categoryBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },

  categoryIcon: {
    width: 16,
    height: 16,
  },

  favoriteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },

  favoriteIcon: {
    color: Colors.primary,
  },

  ratingBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingHorizontal: 6,
    flexDirection: 'row',
  },

  ratingText: {
    color: '#fff',
    fontSize: 12,
  },

  ratingStar: {
    color: '#F4D235',
    marginLeft: 4,
  },

  cardTitle: {
    marginHorizontal: 10,
    marginTop: 6,
    marginBottom: 0,
    fontWeight: '700',
  },

  cardDescription: {
    marginHorizontal: 10,
    marginTop: 2,
    fontSize: 12,
    color: '#6D5D54',
    marginBottom: 4,
  },

  cardFooter: {
    paddingHorizontal: 8,
    marginTop: 4,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  originalPriceText: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '600',
    textDecorationLine: 'line-through',
    flexShrink: 1,
    marginRight: 4,
  },

  priceText: {
    color: Colors.primary,
    fontWeight: '700',
    marginRight: 4,
    flexShrink: 1,
    fontSize: 12,
    maxWidth: '42%',
  },
});
