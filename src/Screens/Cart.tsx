// import React from 'react';
// import { View, Text, StyleSheet, ScrollView } from 'react-native';
// import GlobalBackButton from '../GlobalContainer/GlobalBackButton';
// import Colors from '../assets/Colors/Colors';

// export default function Cart({ navigation }: any) {
//   return (
//     <View style={styles.container}>
//       <GlobalBackButton onPress={() => navigation.goBack()} />
//       <Text style={styles.title}>Cart</Text>

//       <View style={styles.overlay}>
//         <ScrollView showsVerticalScrollIndicator={false}>
//           {/* overlay content goes here */}
//         </ScrollView>
//       </View>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     alignItems: 'center',
//     paddingTop: 100,
//     backgroundColor: Colors.primary,
//   },
//   title: {
//     color: '#fff',
//     fontSize: 28,
//     fontWeight: '700',
//   },
//   overlay: {
//     position: 'absolute',
//     bottom: 0,
//     width: '100%',
//     height: '90%',
//     backgroundColor: '#fff',
//     borderTopLeftRadius: 30,
//     borderTopRightRadius: 30,
//     padding: 16,
//   },
//   text: {
//     fontSize: 22,
//     fontWeight: '600',
//   },
  
// });



import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  TextInput,
  ImageSourcePropType,
  Keyboard,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import RazorpayCheckout from 'react-native-razorpay';
import GlobalBackButton from '../GlobalContainer/GlobalBackButton';
import { goBackToDashboard } from '../GlobalContainer/navigationHelpers';
import GlobalApi from '../GlobalContainer/GlobalApi';
import GlobalLoginAuth from '../GlobalContainer/GlobalLoginAuth';
import Colors from '../assets/Colors/Colors';
import GlobalBottomBar from '../GlobalContainer/GlobalBottomBar';
import GlobalCart from '../GlobalContainer/GlobalCart';
import {
  CartAddOnRequestModel,
  GetCartDataModel,
  GetCartResponseModel,
  UpdateCartRequestModel,
} from '../Models/CartModel';
import { CheckoutCouponsResponseModel } from '../Models/CheckoutCouponModel';
import {
  CheckoutQuoteAddonRequestModel,
  CheckoutQuoteDataModel,
  CheckoutQuoteItemRequestModel,
  CheckoutQuoteRequestModel,
  CheckoutQuoteResponseModel,
} from '../Models/CheckoutQuoteModel';
import {
  CreateOrderAddonRequestModel,
  CreateOrderItemRequestModel,
  CreateOrderRequestModel,
  CreateOrderResponseModel,
  OrderPaymentActionRequestModel,
  PaymentActionResponseModel,
  RazorpayOrderResponseModel,
  RazorpayVerifyRequestModel,
  RazorpayVerifyResponseModel,
} from '../Models/OrderModel';

type CartDisplayItem = {
  id: string;
  cartLineId?: number;
  menuItemId: number;
  variantId?: number;
  restaurantId: number;
  title: string;
  date: string;
  price: string;
  quantity: number;
  unitPrice: number;
  addOns: CartAddOnRequestModel[];
  image: ImageSourcePropType;
};

type CartPricing = {
  itemTotal: number;
  deliveryFee: number;
};

type AppliedCoupon = {
  id: number;
  code: string;
  discount: number;
};

type StaticCoupon = {
  id: number;
  code: string;
  discountType: 'PERCENTAGE' | 'FIXED' | 'FLAT';
  discountValue: number;
  maxDiscountAmount: number;
  estimatedDiscount: number;
  minOrderAmount: number;
  eligible: boolean;
  reason: string;
};

const TIP_OPTIONS = [20, 50, 100];
const CART_REFRESH_INTERVAL_MS = 10000;

const formatBillAmount = (value: number) => `₹${Number(value).toFixed(2)}`;

const formatCouponDiscount = (coupon: StaticCoupon) => {
  if (coupon.discountType === 'PERCENTAGE') {
    return `${coupon.discountValue}% off`;
  }

  return `${formatBillAmount(coupon.discountValue)} off`;
};

const mapApiCouponToDisplay = (coupon: {
  id: number;
  code: string;
  discountType: StaticCoupon['discountType'];
  discountValue: number;
  maxDiscountAmount?: number;
  estimatedDiscount: number;
  minOrderAmount: number;
  eligible: boolean;
  reason: string;
}): StaticCoupon => ({
  id: coupon.id,
  code: coupon.code,
  discountType: coupon.discountType,
  discountValue: coupon.discountValue,
  maxDiscountAmount: coupon.maxDiscountAmount ?? 0,
  estimatedDiscount: coupon.estimatedDiscount,
  minOrderAmount: coupon.minOrderAmount,
  eligible: coupon.eligible,
  reason: coupon.reason,
});

const isCouponEligibleForCart = (
  coupon: Pick<StaticCoupon, 'minOrderAmount'>,
  itemTotal: number,
) => itemTotal >= coupon.minOrderAmount;

const calculateCouponDiscount = (
  coupon: Pick<
    StaticCoupon,
    'discountType' | 'discountValue' | 'estimatedDiscount' | 'maxDiscountAmount'
  >,
  itemTotal: number,
) => {
  if (coupon.estimatedDiscount > 0) {
    return coupon.estimatedDiscount;
  }

  if (coupon.discountType === 'PERCENTAGE') {
    const rawDiscount = (itemTotal * coupon.discountValue) / 100;

    if (coupon.maxDiscountAmount > 0) {
      return Math.min(rawDiscount, coupon.maxDiscountAmount);
    }

    return Math.round(rawDiscount * 100) / 100;
  }

  return coupon.discountValue;
};

const getCouponDisplayState = (
  coupon: StaticCoupon,
  itemTotal: number,
): StaticCoupon => {
  const eligible = isCouponEligibleForCart(coupon, itemTotal);

  if (!eligible) {
    return {
      ...coupon,
      eligible: false,
      estimatedDiscount: 0,
      reason:
        coupon.reason ||
        `Minimum order amount is ${formatBillAmount(coupon.minOrderAmount)}.`,
    };
  }

  return {
    ...coupon,
    eligible: true,
    estimatedDiscount: calculateCouponDiscount(coupon, itemTotal),
    reason: '',
  };
};

const formatCartDate = () => {
  const now = new Date();
  return now.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getApiHeaders = (withBody = false): Record<string, string> => {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'X-Client-Type': 'mobile',
  };

  if (withBody) {
    headers['Content-Type'] = 'application/json';
  }

  const token = GlobalLoginAuth.accessToken || GlobalLoginAuth.token;
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
};

const getQuoteTipAmount = (
  tipSelection: number | 'custom' | null,
  customTip: string,
) => {
  if (tipSelection === 'custom') {
    return Number(customTip) || 0;
  }

  if (typeof tipSelection === 'number') {
    return tipSelection;
  }

  return 0;
};

export default function Cart({ navigation, route }: any) {
  const [cartItems, setCartItems] = useState<CartDisplayItem[]>([]);
  const [cartPricing, setCartPricing] = useState<CartPricing>({
    itemTotal: 0,
    deliveryFee: 0,
  });
  const [couponCode, setCouponCode] = useState('');
  const [availableCoupons, setAvailableCoupons] = useState<StaticCoupon[]>([]);
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const [selectedTip, setSelectedTip] = useState<number | 'custom' | null>(null);
  const [customTipAmount, setCustomTipAmount] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'cod'>('online');
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [checkoutQuote, setCheckoutQuote] =
    useState<CheckoutQuoteDataModel | null>(null);
  const [isLoadingCart, setIsLoadingCart] = useState(true);
  const [hasLoadedCart, setHasLoadedCart] = useState(false);
  const quoteRequestRef = useRef(0);
  const cartRequestRef = useRef(0);
  const couponRequestRef = useRef(0);
  const cartItemsRef = useRef<CartDisplayItem[]>([]);

  useEffect(() => {
    cartItemsRef.current = cartItems;
  }, [cartItems]);

  const clearCouponState = useCallback(() => {
    setAvailableCoupons([]);
    setAppliedCoupon(null);
    setCouponCode('');
  }, []);

  const localPricing = useMemo(() => {
    const itemTotal = cartPricing.itemTotal;
    const deliveryFee = cartPricing.deliveryFee;
    const couponDiscount = appliedCoupon?.discount ?? 0;
    const discountedItemTotal = Math.max(0, itemTotal - couponDiscount);
    const cgst = Math.round(discountedItemTotal * 0.025 * 100) / 100;
    const sgst = Math.round(discountedItemTotal * 0.025 * 100) / 100;
    const taxTotal = cgst + sgst;

    let tipAmount = 0;
    if (selectedTip === 'custom') {
      tipAmount = Number(customTipAmount) || 0;
    } else if (typeof selectedTip === 'number') {
      tipAmount = selectedTip;
    }

    const payable =
      discountedItemTotal + deliveryFee + taxTotal + tipAmount;

    return {
      itemTotal,
      deliveryFee,
      couponDiscount,
      discountedItemTotal,
      cgst,
      sgst,
      taxTotal,
      tipAmount,
      payable,
    };
  }, [
    cartPricing,
    appliedCoupon,
    selectedTip,
    customTipAmount,
  ]);

  const pricing = useMemo(() => {
    if (checkoutQuote) {
      return {
        itemTotal: checkoutQuote.subtotalAmount,
        deliveryFee: checkoutQuote.deliveryFee,
        couponDiscount: checkoutQuote.couponDiscountAmount,
        discountedItemTotal: checkoutQuote.taxableAmount,
        cgst: checkoutQuote.cgstAmount,
        sgst: checkoutQuote.sgstAmount,
        taxTotal: checkoutQuote.taxAmount,
        tipAmount: checkoutQuote.tipAmount,
        payable: checkoutQuote.finalAmount,
      };
    }

    return localPricing;
  }, [checkoutQuote, localPricing]);

  // ✅ KEY LOGIC
  const showBottomBar = route?.params?.fromTab === true;

  const applyCartData = useCallback(
    (cartData: GetCartDataModel, requestId?: number) => {
      if (requestId != null && requestId !== cartRequestRef.current) {
        return;
      }

      const apiItems = cartData.items;
      const totalCount = apiItems.reduce((sum, item) => sum + item.quantity, 0);
      GlobalCart.setItemCount(totalCount);

      if (apiItems.length > 0) {
        setCartItems(
          apiItems.map(item => {
            const quantity = item.quantity;
            const linePrice = Number(item.price ?? 0);
            const unitPrice =
              quantity > 0 ? linePrice / quantity : linePrice;

            return {
              id: String(item.id || item.menuItemId),
              cartLineId: item.id > 0 ? item.id : undefined,
              menuItemId: item.menuItemId,
              variantId: item.variantId,
              restaurantId: item.restaurantId,
              title: item.name,
              date: formatCartDate(),
              price: formatBillAmount(linePrice),
              quantity,
              unitPrice,
              addOns: item.addOns,
              image: item.imageUrl
                ? { uri: item.imageUrl }
                : require('../assets/images/banner1.png'),
            };
          }),
        );
      } else {
        setCartItems([]);
        clearCouponState();
      }

      const summary = cartData.summary;
      setCartPricing({
        itemTotal: summary.subtotal,
        deliveryFee: summary.deliveryFee,
      });

      if (cartData.restaurantId > 0) {
        GlobalCart.setRestaurantId(cartData.restaurantId);
      }
    },
    [clearCouponState],
  );

  const loadCoupons = useCallback(async () => {
    const requestId = ++couponRequestRef.current;
    const items = cartItemsRef.current;

    if (items.length === 0) {
      if (requestId === couponRequestRef.current) {
        clearCouponState();
      }
      return;
    }

    await GlobalCart.loadRestaurantId();

    const restaurantId =
      items.find(item => item.restaurantId > 0)?.restaurantId ||
      GlobalCart.restaurantId ||
      Number(route?.params?.restaurantId ?? 0);

    const cartSubtotal =
      items.reduce(
        (sum, item) => sum + item.unitPrice * item.quantity,
        0,
      ) || cartPricing.itemTotal;

    console.log('Coupons fetch context:', {
      globalRestaurantId: GlobalCart.restaurantId,
      routeRestaurantId: route?.params?.restaurantId,
      resolvedRestaurantId: restaurantId,
      cartSubtotal,
      itemCount: items.length,
    });

    if (restaurantId < 1) {
      console.log(
        'Skipping coupons fetch: restaurantId not available.',
      );
      return;
    }

    try {
      await GlobalLoginAuth.loadAuthData();

      const token = GlobalLoginAuth.accessToken || GlobalLoginAuth.token;
      if (!token) {
        console.log('Skipping coupons fetch: user is not logged in.');
        return;
      }

      const couponsUrl =
        `${GlobalApi.baseUrl}api/checkout/coupons?restaurantId=${restaurantId}`;

      console.log('Calling checkout coupons API:', couponsUrl);

      const response = await fetch(couponsUrl, {
        method: 'GET',
        headers: getApiHeaders(),
      });

      const result = await response.json();
      console.log(
        'Checkout coupons raw response:',
        JSON.stringify(result, null, 2),
      );

      if (requestId !== couponRequestRef.current) {
        return;
      }

      const couponsResponse = CheckoutCouponsResponseModel.fromJson(result);

      if (!response.ok || couponsResponse.success === false) {
        console.log('Checkout coupons failed:', couponsResponse.message);
        return;
      }

      if (couponsResponse.data.length === 0) {
        console.log('Checkout coupons API returned an empty list.');
        setAvailableCoupons([]);
        return;
      }

      const coupons = couponsResponse.data.map(mapApiCouponToDisplay);
      console.log(
        'Checkout coupons mapped for UI:',
        JSON.stringify(coupons, null, 2),
      );
      setAvailableCoupons(coupons);

      setAppliedCoupon(currentApplied => {
        if (!currentApplied) {
          return currentApplied;
        }

        const refreshedCoupon = coupons.find(
          coupon =>
            coupon.code.toUpperCase() === currentApplied.code.toUpperCase(),
        );

        if (!refreshedCoupon) {
          return currentApplied;
        }

        const displayCoupon = getCouponDisplayState(
          refreshedCoupon,
          cartSubtotal,
        );

        if (!displayCoupon.eligible) {
          return null;
        }

        return {
          id: displayCoupon.id,
          code: displayCoupon.code,
          discount: displayCoupon.estimatedDiscount,
        };
      });
    } catch (error) {
      console.log('loadCoupons failed:', error);
    }
  }, [cartPricing.itemTotal, clearCouponState, route?.params?.restaurantId]);

  const fetchCart = useCallback(async (options?: { silent?: boolean }) => {
    const requestId = ++cartRequestRef.current;
    if (!options?.silent) {
      setIsLoadingCart(true);
    }

    try {
      await GlobalLoginAuth.loadAuthData();

      const token = GlobalLoginAuth.accessToken || GlobalLoginAuth.token;
      if (!token) {
        if (requestId !== cartRequestRef.current) {
          return;
        }

        setCartItems([]);
        clearCouponState();
        setHasLoadedCart(true);
        return;
      }

      const response = await fetch(`${GlobalApi.baseUrl}api/carts`, {
        method: 'GET',
        headers: getApiHeaders(),
      });

      const result = await response.json();
      console.log('Get cart response:', JSON.stringify(result, null, 2));

      if (requestId !== cartRequestRef.current) {
        return;
      }

      const cartResponse = GetCartResponseModel.fromJson(result);

      if (!response.ok || cartResponse.success === false || !cartResponse.data) {
        console.log('Get cart failed:', cartResponse.message);
        setHasLoadedCart(true);
        return;
      }

      applyCartData(cartResponse.data, requestId);

      const routeRestaurantId = Number(route?.params?.restaurantId ?? 0);
      if (routeRestaurantId > 0 && cartResponse.data.restaurantId < 1) {
        GlobalCart.setRestaurantId(routeRestaurantId);
      }

      setHasLoadedCart(true);
    } catch (error) {
      if (requestId === cartRequestRef.current) {
        console.log('fetchCart failed:', error);
        setHasLoadedCart(true);
      }
    } finally {
      if (requestId === cartRequestRef.current) {
        setIsLoadingCart(false);
      }
    }
  }, [applyCartData, clearCouponState, route?.params?.restaurantId]);

  useEffect(() => {
    if (!hasLoadedCart || cartItems.length === 0) {
      return;
    }

    loadCoupons();
  }, [hasLoadedCart, cartItems, loadCoupons]);

  const fetchCheckoutQuote = useCallback(async () => {
    const requestId = ++quoteRequestRef.current;

    if (cartItems.length === 0) {
      setCheckoutQuote(null);
      return;
    }

    try {
      await GlobalLoginAuth.loadAuthData();
      await GlobalCart.loadRestaurantId();
      await GlobalCart.loadShippingAddress();

      const restaurantId =
        GlobalCart.restaurantId ||
        cartItems.find(item => item.restaurantId > 0)?.restaurantId ||
        0;
      const addressId = GlobalCart.shippingAddressId;

      if (restaurantId < 1 || addressId < 1) {
        if (requestId === quoteRequestRef.current) {
          setCheckoutQuote(null);
        }
        return;
      }

      const tipAmount = getQuoteTipAmount(selectedTip, customTipAmount);

      const quoteItems = cartItems.map(item =>
        new CheckoutQuoteItemRequestModel({
          menuItemId: item.menuItemId,
          variantId: item.variantId,
          quantity: item.quantity,
          addons: item.addOns
            .filter(addOn => addOn.addonOptionId > 0)
            .map(
              addOn =>
                new CheckoutQuoteAddonRequestModel({
                  addonGroupId: addOn.addonGroupId ?? 0,
                  addonOptionId: addOn.addonOptionId,
                }),
            )
            .filter(
              addOn => addOn.addonGroupId > 0 && addOn.addonOptionId > 0,
            ),
        }),
      );

      const quoteRequest = new CheckoutQuoteRequestModel({
        restaurantId,
        addressId,
        orderType: 'DELIVERY',
        couponCode: appliedCoupon?.code,
        tipAmount: tipAmount > 0 ? tipAmount : undefined,
        items: quoteItems,
      });

      console.log('Checkout quote payload:', quoteRequest.toJson());

      const response = await fetch(
        `${GlobalApi.baseUrl}api/checkout/quote`,
        {
          method: 'POST',
          headers: getApiHeaders(true),
          body: JSON.stringify(quoteRequest.toJson()),
        },
      );

      const result = await response.json();
      console.log('Checkout quote response:', JSON.stringify(result, null, 2));

      if (requestId !== quoteRequestRef.current) {
        return;
      }

      const quoteResponse = CheckoutQuoteResponseModel.fromJson(result);

      if (!response.ok || quoteResponse.success === false || !quoteResponse.data) {
        console.log('Checkout quote failed:', quoteResponse.message);
        setCheckoutQuote(null);
        return;
      }

      setCheckoutQuote(quoteResponse.data);
    } catch (error) {
      console.log('fetchCheckoutQuote failed:', error);

      if (requestId === quoteRequestRef.current) {
        setCheckoutQuote(null);
      }
    }
  }, [cartItems, appliedCoupon, selectedTip, customTipAmount]);

  useEffect(() => {
    if (cartItems.length === 0) {
      setCheckoutQuote(null);
      return;
    }

    const delay = selectedTip === 'custom' ? 400 : 0;
    const timer = setTimeout(() => {
      fetchCheckoutQuote();
    }, delay);

    return () => clearTimeout(timer);
  }, [
    cartItems,
    appliedCoupon,
    selectedTip,
    customTipAmount,
    shippingAddress,
    fetchCheckoutQuote,
  ]);

  const updateCartItemQuantity = async (
    item: CartDisplayItem,
    newQuantity: number,
  ) => {
    if (!item.cartLineId || newQuantity < 1) {
      return;
    }

    const updateRequest = new UpdateCartRequestModel({
      restaurantId: item.restaurantId,
      quantity: newQuantity,
      addOns: item.addOns,
      price: Math.round(item.unitPrice * newQuantity),
    });

    try {
      await GlobalLoginAuth.loadAuthData();

      console.log(
        'Update cart payload:',
        updateRequest.toJson(),
      );

      const response = await fetch(
        `${GlobalApi.baseUrl}api/carts/${item.cartLineId}`,
        {
          method: 'PUT',
          headers: getApiHeaders(true),
          body: JSON.stringify(updateRequest.toJson()),
        },
      );

      const result = await response.json();
      console.log(
        'Update cart item response:',
        JSON.stringify(result, null, 2),
      );

      const cartResponse = GetCartResponseModel.fromJson(result);

      if (!response.ok || cartResponse.success === false || !cartResponse.data) {
        Alert.alert(
          'Update failed',
          cartResponse.message || 'Unable to update cart item.',
        );
        return;
      }

      applyCartData(cartResponse.data);
      loadCoupons();
    } catch (error) {
      console.log('updateCartItemQuantity failed:', error);
      Alert.alert('Update failed', 'Something went wrong. Please try again.');
    }
  };

  const handleIncreaseQuantity = (item: CartDisplayItem) => {
    updateCartItemQuantity(item, item.quantity + 1);
  };

  const handleDecreaseQuantity = (item: CartDisplayItem) => {
    if (item.quantity <= 1) {
      return;
    }

    updateCartItemQuantity(item, item.quantity - 1);
  };

  const deleteCartItem = async (cartLineId: number) => {
    try {
      await GlobalLoginAuth.loadAuthData();

      const response = await fetch(
        `${GlobalApi.baseUrl}api/carts/${cartLineId}`,
        {
          method: 'DELETE',
          headers: getApiHeaders(),
        },
      );

      const result = await response.json();
      console.log(
        'Delete cart item response:',
        JSON.stringify(result, null, 2),
      );

      const cartResponse = GetCartResponseModel.fromJson(result);

      if (!response.ok || cartResponse.success === false || !cartResponse.data) {
        Alert.alert(
          'Remove failed',
          cartResponse.message || 'Unable to remove item from cart.',
        );
        return;
      }

      applyCartData(cartResponse.data);
      loadCoupons();
    } catch (error) {
      console.log('deleteCartItem failed:', error);
      Alert.alert('Remove failed', 'Something went wrong. Please try again.');
    }
  };

  const handleDeleteCartItem = (cartLineId?: number) => {
    if (!cartLineId) {
      return;
    }

    Alert.alert(
      'Delete item',
      'Do you want to delete this item from your cart?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          style: 'destructive',
          onPress: () => deleteCartItem(cartLineId),
        },
      ],
    );
  };

  const displayCoupons = useMemo(
    () =>
      availableCoupons.map(coupon =>
        getCouponDisplayState(coupon, pricing.itemTotal),
      ),
    [availableCoupons, pricing.itemTotal],
  );

  useFocusEffect(
    useCallback(() => {
      fetchCart();

      const refreshCartScreen = () => {
        fetchCart({ silent: true });
      };

      const refreshInterval = setInterval(
        refreshCartScreen,
        CART_REFRESH_INTERVAL_MS,
      );

      const loadShippingAddress = async () => {
        if (route?.params?.shippingAddress) {
          const address = String(route.params.shippingAddress);
          setShippingAddress(address);
          await GlobalCart.setShippingAddress(address);
          return;
        }

        const apiAddress = await GlobalCart.refreshShippingAddressFromApi();
        setShippingAddress(apiAddress.trim());
      };

      loadShippingAddress();

      return () => clearInterval(refreshInterval);
    }, [fetchCart, route?.params?.shippingAddress]),
  );

  const handleOpenDeliveryAddress = () => {
    navigation.navigate('Address');
  };

  const applyCoupon = (coupon: StaticCoupon) => {
    if (!isCouponEligibleForCart(coupon, pricing.itemTotal)) {
      Alert.alert(
        'Coupon',
        coupon.reason ||
          `Minimum order amount is ${formatBillAmount(coupon.minOrderAmount)}.`,
      );
      return;
    }

    const discount = calculateCouponDiscount(coupon, pricing.itemTotal);

    setCouponCode(coupon.code);
    setAppliedCoupon({
      id: coupon.id,
      code: coupon.code,
      discount,
    });
  };

  const handleApplyCoupon = () => {
    const code = couponCode.trim().toUpperCase();

    if (!code) {
      Alert.alert('Coupon', 'Please enter a coupon code.');
      return;
    }

    const matchedCoupon = displayCoupons.find(
      coupon => coupon.code.toUpperCase() === code,
    );

    if (!matchedCoupon) {
      Alert.alert('Coupon', 'Invalid coupon code.');
      return;
    }

    applyCoupon(matchedCoupon);
  };

  const handleApplyAvailableCoupon = (coupon: StaticCoupon) => {
    applyCoupon(coupon);
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
  };

  const bestOfferCouponId = useMemo(() => {
    const eligibleCoupons = displayCoupons.filter(coupon => coupon.eligible);

    if (eligibleCoupons.length === 0) {
      return null;
    }

    return eligibleCoupons.reduce((best, coupon) =>
      coupon.estimatedDiscount > best.estimatedDiscount ? coupon : best,
    ).id;
  }, [displayCoupons]);

  const formatCouponSavings = (coupon: StaticCoupon) => {
    if (coupon.estimatedDiscount > 0) {
      return `${formatBillAmount(coupon.estimatedDiscount)} off`;
    }

    return formatCouponDiscount(coupon);
  };

  const isCouponApplied = (coupon: StaticCoupon) =>
    appliedCoupon?.code.toUpperCase() === coupon.code.toUpperCase();

  const appliedCouponDetails = useMemo(() => {
    if (!appliedCoupon) {
      return null;
    }

    return (
      displayCoupons.find(coupon => isCouponApplied(coupon)) ?? {
        id: appliedCoupon.id,
        code: appliedCoupon.code,
        discountType: 'FLAT' as const,
        discountValue: appliedCoupon.discount,
        maxDiscountAmount: 0,
        estimatedDiscount: appliedCoupon.discount,
        minOrderAmount: 0,
        eligible: true,
        reason: '',
      }
    );
  }, [appliedCoupon, displayCoupons]);

  const otherAvailableCoupons = useMemo(
    () => displayCoupons.filter(coupon => !isCouponApplied(coupon)),
    [appliedCoupon, displayCoupons],
  );

  const buildCreateOrderRequest = async () => {
    await GlobalLoginAuth.loadAuthData();
    await GlobalCart.loadRestaurantId();
    await GlobalCart.loadShippingAddress();

    const userId = GlobalLoginAuth.user?.id ?? 0;
    const restaurantId =
      GlobalCart.restaurantId ||
      cartItems.find(item => item.restaurantId > 0)?.restaurantId ||
      0;
    const addressId = GlobalCart.shippingAddressId;
    const tipAmount = getQuoteTipAmount(selectedTip, customTipAmount);

    if (cartItems.length === 0) {
      throw new Error('Your cart is empty.');
    }

    if (userId < 1) {
      throw new Error('Please log in to place an order.');
    }

    if (restaurantId < 1) {
      throw new Error('Restaurant information is missing.');
    }

    if (addressId < 1) {
      throw new Error('Please select a delivery address.');
    }

    const orderItems = cartItems.map(item =>
      new CreateOrderItemRequestModel({
        menuItemId: item.menuItemId,
        variantId: item.variantId,
        quantity: item.quantity,
        price: item.unitPrice,
        addons: item.addOns
          .filter(addOn => addOn.addonOptionId > 0)
          .map(
            addOn =>
              new CreateOrderAddonRequestModel({
                addonGroupId: addOn.addonGroupId ?? 0,
                addonOptionId: addOn.addonOptionId,
              }),
          )
          .filter(
            addOn => addOn.addonGroupId > 0 && addOn.addonOptionId > 0,
          ),
      }),
    );

    return new CreateOrderRequestModel({
      userId,
      restaurantId,
      addressId,
      source: 'MOBILE_APP',
      orderType: 'DELIVERY',
      couponCode: appliedCoupon?.code,
      paymentMethod: paymentMethod === 'cod' ? 'COD' : 'RAZORPAY',
      tipAmount: tipAmount > 0 ? tipAmount : undefined,
      items: orderItems,
    });
  };

  const confirmCodPayment = async (orderId: number) => {
    const payload = new OrderPaymentActionRequestModel({ orderId });
    console.log('COD confirm payload:', payload.toJson());

    const response = await fetch(
      `${GlobalApi.baseUrl}api/payments/cod/confirm`,
      {
        method: 'POST',
        headers: getApiHeaders(true),
        body: JSON.stringify(payload.toJson()),
      },
    );

    const result = await response.json();
    console.log('COD confirm response:', JSON.stringify(result, null, 2));

    const confirmResponse = PaymentActionResponseModel.fromJson(result);

    if (!response.ok || confirmResponse.success === false) {
      throw new Error(
        confirmResponse.message || 'Unable to confirm COD payment.',
      );
    }
  };

  const createRazorpayPaymentOrder = async (orderId: number) => {
    const payload = new OrderPaymentActionRequestModel({ orderId });
    console.log('Razorpay order payload:', payload.toJson());

    const response = await fetch(
      `${GlobalApi.baseUrl}api/payments/razorpay/order`,
      {
        method: 'POST',
        headers: getApiHeaders(true),
        body: JSON.stringify(payload.toJson()),
      },
    );

    const result = await response.json();
    console.log('Razorpay order response:', JSON.stringify(result, null, 2));

    const razorpayOrderResponse = RazorpayOrderResponseModel.fromJson(result);

    if (!response.ok || razorpayOrderResponse.success === false) {
      throw new Error(
        razorpayOrderResponse.message ||
          'Unable to create Razorpay payment order.',
      );
    }

    return razorpayOrderResponse;
  };

  const verifyRazorpayPayment = async (
    verifyRequest: RazorpayVerifyRequestModel,
  ) => {
    console.log('Razorpay verify payload:', verifyRequest.toJson());

    const response = await fetch(
      `${GlobalApi.baseUrl}api/payments/razorpay/verify`,
      {
        method: 'POST',
        headers: getApiHeaders(true),
        body: JSON.stringify(verifyRequest.toJson()),
      },
    );

    const result = await response.json();
    console.log('Razorpay verify response:', JSON.stringify(result, null, 2));

    const verifyResponse = RazorpayVerifyResponseModel.fromJson(result);

    if (!response.ok || verifyResponse.success === false) {
      throw new Error(
        verifyResponse.message || 'Payment verification failed. Please try again.',
      );
    }
  };

  const openRazorpayCheckout = async (razorpayOrderId: string) => {
    const user = GlobalLoginAuth.user;

    const razorpayResult = await RazorpayCheckout.open({
      key: 'rzp_test_SmSTwiKHdNaqc8',
      currency: 'INR',
      name: 'Restaurant App',
      description: 'Order Payment',
      order_id: razorpayOrderId,
      prefill: {
        name: user?.name || 'Customer',
        email: user?.email || '',
        contact: user?.phone || '',
      },
    });

    console.log(
      'Razorpay checkout result:',
      JSON.stringify(razorpayResult, null, 2),
    );

    return razorpayResult;
  };

  const placeOrder = async () => {
    if (isPlacingOrder) {
      return;
    }

    try {
      setIsPlacingOrder(true);

      const orderRequest = await buildCreateOrderRequest();
      console.log('Create order payload:', orderRequest.toJson());

      const response = await fetch(`${GlobalApi.baseUrl}api/orders`, {
        method: 'POST',
        headers: getApiHeaders(true),
        body: JSON.stringify(orderRequest.toJson()),
      });

      const result = await response.json();
      console.log('Create order response:', JSON.stringify(result, null, 2));

      const orderResponse = CreateOrderResponseModel.fromJson(result);

      if (!response.ok || orderResponse.success === false) {
        Alert.alert(
          'Order failed',
          orderResponse.message || 'Unable to place your order. Please try again.',
        );
        return;
      }

      const orderId = orderResponse.data?.orderId ?? 0;
      if (orderId < 1) {
        Alert.alert(
          'Order failed',
          'Order was created but order id was not returned by the server.',
        );
        return;
      }

      if (paymentMethod === 'cod') {
        await confirmCodPayment(orderId);
        navigation.navigate('OrderConfirmed', { orderId });
        return;
      }

      const razorpayOrderResponse = await createRazorpayPaymentOrder(orderId);
      const razorpayOrderId =
        razorpayOrderResponse.data?.razorpayOrderId ?? '';

      if (!razorpayOrderId) {
        Alert.alert(
          'Payment failed',
          'Razorpay order id was not returned by the server.',
        );
        return;
      }

      const razorpayResult = await openRazorpayCheckout(razorpayOrderId);

      const razorpayPaymentId = String(
        razorpayResult?.razorpay_payment_id ??
          razorpayResult?.razorpayPaymentId ??
          '',
      ).trim();
      const razorpaySignature = String(
        razorpayResult?.razorpay_signature ??
          razorpayResult?.razorpaySignature ??
          '',
      ).trim();
      const resolvedRazorpayOrderId = String(
        razorpayResult?.razorpay_order_id ??
          razorpayResult?.razorpayOrderId ??
          razorpayOrderId,
      ).trim();

      if (!razorpayPaymentId) {
        Alert.alert(
          'Payment pending',
          'Payment was not completed. Please try again.',
        );
        return;
      }

      await verifyRazorpayPayment(
        new RazorpayVerifyRequestModel({
          orderId,
          razorpayOrderId: resolvedRazorpayOrderId,
          razorpayPaymentId,
          razorpaySignature,
        }),
      );

      navigation.navigate('OrderConfirmed', { orderId });
    } catch (error: any) {
      if (error?.code === 'PAYMENT_CANCELLED') {
        Alert.alert('Payment cancelled', 'You cancelled the payment.');
        return;
      }

      Alert.alert(
        'Order failed',
        error?.message || error?.description || 'Something went wrong.',
      );
    } finally {
      setIsPlacingOrder(false);
    }
  };

  return (
    <View style={styles.container}>
      
      <GlobalBackButton onPress={() => goBackToDashboard(navigation)} />
      <Text style={styles.title}>Cart</Text>

      <View style={styles.overlay}>
        
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          contentContainerStyle={{
            paddingBottom: showBottomBar ? 160 : 40, // ✅ dynamic spacing
          }}
        >

          {isLoadingCart && cartItems.length === 0 ? (
            <View style={styles.cartLoadingContainer}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.cartLoadingText}>Loading cart...</Text>
            </View>
          ) : hasLoadedCart && cartItems.length === 0 ? (
            <Text style={styles.emptyCartText}>No items added</Text>
          ) : cartItems.length > 0 ? (
            <>
              {/* 🔥 ADDRESS */}
              <View style={styles.addressContainer}>
                <View style={styles.addressHeader}>
                  <Text style={styles.addressTitle}>Shipping Address</Text>

                  <TouchableOpacity onPress={handleOpenDeliveryAddress}>
                    <Image
                      source={require('../assets/images/Writeicon.png')}
                      style={styles.editIcon}
                    />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={styles.addressBox}
                  activeOpacity={0.85}
                  onPress={handleOpenDeliveryAddress}>
                  {shippingAddress.trim() ? (
                    <Text style={styles.addressDisplayText}>
                      {shippingAddress}
                    </Text>
                  ) : (
                    <Text style={styles.addressPlaceholderText}>
                      Please Enter Your Address
                    </Text>
                  )}
                </TouchableOpacity>

                <Text style={styles.orderSummaryText}>Order Summary</Text>
              </View>

              <View style={styles.dividerLine} />

              {/* 🔥 CART LIST */}
              {cartItems.map((item, index) => (
                <View key={item.cartLineId ?? `${item.menuItemId}-${index}`}>
                  <View style={styles.cartItem}>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => handleDeleteCartItem(item.cartLineId)}>
                      <Image
                        source={require('../assets/images/Delete.png')}
                        style={styles.deleteIcon}
                      />
                    </TouchableOpacity>

                    <Image source={item.image} style={styles.itemImage} />

                    <View style={styles.itemContent}>

                      <View style={styles.rowBetween}>
                        <Text style={styles.itemTitle}>{item.title}</Text>
                        <Text style={styles.itemPrice}>{item.price}</Text>
                      </View>

                      {item.addOns.length > 0 ? (
                        <Text style={styles.itemAddonsText}>
                          {item.addOns
                            .map(addOn => {
                              const label = addOn.name?.trim();
                              if (label) {
                                return addOn.price
                                  ? `${label} (+${formatBillAmount(addOn.price)})`
                                  : label;
                              }
                              return null;
                            })
                            .filter(Boolean)
                            .join(' · ') || 'Custom add-ons selected'}
                        </Text>
                      ) : null}

                      <View style={styles.rowBetween}>
                        <Text style={styles.itemDate}>{item.date}</Text>
                        <Text style={styles.itemCount}>
                          {item.quantity} {item.quantity === 1 ? 'item' : 'items'}
                        </Text>
                      </View>

                      <View style={styles.actionRow}>

                        <TouchableOpacity style={styles.cancelButton}>
                          <Text style={styles.cancelText}>Cancel Order</Text>
                        </TouchableOpacity>

                        <View style={styles.rightControls}>
                          <TouchableOpacity style={styles.editQtyButton}>
                            <Image
                              source={require('../assets/images/Writeicon.png')}
                              style={styles.editQtyIcon}
                            />
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={styles.minusButton}
                            onPress={() => handleDecreaseQuantity(item)}>
                            <Text style={styles.minusText}>-</Text>
                          </TouchableOpacity>

                          <View style={styles.qtyBox}>
                            <Text style={styles.qtyText}>{item.quantity}</Text>
                          </View>

                          <TouchableOpacity
                            style={styles.plusButton}
                            onPress={() => handleIncreaseQuantity(item)}>
                            <Text style={styles.plusText}>+</Text>
                          </TouchableOpacity>
                        </View>
                      </View>

                    </View>
                  </View>

                  {index !== cartItems.length - 1 && (
                    <View style={styles.dividerLine} />
                  )}
                </View>
              ))}

              <View style={[styles.dividerLine, { marginTop: 20 }]} />

              {/* COUPON */}
              <View style={styles.sectionContainer}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Coupon</Text>
                  <Text style={styles.sectionHint}>
                    {appliedCoupon
                      ? `${appliedCoupon.code} applied`
                      : 'Apply discount code'}
                  </Text>
                </View>

                <View style={styles.couponInputRow}>
                  <TextInput
                    style={[
                      styles.couponInput,
                      appliedCoupon && styles.couponInputApplied,
                    ]}
                    placeholder="Enter coupon code"
                    placeholderTextColor="#9CA3AF"
                    value={couponCode}
                    onChangeText={setCouponCode}
                    autoCapitalize="characters"
                  />
                  <TouchableOpacity
                    style={styles.couponApplyButton}
                    onPress={handleApplyCoupon}>
                    <Text style={styles.couponApplyText}>Apply</Text>
                  </TouchableOpacity>
                  {appliedCoupon ? (
                    <TouchableOpacity
                      style={styles.couponRemoveButton}
                      onPress={handleRemoveCoupon}>
                      <Text style={styles.couponApplyText}>Remove</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>

                {appliedCouponDetails ? (
                  <View style={styles.appliedCouponHighlightCard}>
                    <View style={styles.availableCouponInfo}>
                      <View style={styles.couponCodeRow}>
                        <Text style={styles.appliedCouponCodeText}>
                          {appliedCouponDetails.code}
                        </Text>
                        {bestOfferCouponId === appliedCouponDetails.id ? (
                          <View style={styles.bestOfferBadge}>
                            <Text style={styles.bestOfferBadgeText}>
                              Best offer
                            </Text>
                          </View>
                        ) : null}
                      </View>
                      <Text style={styles.availableCouponMeta}>
                        {formatCouponSavings(appliedCouponDetails)}
                      </Text>
                      {appliedCouponDetails.minOrderAmount > 0 ? (
                        <Text style={styles.availableCouponMeta}>
                          Min order{' '}
                          {formatBillAmount(appliedCouponDetails.minOrderAmount)}
                        </Text>
                      ) : null}
                    </View>
                    <View style={styles.appliedCouponStatusButton}>
                      <Text style={styles.appliedCouponStatusText}>Applied</Text>
                    </View>
                  </View>
                ) : null}

                {otherAvailableCoupons.length === 0 && !appliedCoupon ? (
                  <Text style={styles.couponEmptyText}>
                    No coupons available right now.
                  </Text>
                ) : null}

                {otherAvailableCoupons.map((coupon, index) => (
                  <View
                    key={coupon.id > 0 ? String(coupon.id) : `${coupon.code}-${index}`}
                    style={[
                      styles.availableCouponCard,
                      index > 0 || appliedCouponDetails
                        ? styles.availableCouponCardSpacing
                        : null,
                    ]}>
                    <View style={styles.availableCouponInfo}>
                      <Text style={styles.availableCouponCode}>
                        {coupon.code}
                      </Text>
                      <Text style={styles.availableCouponMeta}>
                        {formatCouponSavings(coupon)}
                      </Text>
                      <Text style={styles.availableCouponMeta}>
                        Min order {formatBillAmount(coupon.minOrderAmount)}
                      </Text>
                      {coupon.reason ? (
                        <Text style={styles.couponLimitText}>{coupon.reason}</Text>
                      ) : null}
                    </View>
                    <TouchableOpacity
                      style={[
                        styles.availableCouponApplyButton,
                        !coupon.eligible && styles.disabledCouponButton,
                      ]}
                      disabled={!coupon.eligible}
                      onPress={() => handleApplyAvailableCoupon(coupon)}>
                      <Text style={styles.availableCouponApplyText}>Apply</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>

              <View style={styles.sectionDivider} />

              {/* TIP */}
              <View style={styles.sectionContainer}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Tip</Text>
                  <Text style={styles.sectionHint}>
                    Optional amount for the restaurant team
                  </Text>
                </View>

                <View style={styles.tipRow}>
                  {TIP_OPTIONS.map((tipValue, index) => (
                    <TouchableOpacity
                      key={tipValue}
                      style={[
                        styles.tipButton,
                        index === 0 && styles.tipButtonWide,
                        selectedTip === tipValue && styles.tipButtonSelected,
                      ]}
                      onPress={() => {
                        Keyboard.dismiss();
                        setSelectedTip(tipValue);
                        setCustomTipAmount('');
                      }}>
                      <Text
                        style={[
                          styles.tipButtonText,
                          selectedTip === tipValue && styles.tipButtonTextSelected,
                        ]}>
                        {formatBillAmount(tipValue)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <TouchableOpacity
                  style={[
                    styles.customTipButton,
                    selectedTip === 'custom' && styles.tipButtonSelected,
                  ]}
                  onPress={() => setSelectedTip('custom')}>
                  <Text
                    style={[
                      styles.customTipText,
                      selectedTip === 'custom' && styles.tipButtonTextSelected,
                    ]}>
                    CUSTOM
                  </Text>
                </TouchableOpacity>

                {selectedTip === 'custom' ? (
                  <View style={styles.customTipInputRow}>
                    <TextInput
                      style={styles.customTipInput}
                      placeholder="Enter custom tip amount"
                      placeholderTextColor="#9CA3AF"
                      keyboardType="decimal-pad"
                      value={customTipAmount}
                      onChangeText={setCustomTipAmount}
                    />
                    <TouchableOpacity
                      style={styles.customTipDoneButton}
                      onPress={() => Keyboard.dismiss()}>
                      <Text style={styles.customTipDoneText}>Done</Text>
                    </TouchableOpacity>
                  </View>
                ) : null}
              </View>

              <View style={styles.sectionDivider} />

              {/* PAYMENT METHOD */}
              <View style={styles.sectionContainer}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Payment method</Text>
                  <Text style={styles.sectionHint}>Pay online securely</Text>
                </View>

                <View style={styles.paymentRow}>
                  <TouchableOpacity
                    style={[
                      styles.paymentButton,
                      styles.paymentButtonWide,
                      paymentMethod === 'online' && styles.paymentButtonSelected,
                    ]}
                    onPress={() => setPaymentMethod('online')}>
                    <Text
                      style={[
                        styles.paymentButtonText,
                        paymentMethod === 'online' &&
                          styles.paymentButtonTextSelected,
                      ]}>
                      Online
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.paymentButton,
                      paymentMethod === 'cod' && styles.paymentButtonSelected,
                    ]}
                    onPress={() => setPaymentMethod('cod')}>
                    <Text
                      style={[
                        styles.paymentButtonText,
                        paymentMethod === 'cod' && styles.paymentButtonTextSelected,
                      ]}>
                      COD
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.sectionDivider} />

              {/* 💰 BILL SUMMARY */}
              <View style={styles.billContainer}>

                <View style={styles.billRow}>
                  <Text style={styles.billLabel}>Item total</Text>
                  <Text style={styles.billValue}>
                    {formatBillAmount(pricing.itemTotal)}
                  </Text>
                </View>

                {pricing.couponDiscount > 0 ? (
                  <View style={styles.billRow}>
                    <Text style={styles.billLabel}>Coupon discount</Text>
                    <Text style={styles.billValue}>
                      -{formatBillAmount(pricing.couponDiscount)}
                    </Text>
                  </View>
                ) : null}

                <View style={styles.billRow}>
                  <Text style={styles.billLabel}>Delivery</Text>
                  <Text style={styles.billValue}>
                    {formatBillAmount(pricing.deliveryFee)}
                  </Text>
                </View>

                <View style={styles.billRow}>
                  <Text style={styles.billLabel}>Taxes</Text>
                  <Text style={styles.billValue}>
                    {formatBillAmount(pricing.taxTotal)}
                  </Text>
                </View>

                <View style={styles.taxBreakdownRow}>
                  <Text style={styles.taxBreakdownLabel}>CGST (2.5%)</Text>
                  <Text style={styles.taxBreakdownValue}>
                    {formatBillAmount(pricing.cgst)}
                  </Text>
                </View>

                <View style={styles.taxBreakdownRow}>
                  <Text style={styles.taxBreakdownLabel}>SGST (2.5%)</Text>
                  <Text style={styles.taxBreakdownValue}>
                    {formatBillAmount(pricing.sgst)}
                  </Text>
                </View>

                {pricing.tipAmount > 0 ? (
                  <View style={styles.billRow}>
                    <Text style={styles.billLabel}>Tip</Text>
                    <Text style={styles.billValue}>
                      {formatBillAmount(pricing.tipAmount)}
                    </Text>
                  </View>
                ) : null}

                <View style={styles.dottedDivider} />

                <View style={styles.billRow}>
                  <Text style={styles.totalLabel}>Payable</Text>
                  <Text style={styles.totalValue}>
                    {formatBillAmount(pricing.payable)}
                  </Text>
                </View>

                <TouchableOpacity
                  style={[
                    styles.addToCartButton,
                    isPlacingOrder && styles.addToCartButtonDisabled,
                  ]}
                  onPress={placeOrder}
                  disabled={isPlacingOrder}
                >
                  <Text style={styles.addToCartText}>
                    {isPlacingOrder ? 'Placing Order...' : 'Place Order'}
                  </Text>
                </TouchableOpacity>

              </View>
            </>
          ) : null}

        </ScrollView>

        {/* ✅ CONDITIONAL BOTTOM BAR */}
        {showBottomBar && (
          <GlobalBottomBar navigation={navigation} activeTab="Cart" />
        )}

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

  addressContainer: {
    marginTop: 16,
  },

  addressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  addressTitle: {
    fontSize: 24,
    fontFamily: 'LeagueSpartan-Bold',
    color: '#1F2937',
  },

  editIcon: {
    width: 18,
    height: 18,
    tintColor: Colors.primary,
  },

  addressBox: {
    backgroundColor: '#F3E9B5',
    borderRadius: 20,
    minHeight: 52,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 14,
    marginTop: 6,
    justifyContent: 'center',
  },

  addressDisplayText: {
    fontSize: 16,
    fontFamily: 'LeagueSpartan-Regular',
    color: '#1F2937',
    lineHeight: 22,
  },

  addressPlaceholderText: {
    fontSize: 16,
    fontFamily: 'LeagueSpartan-Regular',
    color: '#6B7280',
    lineHeight: 22,
  },

  orderSummaryText: {
    marginTop: 20,
    fontSize: 20,
    fontFamily: 'LeagueSpartan-Medium',
    color: '#1F2937',
  },

  emptyCartText: {
    marginTop: 40,
    fontSize: 18,
    fontFamily: 'LeagueSpartan-Medium',
    color: '#6B7280',
    textAlign: 'center',
  },

  cartLoadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
  },

  cartLoadingText: {
    marginTop: 12,
    fontSize: 16,
    fontFamily: 'LeagueSpartan-Regular',
    color: '#6B7280',
  },

  dividerLine: {
    height: 1,
    backgroundColor: '#FFD8C7',
    marginVertical: 15,
  },

  // 🔥 FIXED CART ITEM
  cartItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    position: 'relative',
    paddingTop: 28, // 🔥 space for delete icon
  },

  itemImage: {
    width: 72,
    height: 108,
    borderRadius: 20,
    marginTop: -16,
  },

  itemContent: {
    flex: 1,
    marginLeft: 12,
    paddingRight: 24, // 🔥 prevents overlap with delete
  },

  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  itemTitle: {
    fontSize: 20,
    fontFamily: 'LeagueSpartan-Medium',
    color: '#1F2937',
  },

  itemAddonsText: {
    marginTop: 4,
    fontSize: 14,
    fontFamily: 'LeagueSpartan-Regular',
    color: '#6B7280',
  },

  itemPrice: {
    fontSize: 20,
    fontFamily: 'LeagueSpartan-Medium',
    color: '#FF6D00',
  },

  itemDate: {
    fontSize: 14,
    fontFamily: 'LeagueSpartan-Light',
    color: '#1F2937',
    marginTop: 4,
  },

  itemCount: {
    fontSize: 14,
    color: '#6B7280',
  },

  actionRow: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  cancelButton: {
    backgroundColor: '#FFDECF',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 100,
  },

  cancelText: {
    fontSize: 14,
    fontFamily: 'LeagueSpartan-Medium',
    color: Colors.primary,
  },

  rightControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  editQtyButton: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },

  editQtyIcon: {
    width: 10,
    height: 10.7,
    tintColor: '#FF6D00',
  },

  minusButton: {
    width: 20,
    height: 20,
    borderRadius: 14,
    backgroundColor: '#F3D6C8',
    justifyContent: 'center',
    alignItems: 'center',
  },

  plusButton: {
    width: 20,
    height: 20,
    borderRadius: 14,
    backgroundColor: '#FF6D00',
    justifyContent: 'center',
    alignItems: 'center',
  },

  minusText: {
    color: '#fff',
    fontSize: 12,
  },

  plusText: {
    color: '#fff',
    fontSize: 12,
  },

  qtyBox: {
    width: 28,
    alignItems: 'center',
  },

  qtyText: {
    fontSize: 16,
    fontFamily: 'LeagueSpartan-Regular',
  },

  // 🔥 DELETE BUTTON FIXED
  deleteButton: {
    position: 'absolute',
    top: -8, // 👈 ABOVE CARD
    right: 0,
    zIndex: 20,
  },

  deleteIcon: {
    width: 18,
    height: 18,
    resizeMode: 'contain',
    tintColor: '#FF6D00',
  },
  billContainer: {
    marginTop: 10,
  },

  sectionContainer: {
    marginTop: 4,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },

  sectionTitle: {
    fontSize: 18,
    fontFamily: 'LeagueSpartan-Bold',
    color: '#1F2937',
  },

  sectionHint: {
    fontSize: 12,
    fontFamily: 'LeagueSpartan-Regular',
    color: '#9CA3AF',
    flexShrink: 1,
    marginLeft: 12,
    textAlign: 'right',
  },

  sectionDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 18,
  },

  couponInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },

  couponInput: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderColor: '#3B82F6',
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 16,
    fontFamily: 'LeagueSpartan-Bold',
    color: '#1F2937',
    backgroundColor: '#FFFFFF',
  },

  couponInputApplied: {
    borderColor: '#D1D5DB',
  },

  couponApplyButton: {
    marginLeft: 10,
    backgroundColor: '#FFDECF',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },

  couponRemoveButton: {
    marginLeft: 8,
    backgroundColor: '#FFDECF',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },

  couponApplyText: {
    fontSize: 16,
    fontFamily: 'LeagueSpartan-Medium',
    color: Colors.primary,
  },

  availableCouponCard: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#D1D5DB',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
  },

  appliedCouponCard: {
    backgroundColor: Colors.greenLightCard,
    borderColor: '#CFE8C4',
  },

  appliedCouponHighlightCard: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#9CA3AF',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.greenLightCard,
    marginTop: 4,
  },

  appliedCouponCodeText: {
    fontSize: 16,
    fontFamily: 'LeagueSpartan-Bold',
    color: '#1B3C33',
  },

  availableCouponCardSpacing: {
    marginTop: 10,
  },

  availableCouponInfo: {
    flex: 1,
    marginRight: 12,
  },

  couponCodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 4,
    gap: 8,
  },

  availableCouponCode: {
    fontSize: 16,
    fontFamily: 'LeagueSpartan-Bold',
    color: '#1F2937',
  },

  bestOfferBadge: {
    backgroundColor: Colors.greenLight,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },

  bestOfferBadgeText: {
    fontSize: 11,
    fontFamily: 'LeagueSpartan-Medium',
    color: Colors.greenDark,
  },

  availableCouponMeta: {
    fontSize: 13,
    fontFamily: 'LeagueSpartan-Regular',
    color: '#6B7280',
  },

  couponLimitText: {
    marginTop: 4,
    fontSize: 12,
    fontFamily: 'LeagueSpartan-Regular',
    color: '#9CA3AF',
  },

  couponEmptyText: {
    marginTop: 8,
    fontSize: 14,
    fontFamily: 'LeagueSpartan-Regular',
    color: '#9CA3AF',
  },

  availableCouponApplyButton: {
    backgroundColor: '#E8DFAE',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },

  appliedCouponStatusButton: {
    backgroundColor: '#D4C4A0',
    borderRadius: 24,
    paddingHorizontal: 22,
    paddingVertical: 12,
    minWidth: 96,
    alignItems: 'center',
  },

  appliedCouponStatusText: {
    fontSize: 15,
    fontFamily: 'LeagueSpartan-Bold',
    color: '#1B3C33',
  },

  disabledCouponButton: {
    opacity: 0.6,
  },

  availableCouponApplyText: {
    fontSize: 14,
    fontFamily: 'LeagueSpartan-Medium',
    color: '#1F2937',
  },

  tipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },

  tipButton: {
    flex: 1,
    backgroundColor: '#FFDECF',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },

  tipButtonWide: {
    flex: 1.4,
  },

  tipButtonSelected: {
    backgroundColor: Colors.primary,
  },

  tipButtonText: {
    fontSize: 15,
    fontFamily: 'LeagueSpartan-Medium',
    color: '#1F2937',
  },

  tipButtonTextSelected: {
    color: '#FFFFFF',
  },

  customTipButton: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginBottom: 10,
  },

  customTipText: {
    fontSize: 15,
    fontFamily: 'LeagueSpartan-Medium',
    color: '#1F2937',
  },

  customTipInput: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 16,
    fontFamily: 'LeagueSpartan-Regular',
    color: '#1F2937',
    backgroundColor: '#FFFFFF',
  },

  customTipInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  customTipDoneButton: {
    height: 44,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  customTipDoneText: {
    fontSize: 14,
    fontFamily: 'LeagueSpartan-SemiBold',
    color: '#FFFFFF',
  },

  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  paymentButton: {
    flex: 1,
    backgroundColor: '#FFDECF',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },

  paymentButtonWide: {
    flex: 2,
  },

  paymentButtonSelected: {
    backgroundColor: Colors.primary,
  },

  paymentButtonText: {
    fontSize: 16,
    fontFamily: 'LeagueSpartan-Medium',
    color: '#1F2937',
  },

  paymentButtonTextSelected: {
    color: '#FFFFFF',
  },

  taxBreakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 4,
    paddingLeft: 12,
  },

  taxBreakdownLabel: {
    fontSize: 15,
    fontFamily: 'LeagueSpartan-Regular',
    color: '#6B7280',
  },

  taxBreakdownValue: {
    fontSize: 15,
    fontFamily: 'LeagueSpartan-Regular',
    color: '#6B7280',
  },

billRow: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginVertical: 8,
},

billLabel: {
  fontSize: 18,
  fontFamily: 'LeagueSpartan-Medium',
  color: '#1F2937',
},

billValue: {
  fontSize: 18,
  fontFamily: 'LeagueSpartan-Medium',
  color: '#1F2937',
},

// 🔸 dotted line
dottedDivider: {
  borderBottomWidth: 1,
  borderStyle: 'dashed',
  borderColor: '#F1C6B5',
  marginVertical: 10,
},

// 🔥 TOTAL (BOLD)
totalLabel: {
  fontSize: 20,
  fontFamily: 'LeagueSpartan-Bold',
  color: '#1F2937',
},

totalValue: {
  fontSize: 20,
  fontFamily: 'LeagueSpartan-Bold',
  color: '#1F2937',
},
addToCartButton: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',

  width: 180,              // 👈 exact width
  height: 33,              // 👈 exact height

  borderRadius: 50,        // 👈 pill shape
  backgroundColor: '#FF6D00',

  borderWidth: 1.2,        // 👈 from figma
  borderColor: '#FF6D00',

  alignSelf: 'center',     // 👈 CENTER BUTTON

  marginTop: 30,
  marginBottom: 30,
},
addToCartButtonDisabled: {
  opacity: 0.7,
},

addToCartText: {
  fontSize: 20,                         // 👈 exact
  lineHeight: 24,                       // 👈 close to 23.57
  fontFamily: 'LeagueSpartan-Medium',   // 👈 IMPORTANT
  letterSpacing: -0.3,                  // 👈 approx -0.5%
  color: '#FFFFFF',                     // 👈 exact white
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