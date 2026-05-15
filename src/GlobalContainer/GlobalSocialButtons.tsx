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

const GlobalSocialButtons = () => {
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

export default GlobalSocialButtons;






























































// import React, { useEffect, useState } from 'react';
// import { Alert, Image, TouchableOpacity, View, Text } from 'react-native';

// import GlobalStyles from '../assets/Styles/GlobalStyles';
// import auth from '@react-native-firebase/auth';
// import {
//   GoogleSignin,
//   statusCodes,
// } from '@react-native-google-signin/google-signin';
// import { LoginManager, AccessToken } from 'react-native-fbsdk-next';
// const SocialLogin = (navigation: any) => {
//   const [googleUserInfo, setGoogleUserInfo] = useState<any>(null);
//   const [facebookUserInfo, setFacebookUserInfo] = useState<any>(null);

//   useEffect(() => {
//     GoogleSignin.configure({
//       webClientId:
//         '720080454964-otev4leastlqa94ucrg3kglnbgmo3tqd.apps.googleusercontent.com',
//         scopes: ['profile', 'email', 'name'],
//     });
//   }, []);

//   const GoogleSignIn = async () => {
//     try {
//       await GoogleSignin.hasPlayServices();

//       // SHOW ALL GOOGLE ACCOUNTS POPUP
//       await GoogleSignin.signOut();

//       // GOOGLE LOGIN POPUP
//       const response = await GoogleSignin.signIn();

//       console.log('GOOGLE RESPONSE => ', response);

//       // GET TOKEN
//       const { idToken } = await GoogleSignin.getTokens();

//       // FIREBASE CREDENTIAL
//       const googleCredential = auth.GoogleAuthProvider.credential(idToken);

//       // FIREBASE LOGIN
//       const userCredential = await auth().signInWithCredential(
//         googleCredential,
//       );

//       // FIREBASE ID TOKEN
//       const firebaseIdToken = await userCredential.user.getIdToken();

//       console.log('Firebase TOKEN => ', firebaseIdToken);

//       console.log('EMAIL => ', userCredential.user.email);

//       Alert.alert(
//         'User DATA',
//         `UserId: ${response.data?.user.id}
// Name: ${response.data?.user.name || 'N/A'}
// Email: ${response.data?.user.email || 'N/A'}
// Photo: ${response.data?.user.photo || 'N/A'}
// Provider: Google
// id Token: ${idToken || 'N/A'}
// `,
//       );

//       // COMMON USER OBJECT
//       const userData = {
//         id: userCredential.user.uid,
//         name: userCredential.user.displayName || '',
//         email: userCredential.user.email || '',
//         photo: userCredential.user.photoURL || '',
//         provider: userCredential.user.providerId || '',
//       };

//       console.log('GOOGLE USER => ', userData);

//       setGoogleUserInfo(userData);
//     } catch (error) {
//       console.log('Google Sign In Error:', error);

//       if ((error as any).code === statusCodes.SIGN_IN_CANCELLED) {
//         Alert.alert('Cancelled', 'User cancelled login');
//       } else if ((error as any).code === statusCodes.IN_PROGRESS) {
//         Alert.alert('In Progress', 'Signin is already in progress');
//       } else if (
//         (error as any).code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE
//       ) {
//         Alert.alert(
//           'Play Services Error',
//           'Google Play Services not available',
//         );
//       } else {
//         Alert.alert('Info', 'Select any Google Account');
//       }
//     }
//   };

//   // =========================
//   // FACEBOOK LOGIN
//   // =========================
//   const FacebookLogin = async () => {
//     try {
//       // LOGOUT FIRST
//       LoginManager.logOut();

//       // FACEBOOK LOGIN
//       const result = await LoginManager.logInWithPermissions([
//         'public_profile',
//         'email',
//       ]);

//       console.log('FACEBOOK RESULT => ', result);

//       // CANCEL CHECK
//       if (result.isCancelled) {
//         Alert.alert('Cancelled', 'Facebook login cancelled');
//         return;
//       }

//       // ACCESS TOKEN
//       const data = await AccessToken.getCurrentAccessToken();

//       console.log('FACEBOOK TOKEN => ', data);

//       if (!data) {
//         Alert.alert('Error', 'Access token not found');
//         return;
//       }

//       // FIREBASE CREDENTIAL
//       const facebookCredential = auth.FacebookAuthProvider.credential(
//         data.accessToken,
//       );

//       // FIREBASE LOGIN
//       const userCredential = await auth().signInWithCredential(
//         facebookCredential,
//       );
//       // FIREBASE ID TOKEN
//       const firebaseIdToken = await userCredential.user.getIdToken();

//       console.log('Firebase TOKEN => ', firebaseIdToken);

//       console.log('FACEBOOK USER CREDENTIAL => ', userCredential);
//       // COMMON USER OBJECT
//       const userData = {
//         id: userCredential.user.uid,
//         name: userCredential.user.displayName || '',
//         email: userCredential.user.email || '',
//         photo: userCredential.user.photoURL || '',
//         provider: userCredential.user.providerId || '',
//       };

//       console.log('FACEBOOK USER => ', userData);

//       setFacebookUserInfo(userData);

//       Alert.alert(
//         'Facebook Login Success',
//         `Name: ${userData.name || 'N/A'}
// Email: ${userData.email || 'N/A'}
// Photo: ${userData.photo || 'N/A'}
// Provider: ${userData.provider || 'N/A'}
// id Token: ${data.accessToken || 'N/A'}
// `,
//       );
//     } catch (error: any) {
//       console.log('FACEBOOK LOGIN ERROR => ', error);

//       Alert.alert('Facebook Login Error', error?.message || String(error));
//     }
//   };

//   return (
//     // <View style={GlobalStyles.socialContainer}>
//     //   {/* Google Button */}
//     //   <TouchableOpacity
//     //     style={GlobalStyles.socialButton}
//     //     onPress={GoogleSignIn}
//     //   >
//     //     <Image
//     //       source={require('../assets/images/GoogleIcon.png')}
//     //       style={GlobalStyles.socialIcon}
//     //     />
//     //   </TouchableOpacity>

//     //   <TouchableOpacity
//     //     style={GlobalStyles.socialButton}
//     //     onPress={FacebookLogin}
//     //   >
//     //     <Image
//     //       source={require('../assets/images/FacebookIcon.png')}
//     //       style={GlobalStyles.socialIcon}
//     //     />
//     //   </TouchableOpacity>
//     // </View>
//     <View
//   style={GlobalStyles.socialContainer}
//   testID="social-container"
// >
//   {/* Google Button */}
//   <TouchableOpacity
//     testID="google-login-button"
//     accessibilityLabel="google-login-button"
//     style={GlobalStyles.socialButton}
//     onPress={GoogleSignIn}
//   >
//     <Image
//       source={require('../assets/images/GoogleIcon.png')}
//       style={GlobalStyles.socialIcon}
//     />
//   </TouchableOpacity>

//   {/* Facebook Button */}
//   <TouchableOpacity
//     testID="facebook-login-button"
//     accessibilityLabel="facebook-login-button"
//     style={GlobalStyles.socialButton}
//     onPress={FacebookLogin}
//   >
//     <Image
//       source={require('../assets/images/FacebookIcon.png')}
//       style={GlobalStyles.socialIcon}
//     />
//   </TouchableOpacity>
// </View>
//   );
// };
// export default SocialLogin;
