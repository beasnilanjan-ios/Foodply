import React from 'react';
import {
  FlatList,
  View,
  Text,
  StyleSheet,
  Image,
} from 'react-native';
import Colors from '../assets/Colors/Colors';
import { FontFamily } from '../assets/GlobalFont/GlobalFont';
import { DeliveryGlobalStyles } from '../assets/Styles/GlobalStyles';

type Props = {
  items: any[];
};

const ItemCard = ({ item }: any) => {
  return (
    <View style={styles.itemRow}>
      {/* Food Image */}
      <Image
        source={item.image}
        style={styles.foodImage}
      />

      {/* Item Details */}
      <View style={styles.detailsContainer}>
        <Text style={styles.itemName}>
          {item.name}
        </Text>

        <Text style={styles.itemDesc}>
          {item.desc}
        </Text>
      </View>

      {/* Qty */}
      <Text style={styles.qtyText}>
        {item.qty}
      </Text>

      {/* Price */}
      <Text style={styles.priceText}>
        ₹{item.price}
      </Text>
    </View>
  );
};

export default function DeliveryOrderItemsListComponent({
  items,
}: Props) {
  return (
    <View style={styles.container}>
      {/* Header */}
       
        <View style={styles.headerRow}>
          <Text style={styles.title}>
            Order Items
          </Text>

        <View style={DeliveryGlobalStyles.backLight}>
          <Text style={styles.itemCount}>
            {items.length} Items •{' '}
            {items.reduce(
              (sum, item) => sum + item.qty,
              0,
            )}{' '}
            Qty
          </Text>
        </View>
        </View>      
      {/* Table Header */}
        <View style={styles.tableHeader}>
          <Text style={[styles.headerText, { flex: 3 }]}>
            Item
          </Text>

          <Text style={[styles.headerText, { flex: 0.3 }]}>
            Qty
          </Text>

          <Text
            style={[
              styles.headerText,
              {
                flex: 0.8,
                textAlign: 'right',
              },
            ]}
          >
            Price
          </Text>
        </View>
      {/* List */}
      <FlatList
        data={items}
        keyExtractor={(item) => item.id.toString()}
        scrollEnabled={false}
        renderItem={({ item }) => (
          <ItemCard item={item} />
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              No Items Found
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    marginTop: 16,
  },

  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },

  title: {
    fontSize: 18,
    color: Colors.textColor,
    fontFamily: FontFamily.medium,
  },

  itemCount: {
    fontSize: 14,
    color: Colors.primary,
    fontFamily: FontFamily.medium,
  },

  tableHeader: {
    flexDirection: 'row',
    backgroundColor: Colors.lightBackground,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 10,
    marginBottom: 10,
  },

  headerText: {
    fontSize: 12,
    color: Colors.tableHeader,
    fontFamily: FontFamily.medium,
  },

  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },

  foodImage: {
    width: 48,
    height: 38,
    borderRadius: 10,
    marginRight: 10,
  },

  detailsContainer: {
    flex: 2.2,
  },

  itemName: {
    fontSize: 16,
    fontFamily: FontFamily.medium,
    color: Colors.textColor,
  },

  itemDesc: {
    fontSize: 11,
    color: Colors.textColorLight,
    marginTop: 2,
  },

  qtyText: {
    flex: 0.5,
    fontSize: 14,
    fontFamily: FontFamily.medium,
    color: Colors.textColor,
    textAlign: 'center',
  },

  priceText: {
    flex: 0.8,
    fontSize: 14,
    fontFamily: FontFamily.medium,
    color: '#222',
    textAlign: 'right',
  },

  emptyContainer: {
    paddingVertical: 30,
    alignItems: 'center',
  },

  emptyText: {
    fontSize: 14,
    color: '#999',
    fontWeight: '600',
  },
});