import React, { useState } from 'react';
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

import {
  launchCamera,
  launchImageLibrary,
} from 'react-native-image-picker';

import GlobalBackButton from '../GlobalContainer/GlobalBackButton';
import Colors from '../assets/Colors/Colors';
import GlobalStyles from '../assets/Styles/GlobalStyles';

export default function MyProfile({ navigation }: any) {

  const [imageUri, setImageUri] = useState<any>(null);

  const [name, setName] = useState('Surojit Bera');
  const [dob, setDob] = useState('09 / 10 / 1991');
  const [email, setEmail] = useState('johnsmith@example.com');
  const [phone, setPhone] = useState('+123 567 89000');

  // 📷 OPEN OPTIONS
  const openImagePicker = () => {
    Alert.alert('Select Image', 'Choose option', [
      { text: 'Camera', onPress: openCamera },
      { text: 'Gallery', onPress: openGallery },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  // 📷 CAMERA
  const openCamera = async () => {
    const result = await launchCamera({
      mediaType: 'photo',
      quality: 0.8,
    });

    if (!result.didCancel && result.assets?.length) {
      setImageUri(result.assets[0].uri);
    }
  };

  // 🖼️ GALLERY
  const openGallery = async () => {
    const result = await launchImageLibrary({
      mediaType: 'photo',
    });

    if (!result.didCancel && result.assets?.length) {
      setImageUri(result.assets[0].uri);
    }
  };

  return (
    <View style={[GlobalStyles.screenBackgroundPrimary, styles.container]}>
      
      <GlobalBackButton onPress={() => navigation.goBack()} />

      <Text style={[GlobalStyles.pageHeaderTitle, styles.title]}>
        My Profile
      </Text>

      <View style={[GlobalStyles.overlayCard, styles.overlay]}>
        
        <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>

          {/* 👤 PROFILE IMAGE */}
          <View style={styles.imageContainer}>
            <Image
              source={
                imageUri
                  ? { uri: imageUri }
                  : require('../assets/images/Myprofile.png')
              }
              style={styles.profileImage}
            />

            <TouchableOpacity
              style={styles.cameraIcon}
              onPress={openImagePicker}
            >
              <Image
                source={require('../assets/images/camera.png')}
                style={styles.cameraImg}
              />
            </TouchableOpacity>
          </View>

          {/* 📝 FULL NAME */}
          <Text style={styles.label}>Full Name</Text>
          <TextInput value={name} onChangeText={setName} style={styles.input} />

          {/* 🎂 DOB */}
          <Text style={styles.label}>Date of Birth</Text>
          <TextInput value={dob} onChangeText={setDob} style={styles.input} />

          {/* 📧 EMAIL */}
          <Text style={styles.label}>Email</Text>
          <TextInput value={email} onChangeText={setEmail} style={styles.input} />

          {/* 📞 PHONE */}
          <Text style={styles.label}>Phone Number</Text>
          <TextInput value={phone} onChangeText={setPhone} style={styles.input} />

          {/* 🔘 UPDATE BUTTON */}
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