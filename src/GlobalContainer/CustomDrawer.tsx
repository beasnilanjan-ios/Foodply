import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import Colors from '../assets/Colors/Colors';
import GlobalLoginAuth from '../GlobalContainer/GlobalLoginAuth';
import { User } from '../Models/Login/User';

export default function CustomDrawer({ navigation, closeDrawer }: any) {
  const [user, setUser] = useState<User | null>(GlobalLoginAuth.user ?? null);

  useEffect(() => {
    const loadUser = async () => {
      await GlobalLoginAuth.loadAuthData();
      setUser(GlobalLoginAuth.user ?? null);
    };

    loadUser();
  }, []);
  const menu = [
    { title: 'My Orders', icon: require('../assets/images/MyOrder.png') },
    { title: 'My Profile', icon: require('../assets/images/MyProfileSide.png'), route: 'MyProfile' },
    {
      title: 'Delivery Address',
      icon: require('../assets/images/Deliver_Boy_Icon.png'),
      route: 'DeliveryAddressList',
    },
    // { title: 'Payment Methods', icon: require('../assets/images/Payments.png') },
    { title: 'Contact Us', icon: require('../assets/images/Contacts.png') },
    { title: 'Help & FAQs', icon: require('../assets/images/Help.png') },
    { title: 'Settings', icon: require('../assets/images/SettingsSideMenu.png') },
  ];

  const handleMenuPress = (item: { title: string; route?: string }) => {
    closeDrawer();
    if (item.route) {
      navigation.navigate(item.route);
    }
  };

  const logoutClicked = async () => {
    closeDrawer();
    await GlobalLoginAuth.clear();
    navigation.replace('Login');
  };

  return (
    <View style={styles.container}>
      
      {/* HEADER */}
      <View style={styles.header}>
        <Image
          source={
            user?.profileImageUrl
              ? { uri: user.profileImageUrl }
              : require('../assets/images/Myprofile.png')
          }
          style={styles.avatar}
        />
        <View style={styles.userInfo}>
          <Text style={styles.name} numberOfLines={2}>
            {user?.name || 'Guest'}
          </Text>
          <Text style={styles.email} numberOfLines={1} ellipsizeMode="tail">
            {user?.email || ''}
          </Text>
        </View>
      </View>

      {/* MENU */}
      {menu.map((item, index) => (
        <View key={index}>
          <TouchableOpacity
            style={styles.row}
            onPress={() => handleMenuPress(item)}
          >
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

  userInfo: {
    flex: 1,
    minWidth: 0,
  },

  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
    flexShrink: 0,
  },

  name: {
    fontSize: 20,
    color: '#fff',
    fontWeight: 'bold',
    fontFamily: 'LeagueSpartan-Bold',
    flexShrink: 1,
  },

  email: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'LeagueSpartan-Regular',
    marginTop: 4,
    flexShrink: 1,
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
