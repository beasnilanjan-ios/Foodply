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

//Test

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
  const [heading, setHeading] = useState(0);

  // Request Permission + Live Location
 useEffect(() => {
  requestLocationPermission();

  let previousLatitude = 0;
  let previousLongitude = 0;

  const watchId = Geolocation.watchPosition(
    async position => {
      const latitude = position.coords.latitude;
      const longitude = position.coords.longitude;

      console.log('Latitude:', latitude);
      console.log('Longitude:', longitude);

      // Ignore very small movement
      const latDiff = Math.abs(
        latitude - previousLatitude,
      );

      const lngDiff = Math.abs(
        longitude - previousLongitude,
      );

      if (latDiff < 0.00005 && lngDiff < 0.00005) {
        return;
      }

      // Calculate Heading
      if (
        previousLatitude !== 0 &&
        previousLongitude !== 0
      ) {
        const y =
          Math.sin(
            (longitude - previousLongitude) *
              (Math.PI / 180),
          ) *
          Math.cos(latitude * (Math.PI / 180));

        const x =
          Math.cos(previousLatitude * (Math.PI / 180)) *
            Math.sin(latitude * (Math.PI / 180)) -
          Math.sin(previousLatitude * (Math.PI / 180)) *
            Math.cos(latitude * (Math.PI / 180)) *
            Math.cos(
              (longitude - previousLongitude) *
                (Math.PI / 180),
            );

        let bearing =
          Math.atan2(y, x) * (180 / Math.PI);

        bearing = (bearing + 360) % 360;

        setHeading(bearing);
      }

      previousLatitude = latitude;
      previousLongitude = longitude;

      // Update current location
      setCurrentLocation({
        latitude,
        longitude,
      });

      // ALWAYS FETCH NEW ROUTE
      // Route now starts from updated current position
      await getRoute(
        latitude,
        longitude,
        destinationLocation.latitude,
        destinationLocation.longitude,
      );
    },

    error => {
      console.log('Location Error:', error);
    },

    {
      enableHighAccuracy: true,
      distanceFilter: 5,
      interval: 3000,
      fastestInterval: 2000,
      showLocationDialog: true,
      forceRequestLocation: true,
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
                mapStyle="https://tiles.stadiamaps.com/styles/alidade_smooth_dark.json"
                logo={false}
                compass={false}
                onPress={onMapPress}
              >
                {/* NAVIGATION CAMERA */}
                <Camera
                  zoom={16}
                  center={[
                    currentLocation.longitude,
                    currentLocation.latitude,
                  ]}
                  pitch={65}
                  bearing={heading}
                  duration={1200}
                  padding={{
                    paddingTop: 350,
                    paddingBottom: 120,
                    paddingLeft: 50,
                    paddingRight: 50,
                  }}
                />

                {/* BLUE USER DOT */}
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
                  <View style={styles.currentMarkerOuter}>
                    <View style={styles.currentMarkerInner} />
                  </View>
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

                {/* NAVIGATION ROUTE */}
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
                    {/* ROUTE GLOW */}
                    <Layer
                      id="routeGlow"
                      type="line"
                      paint={{
                        'line-color': '#00E5FF',
                        'line-width': 12,
                        'line-opacity': 0.25,
                      }}
                      layout={{
                        'line-cap': 'round',
                        'line-join': 'round',
                      }}
                    />

                    {/* MAIN ROUTE */}
                    <Layer
                      id="routeLayer"
                      type="line"
                      paint={{
                        'line-color': '#00E5FF',
                        'line-width': 6,
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

  
  currentMarkerOuter: {
  width: 28,
  height: 28,
  borderRadius: 14,
  backgroundColor: 'rgba(0,229,255,0.25)',
  justifyContent: 'center',
  alignItems: 'center',
},

currentMarkerInner: {
  width: 16,
  height: 16,
  borderRadius: 8,
  backgroundColor: '#00E5FF',
  borderWidth: 3,
  borderColor: '#FFFFFF',
},

destinationMarker: {
  width: 22,
  height: 22,
  borderRadius: 11,
  backgroundColor: '#FF3B30',
  borderWidth: 4,
  borderColor: '#FFFFFF',
},
});