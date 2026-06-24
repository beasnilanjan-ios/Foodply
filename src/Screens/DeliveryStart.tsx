import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  PermissionsAndroid,
  Platform,
  Image,
  Text,
  TouchableOpacity,
} from 'react-native';

import {
  Map,
  Camera,
  Marker,
  GeoJSONSource,
  Layer,
} from '@maplibre/maplibre-react-native';

import Geolocation from 'react-native-geolocation-service';
import axios from 'axios';

import Colors from '../assets/Colors/Colors';
import GlobalTopBarDelivery from '../GlobalContainer/GlobalTopBarDelivery';
import { DeliveryOrderDetails } from '../Models/DeliveryOrderDetails/DeliveryOrderDetails';
import { FontFamily } from '../assets/GlobalFont/GlobalFont';

const DARK_MAP_STYLE =
  'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

export default function DeliveryStart({
  route,
  navigation,
}: any) {
  const {
    orderDetail,
  }: {
    orderDetail: DeliveryOrderDetails;
  } = route.params;

  const [showDetailsCard, setShowDetailsCard] =
  useState(true);

  // DESTINATION
  const [destinationLocation] = useState({
    latitude:
      orderDetail.customer.address.latitude ||
      22.8948,

    longitude:
      orderDetail.customer.address.longitude ||
      88.4100,
  });

  // CURRENT LOCATION
  const [
    currentLocation,
    setCurrentLocation,
  ] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  // ROUTE
  const [routeCoordinates, setRouteCoordinates] =
    useState<any[]>([]);

  // CAMERA HEADING
  const [cameraHeading, setCameraHeading] =
    useState(0);

  // SCOOTER HEADING
  const [markerHeading, setMarkerHeading] =
    useState(0);

  // PREVIOUS LOCATION
  const previousCoordinateRef = useRef<{
    latitude: number;
    longitude: number;
  } | null>(null);

  // REQUEST LOCATION PERMISSION
  const requestLocationPermission =
    async () => {
      if (Platform.OS === 'android') {
        const granted =
          await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS
              .ACCESS_FINE_LOCATION,
          );

        if (
          granted !==
          PermissionsAndroid.RESULTS.GRANTED
        ) {
          console.log(
            'Location permission denied',
          );
        }
      }
    };

  // GET BEARING
  const calculateBearing = (
    startLat: number,
    startLng: number,
    endLat: number,
    endLng: number,
  ) => {
    const startLatRad =
      (startLat * Math.PI) / 180;

    const startLngRad =
      (startLng * Math.PI) / 180;

    const endLatRad =
      (endLat * Math.PI) / 180;

    const endLngRad =
      (endLng * Math.PI) / 180;

    const dLng = endLngRad - startLngRad;

    const y =
      Math.sin(dLng) *
      Math.cos(endLatRad);

    const x =
      Math.cos(startLatRad) *
        Math.sin(endLatRad) -
      Math.sin(startLatRad) *
        Math.cos(endLatRad) *
        Math.cos(dLng);

    let bearing =
      (Math.atan2(y, x) * 180) /
      Math.PI;

    bearing = (bearing + 360) % 360;

    return bearing;
  };

  // DISTANCE BETWEEN TWO POINTS
  const getDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ) => {
    const R = 6371e3;

    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;

    const Δφ =
      ((lat2 - lat1) * Math.PI) / 180;

    const Δλ =
      ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) *
        Math.sin(Δφ / 2) +
      Math.cos(φ1) *
        Math.cos(φ2) *
        Math.sin(Δλ / 2) *
        Math.sin(Δλ / 2);

    const c =
      2 *
      Math.atan2(
        Math.sqrt(a),
        Math.sqrt(1 - a),
      );

    return R * c;
  };

  // ROUTE API
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
        const coordinates =
          response.data.routes[0].geometry.coordinates;

        setRouteCoordinates(coordinates);
      }
    } catch (error) {
      console.log('ROUTE ERROR', error);
    }
  };

  // INITIAL LOCATION
  const getCurrentLocation = async () => {
    Geolocation.getCurrentPosition(
      async position => {
        const latitude =
          position.coords.latitude;

        const longitude =
          position.coords.longitude;

        setCurrentLocation({
          latitude,
          longitude,
        });

        previousCoordinateRef.current = {
          latitude,
          longitude,
        };

        await getRoute(
          latitude,
          longitude,
          destinationLocation.latitude,
          destinationLocation.longitude,
        );
      },

      error => {
        console.log(error);
      },

      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 10000,
      },
    );
  };

  // LIVE TRACKING
  useEffect(() => {
    requestLocationPermission();

    getCurrentLocation();

    const watchId =
      Geolocation.watchPosition(
        async position => {
          const latitude =
            position.coords.latitude;

          const longitude =
            position.coords.longitude;

          const previous =
            previousCoordinateRef.current;

          // UPDATE LOCATION
          setCurrentLocation({
            latitude,
            longitude,
          });

          // CALCULATE HEADING
          if (previous) {
            const movedDistance =
              getDistance(
                previous.latitude,
                previous.longitude,
                latitude,
                longitude,
              );

            // IGNORE GPS SHAKE
            if (movedDistance > 5) {
              const bearing =
                calculateBearing(
                  previous.latitude,
                  previous.longitude,
                  latitude,
                  longitude,
                );

              // CAMERA ROTATION
              setCameraHeading(prev => {
                let diff = bearing - prev;

                if (diff > 180) diff -= 360;
                if (diff < -180) diff += 360;

                return prev + diff * 0.15;
              });

              // SCOOTER ROTATION
              setMarkerHeading(prev => {
                let diff = bearing - prev;

                if (diff > 180) diff -= 360;
                if (diff < -180) diff += 360;

                return prev + diff * 0.25;
              });
            }
          }

          previousCoordinateRef.current = {
            latitude,
            longitude,
          };

          // UPDATE ROUTE
          await getRoute(
            latitude,
            longitude,
            destinationLocation.latitude,
            destinationLocation.longitude,
          );
        },

        error => {
          console.log(error);
        },

        {
          enableHighAccuracy: true,
          distanceFilter: 5,
          interval: 2500,
          fastestInterval: 2000,
          showLocationDialog: true,
          forceRequestLocation: true,
        },
      );

    return () => {
      Geolocation.clearWatch(watchId);
    };
  }, []);

  const getForwardCoordinate = (
      latitude: number,
      longitude: number,
      bearing: number,
      distanceMeters: number,
    ): [number, number] => {
      const R = 6378137;

      const brng = (bearing * Math.PI) / 180;

      const lat1 = (latitude * Math.PI) / 180;
      const lon1 = (longitude * Math.PI) / 180;

      const lat2 = Math.asin(
        Math.sin(lat1) *
          Math.cos(distanceMeters / R) +
          Math.cos(lat1) *
            Math.sin(distanceMeters / R) *
            Math.cos(brng),
      );

      const lon2 =
        lon1 +
        Math.atan2(
          Math.sin(brng) *
            Math.sin(distanceMeters / R) *
            Math.cos(lat1),
          Math.cos(distanceMeters / R) -
            Math.sin(lat1) * Math.sin(lat2),
        );

      return [
        (lon2 * 180) / Math.PI,
        (lat2 * 180) / Math.PI,
      ];
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
        <View style={styles.card}>
          <View style={styles.mapContainer}>
            <Map
              style={styles.map}
              mapStyle={DARK_MAP_STYLE}
              logo={false}
              compass={true}
            >
              {/* CAMERA */}
              {currentLocation && (
                <Camera
                  zoom={17}
                  pitch={70}
                  bearing={cameraHeading}
                  duration={1000}
                  center={getForwardCoordinate(
                    currentLocation.latitude,
                    currentLocation.longitude,
                    cameraHeading,
                    90, // look 90m ahead
                  )}
                />
              )}

              {/* DELIVERY BOY MARKER */}
              {currentLocation && (
                <Marker
                  anchor="center"
                  lngLat={[
                    currentLocation.longitude,
                    currentLocation.latitude,
                  ]}
                >
                  <View
                    style={[
                      styles.currentMarkerWrapper,
                      {
                        transform: [
                          {
                            rotate: `${markerHeading - (230 * 1)}deg`,
                          },
                        ],
                      },
                    ]}
                  >
                    <Image
                      source={require('../assets/images/delivery_person.png')}
                      style={styles.deliveryIcon}
                      resizeMode="contain"
                    />
                  </View>
                </Marker>
              )}

              {/* DESTINATION */}
              <Marker
                anchor="center"
                lngLat={[
                  destinationLocation.longitude,
                  destinationLocation.latitude,
                ]}
              >
                <View
                  style={
                    styles.destinationMarkerWrapper
                  }
                >
                  <View
                    style={
                      styles.destinationMarker
                    }
                  />
                </View>
              </Marker>

              {/* ROUTE */}
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
                          coordinates:
                            routeCoordinates,
                        },
                      },
                    ],
                  }}
                >
                  {/* ROUTE SHADOW */}
                  <Layer
                    id="routeLayerBg"
                    type="line"
                    paint={{
                      'line-color':
                        '#0B3B2E',
                      'line-width': 10,
                      'line-opacity': 0.7,
                    }}
                    layout={{
                      'line-cap':
                        'round',
                      'line-join':
                        'round',
                    }}
                  />

                  {/* MAIN ROUTE */}
                  <Layer
                    id="routeLayer"
                    type="line"
                    paint={{
                      'line-color':
                        '#00FF9D',
                      'line-width': 6,
                      'line-opacity': 1,
                    }}
                    layout={{
                      'line-cap':
                        'round',
                      'line-join':
                        'round',
                    }}
                  />
                </GeoJSONSource>
              )}
            </Map>


            {/* FLOATING CARD */}
            {showDetailsCard ? (
            <View style={styles.card1}>
              {/* USER INFO */}
              <View style={styles.header}>
                <Image
                  source={{
                    uri: "https://i.pravatar.cc/150?img=12",
                  }}
                  style={styles.avatar}
                />

                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{orderDetail.customer.name}</Text>
                  <Text style={styles.phone}>{orderDetail.customer.phone}</Text>
                  <Text style={styles.address}>
                   {orderDetail.customer.address.fullText}
                  </Text>
                </View>

                <View style={styles.iconColumn}>
                  <TouchableOpacity style={styles.circleBtn}>
                    <Image source={require('../assets/images/call.png')} style={styles.smallIcon} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* ORDER INFO */}
              <View style={styles.orderRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                  <Image source={require('../assets/images/shopping_bag.png')} style={styles.smallIconOrange} />
               
                  <View>
                    <Text style={styles.smallLabel}>{orderDetail.items.length} Items • {orderDetail.items.reduce((acc, item) => acc + item.quantity, 0)} Qty</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                      <Text style={styles.smallLabel}>Payment Status</Text>
                       <View style={styles.codBadge}>
                          <Text style={styles.codText}>{orderDetail.billing.paymentStatus}</Text>
                        </View>
                    </View>
                  </View>
                </View>
                <View>
                  <Text style={styles.smallLabel}>Order Amount</Text>
                  <Text style={styles.amount}>₹{orderDetail.billing.finalAmount.toFixed(2)}</Text>
                </View>
              </View>

              {/* LIVE STATUS */}
              <View style={styles.liveBox}>
                <View style={styles.iconCircle}>
                  <Image source={require('../assets/images/scooter.png')} style={styles.bikeIcon} />
                </View>
                <View style={{ marginLeft: 10 }}>
                  <Text style={styles.liveTitle}>Live Status</Text>
                  <Text style={styles.liveText}>
                    You are on the way to the customer
                  </Text>
                </View>
              </View>

              {/* PROGRESS */}
              <View style={{ marginTop: 20 }}>
                <Text style={styles.progressTitle}>Order Progress</Text>

                <View style={styles.progressRow}>
                    {["Assigned", "Accepted", "Picked", "On The Way", "Delivered"].map(
                      (item, index) => {
                        const isActive = index <= 3;
                        const isOnWay = item === "On The Way";

                        return (
                          <View key={index} style={styles.stepContainer}>
                            <View
                              style={[
                                styles.stepCircle,
                                isActive && styles.activeStep,

                                // LIGHT ORANGE BACKGROUND FOR ON WAY
                                isOnWay && styles.onWayStep,
                              ]}
                            >
                              {isOnWay ? (
                                <Image
                                  source={require('../assets/images/scooter.png')}
                                  style={styles.scooterIcon}
                                />
                              ) : (
                                <Image
                                  source={require('../assets/images/check.png')}
                                  style={[
                                    styles.checkIcon,
                                    {
                                      tintColor: isActive
                                        ?Colors.primary
                                        : "#bbb",
                                    },
                                  ]}
                                />
                              )}
                            </View>

                            <Text style={styles.stepText}>
                              {item}
                            </Text>

                            {index !== 4 && (
                              <View
                                style={[
                                  styles.line,
                                  index < 3 && styles.activeLine,
                                ]}
                              />
                            )}
                          </View>
                        );
                      }
                    )}
                  </View>
              </View>

              {/* BUTTONS */}
              <View style={styles.buttonRow}>
                <TouchableOpacity style={styles.mapBtn}  onPress={() =>
                     setShowDetailsCard(false)
                }>
                  <Text style={styles.mapBtnText}>Open in Maps</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.deliverBtn} onPress={() =>
                   navigation.navigate('DeliveryOtpVerification', { orderDetail: orderDetail })
                }>
                  <Text style={styles.deliverBtnText}>Order Delivered</Text>
                </TouchableOpacity>
              </View>
             </View>
                ) : (
                  <TouchableOpacity
                    activeOpacity={0.8}
                    style={styles.floatingShowButton}
                    onPress={() =>
                      setShowDetailsCard(true)
                    }
                  >
                    <Image
                      source={require('../assets/images/shopping_bag.png')}
                      style={styles.floatingArrow}
                    />
                  </TouchableOpacity>
                )}
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
    flex: 1,
  },

  mapContainer: {
    flex: 1,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },

  map: {
    flex: 1,
  },

  currentMarkerWrapper: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },

  deliveryIcon: {
    width: 56,
    height: 56,
    tintColor: Colors.primary,
  },

  destinationMarkerWrapper: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },

  destinationMarker: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'red',
    borderWidth: 3,
    borderColor: '#fff',
  },
    card1: {
    position: "absolute",
    bottom: 20,
    left: 15,
    right: 15,
    backgroundColor: "#fff",
    borderRadius: 25,
    padding: 18,

    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 5,
    },
    elevation: 8,
  },

  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },

  avatar: {
    width: 60,
    height: 60,
    borderRadius: 20,
    marginRight: 12,
  },

  name: {
    fontSize: 18,
    fontFamily: FontFamily.medium,
    color: Colors.textColor,
  },

  phone: {
    color: Colors.textBrown,
    fontFamily: FontFamily.regular,
    marginTop: 2,
    fontSize: 12,
  },

  address: {
    color: Colors.textBrown,
    marginTop: 2,
    fontSize: 12,
    fontFamily: FontFamily.regular,
  },

  iconColumn: {
    gap: 0,
  },

  circleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#7bc043",
    justifyContent: "center",
    alignItems: "center",
  },

  orderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },

  smallLabel: {
    color: Colors.textBrown,
    fontSize: 14,
    fontFamily: FontFamily.regular,
  },

  boldText: {
    fontFamily: FontFamily.bold,
    marginTop: 2,
    fontSize: 14,
  },

  amount: {
    color: Colors.primary,
    fontSize: 18,
    fontFamily: FontFamily.regular,
    marginTop: 2,
  },

  liveBox: {
    flexDirection: "row",
    backgroundColor: '#FEF6F3',
    padding: 6,
    borderRadius: 10,
    marginTop: 18,
    alignItems: "center",
  },

  liveTitle: {
    color: Colors.textColor,
    fontFamily: FontFamily.medium,
  },

  liveText: {
    color: Colors.textBrown,
    marginTop: 3,
    fontSize: 12,
    fontFamily: FontFamily.regular,
  },

  progressTitle: {
    fontFamily: FontFamily.medium,
    marginBottom: 15,
    color: Colors.textColor,
  },

  progressRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  stepContainer: {
    alignItems: "center",
    flex: 1,
    position: "relative",
    justifyContent: "flex-start",
  },

 stepCircle: {
  width: 30,
  height: 30,
  borderRadius: 15,
  backgroundColor: "#e5e5e5",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 2,
},
  activeStep: {
    backgroundColor: Colors.lightOrange,
  },

  line: {
    position: "absolute",
    top: 12,
    left: "50%",
    width: "100%",
    height: 3,
    backgroundColor: "#ddd",
    zIndex: 1,
  },

  activeLine: {
    backgroundColor: Colors.primary,
  },

  stepText: {
    fontSize: 10,
    marginTop: 10,
    color: Colors.textBrown,
    textAlign: "center",
    fontFamily: FontFamily.regular,
  },

  buttonRow: {
    flexDirection: "row",
    marginTop: 25,
    gap: 12,
  },

  mapBtn: {
    flex: 1,
    backgroundColor: Colors.buttonLight,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },

  deliverBtn: {
    flex: 1,
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },

  mapBtnText: {
    color: Colors.primary,
    fontFamily: FontFamily.regular,
    fontSize: 16,
  },

  deliverBtnText: {
    color: "#fff",
    fontFamily: FontFamily.regular,
    fontSize: 16,
  },

  smallIcon: {
    width: 18,
    height: 18,
    tintColor: "#fff",
},

smallIconOrange: {
    width: 30,
    height: 30,
    tintColor: Colors.primary,
},

bikeIcon: {
  width: 24,
  height: 24,
  tintColor: Colors.primary,
},

checkIcon: {
  width: 16,
  height: 16,
},
 iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.lightOrange,
    justifyContent: 'center',
    alignItems: 'center',
  },
   codBadge: {
    backgroundColor: Colors.lightBackground,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    marginLeft: 2,
  },

  codText: {
    color: Colors.primary,
    fontSize: 12,
    fontFamily: FontFamily.semiBold,
  },
  onWayStep: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.lightOrange,

    justifyContent: "center",
    alignItems: "center",

    zIndex: 3,
},

scooterIcon: {
  width: 20,
  height: 20,
  tintColor: Colors.primary,
},
hideButton: {
  width: 32,
  height: 32,
  borderRadius: 16,
  backgroundColor: "#F5F5F5",
  justifyContent: "center",
  alignItems: "center",
  marginLeft: 10,
},

hideIcon: {
  width: 16,
  height: 16,
  tintColor: Colors.textColor,
},

floatingShowButton: {
  position: "absolute",
  bottom: 30,
  right: 20,
  width: 40,
  height: 40,
  borderRadius: 20,

  backgroundColor: Colors.primary,

  justifyContent: "center",
  alignItems: "center",

  shadowColor: "#000",
  shadowOpacity: 0.2,
  shadowRadius: 8,
  shadowOffset: {
    width: 0,
    height: 4,
  },

  elevation: 10,
},

floatingArrow: {
  width: 24,
  height: 24,
  tintColor: "#fff",
},
});