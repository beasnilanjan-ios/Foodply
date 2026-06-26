import AsyncStorage from '@react-native-async-storage/async-storage';
import GlobalApi from './GlobalApi';
import GlobalLoginAuth from './GlobalLoginAuth';
import { GetCartResponseModel } from '../Models/CartModel';

type CartCountListener = (count: number) => void;
const RESTAURANT_ID_KEY = 'cartRestaurantId';
const SHIPPING_ADDRESS_KEY = 'selectedShippingAddress';
const SHIPPING_ADDRESS_ID_KEY = 'selectedShippingAddressId';

class GlobalCart {
  private static instance: GlobalCart;
  itemCount = 0;
  restaurantId = 0;
  shippingAddress = '';
  shippingAddressId = 0;
  private listeners = new Set<CartCountListener>();

  private constructor() {}

  static getInstance(): GlobalCart {
    if (!GlobalCart.instance) {
      GlobalCart.instance = new GlobalCart();
    }
    return GlobalCart.instance;
  }

  subscribe(listener: CartCountListener) {
    this.listeners.add(listener);
    listener(this.itemCount);

    return () => {
      this.listeners.delete(listener);
    };
  }

  setItemCount(count: number) {
    this.itemCount = Math.max(0, count);
    this.listeners.forEach(listener => listener(this.itemCount));
  }

  setRestaurantId(restaurantId: number) {
    this.restaurantId = Math.max(0, restaurantId);

    if (restaurantId > 0) {
      AsyncStorage.setItem(RESTAURANT_ID_KEY, String(restaurantId)).catch(error => {
        console.log('GlobalCart.setRestaurantId storage failed:', error);
      });
    }
  }

  async loadRestaurantId(): Promise<number> {
    try {
      const stored = await AsyncStorage.getItem(RESTAURANT_ID_KEY);
      if (stored) {
        this.restaurantId = Number(stored) || 0;
      }
    } catch (error) {
      console.log('GlobalCart.loadRestaurantId failed:', error);
    }

    return this.restaurantId;
  }

  clearRestaurantId() {
    this.restaurantId = 0;
    AsyncStorage.removeItem(RESTAURANT_ID_KEY).catch(error => {
      console.log('GlobalCart.clearRestaurantId failed:', error);
    });
  }

  async setShippingAddress(address: string, addressId?: number) {
    this.shippingAddress = address.trim();
    this.shippingAddressId = Math.max(0, addressId ?? 0);

    try {
      await AsyncStorage.multiSet([
        [SHIPPING_ADDRESS_KEY, this.shippingAddress],
        [SHIPPING_ADDRESS_ID_KEY, String(this.shippingAddressId)],
      ]);
    } catch (error) {
      console.log('GlobalCart.setShippingAddress storage failed:', error);
    }
  }

  async loadShippingAddress(): Promise<string> {
    try {
      const entries = await AsyncStorage.multiGet([
        SHIPPING_ADDRESS_KEY,
        SHIPPING_ADDRESS_ID_KEY,
      ]);

      const addressValue = entries.find(entry => entry[0] === SHIPPING_ADDRESS_KEY)?.[1];
      const addressIdValue = entries.find(
        entry => entry[0] === SHIPPING_ADDRESS_ID_KEY,
      )?.[1];

      this.shippingAddress = addressValue?.trim() ?? '';
      this.shippingAddressId = Number(addressIdValue) || 0;
    } catch (error) {
      console.log('GlobalCart.loadShippingAddress failed:', error);
    }

    return this.shippingAddress;
  }

  async refreshShippingAddressFromApi(): Promise<string> {
    try {
      await GlobalLoginAuth.loadAuthData();

      const token = GlobalLoginAuth.accessToken || GlobalLoginAuth.token;
      if (!token) {
        return '';
      }

      await this.loadShippingAddress();

      const response = await fetch(`${GlobalApi.baseUrl}api/users/me/addresses`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'X-Client-Type': 'web',
          Authorization: `Bearer ${token}`,
        },
      });

      const apiResult = await response.json();

      if (!response.ok || apiResult?.success === false) {
        return this.shippingAddress;
      }

      const addresses = Array.isArray(apiResult?.addresses)
        ? apiResult.addresses
        : [];

      if (addresses.length === 0) {
        return '';
      }

      let selectedAddress = addresses[0];

      if (this.shippingAddressId > 0) {
        const storedAddress = addresses.find(
          (item: { id?: number }) => Number(item?.id) === this.shippingAddressId,
        );
        if (storedAddress) {
          selectedAddress = storedAddress;
        } else {
          const defaultAddress = addresses.find(
            (item: { isDefault?: boolean }) => Boolean(item?.isDefault),
          );
          if (defaultAddress) {
            selectedAddress = defaultAddress;
          }
        }
      } else {
        const defaultAddress = addresses.find(
          (item: { isDefault?: boolean }) => Boolean(item?.isDefault),
        );
        if (defaultAddress) {
          selectedAddress = defaultAddress;
        }
      }

      const addressText = String(selectedAddress?.address ?? '').trim();
      const addressId = Number(selectedAddress?.id ?? 0);

      if (addressText) {
        await this.setShippingAddress(addressText, addressId);
      }

      return addressText;
    } catch (error) {
      console.log('GlobalCart.refreshShippingAddressFromApi failed:', error);
      return this.shippingAddress;
    }
  }

  async refreshCount() {
    try {
      await GlobalLoginAuth.loadAuthData();

      const token = GlobalLoginAuth.accessToken || GlobalLoginAuth.token;
      if (!token) {
        this.setItemCount(0);
        return;
      }

      const headers: Record<string, string> = {
        Accept: 'application/json',
        'X-Client-Type': 'mobile',
        Authorization: `Bearer ${token}`,
      };

      const response = await fetch(`${GlobalApi.baseUrl}api/carts`, {
        method: 'GET',
        headers,
      });

      const result = await response.json();
      const cartResponse = GetCartResponseModel.fromJson(result);

      if (!response.ok || cartResponse.success === false || !cartResponse.data) {
        return;
      }

      const totalCount = cartResponse.data.items.reduce(
        (sum, item) => sum + item.quantity,
        0,
      );

      if (cartResponse.data.restaurantId > 0) {
        this.setRestaurantId(cartResponse.data.restaurantId);
      } else {
        await this.loadRestaurantId();
      }

      this.setItemCount(totalCount);
    } catch (error) {
      console.log('GlobalCart.refreshCount failed:', error);
    }
  }
}

export default GlobalCart.getInstance();
