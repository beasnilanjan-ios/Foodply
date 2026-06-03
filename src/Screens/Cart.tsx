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



import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import GlobalBackButton from '../GlobalContainer/GlobalBackButton';
import Colors from '../assets/Colors/Colors';
import GlobalBottomBar from '../GlobalContainer/GlobalBottomBar';

const CART_ITEMS = [
  {
    id: '1',
    title: 'Strawberry Shake',
    date: '29 Nov, 15:20 pm',
    price: '₹20.00',
    quantity: 2,
    image: require('../assets/images/banner2.png'),
  },
  {
    id: '2',
    title: 'Broccoli Lasagna',
    date: '29 Nov, 12:00 pm',
    price: '₹12.99',
    quantity: 1,
    image: require('../assets/images/banner1.png'),
  },
  {
    id: '3',
    title: 'Broccoli Lasagna',
    date: '29 Nov, 12:00 pm',
    price: '₹12.99',
    quantity: 1,
    image: require('../assets/images/banner1.png'),
  },
];

export default function Cart({ navigation, route }: any) {

  // ✅ KEY LOGIC
  const showBottomBar = route?.params?.fromTab === true;

  return (
    <View style={styles.container}>
      
      <GlobalBackButton onPress={() => navigation.goBack()} />
      <Text style={styles.title}>Cart</Text>

      <View style={styles.overlay}>
        
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingBottom: showBottomBar ? 160 : 40, // ✅ dynamic spacing
          }}
        >

          {/* 🔥 ADDRESS */}
          <View style={styles.addressContainer}>
            <View style={styles.addressHeader}>
              <Text style={styles.addressTitle}>Shipping Address</Text>

              <TouchableOpacity onPress={() => navigation.navigate('Address')}>
                <Image
                  source={require('../assets/images/Writeicon.png')}
                  style={styles.editIcon}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.addressBox}>
              <Text style={styles.addressText}>
                778 Locust View Drive Oakland, CA
              </Text>
            </View>

            <Text style={styles.orderSummaryText}>Order Summary</Text>
          </View>

          <View style={styles.dividerLine} />

          {/* 🔥 CART LIST */}
          {CART_ITEMS.map((item, index) => (
            <View key={item.id}>
              <View style={styles.cartItem}>
                <TouchableOpacity style={styles.deleteButton}>
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

                  <View style={styles.rowBetween}>
                    <Text style={styles.itemDate}>{item.date}</Text>
                    <Text style={styles.itemCount}>
                      {item.quantity} items
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

                      <TouchableOpacity style={styles.minusButton}>
                        <Text style={styles.minusText}>-</Text>
                      </TouchableOpacity>

                      <View style={styles.qtyBox}>
                        <Text style={styles.qtyText}>{item.quantity}</Text>
                      </View>

                      <TouchableOpacity style={styles.plusButton}>
                        <Text style={styles.plusText}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                </View>
              </View>

              {index !== CART_ITEMS.length - 1 && (
                <View style={styles.dividerLine} />
              )}
            </View>
          ))}

          <View style={[styles.dividerLine, { marginTop: 20 }]} />

          {/* 💰 BILL SUMMARY */}
          <View style={styles.billContainer}>

            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Subtotal</Text>
              <Text style={styles.billValue}>₹32.00</Text>
            </View>

            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Tax and Fees</Text>
              <Text style={styles.billValue}>₹5.00</Text>
            </View>

            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Delivery</Text>
              <Text style={styles.billValue}>₹3.00</Text>
            </View>

            <View style={styles.dottedDivider} />

            <View style={styles.billRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>₹40.00</Text>
            </View>

            <TouchableOpacity
              style={styles.addToCartButton}
              onPress={() => navigation.navigate('OrderConfirmed')}
            >
              <Text style={styles.addToCartText}>Pay Now</Text>
            </TouchableOpacity>

          </View>

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
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginTop: 6,
  },

  addressText: {
    fontSize: 16,
    color: '#1F2937',
  },

  orderSummaryText: {
    marginTop: 20,
    fontSize: 20,
    fontFamily: 'LeagueSpartan-Medium',
    color: '#1F2937',
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