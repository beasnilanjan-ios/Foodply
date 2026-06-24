import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  Dimensions,
  ScrollView,
  TouchableOpacity,
} from 'react-native';

import Colors from '../assets/Colors/Colors';
import GlobalStyles from '../assets/Styles/GlobalStyles';
import GlobalBottomBar from '../GlobalContainer/GlobalBottomBar';
import GlobalTopBar from '../GlobalContainer/GlobalTopBar';
import DeliveryOrderItemsListComponent from '../GlobalContainer/DeliveryOrderItemsListComponent';

const { width, height } = Dimensions.get('window');
const isTablet = Math.min(width, height) >= 600;

export default function Favorites({ navigation }: any) {

  const dummyItems = [
    {
      id: 1,
      menuItemId: 101,
      name: 'Chicken Biryani',
      quantity: 2,
      unitPrice: 199,
      totalPrice: 398,
      imageUrl: '',
      variantName: 'Regular',
      addons: ['Extra Masala', 'Boiled Egg'],
    },
    {
      id: 2,
      menuItemId: 102,
      name: 'Paneer Butter Masala',
      quantity: 1,
      unitPrice: 149,
      totalPrice: 149,
      imageUrl: '',
      variantName: 'Regular',
      addons: ['Extra Butter'],
    },
    {
      id: 3,
      menuItemId: 103,
      name: 'Veg Hakka Noodles',
      quantity: 3,
      unitPrice: 129,
      totalPrice: 387,
      imageUrl: '',
      variantName: 'Regular',
      addons: [],
    },
  ];

  const totalQty = dummyItems.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  const orderData = {
    billing: {
      itemTotal: 934,
      deliveryCharge: 40,
      packagingCharge: 20,
      discountAmount: 50,
      finalAmount: 944,
    },
  };

  return (
    <View style={[GlobalStyles.screenBackgroundPrimary, styles.container]}>
      
      {/* 🔝 TOP BAR */}
      <GlobalTopBar navigation={navigation} />

      {/* 🔥 Header */}
      <View style={styles.headerContainer}>
        <Text style={styles.title}>Favorites</Text>
      </View>

      {/* 🔽 OVERLAY */}
      <View style={[GlobalStyles.overlayCard, styles.overlay]}>
        
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 140 }} // ✅ FIX for scroll
        >
          
          {/* ✅ Items List */}
          <DeliveryOrderItemsListComponent
            items={dummyItems}
            itemQty={totalQty}
          />

          {/* 🔥 Order Summary */}
          <View style={styles.summaryRow}>
            
            <View style={styles.summaryCard}>
              <Text style={styles.cardTitle}>Order Summary</Text>

              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Item Total</Text>
                <Text style={styles.summaryValue}>
                  ₹{orderData.billing.itemTotal.toFixed(2)}
                </Text>
              </View>

              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Delivery Charges</Text>
                <Text style={styles.summaryValue}>
                  ₹{orderData.billing.deliveryCharge.toFixed(2)}
                </Text>
              </View>

              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Packaging Charges</Text>
                <Text style={styles.summaryValue}>
                  ₹{orderData.billing.packagingCharge.toFixed(2)}
                </Text>
              </View>

              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Discount</Text>
                <Text style={styles.summaryValue}>
                  -₹{orderData.billing.discountAmount.toFixed(2)}
                </Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.summaryItem}>
                <Text style={styles.totalText}>Total Amount</Text>
                <Text style={styles.totalAmount}>
                  ₹{orderData.billing.finalAmount.toFixed(2)}
                </Text>
              </View>
            </View>

          </View>

          {/* 🔥 Re-order Button */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.reorderButton}
              onPress={() => {
                console.log('Re-order clicked');
                // navigation.navigate('Cart', { items: dummyItems });
              }}
            >
              <Text style={styles.reorderText}>Re-order</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>

        {/* 🔻 Bottom Bar */}
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

  /* 🔥 BUTTON */
  buttonContainer: {
    marginTop: 20,
    marginBottom: 10,
  },

  reorderButton: {
    width: '100%',
  },

  reorderText: {
    fontWeight: '700',
  },
});