import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
} from 'react-native';

import GlobalBackButton from '../GlobalContainer/GlobalBackButton';
import Colors from '../assets/Colors/Colors';
import GlobalStyles from '../assets/Styles/GlobalStyles';

export default function DeliveryAddressList({ navigation }: any) {

  const [selected, setSelected] = useState(0);
  const [isAdding, setIsAdding] = useState(false);

  const [name, setName] = useState('');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);

  const [addressList, setAddressList] = useState([
    {
      title: 'My home',
      address: '778 Locust View Drive Oakland, CA',
    },
    {
      title: 'My Office',
      address: '778 Locust View Drive Oakland, CA',
    },
    {
      title: "Parent's House",
      address: '778 Locust View Drive Oakland, CA',
    },
  ]);

  // 🔍 FREE SEARCH (OpenStreetMap)
  const searchAddress = async (text: string) => {
    setQuery(text);

    if (text.length < 3) {
      setResults([]);
      return;
    }

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${text}&format=json`
      );
      const data = await res.json();
      setResults(data);
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <View style={[GlobalStyles.screenBackgroundPrimary, styles.container]}>
      
      <GlobalBackButton onPress={() => navigation.goBack()} />

      <Text style={[GlobalStyles.pageHeaderTitle, styles.title]}>
        Delivery Address
      </Text>

      <View style={[GlobalStyles.overlayCard, styles.overlay]}>
        
        <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>

          {/* 🔁 SWITCH UI */}
          {!isAdding ? (
            <>
              {/* 📍 ADDRESS LIST */}
              {addressList.map((item, index) => (
                <View key={index}>
                  
                  <TouchableOpacity
                    style={styles.row}
                    onPress={() => setSelected(index)}
                  >

                    <Image
                      source={require('../assets/images/HomeNavBar.png')}
                      style={styles.icon}
                    />

                    <View style={styles.textContainer}>
                      <Text style={styles.addressTitle}>{item.title}</Text>
                      <Text style={styles.addressSub}>{item.address}</Text>
                    </View>

                    <View style={styles.radioOuter}>
                      {selected === index && <View style={styles.radioInner} />}
                    </View>

                  </TouchableOpacity>

                  <View style={styles.divider} />
                </View>
              ))}

              {/* ➕ ADD BUTTON */}
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => setIsAdding(true)}
              >
                <Text style={styles.addText}>Add New Address</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              {/* 🏠 ICON */}
              <Image
                source={require('../assets/images/HomeNavBar.png')}
                style={styles.bigIcon}
              />

              {/* 📝 NAME */}
              <Text style={styles.label}>Name</Text>
              <TextInput
                placeholder="Anna House"
                value={name}
                onChangeText={setName}
                style={styles.input}
              />

              {/* 🔍 ADDRESS */}
              <Text style={styles.label}>Address</Text>
              <TextInput
                placeholder="Search Address"
                value={query}
                onChangeText={searchAddress}
                style={styles.input}
              />

              {/* 🔽 RESULTS */}
              {results.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.resultItem}
                  onPress={() => {
                    const newAddress = {
                      title: name || 'New Address',
                      address: item.display_name,
                    };

                    setAddressList(prev => [...prev, newAddress]);

                    // reset
                    setName('');
                    setQuery('');
                    setResults([]);
                    setIsAdding(false);
                  }}
                >
                  <Text style={styles.resultText}>
                    {item.display_name}
                  </Text>
                </TouchableOpacity>
              ))}

              {/* 🔘 APPLY BUTTON (manual fallback) */}
              <TouchableOpacity
                style={styles.applyButton}
                onPress={() => {
                  if (query) {
                    const newAddress = {
                      title: name || 'New Address',
                      address: query,
                    };

                    setAddressList(prev => [...prev, newAddress]);

                    setName('');
                    setQuery('');
                    setIsAdding(false);
                  }
                }}
              >
                <Text style={styles.applyText}>Apply</Text>
              </TouchableOpacity>

            </>
          )}

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

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
  },

  icon: {
    width: 28,
    height: 28,
    tintColor: Colors.primary,
    marginRight: 15,
  },

  textContainer: {
    flex: 1,
  },

  addressTitle: {
    fontSize: 18,
    fontFamily: 'LeagueSpartan-Medium',
    color: '#1F2937',
  },

  addressSub: {
    fontSize: 14,
    fontFamily: 'LeagueSpartan-Regular',
    color: '#6B7280',
    marginTop: 4,
  },

  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
  },

  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
  },

  addButton: {
    marginTop: 40,
    alignSelf: 'center',
    backgroundColor: '#FFDECF',
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 30,
  },

  addText: {
    color: Colors.primary,
    fontSize: 16,
    fontFamily: 'LeagueSpartan-Medium',
  },

  /* 🔍 FORM UI */

  bigIcon: {
    width: 80,
    height: 80,
    tintColor: Colors.primary,
    alignSelf: 'center',
    marginBottom: 20,
  },

  label: {
    fontSize: 18,
    color: '#1F2937',
    marginBottom: 8,
    fontFamily: 'LeagueSpartan-Medium',
  },

  input: {
    backgroundColor: '#E8DFAE',
    borderRadius: 20,
    padding: 14,
    marginBottom: 10,
    fontFamily: 'LeagueSpartan-Regular',
    fontSize: 16,
  },

  resultItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },

  resultText: {
    fontSize: 14,
    color: '#1F2937',
  },

  applyButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: 'center',
    marginTop: 20,
  },

  applyText: {
    color: '#fff',
    fontSize: 18,
    fontFamily: 'LeagueSpartan-Medium',
  },
});