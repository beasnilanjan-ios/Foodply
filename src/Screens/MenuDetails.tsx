import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Colors from '../assets/Colors/Colors';
import GlobalBackButton from '../GlobalContainer/GlobalBackButton';
import GlobalApi from '../GlobalContainer/GlobalApi';
import GlobalLoginAuth from '../GlobalContainer/GlobalLoginAuth';
import GlobalCart from '../GlobalContainer/GlobalCart';
import {
  RestaurantMenuItemModel,
  RestaurantMenuResponseModel,
  MenuItemAddonGroupModel,
} from '../Models/RestaurantMenuModel';
import {
  AddToCartRequestModel,
  CartAddOnRequestModel,
  CartResponseModel,
} from '../Models/CartModel';

const formatPrice = (value: number | null | undefined, fallback = 0) =>
  `Rs${Number(value ?? fallback).toFixed(2)}`;

const hasDiscount = (menuItem: RestaurantMenuItemModel) =>
  menuItem.discountPrice != null && menuItem.discountPrice < menuItem.price;

const getApiHeaders = (): Record<string, string> => {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'X-Client-Type': 'mobile',
  };

  const token = GlobalLoginAuth.accessToken || GlobalLoginAuth.token;
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
};

const findMenuItemById = (
  menuData: RestaurantMenuResponseModel['data'],
  itemId: number,
): RestaurantMenuItemModel | null => {
  const directItem = menuData?.items?.find(menuItem => menuItem.id === itemId);
  if (directItem) {
    return directItem;
  }

  for (const category of menuData?.categories ?? []) {
    const categoryItem = category.items?.find(menuItem => menuItem.id === itemId);
    if (categoryItem) {
      return categoryItem;
    }
  }

  return null;
};

export default function MenuDetails({ navigation, route }: any) {
  const [selectedAddons, setSelectedAddons] = useState<Record<number, number>>({});
  const [quantity, setQuantity] = useState(1);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [hasAddedToCart, setHasAddedToCart] = useState(false);
  const [item, setItem] = useState<RestaurantMenuItemModel | null>(
    route?.params?.item
      ? RestaurantMenuItemModel.fromJson(route.params.item)
      : null,
  );

  useEffect(() => {
    const loadFullMenuItem = async () => {
      const routeItem = route?.params?.item;
      if (!routeItem?.id) {
        return;
      }

      const currentItem = RestaurantMenuItemModel.fromJson(routeItem);
      if (currentItem.addonGroups?.length) {
        setItem(currentItem);
        return;
      }

      const restaurantId =
        route?.params?.restaurantId ?? currentItem.restaurantId;
      const latitude = route?.params?.latitude;
      const longitude = route?.params?.longitude;

      if (!restaurantId || latitude == null || longitude == null) {
        setItem(currentItem);
        return;
      }

      try {
        await GlobalLoginAuth.loadAuthData();

        const menuUrl =
          `${GlobalApi.baseUrl}api/v1/restaurants/${restaurantId}/menu?` +
          `lat=${latitude}&` +
          `lng=${longitude}&` +
          `latitude=${latitude}&` +
          `longitude=${longitude}&` +
          `limit=50&` +
          `offset=0`;

        const response = await fetch(menuUrl, {
          method: 'GET',
          headers: getApiHeaders(),
        });
        const result = await response.json();
        const restaurantMenu = RestaurantMenuResponseModel.fromJson(result);

        if (!response.ok) {
          setItem(currentItem);
          return;
        }

        const fullItem = findMenuItemById(restaurantMenu.data, currentItem.id);
        if (!fullItem) {
          setItem(currentItem);
          return;
        }

        setItem(
          RestaurantMenuItemModel.fromJson({
            ...currentItem,
            description: fullItem.description ?? currentItem.description,
            ingredients: fullItem.ingredients ?? currentItem.ingredients,
            addonGroups: fullItem.addonGroups,
            restaurantId: currentItem.restaurantId || fullItem.restaurantId,
            category: currentItem.category ?? fullItem.category,
          }),
        );
      } catch {
        setItem(currentItem);
      }
    };

    loadFullMenuItem();
  }, [route?.params]);

  useEffect(() => {
    setHasAddedToCart(false);
  }, [item?.id, selectedAddons]);

  const baseItemPrice = item
    ? Number(item.discountPrice ?? item.price ?? 0)
    : 0;

  const selectedAddonPrice =
    item?.addonGroups?.reduce((total, group) => {
      const selectedOptionId = selectedAddons[group.id];
      if (!selectedOptionId) {
        return total;
      }

      const selectedOption = group.options.find(
        option => option.id === selectedOptionId,
      );

      return total + Number(selectedOption?.price ?? 0);
    }, 0) ?? 0;

  const unitPrice = baseItemPrice + selectedAddonPrice;
  const originalUnitPrice = item
    ? Number(item.price ?? 0) + selectedAddonPrice
    : 0;
  const totalPrice = unitPrice * quantity;
  const originalTotalPrice = originalUnitPrice * quantity;
  const displayPrice = item
    ? formatPrice(totalPrice, 0)
    : '₹50.00';
  const displayOriginalPrice = item
    ? formatPrice(originalTotalPrice, 0)
    : '';
  const cartButtonText =
    quantity > 1
      ? `Rs ${Math.round(totalPrice)} and ${quantity} items added to cart, view cart`
      : hasAddedToCart
        ? 'View Cart'
        : 'Add to Cart';
  const displayRating = (item?.rating || 4.0).toFixed(1);
  const displayTitle = item?.name ?? 'Tortilla Chips With Toppins';
  const displayDescription =
    item?.description ||
    item?.ingredients ||
    item?.category?.name ||
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit.';

  const requiredAddonGroups =
    item?.addonGroups?.filter(
      group => group.isRequired && group.options.some(option => option.isAvailable),
    ) ?? [];

  const optionalAddonGroups =
    item?.addonGroups?.filter(
      group => !group.isRequired && group.options.some(option => option.isAvailable),
    ) ?? [];

  const toggleAddonOption = (
    groupId: number,
    optionId: number,
    isRequired: boolean,
  ) => {
    setSelectedAddons(prev => {
      if (prev[groupId] === optionId && !isRequired) {
        const next = { ...prev };
        delete next[groupId];
        return next;
      }

      return { ...prev, [groupId]: optionId };
    });
  };

  const renderAddonOption = (
    group: MenuItemAddonGroupModel,
    optionId: number,
    optionName: string,
    optionPrice: number,
  ) => {
    const isSelected = selectedAddons[group.id] === optionId;

    return (
      <TouchableOpacity
        key={`${group.id}-${optionId}`}
        style={styles.addonRow}
        onPress={() => toggleAddonOption(group.id, optionId, group.isRequired)}
      >
        <Text style={styles.addonText}>{optionName}</Text>

        <View style={styles.dottedLine} />

        <Text style={styles.addonPrice}>{formatPrice(optionPrice, 0)}</Text>

        <View style={styles.checkbox}>
          {isSelected && <View style={styles.checkboxInner} />}
        </View>
      </TouchableOpacity>
    );
  };

  const renderAddonSection = (
    title: string,
    groups: MenuItemAddonGroupModel[],
  ) => {
    if (!groups.length) {
      return null;
    }

    return (
      <View style={styles.addonSection}>
        <Text style={styles.addonSectionTitle}>{title}</Text>
        {groups.map(group =>
          group.options
            .filter(option => option.isAvailable)
            .map(option =>
              renderAddonOption(group, option.id, option.name, option.price),
            ),
        )}
      </View>
    );
  };

  const handleViewCart = async () => {
    if (!item?.id) {
      Alert.alert('Error', 'Menu item not found.');
      return;
    }

    const missingRequiredGroup = requiredAddonGroups.find(
      group => !selectedAddons[group.id],
    );

    if (missingRequiredGroup) {
      Alert.alert(
        'Required selection',
        `Please select an option from "${missingRequiredGroup.name}".`,
      );
      return;
    }

    const restaurantId =
      route?.params?.restaurantId ?? item.restaurantId;

    if (!restaurantId) {
      Alert.alert('Error', 'Restaurant not found.');
      return;
    }

    // Already added once — go to cart without posting again.
    if (hasAddedToCart) {
      navigation.navigate('Cart', { restaurantId });
      return;
    }

    const shouldNavigateAfterAdd = quantity > 1;

    const selectedVariantId =
      item.variants.length === 1 ? item.variants[0].id : undefined;

    const addOns = Object.entries(selectedAddons).map(
      ([groupId, addonOptionId]) =>
        new CartAddOnRequestModel({
          addonGroupId: Number(groupId),
          addonOptionId,
          quantity: 1,
        }),
    );

    const cartRequest = new AddToCartRequestModel({
      restaurantId,
      menuItemId: item.id,
      variantId: selectedVariantId,
      quantity,
      addOns,
      price: Math.round(totalPrice),
    });

    try {
      setIsAddingToCart(true);
      await GlobalLoginAuth.loadAuthData();

      console.log('Add to cart payload:', cartRequest.toJson());

      const response = await fetch(`${GlobalApi.baseUrl}api/carts`, {
        method: 'POST',
        headers: getApiHeaders(),
        body: JSON.stringify(cartRequest.toJson()),
      });

      const result = await response.json();
      console.log('Add to cart response:', JSON.stringify(result, null, 2));

      const cartResponse = CartResponseModel.fromJson(result);

      if (!response.ok || cartResponse.success === false) {
        Alert.alert(
          'Add to cart failed',
          cartResponse.message || 'Unable to add item to cart.',
        );
        return;
      }

      await GlobalCart.refreshCount();
      GlobalCart.setRestaurantId(restaurantId);

      if (shouldNavigateAfterAdd) {
        navigation.navigate('Cart', { restaurantId });
        return;
      }

      setHasAddedToCart(true);
    } catch (error) {
      console.log('Add to cart failed:', error);
      Alert.alert('Add to cart failed', 'Something went wrong. Please try again.');
    } finally {
      setIsAddingToCart(false);
    }
  };

  return (
    <View style={styles.container}>
      <GlobalBackButton onPress={() => navigation.goBack()} />
      <Text style={styles.title}>Menu Items</Text>

      <View style={styles.overlay}>

        <ScrollView showsVerticalScrollIndicator={false}>

          {/* IMAGE */}
          <View style={styles.imageCard}>
            <Image
              source={
                item?.imageUrl
                  ? { uri: item.imageUrl }
                  : require('../assets/images/banner1.png')
              }
              style={styles.foodImage}
            />

            <View style={styles.ratingBadge}>
              <Text style={styles.ratingText}>{displayRating}</Text>
              <Text style={styles.ratingStar}>★</Text>
            </View>

            <TouchableOpacity style={styles.favoriteButton}>
              <Text style={styles.favoriteIcon}>♥</Text>
            </TouchableOpacity>
          </View>

          {/* DETAILS */}
          <View style={styles.detailsContainer}>

            <View style={styles.priceRow}>
              <View style={styles.priceSection}>
                {item && hasDiscount(item) ? (
                  <>
                    <Text style={styles.originalPriceText}>
                      {displayOriginalPrice}
                    </Text>
                    <Text style={styles.price}>{displayPrice}</Text>
                  </>
                ) : (
                  <Text style={styles.price}>{displayPrice}</Text>
                )}
              </View>

              <View style={styles.quantityContainer}>
                <TouchableOpacity
                  style={styles.minusButton}
                  onPress={() => setQuantity(prev => Math.max(1, prev - 1))}
                >
                  <Text style={styles.minusText}>-</Text>
                </TouchableOpacity>

                <View style={styles.quantityBox}>
                  <Text style={styles.quantity}>{quantity}</Text>
                </View>

                <TouchableOpacity
                  style={styles.plusButton}
                  onPress={() => setQuantity(prev => prev + 1)}
                >
                  <Text style={styles.plusText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.divider} />

            <Text style={styles.foodTitle}>
              {displayTitle}
            </Text>

            <Text style={styles.description}>
              {displayDescription}
            </Text>

            <Text style={styles.addOn}>
              Add on ingredients
            </Text>

            {renderAddonSection('Required', requiredAddonGroups)}
            {renderAddonSection('Optional', optionalAddonGroups)}

            {/* ✅ BUTTON INSIDE SCROLL */}
            <TouchableOpacity
              style={styles.addToCartButton}
              activeOpacity={0.8}
              disabled={isAddingToCart}
              onPress={handleViewCart}
            >
              {isAddingToCart ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Image
                    source={require('../assets/images/CartAnother.png')}
                    style={styles.cartIcon}
                  />
                  <Text style={styles.addToCartText}>{cartButtonText}</Text>
                </>
              )}
            </TouchableOpacity>

          </View>

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
    padding: 16,
  },

  imageCard: {
    width: '100%',
    height: 220,
    borderRadius: 36,
    overflow: 'hidden',
    marginTop: 10,
  },

  foodImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },

  ratingBadge: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },

  ratingText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },

  ratingStar: {
    marginLeft: 4,
    color: '#F4D235',
    fontSize: 12,
  },

  favoriteButton: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
  },

  favoriteIcon: {
    color: Colors.primary,
    fontSize: 16,
  },

  detailsContainer: {
    marginTop: 20,
  },

  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  priceSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
    marginRight: 8,
  },

  originalPriceText: {
    color: '#9CA3AF',
    fontSize: 18,
    fontFamily: 'LeagueSpartan-Medium',
    textDecorationLine: 'line-through',
    marginRight: 8,
  },

  price: {
    fontSize: 24,
    fontFamily: 'LeagueSpartan-Bold',
    color: '#FF6D00',
  },

  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  minusButton: {
    width: 26,
    height: 26,
    borderRadius: 16,
    backgroundColor: '#F3D6C8',
    justifyContent: 'center',
    alignItems: 'center',
  },

  plusButton: {
    width: 26,
    height: 26,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },

  quantityBox: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },

  quantity: {
    fontSize: 18,
    fontFamily: 'LeagueSpartan-Regular',
    color: '#2D2D2D',
  },

  minusText: {
    fontSize: 18,
    color: '#fff',
  },

  plusText: {
    fontSize: 18,
    color: '#fff',
  },

  divider: {
    height: 1,
    backgroundColor: '#F1C6B5',
    marginVertical: 16,
  },

  foodTitle: {
    fontSize: 16,
    fontFamily: 'LeagueSpartan-Medium',
    color: '#1F2937',
    marginBottom: 6,
  },

  description: {
    fontSize: 16,
    fontFamily: 'LeagueSpartan-Light',
    color: '#1F2937',
  },

  addOn: {
    marginTop: 20,
    fontSize: 20,
    fontFamily: 'LeagueSpartan-Medium',
    color: '#391713',
  },

  addonSection: {
    marginTop: 12,
  },

  addonSectionTitle: {
    fontSize: 18,
    fontFamily: 'LeagueSpartan-Medium',
    color: '#391713',
    marginBottom: 4,
  },

  addonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
  },

  addonText: {
    fontSize: 16,
    fontFamily: 'LeagueSpartan-Regular',
    color: '#2D2D2D',
  },

  dottedLine: {
    flex: 1,
    borderBottomWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#F1C6B5',
    marginHorizontal: 8,
  },

  addonPrice: {
    fontSize: 16,
    fontFamily: 'LeagueSpartan-Regular',
    color: '#2D2D2D',
    marginRight: 10,
  },

  // ✅ CHECKBOX
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },

  checkboxInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
  },

 addToCartButton: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: 180,
  minHeight: 33,
  paddingHorizontal: 16,
  paddingVertical: 8,
  borderRadius: 50,
  backgroundColor: '#FF6D00',
  borderWidth: 1.2,
  borderColor: '#FF6D00',
  alignSelf: 'center',
  marginTop: 30,
  marginBottom: 30,
},

addToCartText: {
  flexShrink: 1,
  fontSize: 16,
  lineHeight: 20,
  fontFamily: 'LeagueSpartan-Medium',
  letterSpacing: -0.3,
  color: '#FFFFFF',
  textAlign: 'center',
},
cartIcon: {
  width: 20,            // 👈 adjust if needed (18–22)
  height: 20,
  resizeMode: 'contain',
  tintColor: '#fff',    // 👈 makes icon white (IMPORTANT)
  marginRight: 8,
},

});