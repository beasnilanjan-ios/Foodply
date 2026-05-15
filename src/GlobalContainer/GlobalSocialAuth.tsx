// import { View, Text,Alert } from 'react-native'
// import React, { useState }  from 'react'
// import GlobalAuth from '../GlobalContainer/GlobalLoginAuth';
// import GlobalApi from './GlobalApi';    
// import GlobleSocialButton from './GlobalSocialButtons';
// import firebase from '@react-native-firebase/app';
// import auth from '@react-native-firebase/auth';

// const GlobalSocialAuth = ({ navigation }: any) => {
//     const [loading, setLoading] = useState(false);

//   const handleGoogleLogin = async () => {

// setLoading(true);

//     try {
//       const response = await fetch(`${GlobalApi.baseUrl}api/auth/social-login`, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },body: JSON.stringify({
//            provider: 'firebase_google', // ✅ IDENTIFY PROVIDER
//            idToken: await auth().currentUser?.getIdToken(), // ✅ FIREBASE ID TOKEN
              
//         }),
        
//       });

//       const result = await response.json(); // ✅ VERY IMPORTANT

//       // ❌ Handle API-level failure
//       if (!response.ok || !result.success) {
//         Alert.alert('FoodyPly', result.message || 'Login failed');
//         return;
//       }

//       // ✅ STORE FULL RESPONSE GLOBALLY
//       //GlobalAuth.setAuthData(result);

//       console.log('User:', GlobalAuth.user);
//       console.log('Access Token:', GlobalAuth.accessToken);

//       // ✅ NAVIGATE AFTER SUCCESS
//       navigation.reset({
//         index: 0,
//         routes: [{ name: 'Dashboard' }],
//       });

//     } catch (error) {
//       Alert.alert('FoodyPly', 'Unable to connect to server');
//     } finally {
//       setLoading(false);
//     }

// };

//   return (
//     <View>
//       <Text>GlobalSocialAuth</Text>
//     </View>
//   )
// }

// export default GlobalSocialAuth



import React, { useEffect, useState } from 'react';
import {
  View,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';


import auth from '@react-native-firebase/auth';

import {
  GoogleSignin,

} from '@react-native-google-signin/google-signin';

import {
  LoginManager,
  AccessToken,
} from 'react-native-fbsdk-next';

import GlobalStyles from '../assets/Styles/GlobalStyles';
import GlobalApi from './GlobalApi';

const GlobalSocialAuth = () => {
  const navigation: any = useNavigation();
  

 useEffect(() => {
    GoogleSignin.configure({
      webClientId:
        '720080454964-otev4leastlqa94ucrg3kglnbgmo3tqd.apps.googleusercontent.com',
        offlineAccess: true,
    });
  }, []);


  const [loading, setLoading] = useState(false);

  // =========================
  // COMMON API FUNCTION
  // =========================
  const handleSocialLogin = async (
    provider: string,
    userCredential: any,
  ) => {
    setLoading(true);

    try {
      // FIREBASE ID TOKEN
      const firebaseIdToken =
        await userCredential.user.getIdToken();

      console.log('PROVIDER => ', provider);
      console.log('FIREBASE TOKEN => ', firebaseIdToken);

      // API CALL
      const response = await fetch(
        `${GlobalApi.baseUrl}api/auth/social-login`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },

          body: JSON.stringify({
            provider: provider,
            idToken: firebaseIdToken,
          }),
        },
      );

      const result = await response.json();

      console.log('API RESPONSE => ', result);

      // ERROR HANDLE
      if (!response.ok || !result.success) {
        Alert.alert(
          'FoodyPly',
          result.message || 'Login failed',
        );
        return;
      }

      // SUCCESS
      Alert.alert(
        'Success',
        `${provider} Login Success`,
      );

      // NAVIGATION
      navigation.reset({
        index: 0,
        routes: [{ name: 'Dashboard' }],
      });

    } catch (error) {
      console.log('SOCIAL LOGIN ERROR => ', error);

      Alert.alert(
        'FoodyPly',
        'Unable to connect server',
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // GOOGLE LOGIN
  // =========================
  const GoogleSignIn = async () => {
    try {
      // PLAY SERVICE
      await GoogleSignin.hasPlayServices();

      // SHOW ACCOUNT LIST
      await GoogleSignin.signOut();

      // GOOGLE LOGIN
      const response = await GoogleSignin.signIn();

      console.log('GOOGLE RESPONSE => ', response);

      // GOOGLE TOKEN
      const { idToken } =
        await GoogleSignin.getTokens();

      // FIREBASE CREDENTIAL
      const googleCredential =
        auth.GoogleAuthProvider.credential(idToken);

      // FIREBASE LOGIN
      const userCredential =
        await auth().signInWithCredential(
          googleCredential,
        );

      // COMMON FUNCTION
      await handleSocialLogin(
        'firebase_google',
        userCredential,
      );

    } catch (error) {
      console.log('GOOGLE LOGIN ERROR => ', error);

      Alert.alert(
        'Google Login Error',
        String(error),
      );
    }
  };

  // =========================
  // FACEBOOK LOGIN
  // =========================
  const FacebookLogin = async () => {
    try {
      // LOGOUT FIRST
      LoginManager.logOut();

      // FACEBOOK LOGIN
      const result =
        await LoginManager.logInWithPermissions([
          'public_profile',
          'email',
        ]);

      // CANCEL CHECK
      if (result.isCancelled) {
        Alert.alert(
          'Cancelled',
          'Facebook login cancelled',
        );
        return;
      }

      // ACCESS TOKEN
      const data =
        await AccessToken.getCurrentAccessToken();

      if (!data) {
        Alert.alert(
          'Error',
          'Access token not found',
        );
        return;
      }

      // FIREBASE CREDENTIAL
      const facebookCredential =
        auth.FacebookAuthProvider.credential(
          data.accessToken,
        );

      // FIREBASE LOGIN
      const userCredential =
        await auth().signInWithCredential(
          facebookCredential,
        );

      // COMMON FUNCTION
      await handleSocialLogin(
        'firebase_facebook',
        userCredential,
      );

    } catch (error) {
      console.log('FACEBOOK LOGIN ERROR => ', error);

      Alert.alert(
        'Facebook Login Error',
        String(error),
      );
    }
  };

  return (
    <View style={GlobalStyles.socialContainer}>
      {/* GOOGLE BUTTON */}
      <TouchableOpacity
        style={GlobalStyles.socialButton}
        onPress={GoogleSignIn}
      >
        <Image
          source={require('../assets/images/GoogleIcon.png')}
          style={GlobalStyles.socialIcon}
        />
      </TouchableOpacity>

      {/* FACEBOOK BUTTON */}
      <TouchableOpacity
        style={GlobalStyles.socialButton}
        onPress={FacebookLogin}
      >
        <Image
          source={require('../assets/images/FacebookIcon.png')}
          style={GlobalStyles.socialIcon}
        />
      </TouchableOpacity>
    </View>
  );
};

export default GlobalSocialAuth;