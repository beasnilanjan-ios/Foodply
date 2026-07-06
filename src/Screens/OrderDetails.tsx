import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
  Platform,
  Share,
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
import { isCompletedOrderStatus } from '../Models/MyOrdersModel';

const { width, height } = Dimensions.get('window');
const isTablet = Math.min(width, height) >= 600;

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

const mapOrderItems = (items: any[] = []): OrderItem[] =>
  items.map(item => {
    const menuItem = item?.menuItem ?? {};
    const variant = item?.variant ?? {};
    const addonLabels = Array.isArray(item?.addons)
      ? item.addons
          .map((addon: any) =>
            typeof addon === 'string'
              ? addon
              : String(
                  addon?.addonOptionName ??
                    addon?.name ??
                    addon?.addonGroupName ??
                    '',
                ),
          )
          .filter(Boolean)
      : [];

    const descriptionParts = [
      variant?.name ? String(variant.name) : '',
      ...addonLabels,
    ].filter(Boolean);

    return {
      id: Number(item?.id ?? 0),
      menuItemId: Number(item?.menuItemId ?? menuItem?.id ?? 0),
      name: String(menuItem?.name ?? item?.name ?? ''),
      imageUrl: String(menuItem?.imageUrl ?? item?.imageUrl ?? ''),
      variantName: String(variant?.name ?? item?.variantName ?? ''),
      addons: descriptionParts,
      quantity: Number(item?.quantity ?? 0),
      unitPrice: Number(
        item?.price ?? item?.unitPrice ?? menuItem?.price ?? 0,
      ),
      totalPrice: Number(item?.totalPrice ?? 0),
    };
  });

export default function OrderDetails({ navigation, route }: any) {
  const orderId = Number(route?.params?.orderId ?? 0);
  const isReOrder = Boolean(route?.params?.isReOrder);
  const [loading, setLoading] = useState(false);
  const [orderData, setOrderData] = useState<DeliveryOrderDetails | null>(null);
  const [invoiceData, setInvoiceData] = useState<OrderInvoiceDataModel | null>(
    null,
  );
  const [invoiceError, setInvoiceError] = useState<string | null>(null);

  const fetchOrderInvoice = useCallback(
    async (id: number): Promise<{ ok: boolean; message?: string }> => {
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
          const message =
            invoiceResponse.message || 'Failed to load invoice';
          setInvoiceData(null);
          setInvoiceError(message);
          return { ok: false, message };
        }

        if (invoiceResponse.data) {
          setInvoiceData(invoiceResponse.data);
          setInvoiceError(null);
          return { ok: true };
        }

        const message = 'Invoice is not available for this order';
        setInvoiceData(null);
        setInvoiceError(message);
        return { ok: false, message };
      } catch (error) {
        console.log('fetchOrderInvoice failed:', error);
        const message = 'Unable to load invoice';
        setInvoiceData(null);
        setInvoiceError(message);
        return { ok: false, message };
      }
    },
    [],
  );

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
      setInvoiceError(null);

      const invoiceResult = await fetchOrderInvoice(orderId);
      if (!invoiceResult.ok && !result.data.billing) {
        Alert.alert('FoodyPly', invoiceResult.message || 'Failed to load invoice');
      }
    } catch (error) {
      console.log('fetchOrderDetails failed:', error);
      Alert.alert('FoodyPly', 'Unable to connect to server');
    } finally {
      setLoading(false);
    }
  }, [fetchOrderInvoice, navigation, orderId]);

  const handleReOrder = useCallback(async () => {
    if (!orderId) {
      return;
    }

    try {
      setLoading(true);
      await GlobalLoginAuth.loadAuthData();

      const token = GlobalLoginAuth.accessToken || GlobalLoginAuth.token;
      if (!token) {
        Alert.alert('FoodyPly', 'Please login to re-order');
        return;
      }

      const response = await fetch(`${GlobalApi.baseUrl}api/orders/reorder`, {
        method: 'POST',
        headers: getApiHeaders(true),
        body: JSON.stringify({ orderId }),
      });

      const result = await response.json();

      if (!response.ok || result?.success === false) {
        Alert.alert('FoodyPly', result?.message || 'Failed to re-order');
        return;
      }

      navigation.goBack();
    } catch (error) {
      console.log('handleReOrder failed:', error);
      Alert.alert('FoodyPly', 'Unable to connect to server');
    } finally {
      setLoading(false);
    }
  }, [navigation, orderId]);

  const handleDownloadInvoice = useCallback(async () => {
    if (!orderId) {
      return;
    }

    try {
      setLoading(true);
      await GlobalLoginAuth.loadAuthData();

      const response = await fetch(
        `${GlobalApi.baseUrl}api/orders/${orderId}/invoice/download`,
        {
          method: 'GET',
          headers: {
            ...getApiHeaders(),
            Accept: '*/*',
          },
        },
      );

      const contentType = response.headers.get('content-type') ?? '';

      if (!response.ok) {
        const result = contentType.includes('application/json')
          ? await response.json().catch(() => null)
          : null;
        Alert.alert(
          'FoodyPly',
          result?.message || 'Failed to download invoice',
        );
        return;
      }

      const isFileResponse =
        contentType.includes('application/pdf') ||
        contentType.includes('application/octet-stream') ||
        contentType.includes('image/');

      if (isFileResponse) {
        const arrayBuffer = await response.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);
        let binary = '';
        const chunkSize = 0x8000;

        for (let i = 0; i < bytes.length; i += chunkSize) {
          binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
        }

        const base64 = global.btoa(binary);
        const mimeType = contentType.split(';')[0] || 'application/pdf';
        const title = orderData?.order?.orderNumber
          ? `Invoice ${orderData.order.orderNumber}`
          : 'Invoice';

        await Share.share(
          Platform.OS === 'ios'
            ? { title, url: `data:${mimeType};base64,${base64}` }
            : { title, message: title },
        );
        return;
      }

      if (contentType.includes('application/json')) {
        const result = await response.json();
        const fileUrl =
          result?.data?.downloadUrl ??
          result?.data?.pdfUrl ??
          result?.downloadUrl ??
          result?.pdfUrl;

        if (fileUrl) {
          await Linking.openURL(String(fileUrl));
          return;
        }

        Alert.alert(
          'FoodyPly',
          result?.message || 'Invoice is not available for this order',
        );
        return;
      }

      Alert.alert('FoodyPly', 'Invoice is not available for this order');
    } catch (error) {
      console.log('handleDownloadInvoice failed:', error);
      Alert.alert('FoodyPly', 'Unable to download invoice');
    } finally {
      setLoading(false);
    }
  }, [orderData?.order?.orderNumber, orderId]);

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
  const summary = useMemo(() => {
    const source = invoiceData ?? billing;
    if (!source) {
      return null;
    }

    return new OrderInvoiceDataModel({
      itemTotal: source.itemTotal,
      deliveryCharge: source.deliveryCharge,
      packagingCharge: source.packagingCharge,
      discountAmount: source.discountAmount,
      taxAmount: source.taxAmount,
      cgstAmount: Number((source as OrderInvoiceDataModel).cgstAmount ?? 0),
      sgstAmount: Number((source as OrderInvoiceDataModel).sgstAmount ?? 0),
      tipAmount: Number((source as OrderInvoiceDataModel).tipAmount ?? 0),
      finalAmount: source.finalAmount,
    });
  }, [billing, invoiceData]);

  const taxTotal =
    summary?.taxAmount ??
    (summary?.cgstAmount ?? 0) + (summary?.sgstAmount ?? 0);
  const cgstAmount = summary?.cgstAmount ?? 0;
  const sgstAmount = summary?.sgstAmount ?? 0;
  const tipAmount = summary?.tipAmount ?? 0;
  const showDownloadInvoice =
    isReOrder ||
    isCompletedOrderStatus(orderData?.order?.status ?? '') ||
    isCompletedOrderStatus(orderData?.delivery?.status ?? '');
  const showReOrder = showDownloadInvoice;

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
          {showDownloadInvoice ? (
            <TouchableOpacity
              style={styles.downloadInvoiceRow}
              activeOpacity={0.8}
              onPress={handleDownloadInvoice}
            >
              <Text style={styles.downloadInvoiceText}>Download Invoice</Text>
              <Text style={styles.downloadIconSmall}>↓</Text>
            </TouchableOpacity>
          ) : null}

          <DeliveryOrderItemsListComponent items={items} itemQty={totalQty} />

          <View style={styles.summaryRow}>
            <View style={styles.summaryCard}>
              <Text style={styles.cardTitle}>Order Summary</Text>

              {invoiceError && !invoiceData ? (
                <Text style={styles.invoiceErrorText}>
                  {orderData?.billing
                    ? `${invoiceError}. Showing order billing instead.`
                    : invoiceError}
                </Text>
              ) : null}

              {summary ? (
                <>
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

              {taxTotal > 0 ? (
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Taxes</Text>
                  <Text style={styles.summaryValue}>
                    ₹{taxTotal.toFixed(2)}
                  </Text>
                </View>
              ) : null}

              {cgstAmount > 0 ? (
                <View style={styles.taxBreakdownRow}>
                  <Text style={styles.taxBreakdownLabel}>CGST</Text>
                  <Text style={styles.taxBreakdownValue}>
                    ₹{cgstAmount.toFixed(2)}
                  </Text>
                </View>
              ) : null}

              {sgstAmount > 0 ? (
                <View style={styles.taxBreakdownRow}>
                  <Text style={styles.taxBreakdownLabel}>SGST</Text>
                  <Text style={styles.taxBreakdownValue}>
                    ₹{sgstAmount.toFixed(2)}
                  </Text>
                </View>
              ) : null}

              {tipAmount > 0 ? (
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Tip</Text>
                  <Text style={styles.summaryValue}>
                    ₹{tipAmount.toFixed(2)}
                  </Text>
                </View>
              ) : null}

              <View style={styles.divider} />

              <View style={styles.summaryItem}>
                <Text style={styles.totalText}>Total Amount</Text>
                <Text style={styles.totalAmount}>
                  ₹{(summary?.finalAmount ?? 0).toFixed(2)}
                </Text>
              </View>
                </>
              ) : (
                <Text style={styles.invoiceErrorText}>
                  {invoiceError || 'Order summary is not available.'}
                </Text>
              )}
            </View>
          </View>

          {showReOrder ? (
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[GlobalStyles.buttonPrimary, styles.reorderButton]}
                activeOpacity={0.8}
                disabled={loading}
                onPress={handleReOrder}
              >
                <Text style={GlobalStyles.buttonPrimaryText}>Re-order</Text>
              </TouchableOpacity>
            </View>
          ) : null}
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

  invoiceErrorText: {
    fontSize: 12,
    color: '#c0392b',
    marginBottom: 10,
    lineHeight: 18,
  },

  downloadInvoiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    marginBottom: 12,
    paddingVertical: 4,
    paddingHorizontal: 2,
  },

  downloadInvoiceText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
    fontFamily: 'LeagueSpartan-Medium',
  },

  downloadIconSmall: {
    marginLeft: 6,
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary,
    lineHeight: 18,
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

  taxBreakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 3,
    paddingLeft: 12,
  },

  taxBreakdownLabel: {
    fontSize: 12,
    color: '#777',
  },

  taxBreakdownValue: {
    fontSize: 12,
    fontWeight: '500',
    color: '#555',
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
