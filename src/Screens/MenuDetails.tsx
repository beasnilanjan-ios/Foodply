import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  FlatList,
  ScrollView,
} from 'react-native';
import Colors from '../assets/Colors/Colors';
import GlobalBackButton from '../GlobalContainer/GlobalBackButton';

const ADDONS = [
  { id: '1', name: 'Shrimp', price: '₹2.99' },
  { id: '2', name: 'Crisp Onion', price: '₹3.99' },
  { id: '3', name: 'Sweet Corn', price: '₹3.99' },
  { id: '4', name: 'Pico de Gallo', price: '₹2.99' },
];

export default function MenuDetails({ navigation }: any) {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  const toggleItem = (id: string) => {
    if (selectedItems.includes(id)) {
      setSelectedItems(selectedItems.filter(item => item !== id));
    } else {
      setSelectedItems([...selectedItems, id]);
    }
  };

  const renderItem = ({ item }: any) => {
    const isSelected = selectedItems.includes(item.id);

    return (
      <TouchableOpacity
        style={styles.addonRow}
        onPress={() => toggleItem(item.id)}
      >
        <Text style={styles.addonText}>{item.name}</Text>

        <View style={styles.dottedLine} />

        <Text style={styles.addonPrice}>{item.price}</Text>

        <View style={styles.checkbox}>
          {isSelected && <View style={styles.checkboxInner} />}
        </View>
      </TouchableOpacity>
    );
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
              source={require('../assets/images/banner1.png')}
              style={styles.foodImage}
            />

            <View style={styles.ratingBadge}>
              <Text style={styles.ratingText}>4.0</Text>
              <Text style={styles.ratingStar}>★</Text>
            </View>

            <TouchableOpacity style={styles.favoriteButton}>
              <Text style={styles.favoriteIcon}>♥</Text>
            </TouchableOpacity>
          </View>

          {/* DETAILS */}
          <View style={styles.detailsContainer}>

            <View style={styles.priceRow}>
              <Text style={styles.price}>₹50.00</Text>

              <View style={styles.quantityContainer}>
                <TouchableOpacity style={styles.minusButton}>
                  <Text style={styles.minusText}>-</Text>
                </TouchableOpacity>

                <View style={styles.quantityBox}>
                  <Text style={styles.quantity}>1</Text>
                </View>

                <TouchableOpacity style={styles.plusButton}>
                  <Text style={styles.plusText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.divider} />

            <Text style={styles.foodTitle}>
              Tortilla Chips With Toppins
            </Text>

            <Text style={styles.description}>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit.
            </Text>

            <Text style={styles.addOn}>
              Add on ingredients
            </Text>

            <FlatList
              data={ADDONS}
              renderItem={renderItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={false} // 👈 IMPORTANT
            />

            {/* ✅ BUTTON INSIDE SCROLL */}
            <TouchableOpacity
  style={styles.addToCartButton}
  activeOpacity={0.8}
  onPress={() => navigation.navigate('Cart')} // 👈 IMPORTANT
>
  <Image
    source={require('../assets/images/CartAnother.png')}
    style={styles.cartIcon}
  />
  <Text style={styles.addToCartText}>Add to Cart</Text>
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