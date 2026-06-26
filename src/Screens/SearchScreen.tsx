import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  Image,
  TouchableOpacity,
  ImageSourcePropType,
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

import Colors from '../assets/Colors/Colors';
import { FontStyles } from '../assets/Styles/GlobalStyles';
import GlobalBackButton from '../GlobalContainer/GlobalBackButton';
import GlobalApi from '../GlobalContainer/GlobalApi';
import GlobalLoginAuth from '../GlobalContainer/GlobalLoginAuth';
import GlobalLoader from '../GlobalContainer/GlobalLoader';
import DeliveryOrderListComponent from '../GlobalContainer/DeliveryOrderListComponent';
import { AssignedOrder } from '../Models/DeliveryDasboard/AssignedOrder';
import {
  MenuItemCategoryModel,
  RestaurantMenuItemModel,
} from '../Models/RestaurantMenuModel';
import {
  MyOrderItemModel,
  MyOrdersResponseModel,
} from '../Models/MyOrdersModel';

export type SearchScope = 'home' | 'orders' | 'favorites';

type SearchScreenProps = {
  navigation: any;
  route: {
    params?: {
      scope?: SearchScope;
      restaurantId?: number | null;
      latitude?: number | null;
      longitude?: number | null;
      menuItems?: RestaurantMenuItemModel[];
    };
  };
};

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_GAP = 10;
const CARD_WIDTH = (SCREEN_WIDTH - 40 - CARD_GAP) / 2;

const SCOPE_CONFIG: Record<
  SearchScope,
  { title: string; placeholder: string; hint: string }
> = {
  home: {
    title: 'Search Menu',
    placeholder: 'Search dishes, categories...',
    hint: 'Find dishes from the selected restaurant',
  },
  orders: {
    title: 'Search Orders',
    placeholder: 'Search by order no. or restaurant...',
    hint: 'Find your past and active orders',
  },
  favorites: {
    title: 'Search Favorites',
    placeholder: 'Search favorites by name or category...',
    hint: 'Find your saved favorite dishes',
  },
};

const STATIC_FAVORITES: RestaurantMenuItemModel[] = [
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
    rating: 4.8,
    restaurantId: 1,
    category: new MenuItemCategoryModel({ id: 4, name: 'Desserts' }),
    imageUrl: null,
  }),
];

const categoryIcons: Record<string, ImageSourcePropType> = {
  snacks: require('../assets/images/Snacks.png'),
  meal: require('../assets/images/Meals.png'),
  meals: require('../assets/images/Meals.png'),
  dessert: require('../assets/images/Desserts.png'),
  desserts: require('../assets/images/Desserts.png'),
  drinks: require('../assets/images/Drinks.png'),
};

const getCategoryIcon = (name: string) =>
  categoryIcons[name.trim().toLowerCase()] ??
  require('../assets/images/Meals.png');

const formatPrice = (value: number | null | undefined, fallback = 0) =>
  `Rs${Number(value ?? fallback).toFixed(2)}`;

const hasDiscount = (item: RestaurantMenuItemModel) =>
  item.discountPrice != null && item.discountPrice < item.price;

const normalizeQuery = (value: string) => value.trim().toLowerCase();

const filterMenuItems = (
  items: RestaurantMenuItemModel[],
  query: string,
) => {
  const normalized = normalizeQuery(query);
  if (!normalized) {
    return items;
  }

  return items.filter(item => {
    const haystack = [
      item.name,
      item.category?.name,
      item.description,
      item.ingredients,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    return haystack.includes(normalized);
  });
};

const mapToAssignedOrder = (order: MyOrderItemModel): AssignedOrder => ({
  deliveryId: order.deliveryId,
  orderId: order.orderId,
  orderNumber: order.orderNumber,
  createdAt: order.createdAt,
  minutesAgo: order.minutesAgo,
  customerName: order.restaurantName || order.customerName || 'Restaurant',
  customerPhone: order.customerPhone,
  addressText: order.addressText,
  itemCount: order.itemCount,
  totalQuantity: order.totalQuantity || order.itemCount,
  finalAmount: order.finalAmount,
  paymentMethod: order.paymentMethod,
  paymentStatus: order.paymentStatus,
  deliveryStatus: order.deliveryStatus,
  orderStatus: order.status,
});

const filterOrders = (orders: AssignedOrder[], query: string) => {
  const normalized = normalizeQuery(query);
  if (!normalized) {
    return orders;
  }

  return orders.filter(order => {
    const haystack = [
      order.orderNumber,
      order.customerName,
      order.addressText,
      order.orderStatus,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    return haystack.includes(normalized);
  });
};

export default function SearchScreen({ navigation, route }: SearchScreenProps) {
  const scope: SearchScope = route.params?.scope ?? 'home';
  const config = SCOPE_CONFIG[scope];

  const restaurantId = route.params?.restaurantId ?? null;
  const latitude = route.params?.latitude ?? null;
  const longitude = route.params?.longitude ?? null;
  const passedMenuItems = route.params?.menuItems ?? [];

  const inputRef = useRef<TextInput>(null);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<AssignedOrder[]>([]);

  const sourceMenuItems = useMemo(() => {
    if (scope === 'favorites') {
      return STATIC_FAVORITES;
    }
    if (scope === 'home') {
      return passedMenuItems;
    }
    return [];
  }, [scope, passedMenuItems]);

  const fetchOrders = useCallback(async () => {
    if (scope !== 'orders') {
      return;
    }

    try {
      setLoading(true);
      await GlobalLoginAuth.loadAuthData();

      const token = GlobalLoginAuth.accessToken || GlobalLoginAuth.token;
      if (!token) {
        setOrders([]);
        return;
      }

      const headers: Record<string, string> = {
        Accept: 'application/json',
        'X-Client-Type': 'mobile',
        Authorization: `Bearer ${token}`,
      };

      const response = await fetch(
        `${GlobalApi.baseUrl}api/orders/my-orders?limit=20&offset=0`,
        { method: 'GET', headers },
      );

      const result = await response.json();
      const myOrdersResponse = MyOrdersResponseModel.fromJson(result);

      if (!response.ok || myOrdersResponse.success === false) {
        setOrders([]);
        return;
      }

      setOrders(
        (myOrdersResponse.data?.orders ?? []).map(mapToAssignedOrder),
      );
    } catch (error) {
      console.log('SearchScreen fetchOrders failed:', error);
      Alert.alert('FoodyPly', 'Unable to load orders for search');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [scope]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const hasSearchQuery = query.trim().length > 0;

  const filteredMenuItems = useMemo(
    () => (hasSearchQuery ? filterMenuItems(sourceMenuItems, query) : []),
    [sourceMenuItems, query, hasSearchQuery],
  );

  const filteredOrders = useMemo(
    () => (hasSearchQuery ? filterOrders(orders, query) : []),
    [orders, query, hasSearchQuery],
  );

  const handleMenuItemPress = (item: RestaurantMenuItemModel) => {
    navigation.navigate('MenuDetails', {
      item,
      restaurantId: restaurantId ?? item.restaurantId,
      latitude,
      longitude,
    });
  };

  const renderMenuItem = ({ item }: { item: RestaurantMenuItemModel }) => (
    <View style={styles.card}>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => handleMenuItemPress(item)}>
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
          {item.category?.name || 'Menu item'}
        </Text>
      </TouchableOpacity>

      <View style={styles.cardFooter}>
        {hasDiscount(item) ? (
          <>
            <Text style={styles.originalPriceText}>{formatPrice(item.price)}</Text>
            <Text style={styles.priceText}>{formatPrice(item.discountPrice)}</Text>
          </>
        ) : (
          <Text style={styles.priceText}>{formatPrice(item.price)}</Text>
        )}
      </View>
    </View>
  );

  const renderOrderItem = ({ item }: { item: AssignedOrder }) => (
    <DeliveryOrderListComponent
      orders={[item]}
      showAmountInItemBadge
      showTrackOrderButton
      onPressItem={order =>
        navigation.navigate('OrderDetails', { orderId: order.orderId })
      }
      onPressTrackOrder={order =>
        navigation.navigate('Trackorder', { orderId: order.orderId })
      }
    />
  );

  const showMenuResults = scope === 'home' || scope === 'favorites';
  const resultCount = showMenuResults
    ? filteredMenuItems.length
    : filteredOrders.length;

  return (
    <View style={styles.container}>
      <GlobalLoader visible={loading} text="Please Wait" />

      <GlobalBackButton onPress={() => navigation.goBack()} />
      <Text style={styles.title}>{config.title}</Text>

      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}>
        <Text style={styles.hint}>{config.hint}</Text>

        <TouchableOpacity
          activeOpacity={1}
          style={styles.searchBar}
          onPress={() => inputRef.current?.focus()}>
          <TextInput
            ref={inputRef}
            value={query}
            onChangeText={setQuery}
            placeholder={config.placeholder}
            placeholderTextColor={Colors.muted}
            style={styles.searchField}
            returnKeyType="search"
            autoCorrect={false}
            clearButtonMode="while-editing"
          />

          <TouchableOpacity style={styles.filterButton}>
            <Image
              source={require('../assets/images/Filtericon.png')}
              style={styles.filterIcon}
            />
          </TouchableOpacity>
        </TouchableOpacity>

        {hasSearchQuery ? (
          <Text style={styles.resultMeta}>
            {resultCount} result{resultCount === 1 ? '' : 's'} for "{query.trim()}"
          </Text>
        ) : null}

        {showMenuResults ? (
          <FlatList
            data={filteredMenuItems}
            keyExtractor={item => String(item.id)}
            numColumns={2}
            columnWrapperStyle={styles.menuRow}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            ListEmptyComponent={
              <View style={styles.emptyState}>
                {hasSearchQuery ? (
                  <>
                    <Text style={styles.emptyTitle}>No dishes found</Text>
                    <Text style={styles.emptyText}>
                      {scope === 'home' && !passedMenuItems.length
                        ? 'Open Home and load a restaurant menu first, then search again.'
                        : 'Try a different dish name or category.'}
                    </Text>
                  </>
                ) : (
                  <>
                    <Text style={styles.emptyTitle}>Search dishes</Text>
                    <Text style={styles.emptyText}>
                      Type in the search bar above to find dishes.
                    </Text>
                  </>
                )}
              </View>
            }
            renderItem={renderMenuItem}
          />
        ) : (
          <FlatList
            data={filteredOrders}
            keyExtractor={item => String(item.orderId)}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            ListEmptyComponent={
              <View style={styles.emptyState}>
                {hasSearchQuery ? (
                  <>
                    <Text style={styles.emptyTitle}>No orders found</Text>
                    <Text style={styles.emptyText}>
                      Try searching by order number or restaurant name.
                    </Text>
                  </>
                ) : (
                  <>
                    <Text style={styles.emptyTitle}>Search orders</Text>
                    <Text style={styles.emptyText}>
                      Type in the search bar above to find your orders.
                    </Text>
                  </>
                )}
              </View>
            }
            renderItem={renderOrderItem}
          />
        )}
      </KeyboardAvoidingView>
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
    marginTop: 8,
  },

  overlay: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: '88%',
    backgroundColor: '#fff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 20,
  },

  hint: {
    color: Colors.primary,
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 14,
  },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
    backgroundColor: Colors.searchBackground,
    borderRadius: 25,
    paddingLeft: 16,
    paddingRight: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },

  searchField: {
    flex: 1,
    minHeight: 40,
    fontSize: 15,
    fontFamily: FontStyles.regular,
    color: Colors.textColor,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
  },

  filterButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },

  filterIcon: {
    width: 14,
    height: 14,
    resizeMode: 'contain',
  },

  resultMeta: {
    fontSize: 13,
    color: Colors.muted,
    marginBottom: 12,
  },

  listContent: {
    paddingBottom: 30,
  },

  menuRow: {
    justifyContent: 'space-between',
  },

  card: {
    width: CARD_WIDTH,
    marginBottom: 18,
    borderRadius: 20,
    backgroundColor: '#fff',
  },

  cardImageContainer: {
    height: 110,
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
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },

  categoryIcon: {
    width: 14,
    height: 14,
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
    fontSize: 11,
  },

  ratingStar: {
    color: '#F4D235',
    marginLeft: 3,
    fontSize: 11,
  },

  cardTitle: {
    marginHorizontal: 10,
    marginTop: 6,
    fontWeight: '700',
    fontSize: 13,
  },

  cardDescription: {
    marginHorizontal: 10,
    marginTop: 2,
    fontSize: 11,
    color: '#6D5D54',
    marginBottom: 4,
  },

  cardFooter: {
    paddingHorizontal: 8,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },

  originalPriceText: {
    color: '#9CA3AF',
    fontSize: 11,
    fontWeight: '600',
    textDecorationLine: 'line-through',
    marginRight: 4,
  },

  priceText: {
    color: Colors.primary,
    fontWeight: '700',
    fontSize: 12,
  },

  emptyState: {
    alignItems: 'center',
    paddingTop: 40,
    paddingHorizontal: 20,
  },

  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
    color: Colors.textColor,
  },

  emptyText: {
    fontSize: 13,
    color: Colors.muted,
    textAlign: 'center',
    lineHeight: 20,
  },
});
