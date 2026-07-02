// import { Alert, PermissionsAndroid, Platform } from 'react-native';

// export default class GlobalLocationPermission {
//   static async request() {
//     if (Platform.OS !== 'android') {
//       return true;
//     }

//     try {
//       const granted = await PermissionsAndroid.request(
//         PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
//         {
//           title: 'Location Permission',
//           message: 'Foodyply needs your location to show nearby restaurants and deliveries.',
//           buttonPositive: 'Allow',
//           buttonNegative: 'Deny',
//         },
//       );

//       if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
//         Alert.alert('FoodyPly', 'Location permission is required to continue');
//         return false;
//       }

//       return true;
//     } catch (error) {
//       Alert.alert('FoodyPly', 'Unable to request location permission');
//       return false;
//     }
//   }
// }


import { Alert, PermissionsAndroid, Platform, Linking } from 'react-native';
import Geolocation from 'react-native-geolocation-service';

export default class GlobalLocationPermission {

  // ✅ REQUEST PERMISSION
  static async request(): Promise<'granted' | 'denied'> {
    try {
      // 👉 iOS
      if (Platform.OS === 'ios') {
        const status = await Geolocation.requestAuthorization('whenInUse');
        console.log('iOS location authorization result:', status);

        if (status === 'granted') {
          return 'granted';
        }

        if (status === 'denied' || status === 'restricted') {
          Alert.alert(
            'Location Permission Denied',
            'Please enable location permission from Settings.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Open Settings', onPress: () => Linking.openSettings() },
            ]
          );
        }

        if (status === 'disabled') {
          Alert.alert(
            'Location Disabled',
            'Please turn on Location Services.'
          );
        }

        return 'denied';
      }

      // 👉 Android
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'Foodyply needs your location to show nearby restaurants and deliveries.',
            buttonPositive: 'Allow',
            buttonNegative: 'Deny',
          }
        );

        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          return 'granted';
        } else {
          Alert.alert(
            'Permission Denied',
            'Location permission is required to continue'
          );
          return 'denied';
        }
      }

      return 'denied';

    } catch (error) {
      console.log('Permission Error:', error);
      Alert.alert('Error', 'Unable to request location permission');
      return 'denied';
    }
  }

  private static getPosition(options: any): Promise<any> {
    return new Promise((resolve, reject) => {
      let completed = false;
      const timeoutMs =
        typeof options?.timeout === 'number' ? options.timeout + 1000 : 21000;
      const timeout = setTimeout(() => {
        if (completed) {
          return;
        }

        completed = true;
        reject({
          code: 3,
          message: 'Location request timed out before coordinates were received',
        });
      }, timeoutMs);

      Geolocation.getCurrentPosition(
        (position) => {
          if (completed) {
            return;
          }

          completed = true;
          clearTimeout(timeout);
          console.log('Current location received:', position);
          resolve(position);
        },
        (error) => {
          if (completed) {
            return;
          }

          completed = true;
          clearTimeout(timeout);
          console.log('Location Error:', error);
          reject(error);
        },
        options
      );
    });
  }

  // ✅ GET CURRENT LOCATION
  static async getCurrentLocation(): Promise<any> {
    const options =
      Platform.OS === 'ios'
        ? {
            accuracy: { ios: 'hundredMeters' },
            enableHighAccuracy: false,
            timeout: 20000,
            maximumAge: 60000,
            distanceFilter: 0,
          }
        : {
            accuracy: { android: 'balanced' },
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 10000,
            distanceFilter: 0,
            forceRequestLocation: true,
            showLocationDialog: true,
          };

    try {
      return await this.getPosition(options);
    } catch (error) {
      if (Platform.OS !== 'ios') {
        throw error;
      }

      console.log('Retrying iOS location with reduced accuracy');

      return this.getPosition({
        accuracy: { ios: 'reduced' },
        enableHighAccuracy: false,
        timeout: 20000,
        maximumAge: 300000,
        distanceFilter: 0,
      });
    }
  }

  static async getSearchBiasLocation(): Promise<{
    lat: number;
    lon: number;
  } | null> {
    try {
      if (Platform.OS === 'android') {
        let hasPermission = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        );

        if (!hasPermission) {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
            {
              title: 'Improve address search',
              message:
                'Allow location to show nearby address suggestions while you type.',
              buttonPositive: 'Allow',
              buttonNegative: 'Not now',
            },
          );
          hasPermission = granted === PermissionsAndroid.RESULTS.GRANTED;
        }

        if (!hasPermission) {
          return null;
        }
      } else {
        const status = await Geolocation.requestAuthorization('whenInUse');
        if (status !== 'granted') {
          return null;
        }
      }

      const position = await this.getCurrentLocation();

      return {
        lat: position.coords.latitude,
        lon: position.coords.longitude,
      };
    } catch (error) {
      console.log('Search bias location unavailable:', error);
      return null;
    }
  }
}
