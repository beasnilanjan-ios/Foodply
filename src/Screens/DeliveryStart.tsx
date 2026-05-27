import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  PermissionsAndroid,
  Platform,
} from 'react-native';

import {
  Map,
  Camera,
  UserLocation,
  Marker,
  GeoJSONSource,
  Layer,
} from '@maplibre/maplibre-react-native';

import Geolocation from 'react-native-geolocation-service';
import axios from 'axios';

import Colors from '../assets/Colors/Colors';
import GlobalTopBarDelivery from '../GlobalContainer/GlobalTopBarDelivery';
import { DeliveryOrderDetails } from '../Models/DeliveryOrderDetails/DeliveryOrderDetails';

export default function DeliveryStart({ route, navigation }: any) {
  const { orderDetail }: { orderDetail: DeliveryOrderDetails } =
    route.params;

  // Destination Location
  const [destinationLocation, setDestinationLocation] = useState({
    latitude: orderDetail.delivery.latestLocation.latitude || 22.8948,
    longitude: orderDetail.delivery.latestLocation.longitude || 88.4100,
  });

  // Current User Location
  const [currentLocation, setCurrentLocation] = useState({
    latitude: 22.8948,
    longitude: 88.3984,
  });

  // Route Coordinates
  const [routeCoordinates, setRouteCoordinates] = useState<any[]>([]);

  // Request Permission + Live Location
  useEffect(() => {
    requestLocationPermission();

    const watchId = Geolocation.watchPosition(
      position => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;

        console.log('Current Latitude:', latitude);
        console.log('Current Longitude:', longitude);

        setCurrentLocation({
          latitude,
          longitude,
        });
      },

      error => {
        console.log('Location Error:', error);
      },

      {
        enableHighAccuracy: true,
        distanceFilter: 5,
        interval: 3000,
        fastestInterval: 2000,
      },
    );

    return () => {
      Geolocation.clearWatch(watchId);
    };
  }, []);

  // Auto Update Route
  useEffect(() => {
    getRoute(
      currentLocation.latitude,
      currentLocation.longitude,
      destinationLocation.latitude,
      destinationLocation.longitude,
    );
  }, [currentLocation, destinationLocation]);

  // Permission
  const requestLocationPermission = async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      );

      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        console.log('Location permission denied');
      }
    }
  };

  // Fetch Real Road Route
const getRoute = async (
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number,
) => {
  try {
    const response = await axios.get(
      `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`,
    );

    if (
      response.data &&
      response.data.routes &&
      response.data.routes.length > 0
    ) {
      const rawCoordinates =
        response.data.routes[0].geometry.coordinates;

      // CLEAN COORDINATES
      const validCoordinates = rawCoordinates
        .filter(
          (item: any) =>
            Array.isArray(item) &&
            item.length >= 2 &&
            typeof item[0] === 'number' &&
            typeof item[1] === 'number' &&
            !isNaN(item[0]) &&
            !isNaN(item[1]),
        )
        .map((item: any) => [
          Number(item[0]),
          Number(item[1]),
        ]);

      console.log('VALID ROUTE:', validCoordinates);

      setRouteCoordinates(validCoordinates);
    }
  } catch (error) {
    console.log('Route Error:', error);
  }
};

  // Change Destination On Map Press
  const onMapPress = (e: any) => {
    try {
      const lngLat = e?.nativeEvent?.lngLat;
      if (Array.isArray(lngLat) && lngLat.length >= 2) {
        const [lng, lat] = lngLat;
        if (
          typeof lng === 'number' &&
          typeof lat === 'number' &&
          !isNaN(lng) &&
          !isNaN(lat)
        ) {
          setDestinationLocation({ latitude: lat, longitude: lng });
        }
      }
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <View style={styles.container}>
      <GlobalTopBarDelivery
        navigation={navigation}
        notificationClick={() => {}}
        text="Start Delivery"
        subtitleText={`#${orderDetail?.order.orderNumber}`}
        isBackVisible={true}
        isOnlineVisible={false}
      />

      <View style={styles.overlay}>
          {/* MAP CARD */}
          <View style={styles.card}>
            <View style={styles.mapContainer}>
              <Map
                style={styles.map}
                mapStyle="https://tiles.openfreemap.org/styles/liberty"
                logo={false}
                compass={true}
                onPress={onMapPress}
              >
                {/* CAMERA */}
                <Camera
                  zoom={15}
                  center={[
                    currentLocation.longitude,
                    currentLocation.latitude,
                  ]}
                  easing="fly"
                  duration={1000}
                />

                {/* USER LOCATION */}
                <UserLocation
                  animated={true}
                  accuracy={true}
                />

                {/* CURRENT LOCATION MARKER */}
                <Marker
                  lngLat={[
                    currentLocation.longitude,
                    currentLocation.latitude,
                  ]}
                >
                  <View style={styles.currentMarker} />
                </Marker>

                {/* DESTINATION MARKER */}
                <Marker
                  lngLat={[
                    destinationLocation.longitude,
                    destinationLocation.latitude,
                  ]}
                >
                  <View style={styles.destinationMarker} />
                </Marker>

                {/* ROUTE PATH */}
                {routeCoordinates.length > 1 && (
                  <GeoJSONSource
                    id="routeSource"
                    data={{
                      type: 'FeatureCollection',
                      features: [
                        {
                          type: 'Feature',
                          properties: {},
                          geometry: {
                            type: 'LineString',
                            coordinates: routeCoordinates,
                          },
                        },
                      ],
                    }}
                  >
                    <Layer
                      id="routeLayer"
                      type="line"
                      paint={{
                        'line-color': '#007AFF',
                        'line-width': 5,
                      }}
                      layout={{
                        'line-cap': 'round',
                        'line-join': 'round',
                      }}
                    />
                  </GeoJSONSource>
                )}
              </Map>
            </View>
          </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
    paddingTop: 100,
  },

  overlay: {
    flex: 1,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: 20,
  },

  card: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },

  mapContainer: {
    height: "100%",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },

  map: {
    flex: 1,
  },

  currentMarker: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'blue',
    borderWidth: 3,
    borderColor: '#fff',
  },

  destinationMarker: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'red',
    borderWidth: 3,
    borderColor: '#fff',
  },
});