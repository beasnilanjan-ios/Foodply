
import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ImageSourcePropType,
  Dimensions,
} from 'react-native';
import Colors from '../assets/Colors/Colors';
import GlobalBackButton from '../GlobalContainer/GlobalBackButton';
import FavoriteButton from '../components/FavoriteButton';
import GlobalFavorites from '../GlobalContainer/GlobalFavorites';
import { RestaurantMenuItemModel } from '../Models/RestaurantMenuModel';

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

export default function Dashboard({ navigation, route }: any) {
  const bestSellerItems: RestaurantMenuItemModel[] =
    route?.params?.bestSellerItems ?? [];
  const restaurantId: number | null = route?.params?.restaurantId ?? null;
  const latitude: number | null = route?.params?.latitude ?? null;
  const longitude: number | null = route?.params?.longitude ?? null;

  useEffect(() => {
    if (bestSellerItems.length > 0) {
      GlobalFavorites.syncFromMenuItems(bestSellerItems);
    }
  }, [route?.params?.bestSellerItems]);

  return (
    <View style={styles.container}>
      <GlobalBackButton onPress={() => navigation.goBack()} />
      <Text style={styles.title}>Menu Items</Text>

      <View style={styles.overlay}>
        <Text style={styles.overlayTitle}>
          Search your favorite dishes by name, category, or ingredients.
        </Text>

        <ScrollView contentContainerStyle={styles.cardsContainer}>
          {bestSellerItems.map((item) => (
            <View key={item.id} style={styles.card}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() =>
                  navigation.navigate('MenuDetails', {
                    item,
                    restaurantId: restaurantId ?? item.restaurantId,
                    latitude,
                    longitude,
                  })
                }
              >
              {/* IMAGE */}
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

                <FavoriteButton
                  itemId={item.id}
                  buttonStyle={styles.favoriteButton}
                  iconStyle={styles.favoriteIcon}
                />

                <View style={styles.ratingBadge}>
                  <Text style={styles.ratingText}>
                    {(item.rating || 4.0).toFixed(1)}
                  </Text>
                  <Text style={styles.ratingStar}>★</Text>
                </View>
              </View>

              {/* TEXT */}
              <Text style={styles.cardTitle} numberOfLines={2}>
                {item.name}
              </Text>

              <Text style={styles.cardDescription} numberOfLines={2}>
                {item.category?.name || 'Best selling item'}
              </Text>
              </TouchableOpacity>

              {/* FOOTER */}
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

                {/* {quantity and cart controls — kept for future use}
                <View style={styles.leftSection}>
                  <Text
                    style={styles.priceText}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.85}>
                    {formatPrice(item.discountPrice, item.price)}
                  </Text>

                  <View style={styles.quantityContainer}>
                    <TouchableOpacity style={styles.counterButton}>
                      <Text style={styles.counterButtonText}>-</Text>
                    </TouchableOpacity>

                    <Text style={styles.quantityText}>1</Text>

                    <TouchableOpacity style={styles.counterButton}>
                      <Text style={styles.counterButtonText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity style={styles.cartButton}>
                  <Image
                    source={{ uri: 'https://cdn-icons-png.flaticon.com/512/263/263142.png' }}
                    style={styles.cartIcon}
                  />
                </TouchableOpacity>
                */}
              </View>

            </View>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 100,
    backgroundColor: Colors.primary,
  },

  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '700',
    fontFamily: 'LeagueSpartan-Medium',
  },

  overlay: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: '90%',
    backgroundColor: '#fff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
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

  borderBottomLeftRadius: 12,   // 👈 ADD THIS (soft match)
  borderBottomRightRadius: 12,  // 👈 ADD THIS

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
    fontSize: 12,
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

  leftSection: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
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

  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
  },

  counterButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#eee',
    justifyContent: 'center',
    alignItems: 'center',
  },

  counterButtonText: {
    color: Colors.primary,
  },

  quantityText: {
    marginHorizontal: 4,
  },

  cartButton: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },

  cartIcon: {
    width: 16,
    height: 16,
    tintColor: '#fff',
  },
});
