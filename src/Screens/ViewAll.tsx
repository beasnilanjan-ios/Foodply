import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  Dimensions,
  ImageSourcePropType,
} from 'react-native';
import Colors from '../assets/Colors/Colors';

const { width } = Dimensions.get('window');
const itemImageWidth = width - 40;

type ViewAllItem = {
  id: number;
  title: string;
  description: string;
  rating: number;
  price: string;
  image: ImageSourcePropType;
};

const viewAllItems: ViewAllItem[] = [
  {
    id: 1,
    title: 'Mexican Appetizer',
    description: 'Tortilla Chips With Toppins',
    rating: 5.0,
    price: 'Rs50.00',
    image: require('../assets/images/banner1.png'),
  },
  {
    id: 2,
    title: 'Pork Skewer',
    description:
      'Marinated in a rich blend of herbs and spices, then grilled to perfection, served with a side of zesty dipping sauce.',
    rating: 4.0,
    price: 'Rs12.99',
    image: require('../assets/images/banner2.png'),
  },
];

export default function Dashboard({ navigation, openDrawer }: any) {
  return (
     <View style={styles.container}>
        <View style={styles.overlay}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}>
            {viewAllItems.map((item, index) => (
              <View key={item.id}>
                <View style={styles.foodCard}>
                  <Image source={item.image} style={styles.foodImage} />

                  <View style={styles.foodHeader}>
                    <Text style={styles.foodTitle}>{item.title}</Text>
                    <Text style={styles.dot}>•</Text>

                    <View style={styles.ratingBadge}>
                      <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
                      <Text style={styles.ratingStar}>★</Text>
                    </View>

                    <Text style={styles.priceText}>{item.price}</Text>
                  </View>

                  <Text style={styles.descriptionText}>{item.description}</Text>
                </View>

                {index < viewAllItems.length - 1 && <View style={styles.divider} />}
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
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 100,
    backgroundColor: Colors.primary,
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
    // shadow (iOS)
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    // shadow (Android)
    elevation: 5,
  },

  listContainer: {
    paddingBottom: 30,
  },

  foodCard: {
    width: '100%',
  },

  foodImage: {
    width: itemImageWidth,
    height: 190,
    borderRadius: 30,
    resizeMode: 'cover',
    alignSelf: 'center',
  },

  foodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },

  foodTitle: {
    flexShrink: 1,
    fontSize: 24,
    fontFamily: 'LeagueSpartan-Bold',
    color: '#351B18',
    includeFontPadding: false,
  },

  dot: {
    marginHorizontal: 12,
    fontSize: 24,
    fontFamily: 'LeagueSpartan-Bold',
    color: Colors.primary,
    includeFontPadding: false,
  },

  ratingBadge: {
    height: 26,
    paddingHorizontal: 7,
    borderRadius: 13,
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
  },

  ratingText: {
    fontSize: 14,
    fontFamily: 'LeagueSpartan-Regular',
    color: '#fff',
    includeFontPadding: false,
  },

  ratingStar: {
    marginLeft: 3,
    fontSize: 13,
    color: '#F4D235',
    includeFontPadding: false,
  },

  priceText: {
    marginLeft: 'auto',
    fontSize: 24,
    fontFamily: 'LeagueSpartan-Regular',
    color: Colors.primary,
    includeFontPadding: false,
  },

  descriptionText: {
    marginTop: 8,
    fontSize: 15,
    lineHeight: 18,
    fontFamily: 'LeagueSpartan-Regular',
    color: '#351B18',
  },

  divider: {
    height: 1,
    backgroundColor: '#F0CDBF',
    marginVertical: 34,
  },
 
  });
