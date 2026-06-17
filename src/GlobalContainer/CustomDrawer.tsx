import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import Colors from '../assets/Colors/Colors';
import GlobalLoginAuth from '../GlobalContainer/GlobalLoginAuth'; // ✅ IMPORT CLEAR FUNCTION

export default function CustomDrawer({ navigation, closeDrawer }: any) {
  const menu = [
    { title: 'My Orders', icon: require('../assets/images/MyOrder.png') },
    { title: 'My Profile', icon: require('../assets/images/MyProfileSide.png') },
    { title: 'Delivery Address', icon: require('../assets/images/Deliver_Boy_Icon.png') },
    { title: 'Payment Methods', icon: require('../assets/images/Payments.png') },
    { title: 'Contact Us', icon: require('../assets/images/Contacts.png') },
    { title: 'Help & FAQs', icon: require('../assets/images/Help.png') },
    { title: 'Settings', icon: require('../assets/images/SettingsSideMenu.png') },
  ];

  const logoutClicked = () => {
    closeDrawer(); // ✅ close drawer first
    navigation.replace('Login');
    GlobalLoginAuth.clear(); // ✅ then navigate
  };

  return (
    <View style={styles.container}>
      
      {/* HEADER */}
      <View style={styles.header}>
        <Image
          source={require('../assets/images/Myprofile.png')}
          style={styles.avatar}
        />
        <View>
          <Text style={styles.name}>Surojit Berg</Text>
          <Text style={styles.email}>Loremipsum@email.com</Text>
        </View>
      </View>

      {/* MENU */}
      {menu.map((item, index) => (
        <View key={index}>
          <TouchableOpacity style={styles.row}>
            <View style={styles.iconBox}>
              <Image source={item.icon} style={styles.icon} />
            </View>
            <Text style={styles.text}>{item.title}</Text>
          </TouchableOpacity>

          <View style={styles.divider} />
        </View>
      ))}

      {/* LOGOUT */}
      <TouchableOpacity style={styles.row} onPress={logoutClicked}>
        <View style={styles.iconBox}>
          <Image
            source={require('../assets/images/LogOuticon.png')}
            style={styles.icon}
          />
        </View>
        <Text style={styles.text}>Log Out</Text>
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
    borderTopRightRadius: 30,
    borderBottomRightRadius: 30,
    paddingTop: 60,
    paddingHorizontal: 20,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 40,
  },

  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
  },

  name: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
    fontFamily: 'LeagueSpartan-Bold',
  },

  email: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'LeagueSpartan-Regular',
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 15,
  },

  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 15,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },

  icon: {
    width: 22,
    height: 22,
    resizeMode: 'contain',
  },

  text: {
    color: '#fff',
    fontSize: 18,
    fontFamily: 'LeagueSpartan-Regular',
  },

  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
});
