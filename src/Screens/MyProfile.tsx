import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  launchCamera,
  launchImageLibrary,
} from 'react-native-image-picker';

import GlobalBackButton from '../GlobalContainer/GlobalBackButton';
import GlobalApi from '../GlobalContainer/GlobalApi';
import GlobalLoader from '../GlobalContainer/GlobalLoader';
import GlobalLoginAuth from '../GlobalContainer/GlobalLoginAuth';
import Colors from '../assets/Colors/Colors';
import GlobalStyles from '../assets/Styles/GlobalStyles';
import { AuthMeResponseModel } from '../Models/AuthMeModel';

const formatDobForDisplay = (value: string) => {
  if (!value?.trim()) {
    return '';
  }

  if (value.includes('/')) {
    return value;
  }

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }

  const day = String(parsedDate.getDate()).padStart(2, '0');
  const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
  const year = parsedDate.getFullYear();

  return `${day} / ${month} / ${year}`;
};

const getApiHeaders = (): Record<string, string> => {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'X-Client-Type': 'mobile',
  };

  const token = GlobalLoginAuth.accessToken || GlobalLoginAuth.token;
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
};

export default function MyProfile({ navigation }: any) {
  const [loading, setLoading] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const fetchMyProfile = useCallback(async () => {
    try {
      setLoading(true);
      await GlobalLoginAuth.loadAuthData();

      const token = GlobalLoginAuth.accessToken || GlobalLoginAuth.token;
      if (!token) {
        Alert.alert('FoodyPly', 'Please login to view your profile');
        return;
      }

      const response = await fetch(`${GlobalApi.baseUrl}api/auth/me`, {
        method: 'GET',
        headers: getApiHeaders(),
      });

      const result = await response.json();
      console.log('My profile response:', JSON.stringify(result, null, 2));

      const profileResponse = AuthMeResponseModel.fromJson(result);

      if (!response.ok || profileResponse.success === false) {
        Alert.alert(
          'FoodyPly',
          profileResponse.message || 'Failed to load profile',
        );
        return;
      }

      const user = profileResponse.data;
      if (!user) {
        return;
      }

      setName(user.name);
      setEmail(user.email);
      setPhone(user.phone);
      setDob(formatDobForDisplay(user.dob));
      setProfileImageUrl(user.profileImageUrl);

      GlobalLoginAuth.user = {
        ...GlobalLoginAuth.user,
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        profileImageUrl: user.profileImageUrl,
        role: user.role,
      };
    } catch (error) {
      console.log('fetchMyProfile failed:', error);
      Alert.alert('FoodyPly', 'Unable to connect to server');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchMyProfile();
    }, [fetchMyProfile]),
  );

  const openImagePicker = () => {
    Alert.alert('Select Image', 'Choose option', [
      { text: 'Camera', onPress: openCamera },
      { text: 'Gallery', onPress: openGallery },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const openCamera = async () => {
    const result = await launchCamera({
      mediaType: 'photo',
      quality: 0.8,
    });

    if (!result.didCancel && result.assets?.length) {
      setImageUri(result.assets[0].uri ?? null);
    }
  };

  const openGallery = async () => {
    const result = await launchImageLibrary({
      mediaType: 'photo',
    });

    if (!result.didCancel && result.assets?.length) {
      setImageUri(result.assets[0].uri ?? null);
    }
  };

  const profileImageSource = imageUri
    ? { uri: imageUri }
    : profileImageUrl
    ? { uri: profileImageUrl }
    : require('../assets/images/Myprofile.png');

  return (
    <View style={[GlobalStyles.screenBackgroundPrimary, styles.container]}>
      <GlobalLoader visible={loading} text="Please Wait" />

      <GlobalBackButton onPress={() => navigation.goBack()} />

      <Text style={[GlobalStyles.pageHeaderTitle, styles.title]}>
        My Profile
      </Text>

      <View style={[GlobalStyles.overlayCard, styles.overlay]}>
        <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
          <View style={styles.imageContainer}>
            <Image source={profileImageSource} style={styles.profileImage} />

            <TouchableOpacity
              style={styles.cameraIcon}
              onPress={openImagePicker}>
              <Image
                source={require('../assets/images/camera.png')}
                style={styles.cameraImg}
              />
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Full Name</Text>
          <TextInput value={name} onChangeText={setName} style={styles.input} />

          <Text style={styles.label}>Date of Birth</Text>
          <TextInput value={dob} onChangeText={setDob} style={styles.input} />

          <Text style={styles.label}>Email</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            style={styles.input}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            value={phone}
            onChangeText={setPhone}
            style={styles.input}
            keyboardType="phone-pad"
          />

          <TouchableOpacity style={styles.button}>
            <Text style={styles.buttonText}>Update Profile</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 100,
    backgroundColor: Colors.primary,
    alignItems: 'center',
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

  imageContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },

  profileImage: {
    width: 140,
    height: 140,
    borderRadius: 30,
  },

  cameraIcon: {
    position: 'absolute',
    bottom: 5,
    right: '35%',
    backgroundColor: Colors.primary,
    padding: 10,
    borderRadius: 20,
  },

  cameraImg: {
    width: 18,
    height: 18,
    tintColor: '#fff',
  },

  label: {
    fontSize: 20,
    color: '#1F2937',
    marginBottom: 8,
    fontFamily: 'LeagueSpartan-Medium',
  },

  input: {
    backgroundColor: '#E8DFAE',
    borderRadius: 25,
    padding: 16,
    marginBottom: 20,
    fontSize: 18,
    fontFamily: 'LeagueSpartan-Regular',
    color: '#1F2937',
  },

  button: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    marginTop: 30,
  },

  buttonText: {
    color: '#fff',
    fontSize: 20,
    fontFamily: 'LeagueSpartan-Medium',
  },
});
