
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
} from 'react-native';
import Colors from '../assets/Colors/Colors';
import GlobalBackButton from '../GlobalContainer/GlobalBackButton';

const cardWidth = '48%';

const viewAllItems = [
  {
    id: 1,
    title: 'Bean and vegetable burger',
    description: 'Lorem ipsum dolor sit amet, consectetur...',
    rating: 4.0,
    price: '₹15.00',
    image: require('../assets/images/banner1.png'),
    categoryIcon: require('../assets/images/Meals.png'),
  },
  {
    id: 2,
    title: 'Creamy milkshakes',
    description: 'Lorem ipsum dolor sit amet, consectetur...',
    rating: 4.0,
    price: '₹15.00',
    image: require('../assets/images/banner2.png'),
    categoryIcon: require('../assets/images/Drinks.png'),
  },
  {
    id: 3,
    title: 'Spicy rice bowl',
    description: 'Lorem ipsum dolor sit amet, consectetur...',
    rating: 4.0,
    price: '₹15.00',
    image: require('../assets/images/banner3.png'),
    categoryIcon: require('../assets/images/Snacks.png'),
  },
  {
    id: 4,
    title: 'Vegetable curry bowl',
    description: 'Lorem ipsum dolor sit amet, consectetur...',
    rating: 4.0,
    price: '₹15.00',
    image: require('../assets/images/banner1.png'),
    categoryIcon: require('../assets/images/Vegan.png'),
  },
];

export default function Dashboard({ navigation }: any) {
  return (
    <View style={styles.container}>
      <GlobalBackButton onPress={() => navigation.goBack()} />
      <Text style={styles.title}>Menu Items</Text>

      <View style={styles.overlay}>
        <Text style={styles.overlayTitle}>
          Search your favorite dishes by name, category, or ingredients.
        </Text>

        <ScrollView contentContainerStyle={styles.cardsContainer}>
          {viewAllItems.map((item) => (
            <TouchableOpacity
  key={item.id}
  style={styles.card}
  activeOpacity={0.8}
  onPress={() => navigation.navigate('MenuDetails', { item })}
>

              {/* IMAGE */}
              <View style={styles.cardImageContainer}>
                <Image source={item.image} style={styles.cardImage} />

                <View style={styles.categoryBadge}>
                  <Image source={item.categoryIcon} style={styles.categoryIcon} />
                </View>

                <TouchableOpacity style={styles.favoriteButton}>
                  <Text style={styles.favoriteIcon}>♥</Text>
                </TouchableOpacity>

                <View style={styles.ratingBadge}>
                  <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
                  <Text style={styles.ratingStar}>★</Text>
                </View>
              </View>

              {/* TEXT */}
              <Text style={styles.cardTitle} numberOfLines={2}>
                {item.title}
              </Text>

              <Text style={styles.cardDescription} numberOfLines={2}>
                {item.description}
              </Text>

              {/* FOOTER */}
              <View style={styles.cardFooter}>
                <View style={styles.leftSection}>
                  <Text style={styles.priceText}>{item.price}</Text>

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
              </View>

            </TouchableOpacity>
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
    width: cardWidth,
    marginBottom: 18,
    borderRadius: 20,
    backgroundColor: '#fff',
    overflow: 'hidden',
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
    color: Colors.primary,
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
    marginBottom: 2, // 👈 tightened
    fontWeight: '700',
    height: 36,
  },

  cardDescription: {
  marginHorizontal: 10,
  fontSize: 12,
  color: '#6D5D54',
  marginBottom: 4,
  height: 32, // 👈 ADD THIS
},

  cardFooter: {
    marginHorizontal: 10,
    marginTop: 4, // 👈 reduced gap
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },

  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  priceText: {
    color: Colors.primary,
    fontWeight: '700',
    marginRight: 6,
  },

  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
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
    marginHorizontal: 6,
  },

  cartButton: {
    marginLeft: 'auto',
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },

  cartIcon: {
    width: 16,
    height: 16,
    tintColor: '#fff',
  },
});