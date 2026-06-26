import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';

import Colors from '../assets/Colors/Colors';
import GlobalStyles from '../assets/Styles/GlobalStyles';
import GlobalBackButton from '../GlobalContainer/GlobalBackButton';
import GlobalApi from '../GlobalContainer/GlobalApi';
import GlobalLoginAuth from '../GlobalContainer/GlobalLoginAuth';
import GlobalLoader from '../GlobalContainer/GlobalLoader';
import DeliveryOrderItemsListComponent from '../GlobalContainer/DeliveryOrderItemsListComponent';
import { DeliveryOrderDetails } from '../Models/DeliveryOrderDetails/DeliveryOrderDetails';
import { DeliveryOrderDetailsResponse } from '../Models/DeliveryOrderDetails/DeliveryOrderDetailsResponse';
import { OrderItem } from '../Models/DeliveryOrderDetails/OrderItem';
import {
  OrderInvoiceDataModel,
  OrderInvoiceResponseModel,
} from '../Models/OrderInvoiceModel';

const { width, height } = Dimensions.get('window');
const isTablet = Math.min(width, height) >= 600;

const getApiHeaders = (): Record<string, string> => {
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

const mapOrderItems = (items: OrderItem[] = []): OrderItem[] =>
  items.map(item => ({
    ...item,
    addons: (item.addons ?? []).map(addon =>
      typeof addon === 'string' ? addon : String((addon as any)?.name ?? ''),
    ),
  }));

export default function OrderDetails({ navigation, route }: any) {
  const orderId = Number(route?.params?.orderId ?? 0);
  const [loading, setLoading] = useState(false);
  const [orderData, setOrderData] = useState<DeliveryOrderDetails | null>(null);
  const [invoiceData, setInvoiceData] = useState<OrderInvoiceDataModel | null>(
    null,
  );

  const fetchOrderInvoice = useCallback(async (id: number) => {
    try {
      const response = await fetch(
        `${GlobalApi.baseUrl}api/orders/${id}/invoice`,
        {
          method: 'GET',
          headers: getApiHeaders(),
        },
      );

      const result = await response.json();
      console.log('Order invoice response:', JSON.stringify(result, null, 2));

      const invoiceResponse = OrderInvoiceResponseModel.fromJson(result);

      if (!response.ok || invoiceResponse.success === false) {
        console.log(
          'Order invoice failed:',
          invoiceResponse.message || 'Failed to load invoice',
        );
        return;
      }

      if (invoiceResponse.data) {
        setInvoiceData(invoiceResponse.data);
      }
    } catch (error) {
      console.log('fetchOrderInvoice failed:', error);
    }
  }, []);

  const fetchOrderDetails = useCallback(async () => {
    if (!orderId) {
      Alert.alert('FoodyPly', 'Order not found');
      navigation.goBack();
      return;
    }

    try {
      setLoading(true);
      await GlobalLoginAuth.loadAuthData();

      const token = GlobalLoginAuth.accessToken || GlobalLoginAuth.token;
      if (!token) {
        Alert.alert('FoodyPly', 'Please login to view order details');
        navigation.goBack();
        return;
      }

      const response = await fetch(
        `${GlobalApi.baseUrl}api/orders/${orderId}`,
        {
          method: 'GET',
          headers: getApiHeaders(),
        },
      );

      const result: DeliveryOrderDetailsResponse = await response.json();
      console.log('Order details response:', JSON.stringify(result, null, 2));

      if (!response.ok || !result.success || !result.data) {
        Alert.alert(
          'FoodyPly',
          result.message || 'Failed to load order details',
        );
        return;
      }

      setOrderData(result.data);
      await fetchOrderInvoice(orderId);
    } catch (error) {
      console.log('fetchOrderDetails failed:', error);
      Alert.alert('FoodyPly', 'Unable to connect to server');
    } finally {
      setLoading(false);
    }
  }, [fetchOrderInvoice, navigation, orderId]);

  useEffect(() => {
    fetchOrderDetails();
  }, [fetchOrderDetails]);

  const items = useMemo(
    () => mapOrderItems(orderData?.items ?? []),
    [orderData?.items],
  );

  const totalQty = useMemo(
    () =>
      orderData?.itemsSummary?.totalQuantity ??
      items.reduce((sum, item) => sum + item.quantity, 0),
    [items, orderData?.itemsSummary?.totalQuantity],
  );

  const billing = orderData?.billing;
  const summary = invoiceData ?? billing;

  return (
    <View style={styles.container}>
      <GlobalLoader visible={loading} text="Please Wait" />

      <GlobalBackButton onPress={() => navigation.goBack()} />

      <Text style={styles.title}>Order Details</Text>

      <View style={styles.overlay}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          <DeliveryOrderItemsListComponent items={items} itemQty={totalQty} />

          <View style={styles.summaryRow}>
            <View style={styles.summaryCard}>
              <Text style={styles.cardTitle}>Order Summary</Text>

              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Item Total</Text>
                <Text style={styles.summaryValue}>
                  ₹{(summary?.itemTotal ?? 0).toFixed(2)}
                </Text>
              </View>

              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Delivery Charges</Text>
                <Text style={styles.summaryValue}>
                  ₹{(summary?.deliveryCharge ?? 0).toFixed(2)}
                </Text>
              </View>

              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Packaging Charges</Text>
                <Text style={styles.summaryValue}>
                  ₹{(summary?.packagingCharge ?? 0).toFixed(2)}
                </Text>
              </View>

              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Discount</Text>
                <Text style={styles.summaryValue}>
                  -₹{(summary?.discountAmount ?? 0).toFixed(2)}
                </Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.summaryItem}>
                <Text style={styles.totalText}>Total Amount</Text>
                <Text style={styles.totalAmount}>
                  ₹{(summary?.finalAmount ?? 0).toFixed(2)}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[GlobalStyles.buttonPrimary, styles.reorderButton]}
              activeOpacity={0.8}
              onPress={() => {
                console.log('Re-order clicked');
              }}
            >
              <Text style={GlobalStyles.buttonPrimaryText}>Re-order</Text>
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
    paddingTop: 100,
    backgroundColor: Colors.primary,
    alignItems: 'center',
  },

  title: {
    color: '#fff',
    fontSize: isTablet ? 32 : 28,
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

  summaryRow: {
    marginTop: 20,
  },

  summaryCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    elevation: 3,
  },

  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
  },

  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 5,
  },

  summaryLabel: {
    fontSize: 13,
    color: '#555',
  },

  summaryValue: {
    fontSize: 13,
    fontWeight: '600',
  },

  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 10,
  },

  totalText: {
    fontSize: 14,
    fontWeight: '700',
  },

  totalAmount: {
    fontSize: 14,
    fontWeight: '700',
  },

  buttonContainer: {
    marginTop: 20,
    marginBottom: 10,
  },

  reorderButton: {
    width: '100%',
  },
});
