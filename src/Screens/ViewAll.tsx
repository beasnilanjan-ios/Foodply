// import React from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   Image,
//   ScrollView,
//   Dimensions,
//   ImageSourcePropType,
// } from 'react-native';
// import Colors from '../assets/Colors/Colors';
// import GlobalBackButton from '../GlobalContainer/GlobalBackButton';

// const { width } = Dimensions.get('window');
// const itemImageWidth = Math.min(width - 40, 323);

// type ViewAllItem = {
//   id: number;
//   title: string;
//   description: string;
//   rating: number;
//   price: string;
//   image: ImageSourcePropType;
// };

// const viewAllItems: ViewAllItem[] = [
//   {
//     id: 1,
//     title: 'Mexican Appetizer',
//     description: 'Tortilla Chips With Toppins',
//     rating: 5.0,
//     price: '₹50.00',
//     image: require('../assets/images/banner1.png'),
//   },
//   {
//     id: 2,
//     title: 'Pork Skewer',
//     description:
//       'Marinated in a rich blend of herbs and spices, then grilled to perfection, served with a side of zesty dipping sauce.',
//     rating: 4.0,
//     price: '₹12.99',
//     image: require('../assets/images/banner2.png'),
//   },
// ];

// export default function Dashboard({ navigation, openDrawer }: any) {
//   return (
//      <View style={styles.container}>
//         <GlobalBackButton onPress={() => navigation.goBack()} />

//         <Text style={styles.title}>Menu Items</Text>

//         <View style={styles.overlay}>
//           <ScrollView
//             showsVerticalScrollIndicator={false}
//             contentContainerStyle={styles.listContainer}>
//             {/* {viewAllItems.map((item, index) => (
//               <View key={item.id}>
//                 <View style={styles.foodCard}>
//                   <Image source={item.image} style={styles.foodImage} />

//                   <View style={styles.foodHeader}>
//                     <Text style={styles.foodTitle}>{item.title}</Text>
//                     <Text style={styles.dot}>•</Text>

//                     <View style={styles.ratingBadge}>
//                       <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
//                       <Text style={styles.ratingStar}>★</Text>
//                     </View>

//                     <Text style={styles.priceText}>{item.price}</Text>
//                   </View>

//                   <Text style={styles.descriptionText}>{item.description}</Text>
//                 </View>

//                 {index < viewAllItems.length - 1 && <View style={styles.divider} />}
//               </View>
//             ))} */}
//           </ScrollView>
//          </View>
//     </View>
//     );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     justifyContent: 'flex-start',
//     alignItems: 'center',
//     paddingTop: 100,
//     backgroundColor: Colors.primary,
//   },

//   title: {
//     color: '#fff',
//     fontSize: 28,
//     fontWeight: '700',
//     fontFamily: 'LeagueSpartan-Bold',
//   },

//   overlay: {
//     position: 'absolute',
//     bottom: 0,
//     width: '100%',
//     height: '90%',
//     backgroundColor: '#fff',
//     borderTopLeftRadius: 30,
//     borderTopRightRadius: 30,
//     alignItems: 'stretch',
//     padding: 20,
//     // shadow (iOS)
//     shadowColor: '#000',
//     shadowOpacity: 0.1,
//     shadowRadius: 10,
//     // shadow (Android)
//     elevation: 5,
//   },

//   listContainer: {
//     paddingBottom: 30,
//   },

//   foodCard: {
//     width: '100%',
//   },

//   foodImage: {
//     width: itemImageWidth,
//     height: 174,
//     borderRadius: 36,
//     resizeMode: 'cover',
//     alignSelf: 'center',
//   },

//   foodHeader: {
//     width: itemImageWidth,
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginTop: 16,
//     alignSelf: 'center',
//   },

//   foodTitle: {
//     flexShrink: 1,
//     fontSize: 18,
//     fontFamily: 'LeagueSpartan-SemiBold',
//     color: '#351B18',
//     includeFontPadding: false,
//   },

//   dot: {
//     marginHorizontal: 12,
//     fontSize: 24,
//     fontFamily: 'LeagueSpartan-Bold',
//     color: Colors.primary,
//     includeFontPadding: false,
//   },

//   ratingBadge: {
//     width: 34,
//     height: 14,
//     borderRadius: 30,
//     backgroundColor: Colors.primary,
//     flexDirection: 'row',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },

//   ratingText: {
//     fontSize: 10,
//     fontFamily: 'LeagueSpartan-Regular',
//     color: '#fff',
//     includeFontPadding: false,
//   },

//   ratingStar: {
//     marginLeft: 1,
//     fontSize: 9,
//     color: '#F4D235',
//     includeFontPadding: false,
//   },

//   priceText: {
//     marginLeft: 'auto',
//     fontSize: 18,
//     fontFamily: 'LeagueSpartan-Regular',
//     color: Colors.primary,
//     includeFontPadding: false,
//   },

//   descriptionText: {
//     marginTop: 8,
//     width: itemImageWidth,
//     fontSize: 12,
//     lineHeight: 12,
//     fontFamily: 'LeagueSpartan-Regular',
//     color: '#351B18',
//     alignSelf: 'center',
//     textAlign: 'left',
//   },

//   divider: {
//     height: 1,
//     backgroundColor: '#F0CDBF',
//     marginVertical: 34,
//   },
 
//   });


import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ScrollView,
  Image,
  TouchableOpacity,
} from 'react-native';
import Colors from '../assets/Colors/Colors';
import GlobalBackButton from '../GlobalContainer/GlobalBackButton';

const { width } = Dimensions.get('window');
const cardWidth = (width - 58) / 2;

type ViewAllItem = {
  id: number;
  title: string;
  description: string;
  rating: number;
  price: string;
  image: any;
  categoryIcon: any;
};

const viewAllItems: ViewAllItem[] = [
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
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.cardsContainer}>
          {viewAllItems.map((item, index) => (
            <View key={item.id} style={styles.card}>
              <View style={styles.cardImageContainer}>
                <Image source={item.image} style={styles.cardImage} />
                <View style={styles.categoryBadge}>
                  <Image source={item.categoryIcon} style={styles.categoryIcon} />
                </View>
                <TouchableOpacity style={styles.favoriteButton} activeOpacity={0.8}>
                  <Text style={styles.favoriteIcon}>♥</Text>
                </TouchableOpacity>
                <View style={styles.ratingBadge}>
                  <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
                  <Text style={styles.ratingStar}>★</Text>
                </View>
              </View>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardDescription}>{item.description}</Text>
              <View style={styles.cardFooter}>
                <Text style={styles.priceText}>{item.price}</Text>
                <View style={styles.quantityContainer}>
                  <TouchableOpacity style={styles.counterButton} activeOpacity={0.8}>
                    <Text style={styles.counterButtonText}>-</Text>
                  </TouchableOpacity>
                  <Text style={styles.quantityText}>1</Text>
                  <TouchableOpacity style={styles.counterButton} activeOpacity={0.8}>
                    <Text style={styles.counterButtonText}>+</Text>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity style={styles.cartButton} activeOpacity={0.8}>
                  <Image source={require('../assets/images/Cart.png')} style={styles.cartIcon} />
                </TouchableOpacity>
              </View>
            </View>
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
    fontFamily: 'LeagueSpartan-Bold',
  },

  overlayTitle: {
    color: Colors.primary,
    fontSize: 20,
    fontWeight: '400',
    fontFamily: 'LeagueSpartan-Regular',
    textAlign: 'center',
    marginBottom: 18,
  },

  overlay: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: '90%',
    backgroundColor: '#fff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    alignItems: 'stretch',
    padding: 20,

    // iOS shadow
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,

    // Android shadow
    elevation: 5,
  },

  cardsContainer: {
    paddingBottom: 30,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  card: {
    width: cardWidth,
    marginBottom: 18,
    borderRadius: 22,
    backgroundColor: Colors.white,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    overflow: 'hidden',
  },

  cardImageContainer: {
    width: '100%',
    height: 150,
    overflow: 'hidden',
  },

  cardImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },

  categoryBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },

  categoryIcon: {
    width: 18,
    height: 18,
    resizeMode: 'contain',
  },

  favoriteButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },

  favoriteIcon: {
    color: Colors.primary,
    fontSize: 14,
  },

  ratingBadge: {
    position: 'absolute',
    left: 12,
    bottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
    backgroundColor: Colors.primary,
  },

  ratingText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '700',
  },

  ratingStar: {
    marginLeft: 4,
    color: '#F4D235',
    fontSize: 12,
  },

  cardTitle: {
    marginTop: 14,
    marginHorizontal: 14,
    fontSize: 16,
    fontWeight: '700',
    color: '#351B18',
    lineHeight: 22,
  },

  cardDescription: {
    marginTop: 6,
    marginHorizontal: 14,
    fontSize: 12,
    lineHeight: 18,
    color: '#6D5D54',
  },

  cardFooter: {
    marginTop: 14,
    marginBottom: 14,
    marginHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  priceText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary,
  },

  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.lightGray,
    borderRadius: 16,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },

  counterButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
  },

  counterButtonText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: '700',
  },

  quantityText: {
    fontSize: 14,
    color: Colors.black,
    minWidth: 16,
    textAlign: 'center',
  },

  cartButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },

  cartIcon: {
    width: 10,
    height: 10,
    resizeMode: 'contain',
    tintColor: Colors.white,
  },
});