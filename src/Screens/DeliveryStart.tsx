//re-route rnd 1
import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  PermissionsAndroid,
  Platform,
  Image,
  Text,
  TouchableOpacity,
  ToastAndroid,
  Alert,
} from 'react-native';

import {
  Map,
  Camera,
  Marker,
  GeoJSONSource,
  Layer,
} from '@maplibre/maplibre-react-native';
import { OSM_STYLE } from '../GlobalContainer/mapStyle';
import Geolocation from 'react-native-geolocation-service';
import axios from 'axios';

import Colors from '../assets/Colors/Colors';
import GlobalTopBarDelivery from '../GlobalContainer/GlobalTopBarDelivery';
import { DeliveryOrderDetails } from '../Models/DeliveryOrderDetails/DeliveryOrderDetails';
import { FontFamily } from '../assets/GlobalFont/GlobalFont';
import GlobalLoginAuth from '../GlobalContainer/GlobalLoginAuth';
import GlobalApi from '../GlobalContainer/GlobalApi';
import GlobalLoader from '../GlobalContainer/GlobalLoader';
import { SendOtpResponse } from '../Models/SendOTP/SendOtpResponse ';

const DARK_MAP_STYLE =
  'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

export default function DeliveryStart({ route, navigation }: any) {
  const {
    orderDetail,
  }: {
    orderDetail: DeliveryOrderDetails;
  } = route.params;

  const [showDetailsCard, setShowDetailsCard] = useState(true);
  const lastSnappedIndexRef = useRef(-1);
  // DESTINATION
  const [destinationLocation] = useState({
    latitude: orderDetail.customer.address.latitude || 22.8948,

    longitude: orderDetail.customer.address.longitude || 88.41,
  });

  // CURRENT LOCATION
  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  // ROUTE
  const [routeCoordinates, setRouteCoordinates] = useState<any[]>([]);
  const routeCoordinatesRef = useRef<any[]>([]);
  const [remainingRoute, setRemainingRoute] = useState<any[]>([]);
  const headingRef = useRef(0);
  const cameraHeadingRef = useRef(0);
  const markerAnimationRef = useRef<any>(null); // cancel old animation before new one
  const headingAnimationRef = useRef<any>(null); // cancel old heading animation
  const riderPositionRef = useRef<{
    latitude: number;
    longitude: number;
  } | null>(null); // always fresh position
  const lastAnimatedBearingRef = useRef<number>(-1);
  const isReroutingRef = useRef(false);
  const offRouteCountRef = useRef(0); // last bearing jo animate hua — dobara same pe na karo
  const [riderPosition, setRiderPosition] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  // CAMERA HEADING
  const [cameraHeading, setCameraHeading] = useState(0);

  // SCOOTER HEADING
  const [markerHeading, setMarkerHeading] = useState(0);
  const [loading, setLoading] = useState(false);
  // FREE CAMERA MODE — jab user zoom/pan kare to rider follow band ho jaye
  const [isFollowingRider, setIsFollowingRider] = useState(true);
  const userInteractingRef = useRef(false);
  const interactionTimerRef = useRef<any>(null);
  const [locationHistory, setLocationHistory] = useState<
    { latitude: number; longitude: number }[]
  >([]);
  // PREVIOUS LOCATION
  const previousCoordinateRef = useRef<{
    latitude: number;
    longitude: number;
  } | null>(null);

  // REQUEST LOCATION PERMISSION
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

  const calculateBearing = (
    startLat: number,

    startLng: number,

    endLat: number,

    endLng: number,
  ) => {
    const dLon = ((endLng - startLng) * Math.PI) / 180;

    const y = Math.sin(dLon) * Math.cos((endLat * Math.PI) / 180);

    const x =
      Math.cos((startLat * Math.PI) / 180) *
        Math.sin((endLat * Math.PI) / 180) -
      Math.sin((startLat * Math.PI) / 180) *
        Math.cos((endLat * Math.PI) / 180) *
        Math.cos(dLon);

    const brng = (Math.atan2(y, x) * 180) / Math.PI;

    return (brng + 360) % 360;
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

    const Δφ = ((lat2 - lat1) * Math.PI) / 180;

    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  const getProjectedPointOnSegment = (
    lat: number,
    lng: number,
    startLat: number,
    startLng: number,
    endLat: number,
    endLng: number,
  ) => {
    const dx = endLng - startLng;
    const dy = endLat - startLat;

    const lengthSquared = dx * dx + dy * dy;

    if (lengthSquared === 0) {
      return {
        latitude: startLat,
        longitude: startLng,
        t: 0,
      };
    }

    let t = ((lng - startLng) * dx + (lat - startLat) * dy) / lengthSquared;

    t = Math.max(0, Math.min(1, t));

    return {
      latitude: startLat + t * dy,
      longitude: startLng + t * dx,
      t,
    };
  };

  const getNearestPointOnRoute = (
    latitude: number,
    longitude: number,
    route: any[],
  ) => {
    if (route.length < 2) {
      return null;
    }

    let minDistance = Infinity;

    let nearestIndex = 0;

    let projectedPoint: any = null;

    for (let i = 0; i < route.length - 1; i++) {
      const start = route[i];
      const end = route[i + 1];

      const projected = getProjectedPointOnSegment(
        latitude,
        longitude,
        start[1],
        start[0],
        end[1],
        end[0],
      );

      const distance = getDistance(
        latitude,
        longitude,
        projected.latitude,
        projected.longitude,
      );

      if (distance < minDistance) {
        minDistance = distance;
        nearestIndex = i;
        projectedPoint = projected;
      }
    }

    return {
      index: nearestIndex,
      distance: minDistance,
      point: projectedPoint,
    };
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
        const osrmCoordinates = response.data.routes[0].geometry.coordinates;

        // Insert actual GPS as first point
        const coordinates = [[startLng, startLat], ...osrmCoordinates];

        for (let i = 0; i < 5; i++) {
          const dist = getDistance(
            coordinates[i][1],
            coordinates[i][0],
            coordinates[i + 1][1],
            coordinates[i + 1][0],
          );

          console.log(`Distance ${i} -> ${i + 1}:`, dist);
        }
        setRouteCoordinates(coordinates);
        routeCoordinatesRef.current = coordinates;

        console.log('Route Length:', coordinates.length);

        console.log('First Route Point:', coordinates[0]);

        console.log('Start GPS:', startLat, startLng);

        console.log(
          'Distance Between Start And Route Point:',
          getDistance(startLat, startLng, coordinates[0][1], coordinates[0][0]),
        );

        if (!riderPosition && coordinates.length > 0) {
          const initialPos = {
            latitude: coordinates[0][1],
            longitude: coordinates[0][0],
          };
          riderPositionRef.current = initialPos;
          setRiderPosition(initialPos);

          lastSnappedIndexRef.current = 0;

          setRemainingRoute(coordinates);
        }
      }
    } catch (error) {
      console.log('ROUTE ERROR', error);
    }
  };

  // RE-ROUTE — rider off-route ho gaya, current position se naya route fetch karo
  const reRoute = async (currentLat: number, currentLng: number) => {
    if (isReroutingRef.current) return;
    isReroutingRef.current = true;

    ToastAndroid.show('Re-routing...', ToastAndroid.SHORT);

    try {
      const response = await axios.get(
        `https://router.project-osrm.org/route/v1/driving/${currentLng},${currentLat};${destinationLocation.longitude},${destinationLocation.latitude}?overview=full&geometries=geojson`,
      );

      if (response.data?.routes?.length > 0) {
        const osrmCoordinates = response.data.routes[0].geometry.coordinates;

        // Naye route ka pehla snapped point nikalo
        const firstSnapped = osrmCoordinates[0]; // [lng, lat]

        // ── SMOOTH ANIMATION: rider current pos → naye route ke pehle point tak ──
        // Rider abhi jahan hai wahan se naye route pe smoothly leke jao
        const currentRiderPos = riderPositionRef.current;
        if (currentRiderPos) {
          const SMOOTH_STEPS = 20;
          const SMOOTH_INTERVAL = 50; // ms — total ~1 second smooth slide
          let step = 0;

          const fromLat = currentRiderPos.latitude;
          const fromLng = currentRiderPos.longitude;
          const toLat = firstSnapped[1];
          const toLng = firstSnapped[0];

          const slideInterval = setInterval(() => {
            step++;
            const progress = step / SMOOTH_STEPS;
            const easedProgress = 1 - Math.pow(1 - progress, 3); // ease-out cubic

            const newPos = {
              latitude: fromLat + (toLat - fromLat) * easedProgress,
              longitude: fromLng + (toLng - fromLng) * easedProgress,
            };
            riderPositionRef.current = newPos;
            setRiderPosition(newPos);

            if (step >= SMOOTH_STEPS) {
              clearInterval(slideInterval);

              // Animation complete — ab naya route set karo
              const newCoordinates = [
                firstSnapped,
                ...osrmCoordinates.slice(1),
              ];
              setRouteCoordinates(newCoordinates);
              routeCoordinatesRef.current = newCoordinates;
              setRemainingRoute(newCoordinates);
              lastSnappedIndexRef.current = 0;
              offRouteCountRef.current = 0;

              ToastAndroid.show('Route updated!', ToastAndroid.SHORT);
            }
          }, SMOOTH_INTERVAL);
        } else {
          // Agar riderPosition nahi hai — directly set karo
          const newCoordinates = [firstSnapped, ...osrmCoordinates.slice(1)];
          setRouteCoordinates(newCoordinates);
          routeCoordinatesRef.current = newCoordinates;
          setRemainingRoute(newCoordinates);
          lastSnappedIndexRef.current = 0;
          offRouteCountRef.current = 0;
          ToastAndroid.show('Route updated!', ToastAndroid.SHORT);
        }
      }
    } catch (error) {
      console.log('Re-route error:', error);
    } finally {
      isReroutingRef.current = false;
    }
  };

  // INITIAL LOCATION
  const getCurrentLocation = async () => {
    Geolocation.getCurrentPosition(
      async position => {
        const latitude = position.coords.latitude;

        const longitude = position.coords.longitude;

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

    const animateMarker = (
      startLat: number,
      startLng: number,
      endLat: number,
      endLng: number,
    ) => {
      // CANCEL previous animation — nahi to purani aur nayi dono chalti hain
      if (markerAnimationRef.current) {
        clearInterval(markerAnimationRef.current);
        markerAnimationRef.current = null;
      }

      // Bike fast ho to kam steps — marker peeche nahi rahega
      const distance = Math.sqrt(
        Math.pow(endLat - startLat, 2) + Math.pow(endLng - startLng, 2),
      ); // Fast movement = fewer steps (snap quickly), slow = more steps (smooth)

      const steps = distance > 0.0005 ? 6 : 10; // ~55m threshold
      let currentStep = 0;

      const interval = setInterval(() => {
        currentStep++;
        const progress = currentStep / steps;
        const newPos = {
          latitude: startLat + (endLat - startLat) * progress,
          longitude: startLng + (endLng - startLng) * progress,
        };
        riderPositionRef.current = newPos;
        setRiderPosition(newPos);

        if (currentStep >= steps) {
          clearInterval(interval);
          markerAnimationRef.current = null;
        }
      }, 50);

      markerAnimationRef.current = interval;
    };

    // SMOOTH HEADING ANIMATION
    const animateHeading = (fromBearing: number, toBearing: number) => {
      // CANCEL previous heading animation
      if (headingAnimationRef.current) {
        clearInterval(headingAnimationRef.current);
        headingAnimationRef.current = null;
      }

      let delta = toBearing - fromBearing;
      if (delta > 180) delta -= 360;
      if (delta < -180) delta += 360;

      const steps = 15; // fast turn — heading peeche nahi rahegi
      let currentStep = 0;

      const interval = setInterval(() => {
        currentStep++;
        const progress = currentStep / steps;
        const newHeading = (fromBearing + delta * progress + 360) % 360;
        headingRef.current = newHeading;
        setMarkerHeading(newHeading);
        setCameraHeading(newHeading);
        cameraHeadingRef.current = newHeading;

        if (currentStep >= steps) {
          clearInterval(interval);
          headingAnimationRef.current = null;
        }
      }, 50);

      headingAnimationRef.current = interval;
    };
    const watchId = Geolocation.watchPosition(
      async position => {
        const latitude = position.coords.latitude;

        const longitude = position.coords.longitude;

        const previous = previousCoordinateRef.current;

        if (previous) {
          const movedDistance = getDistance(
            previous.latitude,
            previous.longitude,
            latitude,
            longitude,
          );

          console.log('GPS Move Distance:', movedDistance);
        }

        // UPDATE LOCATION
        setCurrentLocation({
          latitude,
          longitude,
        });
        // ARRAY ME STORE KARO
        setLocationHistory(prev => {
          const updated = [
            ...prev,
            {
              latitude,
              longitude,
            },
          ];

          // // TOAST ME DIKHAO
          // ToastAndroid.show(
          //   JSON.stringify(updated),
          //   ToastAndroid.SHORT,
          // );

          return updated;
        });

        const route = routeCoordinatesRef.current;

        if (route.length < 2) {
          return;
        }
        // CALCULATE HEADING
        if (previous) {
          const movedDistance = getDistance(
            previous.latitude,
            previous.longitude,
            latitude,
            longitude,
          );
          // ToastAndroid.show(
          //   `Rider moved: ${movedDistance.toFixed(1)} meter`,
          //   ToastAndroid.SHORT,
          // );

          console.log('GPS Move Distance:', movedDistance);
          // if (movedDistance < 3) {
          //   return;
          // }
          const route = routeCoordinatesRef.current;
          if (route.length > 1) {
            const snapped = getNearestPointOnRoute(latitude, longitude, route);

            if (snapped) {
              // ── OFF-ROUTE CHECK ──────────────────────────────────────────
              const OFF_ROUTE_THRESHOLD_METERS = 40;
              const OFF_ROUTE_CONFIRM_COUNT = 3;

              if (snapped.distance > OFF_ROUTE_THRESHOLD_METERS) {
                offRouteCountRef.current += 1;
                if (offRouteCountRef.current >= OFF_ROUTE_CONFIRM_COUNT) {
                  // Smooth re-route — current GPS se, animation ke saath
                  reRoute(latitude, longitude);
                  return; // Is update skip karo, naya route aane do
                }
              } else {
                offRouteCountRef.current = 0; // on-route — reset
              }
              // ─────────────────────────────────────────────────────────────

              // riderPositionRef use karo — state stale hoti hai closure mein
              if (riderPositionRef.current) {
                animateMarker(
                  riderPositionRef.current.latitude,
                  riderPositionRef.current.longitude,
                  snapped.point.latitude,
                  snapped.point.longitude,
                );
              } else {
                const pos = {
                  latitude: snapped.point.latitude,
                  longitude: snapped.point.longitude,
                };
                riderPositionRef.current = pos;
                setRiderPosition(pos);
              }

              const currentMatchedPoint = [
                snapped.point.longitude,
                snapped.point.latitude,
              ];

              setRemainingRoute([
                currentMatchedPoint,
                ...route.slice(snapped.index + 1),
              ]);

              if (snapped.index !== lastSnappedIndexRef.current) {
                lastSnappedIndexRef.current = snapped.index;
              }

              if (snapped.index < route.length - 1) {
                const current = route[snapped.index];
                const next = route[snapped.index + 1];

                const routeBearing = calculateBearing(
                  current[1],
                  current[0],
                  next[1],
                  next[0],
                );

                const bearingDiff = Math.abs(routeBearing - headingRef.current);

                // 15° threshold — choti GPS jitter pe animate nahi hoga
                // lastAnimatedBearing check — same bearing pe dobara animate nahi hoga (vibration fix)
                const alreadyAnimated =
                  Math.abs(routeBearing - lastAnimatedBearingRef.current) < 5;

                if (bearingDiff > 15 && !alreadyAnimated) {
                  lastAnimatedBearingRef.current = routeBearing;
                  animateHeading(headingRef.current, routeBearing);
                }
              }
            }
          }
        }

        previousCoordinateRef.current = {
          latitude,
          longitude,
        };
      },

      error => {
        console.log(error);
      },

      {
        enableHighAccuracy: true,
        distanceFilter: 1, // walk: 1m theek, bike: 5m better — kam spam
        interval: 1000, // har 2 sec update — animation complete hone ka time milta hai
        fastestInterval: 1000,
        showLocationDialog: true,
        forceRequestLocation: true,
      },
    );

    return () => {
      Geolocation.clearWatch(watchId);
    };
  }, []);

  const sendOTP = async () => {
    try {
      setLoading(true);

      console.log(
        'Fetching dashboard data with token:',
        GlobalLoginAuth.refreshToken,
      );

      const response = await fetch(
        `${GlobalApi.baseUrl}api/deliveries/me/orders/${orderDetail?.order.id}/send-otp`,

        {
          method: 'POST',

          headers: {
            'Content-Type': 'application/json',

            Authorization: `Bearer ${GlobalLoginAuth.accessToken}`,
          },
        },
      );

      const result = await response.json();

      const SendOtpResponse = result as SendOtpResponse; // âœ… Type assertion to ensure it matches our model

      console.log('Generate OTP Response:', result);

      if (!response.ok) {
        Alert.alert('FoodyPly', result.message || 'Failed to load dashboard');

        return;
      }

      if (SendOtpResponse.success) {
        console.log('OTP sent successfully:', SendOtpResponse.data.otp);

        navigation.navigate('DeliveryOtpVerification', {
          orderDetail: orderDetail,
          otp: SendOtpResponse.data.otp,
        });
      }
    } catch (error) {
      console.log(error);

      Alert.alert('FoodyPly', 'Unable to connect to server');
    } finally {
      setLoading(false);
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
        <View style={styles.card}>
          <View style={styles.mapContainer}>
            <Map
              style={styles.map}
              mapStyle={OSM_STYLE}
              logo={false}
              compass={false}
              onTouchStart={() => {
                // User ne map touch kiya — free camera mode ON
                userInteractingRef.current = true;
                setIsFollowingRider(false);

                // Pehla timer clear karo
                if (interactionTimerRef.current) {
                  clearTimeout(interactionTimerRef.current);
                }
              }}
            >
              {/* CAMERA */}
              {riderPosition && (
                <Camera
                  zoom={18}
                  pitch={0}
                  bearing={cameraHeading}
                  animationMode="none"
                  animationDuration={0}
                  center={[riderPosition.longitude, riderPosition.latitude]}
                  padding={{
                    top: 100,
                    bottom: 300,
                    left: 0,
                    right: 0,
                  }}
                />
              )}

              {/* DELIVERY BOY MARKER */}
              {riderPosition && isFollowingRider && (
                <Marker
                  anchor="center"
                  lngLat={[riderPosition.longitude, riderPosition.latitude]}
                >
                  <View
                    style={[
                      styles.currentMarkerWrapper,
                      {
                        // transform: [
                        //   {
                        //     rotate: `${markerHeading}deg`,
                        //   },
                        // ],
                      },
                    ]}
                  >
                    <Image
                      source={require('../assets/images/delivery-foodyply-rider.png')}
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
                <View style={styles.destinationMarkerWrapper}>
                  <View style={styles.destinationMarker} />
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
                          coordinates: remainingRoute,
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
                      'line-color': '#0B3B2E',
                      'line-width': 10,
                      'line-opacity': 0.7,
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
                      'line-color': '#440DFA',
                      'line-width': 6,
                      'line-opacity': 1,
                    }}
                    layout={{
                      'line-cap': 'round',
                      'line-join': 'round',
                    }}
                  />
                </GeoJSONSource>
              )}
            </Map>
            {!isFollowingRider && (
              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.reCenterBtn}
                onPress={() => {
                  userInteractingRef.current = false;
                  setIsFollowingRider(true);
                }}
              >
                <Image
                  source={require('../assets/images/map-point.png')}
                  style={styles.mapPoint}
                />
                {/* <Text style={styles.reCenterText}>Re-center</Text> */}
              </TouchableOpacity>
            )}
            {/* FLOATING CARD */}
            {showDetailsCard ? (
              <View style={styles.card1}>
                {/* USER INFO */}
                <View style={styles.header}>
                  <Image
                    source={
                      orderDetail?.customer?.profileImageUrl
                        ? { uri: orderDetail.customer.profileImageUrl }
                        : require('../assets/images/customer_image.png')
                    }
                    style={styles.avatar}
                  />

                  <View style={{ flex: 1 }}>
                    <Text style={styles.name}>{orderDetail.customer.name}</Text>
                    <Text style={styles.phone}>
                      {orderDetail.customer.phone}
                    </Text>
                    <Text style={styles.address}>
                      {orderDetail.customer.address.fullText}
                    </Text>
                  </View>

                  <View style={styles.iconColumn}>
                    <TouchableOpacity style={styles.circleBtn}>
                      <Image
                        source={require('../assets/images/call.png')}
                        style={styles.smallIcon}
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* ORDER INFO */}
                <View style={styles.orderRow}>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 5,
                    }}
                  >
                    <Image
                      source={require('../assets/images/shopping_bag.png')}
                      style={styles.smallIconOrange}
                    />

                    <View>
                      <Text style={styles.smallLabel}>
                        {orderDetail.items.length} Items •{' '}
                        {orderDetail.items.reduce(
                          (acc, item) => acc + item.quantity,
                          0,
                        )}{' '}
                        Qty
                      </Text>
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 4,
                          marginTop: 2,
                        }}
                      >
                        <Text style={styles.smallLabel}>Payment Status</Text>
                        <View style={styles.codBadge}>
                          <Text style={styles.codText}>
                            {orderDetail.billing.paymentStatus}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                  <View>
                    <Text style={styles.smallLabel}>Order Amount</Text>
                    <Text style={styles.amount}>
                      ₹{orderDetail.billing.finalAmount.toFixed(2)}
                    </Text>
                  </View>
                </View>

                {/* LIVE STATUS */}
                <View style={styles.liveBox}>
                  <View style={styles.iconCircle}>
                    <Image
                      source={require('../assets/images/scooter.png')}
                      style={styles.bikeIcon}
                    />
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
                    {[
                      'Assigned',
                      'Accepted',
                      'Picked',
                      'On The Way',
                      'Delivered',
                    ].map((item, index) => {
                      const isActive = index <= 3;
                      const isOnWay = item === 'On The Way';

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
                                      ? Colors.primary
                                      : '#bbb',
                                  },
                                ]}
                              />
                            )}
                          </View>

                          <Text style={styles.stepText}>{item}</Text>

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
                    })}
                  </View>
                </View>

                {/* BUTTONS */}
                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    style={styles.mapBtn}
                    onPress={() => setShowDetailsCard(false)}
                  >
                    <Text style={styles.mapBtnText}>Open in Maps</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.deliverBtn}
                    onPress={() => sendOTP()}
                  >
                    <Text style={styles.deliverBtnText}>Order Delivered</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.floatingShowButton}
                onPress={() => setShowDetailsCard(true)}
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
      <GlobalLoader visible={loading} />
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
 mapPoint: {
    width: 20,
    height: 20,
  },
  currentMarkerWrapper: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },

  deliveryIcon: {
    width: 60,
    height: 60,

    // REMOVE THIS IF IMAGE ALREADY ORANGE
    // tintColor: Colors.primary,
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
    position: 'absolute',
    bottom: 20,
    left: 15,
    right: 15,
    backgroundColor: '#fff',
    borderRadius: 25,
    padding: 18,

    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 5,
    },
    elevation: 8,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
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
    backgroundColor: '#7bc043',
    justifyContent: 'center',
    alignItems: 'center',
  },

  orderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
    flexDirection: 'row',
    backgroundColor: '#FEF6F3',
    padding: 6,
    borderRadius: 10,
    marginTop: 18,
    alignItems: 'center',
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
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  stepContainer: {
    alignItems: 'center',
    flex: 1,
    position: 'relative',
    justifyContent: 'flex-start',
  },

  stepCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#e5e5e5',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  activeStep: {
    backgroundColor: Colors.lightOrange,
  },

  line: {
    position: 'absolute',
    top: 12,
    left: '50%',
    width: '100%',
    height: 3,
    backgroundColor: '#ddd',
    zIndex: 1,
  },

  activeLine: {
    backgroundColor: Colors.primary,
  },

  stepText: {
    fontSize: 10,
    marginTop: 10,
    color: Colors.textBrown,
    textAlign: 'center',
    fontFamily: FontFamily.regular,
  },

  buttonRow: {
    flexDirection: 'row',
    marginTop: 25,
    gap: 12,
  },

  mapBtn: {
    flex: 1,
    backgroundColor: Colors.buttonLight,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },

  deliverBtn: {
    flex: 1,
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },

  mapBtnText: {
    color: Colors.primary,
    fontFamily: FontFamily.regular,
    fontSize: 16,
  },

  deliverBtnText: {
    color: '#fff',
    fontFamily: FontFamily.regular,
    fontSize: 16,
  },

  smallIcon: {
    width: 18,
    height: 18,
    tintColor: '#fff',
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

    justifyContent: 'center',
    alignItems: 'center',

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
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },

  hideIcon: {
    width: 16,
    height: 16,
    tintColor: Colors.textColor,
  },

  floatingShowButton: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,

    backgroundColor: Colors.primary,

    justifyContent: 'center',
    alignItems: 'center',

    shadowColor: '#000',
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
    tintColor: '#fff',
    
  },
  // RE-CENTER BUTTON
  reCenterBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  reCenterText: {
    color: Colors.primary,
    fontSize: 13,
    fontFamily: FontFamily.semiBold,
  },
});

// import React, { useEffect, useState, useRef } from 'react';
// import {
//   View,
//   StyleSheet,
//   PermissionsAndroid,
//   Platform,
//   Image,
//   Text,
//   TouchableOpacity,
//   ToastAndroid,
//   Alert,
// } from 'react-native';

// import {
//   Map,
//   Camera,
//   Marker,
//   GeoJSONSource,
//   Layer,
// } from '@maplibre/maplibre-react-native';

// import Geolocation from 'react-native-geolocation-service';
// import axios from 'axios';

// import Colors from '../assets/Colors/Colors';
// import GlobalTopBarDelivery from '../GlobalContainer/GlobalTopBarDelivery';
// import { DeliveryOrderDetails } from '../Models/DeliveryOrderDetails/DeliveryOrderDetails';
// import { FontFamily } from '../assets/GlobalFont/GlobalFont';
// import GlobalLoginAuth from '../GlobalContainer/GlobalLoginAuth';
// import GlobalApi from '../GlobalContainer/GlobalApi';
// import GlobalLoader from '../GlobalContainer/GlobalLoader';
// import { SendOtpResponse } from '../Models/SendOTP/SendOtpResponse ';

// const DARK_MAP_STYLE =
//   'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

// export default function DeliveryStart({ route, navigation }: any) {
//   const {
//     orderDetail,
//   }: {
//     orderDetail: DeliveryOrderDetails;
//   } = route.params;

//   const [showDetailsCard, setShowDetailsCard] = useState(true);
//   const lastSnappedIndexRef = useRef(-1);
//   // DESTINATION
//   const [destinationLocation] = useState({
//     latitude: orderDetail.customer.address.latitude || 22.8948,

//     longitude: orderDetail.customer.address.longitude || 88.41,
//   });

//   // CURRENT LOCATION
//   const [currentLocation, setCurrentLocation] = useState<{
//     latitude: number;
//     longitude: number;
//   } | null>(null);

//   // ROUTE
//   const [routeCoordinates, setRouteCoordinates] = useState<any[]>([]);
//   const routeCoordinatesRef = useRef<any[]>([]);
//   const [remainingRoute, setRemainingRoute] = useState<any[]>([]);
//   const headingRef = useRef(0);
//   const cameraHeadingRef = useRef(0);
//   const [riderPosition, setRiderPosition] = useState<{
//     latitude: number;
//     longitude: number;
//   } | null>(null);
//   // CAMERA HEADING
//   const [cameraHeading, setCameraHeading] = useState(0);

//   // SCOOTER HEADING
//   const [markerHeading, setMarkerHeading] = useState(0);
//   const [loading, setLoading] = useState(false);
// const markerAnimationRef = useRef<any>(null);
// const headingAnimationRef = useRef<any>(null);
// const riderPositionRef = useRef<{ latitude: number; longitude: number } | null>(null);
// const lastAnimatedBearingRef = useRef<number>(-1);
//   const [locationHistory, setLocationHistory] = useState<
//     { latitude: number; longitude: number }[]
//   >([]);
//   // PREVIOUS LOCATION
//   const previousCoordinateRef = useRef<{
//     latitude: number;
//     longitude: number;
//   } | null>(null);

//   // REQUEST LOCATION PERMISSION
//   const requestLocationPermission = async () => {
//     if (Platform.OS === 'android') {
//       const granted = await PermissionsAndroid.request(
//         PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
//       );

//       if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
//         console.log('Location permission denied');
//       }
//     }
//   };

//   const calculateBearing = (
//     startLat: number,

//     startLng: number,

//     endLat: number,

//     endLng: number,
//   ) => {
//     const dLon = ((endLng - startLng) * Math.PI) / 180;

//     const y = Math.sin(dLon) * Math.cos((endLat * Math.PI) / 180);

//     const x =
//       Math.cos((startLat * Math.PI) / 180) *
//         Math.sin((endLat * Math.PI) / 180) -
//       Math.sin((startLat * Math.PI) / 180) *
//         Math.cos((endLat * Math.PI) / 180) *
//         Math.cos(dLon);

//     const brng = (Math.atan2(y, x) * 180) / Math.PI;

//     return (brng + 360) % 360;
//   };

//   // DISTANCE BETWEEN TWO POINTS
//   const getDistance = (
//     lat1: number,
//     lon1: number,
//     lat2: number,
//     lon2: number,
//   ) => {
//     const R = 6371e3;

//     const φ1 = (lat1 * Math.PI) / 180;
//     const φ2 = (lat2 * Math.PI) / 180;

//     const Δφ = ((lat2 - lat1) * Math.PI) / 180;

//     const Δλ = ((lon2 - lon1) * Math.PI) / 180;

//     const a =
//       Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
//       Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

//     const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

//     return R * c;
//   };

//   const getProjectedPointOnSegment = (
//     lat: number,
//     lng: number,
//     startLat: number,
//     startLng: number,
//     endLat: number,
//     endLng: number,
//   ) => {
//     const dx = endLng - startLng;
//     const dy = endLat - startLat;

//     const lengthSquared = dx * dx + dy * dy;

//     if (lengthSquared === 0) {
//       return {
//         latitude: startLat,
//         longitude: startLng,
//         t: 0,
//       };
//     }

//     let t = ((lng - startLng) * dx + (lat - startLat) * dy) / lengthSquared;

//     t = Math.max(0, Math.min(1, t));

//     return {
//       latitude: startLat + t * dy,
//       longitude: startLng + t * dx,
//       t,
//     };
//   };

//   const getNearestPointOnRoute = (
//     latitude: number,
//     longitude: number,
//     route: any[],
//   ) => {
//     if (route.length < 2) {
//       return null;
//     }

//     let minDistance = Infinity;

//     let nearestIndex = 0;

//     let projectedPoint: any = null;

//     for (let i = 0; i < route.length - 1; i++) {
//       const start = route[i];
//       const end = route[i + 1];

//       const projected = getProjectedPointOnSegment(
//         latitude,
//         longitude,
//         start[1],
//         start[0],
//         end[1],
//         end[0],
//       );

//       const distance = getDistance(
//         latitude,
//         longitude,
//         projected.latitude,
//         projected.longitude,
//       );

//       if (distance < minDistance) {
//         minDistance = distance;
//         nearestIndex = i;
//         projectedPoint = projected;
//       }
//     }

//     return {
//       index: nearestIndex,
//       distance: minDistance,
//       point: projectedPoint,
//     };
//   };
//   // ROUTE API
//   const getRoute = async (
//     startLat: number,
//     startLng: number,
//     endLat: number,
//     endLng: number,
//   ) => {
//     try {
//       const response = await axios.get(
//         `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`,
//       );

//       if (
//         response.data &&
//         response.data.routes &&
//         response.data.routes.length > 0
//       ) {
//         const osrmCoordinates = response.data.routes[0].geometry.coordinates;

//         // Insert actual GPS as first point
//         const coordinates = [[startLng, startLat], ...osrmCoordinates];

//         for (let i = 0; i < 5; i++) {
//           const dist = getDistance(
//             coordinates[i][1],
//             coordinates[i][0],
//             coordinates[i + 1][1],
//             coordinates[i + 1][0],
//           );

//           console.log(`Distance ${i} -> ${i + 1}:`, dist);
//         }
//         setRouteCoordinates(coordinates);
//         routeCoordinatesRef.current = coordinates;

//         console.log('Route Length:', coordinates.length);

//         console.log('First Route Point:', coordinates[0]);

//         console.log('Start GPS:', startLat, startLng);

//         console.log(
//           'Distance Between Start And Route Point:',
//           getDistance(startLat, startLng, coordinates[0][1], coordinates[0][0]),
//         );

//         if (!riderPosition && coordinates.length > 0) {
//           setRiderPosition({
//             latitude: coordinates[0][1],
//             longitude: coordinates[0][0],
//           });

//           lastSnappedIndexRef.current = 0;

//           setRemainingRoute(coordinates);
//         }
//       }
//     } catch (error) {
//       console.log('ROUTE ERROR', error);
//     }
//   };

//   // INITIAL LOCATION
//   const getCurrentLocation = async () => {
//     Geolocation.getCurrentPosition(
//       async position => {
//         const latitude = position.coords.latitude;

//         const longitude = position.coords.longitude;

//         setCurrentLocation({
//           latitude,
//           longitude,
//         });

//         previousCoordinateRef.current = {
//           latitude,
//           longitude,
//         };

//         await getRoute(
//           latitude,
//           longitude,
//           destinationLocation.latitude,
//           destinationLocation.longitude,
//         );
//       },

//       error => {
//         console.log(error);
//       },

//       {
//         enableHighAccuracy: true,
//         timeout: 15000,
//         maximumAge: 10000,
//       },
//     );
//   };

//   // LIVE TRACKING
//   useEffect(() => {
//     requestLocationPermission();

//     getCurrentLocation();

//     // UNIFIED — position + heading ek hi interval mein, zero delay between them
//     const animateMarker = (
//       startLat: number,
//       startLng: number,
//       endLat: number,
//       endLng: number,
//       targetBearing?: number,
//     ) => {
//       // Dono cancel karo pehle
//       if (markerAnimationRef.current) {
//         clearInterval(markerAnimationRef.current);
//         markerAnimationRef.current = null;
//       }
//       if (headingAnimationRef.current) {
//         clearInterval(headingAnimationRef.current);
//         headingAnimationRef.current = null;
//       }

//       const distance = Math.sqrt(
//         Math.pow(endLat - startLat, 2) + Math.pow(endLng - startLng, 2)
//       );
//       const steps = distance > 0.0005 ? 8 : 17;

//       // Heading ke liye shortest arc
//       const fromBearing = headingRef.current;
//       const toBearing = targetBearing ?? fromBearing;
//       let delta = toBearing - fromBearing;
//       if (delta > 180) delta -= 360;
//       if (delta < -180) delta += 360;

//       const shouldTurn = targetBearing !== undefined
//         && Math.abs(delta) > 10
//         && Math.abs(toBearing - lastAnimatedBearingRef.current) >= 5;

//       if (shouldTurn) {
//         lastAnimatedBearingRef.current = toBearing;
//       }

//       let currentStep = 0;
//       const interval = setInterval(() => {
//         currentStep++;
//         const progress = currentStep / steps;

//         // POSITION — same tick
//         const newPos = {
//           latitude: startLat + (endLat - startLat) * progress,
//           longitude: startLng + (endLng - startLng) * progress,
//         };
//         riderPositionRef.current = newPos;
//         setRiderPosition(newPos);

//         // HEADING — same tick, zero lag
//         if (shouldTurn) {
//           const newHeading = (fromBearing + delta * progress + 360) % 360;
//           headingRef.current = newHeading;
//           setMarkerHeading(newHeading);
//           setCameraHeading(newHeading);
//           cameraHeadingRef.current = newHeading;
//         }

//         if (currentStep >= steps) {
//           clearInterval(interval);
//           markerAnimationRef.current = null;
//           // Final heading exactly lock karo
//           if (shouldTurn) {
//             headingRef.current = toBearing;
//             setMarkerHeading(toBearing);
//             setCameraHeading(toBearing);
//             cameraHeadingRef.current = toBearing;
//           }
//         }
//       }, 50);

//       markerAnimationRef.current = interval;
//     };
//     const watchId = Geolocation.watchPosition(
//       async position => {
//         const latitude = position.coords.latitude;

//         const longitude = position.coords.longitude;

//         const previous = previousCoordinateRef.current;

//         if (previous) {
//           const movedDistance = getDistance(
//             previous.latitude,
//             previous.longitude,
//             latitude,
//             longitude,
//           );

//           console.log('GPS Move Distance:', movedDistance);
//         }

//         // UPDATE LOCATION
//         setCurrentLocation({
//           latitude,
//           longitude,
//         });
//         // ARRAY ME STORE KARO
//         setLocationHistory(prev => {
//           const updated = [
//             ...prev,
//             {
//               latitude,
//               longitude,
//             },
//           ];

//           // // TOAST ME DIKHAO
//           // ToastAndroid.show(
//           //   JSON.stringify(updated),
//           //   ToastAndroid.SHORT,
//           // );

//           return updated;
//         });

//         const route = routeCoordinatesRef.current;

//         if (route.length < 2) {
//           return;
//         }
//         // CALCULATE HEADING
//         if (previous) {
//           const movedDistance = getDistance(
//             previous.latitude,
//             previous.longitude,
//             latitude,
//             longitude,
//           );
//           ToastAndroid.show(
//             `Rider moved: ${movedDistance.toFixed(1)} meter`,
//             ToastAndroid.SHORT,
//           );

//           console.log('GPS Move Distance:', movedDistance);
//           // if (movedDistance < 3) {
//           //   return;
//           // }
//           const route = routeCoordinatesRef.current;
//           if (route.length > 1) {
//             const snapped = getNearestPointOnRoute(latitude, longitude, route);

//             if (snapped) {
//               // Bearing pehle nikalo — position ke saath ek hi call mein dena hai
//               let targetBearing: number | undefined = undefined;
//               if (snapped.index < route.length - 1) {
//                 const curr = route[snapped.index];
//                 const nxt = route[snapped.index + 1];
//                 targetBearing = calculateBearing(
//                   curr[1], curr[0], nxt[1], nxt[0],
//                 );
//               }

//               if (riderPositionRef.current) {
//                 // position + heading ek saath — no lag, no separate interval
//                 animateMarker(
//                   riderPositionRef.current.latitude,
//                   riderPositionRef.current.longitude,
//                   snapped.point.latitude,
//                   snapped.point.longitude,
//                   targetBearing,
//                 );
//               } else {
//                 const pos = {
//                   latitude: snapped.point.latitude,
//                   longitude: snapped.point.longitude,
//                 };
//                 riderPositionRef.current = pos;
//                 setRiderPosition(pos);
//               }

//               setRemainingRoute([
//                 [snapped.point.longitude, snapped.point.latitude],
//                 ...route.slice(snapped.index + 1),
//               ]);

//               if (snapped.index !== lastSnappedIndexRef.current) {
//                 lastSnappedIndexRef.current = snapped.index;
//               }
//             }
//           }
//         }

//         previousCoordinateRef.current = {
//           latitude,
//           longitude,
//         };
//       },

//       error => {
//         console.log(error);
//       },

//       {
//         enableHighAccuracy: true,
//         distanceFilter: 1,
//         interval: 1000,
//         fastestInterval: 500,
//         showLocationDialog: true,
//         forceRequestLocation: true,
//       },
//     );

//     return () => {
//       Geolocation.clearWatch(watchId);
//     };
//   }, []);

//   const sendOTP = async () => {
//     try {
//       setLoading(true);

//       console.log(
//         'Fetching dashboard data with token:',
//         GlobalLoginAuth.refreshToken,
//       );

//       const response = await fetch(
//         `${GlobalApi.baseUrl}api/deliveries/me/orders/${orderDetail?.order.id}/send-otp`,

//         {
//           method: 'POST',

//           headers: {
//             'Content-Type': 'application/json',

//             Authorization: `Bearer ${GlobalLoginAuth.accessToken}`,
//           },
//         },
//       );

//       const result = await response.json();

//       const SendOtpResponse = result as SendOtpResponse; // âœ… Type assertion to ensure it matches our model

//       console.log('Generate OTP Response:', result);

//       if (!response.ok) {
//         Alert.alert('FoodyPly', result.message || 'Failed to load dashboard');

//         return;
//       }

//       if (SendOtpResponse.success) {
//         console.log('OTP sent successfully:', SendOtpResponse.data.otp);

//         navigation.navigate('DeliveryOtpVerification', {
//           orderDetail: orderDetail,
//           otp: SendOtpResponse.data.otp,
//         });
//       }
//     } catch (error) {
//       console.log(error);

//       Alert.alert('FoodyPly', 'Unable to connect to server');
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <View style={styles.container}>
//       <GlobalTopBarDelivery
//         navigation={navigation}
//         notificationClick={() => {}}
//         text="Start Delivery"
//         subtitleText={`#${orderDetail?.order.orderNumber}`}
//         isBackVisible={true}
//         isOnlineVisible={false}
//       />

//       <View style={styles.overlay}>
//         <View style={styles.card}>
//           <View style={styles.mapContainer}>
//             <Map
//               style={styles.map}
//               mapStyle={DARK_MAP_STYLE}
//               logo={false}
//               compass={true}
//             >
//               {/* CAMERA */}
//               {riderPosition && (
//                 <Camera
//                   zoom={18}
//                   pitch={0}
//                   bearing={cameraHeading}
//                   center={[riderPosition.longitude, riderPosition.latitude]}
//                   padding={{
//                     top: 100,
//                     bottom: 300,
//                     left: 0,
//                     right: 0,
//                   }}
//                 />
//               )}

//               {/* DELIVERY BOY MARKER */}
//               {riderPosition && (
//                 <Marker
//                   anchor="center"
//                   lngLat={[riderPosition.longitude, riderPosition.latitude]}
//                 >
//                   <View
//                     style={[
//                       styles.currentMarkerWrapper,
//                       {
//                         transform: [
//                           {
//                             rotate: `${markerHeading}deg`,
//                           },
//                         ],
//                       },
//                     ]}
//                   >
//                     <Image
//                       source={require('../assets/images/dman.png')}
//                       style={styles.deliveryIcon}
//                       resizeMode="contain"
//                     />
//                   </View>
//                 </Marker>
//               )}

//               {/* DESTINATION */}
//               <Marker
//                 anchor="center"
//                 lngLat={[
//                   destinationLocation.longitude,
//                   destinationLocation.latitude,
//                 ]}
//               >
//                 <View style={styles.destinationMarkerWrapper}>
//                   <View style={styles.destinationMarker} />
//                 </View>
//               </Marker>

//               {/* ROUTE */}
//               {routeCoordinates.length > 1 && (
//                 <GeoJSONSource
//                   id="routeSource"
//                   data={{
//                     type: 'FeatureCollection',
//                     features: [
//                       {
//                         type: 'Feature',
//                         properties: {},
//                         geometry: {
//                           type: 'LineString',
//                           coordinates: remainingRoute,
//                         },
//                       },
//                     ],
//                   }}
//                 >
//                   {/* ROUTE SHADOW */}
//                   <Layer
//                     id="routeLayerBg"
//                     type="line"
//                     paint={{
//                       'line-color': '#0B3B2E',
//                       'line-width': 10,
//                       'line-opacity': 0.7,
//                     }}
//                     layout={{
//                       'line-cap': 'round',
//                       'line-join': 'round',
//                     }}
//                   />

//                   {/* MAIN ROUTE */}
//                   <Layer
//                     id="routeLayer"
//                     type="line"
//                     paint={{
//                       'line-color': '#00FF9D',
//                       'line-width': 6,
//                       'line-opacity': 1,
//                     }}
//                     layout={{
//                       'line-cap': 'round',
//                       'line-join': 'round',
//                     }}
//                   />
//                 </GeoJSONSource>
//               )}
//             </Map>

//             {/* FLOATING CARD */}
//             {showDetailsCard ? (
//               <View style={styles.card1}>
//                 {/* USER INFO */}
//                 <View style={styles.header}>
//                   <Image
//                     source={
//                       orderDetail?.customer?.profileImageUrl
//                         ? { uri: orderDetail.customer.profileImageUrl }
//                         : require('../assets/images/customer_image.png')
//                     }
//                     style={styles.avatar}
//                   />

//                   <View style={{ flex: 1 }}>
//                     <Text style={styles.name}>{orderDetail.customer.name}</Text>
//                     <Text style={styles.phone}>
//                       {orderDetail.customer.phone}
//                     </Text>
//                     <Text style={styles.address}>
//                       {orderDetail.customer.address.fullText}
//                     </Text>
//                   </View>

//                   <View style={styles.iconColumn}>
//                     <TouchableOpacity style={styles.circleBtn}>
//                       <Image
//                         source={require('../assets/images/call.png')}
//                         style={styles.smallIcon}
//                       />
//                     </TouchableOpacity>
//                   </View>
//                 </View>

//                 {/* ORDER INFO */}
//                 <View style={styles.orderRow}>
//                   <View
//                     style={{
//                       flexDirection: 'row',
//                       alignItems: 'center',
//                       gap: 5,
//                     }}
//                   >
//                     <Image
//                       source={require('../assets/images/shopping_bag.png')}
//                       style={styles.smallIconOrange}
//                     />

//                     <View>
//                       <Text style={styles.smallLabel}>
//                         {orderDetail.items.length} Items •{' '}
//                         {orderDetail.items.reduce(
//                           (acc, item) => acc + item.quantity,
//                           0,
//                         )}{' '}
//                         Qty
//                       </Text>
//                       <View
//                         style={{
//                           flexDirection: 'row',
//                           alignItems: 'center',
//                           gap: 4,
//                           marginTop: 2,
//                         }}
//                       >
//                         <Text style={styles.smallLabel}>Payment Status</Text>
//                         <View style={styles.codBadge}>
//                           <Text style={styles.codText}>
//                             {orderDetail.billing.paymentStatus}
//                           </Text>
//                         </View>
//                       </View>
//                     </View>
//                   </View>
//                   <View>
//                     <Text style={styles.smallLabel}>Order Amount</Text>
//                     <Text style={styles.amount}>
//                       ₹{orderDetail.billing.finalAmount.toFixed(2)}
//                     </Text>
//                   </View>
//                 </View>

//                 {/* LIVE STATUS */}
//                 <View style={styles.liveBox}>
//                   <View style={styles.iconCircle}>
//                     <Image
//                       source={require('../assets/images/scooter.png')}
//                       style={styles.bikeIcon}
//                     />
//                   </View>
//                   <View style={{ marginLeft: 10 }}>
//                     <Text style={styles.liveTitle}>Live Status</Text>
//                     <Text style={styles.liveText}>
//                       You are on the way to the customer
//                     </Text>
//                   </View>
//                 </View>

//                 {/* PROGRESS */}
//                 <View style={{ marginTop: 20 }}>
//                   <Text style={styles.progressTitle}>Order Progress</Text>

//                   <View style={styles.progressRow}>
//                     {[
//                       'Assigned',
//                       'Accepted',
//                       'Picked',
//                       'On The Way',
//                       'Delivered',
//                     ].map((item, index) => {
//                       const isActive = index <= 3;
//                       const isOnWay = item === 'On The Way';

//                       return (
//                         <View key={index} style={styles.stepContainer}>
//                           <View
//                             style={[
//                               styles.stepCircle,
//                               isActive && styles.activeStep,

//                               // LIGHT ORANGE BACKGROUND FOR ON WAY
//                               isOnWay && styles.onWayStep,
//                             ]}
//                           >
//                             {isOnWay ? (
//                               <Image
//                                 source={require('../assets/images/scooter.png')}
//                                 style={styles.scooterIcon}
//                               />
//                             ) : (
//                               <Image
//                                 source={require('../assets/images/check.png')}
//                                 style={[
//                                   styles.checkIcon,
//                                   {
//                                     tintColor: isActive
//                                       ? Colors.primary
//                                       : '#bbb',
//                                   },
//                                 ]}
//                               />
//                             )}
//                           </View>

//                           <Text style={styles.stepText}>{item}</Text>

//                           {index !== 4 && (
//                             <View
//                               style={[
//                                 styles.line,
//                                 index < 3 && styles.activeLine,
//                               ]}
//                             />
//                           )}
//                         </View>
//                       );
//                     })}
//                   </View>
//                 </View>

//                 {/* BUTTONS */}
//                 <View style={styles.buttonRow}>
//                   <TouchableOpacity
//                     style={styles.mapBtn}
//                     onPress={() => setShowDetailsCard(false)}
//                   >
//                     <Text style={styles.mapBtnText}>Open in Maps</Text>
//                   </TouchableOpacity>

//                   <TouchableOpacity
//                     style={styles.deliverBtn}
//                     onPress={() => sendOTP()}
//                   >
//                     <Text style={styles.deliverBtnText}>Order Delivered</Text>
//                   </TouchableOpacity>
//                 </View>
//               </View>
//             ) : (
//               <TouchableOpacity
//                 activeOpacity={0.8}
//                 style={styles.floatingShowButton}
//                 onPress={() => setShowDetailsCard(true)}
//               >
//                 <Image
//                   source={require('../assets/images/shopping_bag.png')}
//                   style={styles.floatingArrow}
//                 />
//               </TouchableOpacity>
//             )}
//           </View>
//         </View>
//       </View>
//       <GlobalLoader visible={loading} />
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: Colors.primary,
//     paddingTop: 100,
//   },

//   overlay: {
//     flex: 1,
//     borderTopLeftRadius: 30,
//     borderTopRightRadius: 30,
//     marginTop: 20,
//   },

//   card: {
//     backgroundColor: '#fff',
//     borderTopLeftRadius: 20,
//     borderTopRightRadius: 20,
//     flex: 1,
//   },

//   mapContainer: {
//     flex: 1,
//     borderTopLeftRadius: 20,
//     borderTopRightRadius: 20,
//     overflow: 'hidden',
//   },

//   map: {
//     flex: 1,
//   },

//   currentMarkerWrapper: {
//     width: 44,
//     height: 44,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },

//   deliveryIcon: {
//     width: 80,
//     height: 80,

//     // REMOVE THIS IF IMAGE ALREADY ORANGE
//     // tintColor: Colors.primary,
//   },

//   destinationMarkerWrapper: {
//     width: 30,
//     height: 30,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },

//   destinationMarker: {
//     width: 18,
//     height: 18,
//     borderRadius: 9,
//     backgroundColor: 'red',
//     borderWidth: 3,
//     borderColor: '#fff',
//   },
//   card1: {
//     position: 'absolute',
//     bottom: 20,
//     left: 15,
//     right: 15,
//     backgroundColor: '#fff',
//     borderRadius: 25,
//     padding: 18,

//     shadowColor: '#000',
//     shadowOpacity: 0.15,
//     shadowRadius: 10,
//     shadowOffset: {
//       width: 0,
//       height: 5,
//     },
//     elevation: 8,
//   },

//   header: {
//     flexDirection: 'row',
//     alignItems: 'flex-start',
//     justifyContent: 'space-between',
//   },

//   avatar: {
//     width: 60,
//     height: 60,
//     borderRadius: 20,
//     marginRight: 12,
//   },

//   name: {
//     fontSize: 18,
//     fontFamily: FontFamily.medium,
//     color: Colors.textColor,
//   },

//   phone: {
//     color: Colors.textBrown,
//     fontFamily: FontFamily.regular,
//     marginTop: 2,
//     fontSize: 12,
//   },

//   address: {
//     color: Colors.textBrown,
//     marginTop: 2,
//     fontSize: 12,
//     fontFamily: FontFamily.regular,
//   },

//   iconColumn: {
//     gap: 0,
//   },

//   circleBtn: {
//     width: 38,
//     height: 38,
//     borderRadius: 19,
//     backgroundColor: '#7bc043',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },

//   orderRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     marginTop: 20,
//   },

//   smallLabel: {
//     color: Colors.textBrown,
//     fontSize: 14,
//     fontFamily: FontFamily.regular,
//   },

//   boldText: {
//     fontFamily: FontFamily.bold,
//     marginTop: 2,
//     fontSize: 14,
//   },

//   amount: {
//     color: Colors.primary,
//     fontSize: 18,
//     fontFamily: FontFamily.regular,
//     marginTop: 2,
//   },

//   liveBox: {
//     flexDirection: 'row',
//     backgroundColor: '#FEF6F3',
//     padding: 6,
//     borderRadius: 10,
//     marginTop: 18,
//     alignItems: 'center',
//   },

//   liveTitle: {
//     color: Colors.textColor,
//     fontFamily: FontFamily.medium,
//   },

//   liveText: {
//     color: Colors.textBrown,
//     marginTop: 3,
//     fontSize: 12,
//     fontFamily: FontFamily.regular,
//   },

//   progressTitle: {
//     fontFamily: FontFamily.medium,
//     marginBottom: 15,
//     color: Colors.textColor,
//   },

//   progressRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//   },

//   stepContainer: {
//     alignItems: 'center',
//     flex: 1,
//     position: 'relative',
//     justifyContent: 'flex-start',
//   },

//   stepCircle: {
//     width: 30,
//     height: 30,
//     borderRadius: 15,
//     backgroundColor: '#e5e5e5',
//     justifyContent: 'center',
//     alignItems: 'center',
//     zIndex: 2,
//   },
//   activeStep: {
//     backgroundColor: Colors.lightOrange,
//   },

//   line: {
//     position: 'absolute',
//     top: 12,
//     left: '50%',
//     width: '100%',
//     height: 3,
//     backgroundColor: '#ddd',
//     zIndex: 1,
//   },

//   activeLine: {
//     backgroundColor: Colors.primary,
//   },

//   stepText: {
//     fontSize: 10,
//     marginTop: 10,
//     color: Colors.textBrown,
//     textAlign: 'center',
//     fontFamily: FontFamily.regular,
//   },

//   buttonRow: {
//     flexDirection: 'row',
//     marginTop: 25,
//     gap: 12,
//   },

//   mapBtn: {
//     flex: 1,
//     backgroundColor: Colors.buttonLight,
//     paddingVertical: 14,
//     borderRadius: 14,
//     alignItems: 'center',
//   },

//   deliverBtn: {
//     flex: 1,
//     backgroundColor: Colors.primary,
//     paddingVertical: 14,
//     borderRadius: 14,
//     alignItems: 'center',
//   },

//   mapBtnText: {
//     color: Colors.primary,
//     fontFamily: FontFamily.regular,
//     fontSize: 16,
//   },

//   deliverBtnText: {
//     color: '#fff',
//     fontFamily: FontFamily.regular,
//     fontSize: 16,
//   },

//   smallIcon: {
//     width: 18,
//     height: 18,
//     tintColor: '#fff',
//   },

//   smallIconOrange: {
//     width: 30,
//     height: 30,
//     tintColor: Colors.primary,
//   },

//   bikeIcon: {
//     width: 24,
//     height: 24,
//     tintColor: Colors.primary,
//   },

//   checkIcon: {
//     width: 16,
//     height: 16,
//   },
//   iconCircle: {
//     width: 60,
//     height: 60,
//     borderRadius: 30,
//     backgroundColor: Colors.lightOrange,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   codBadge: {
//     backgroundColor: Colors.lightBackground,
//     paddingHorizontal: 8,
//     paddingVertical: 3,
//     borderRadius: 20,
//     marginLeft: 2,
//   },

//   codText: {
//     color: Colors.primary,
//     fontSize: 12,
//     fontFamily: FontFamily.semiBold,
//   },
//   onWayStep: {
//     width: 30,
//     height: 30,
//     borderRadius: 15,
//     backgroundColor: Colors.lightOrange,

//     justifyContent: 'center',
//     alignItems: 'center',

//     zIndex: 3,
//   },

//   scooterIcon: {
//     width: 20,
//     height: 20,
//     tintColor: Colors.primary,
//   },
//   hideButton: {
//     width: 32,
//     height: 32,
//     borderRadius: 16,
//     backgroundColor: '#F5F5F5',
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginLeft: 10,
//   },

//   hideIcon: {
//     width: 16,
//     height: 16,
//     tintColor: Colors.textColor,
//   },

//   floatingShowButton: {
//     position: 'absolute',
//     bottom: 30,
//     right: 20,
//     width: 40,
//     height: 40,
//     borderRadius: 20,

//     backgroundColor: Colors.primary,

//     justifyContent: 'center',
//     alignItems: 'center',

//     shadowColor: '#000',
//     shadowOpacity: 0.2,
//     shadowRadius: 8,
//     shadowOffset: {
//       width: 0,
//       height: 4,
//     },

//     elevation: 10,
//   },

//   floatingArrow: {
//     width: 24,
//     height: 24,
//     tintColor: '#fff',
//   },
// });

// import React, { useEffect, useState, useRef } from 'react';
// import {
//   View,
//   StyleSheet,
//   PermissionsAndroid,
//   Platform,
//   Image,
//   Text,
//   TouchableOpacity,
//   ToastAndroid,
//   Alert,
// } from 'react-native';

// import {
//   Map,
//   Camera,
//   Marker,
//   GeoJSONSource,
//   Layer,
// } from '@maplibre/maplibre-react-native';

// import Geolocation from 'react-native-geolocation-service';
// import axios from 'axios';

// import Colors from '../assets/Colors/Colors';
// import GlobalTopBarDelivery from '../GlobalContainer/GlobalTopBarDelivery';
// import { DeliveryOrderDetails } from '../Models/DeliveryOrderDetails/DeliveryOrderDetails';
// import { FontFamily } from '../assets/GlobalFont/GlobalFont';
// import GlobalLoginAuth from '../GlobalContainer/GlobalLoginAuth';
// import GlobalApi from '../GlobalContainer/GlobalApi';
// import GlobalLoader from '../GlobalContainer/GlobalLoader';
// import { SendOtpResponse } from '../Models/SendOTP/SendOtpResponse ';

// const DARK_MAP_STYLE =
//   'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

// export default function DeliveryStart({ route, navigation }: any) {
//   const {
//     orderDetail,
//   }: {
//     orderDetail: DeliveryOrderDetails;
//   } = route.params;

//   const [showDetailsCard, setShowDetailsCard] = useState(true);
//   const lastSnappedIndexRef = useRef(-1);
//   // DESTINATION
//   const [destinationLocation] = useState({
//     latitude: orderDetail.customer.address.latitude || 22.8948,

//     longitude: orderDetail.customer.address.longitude || 88.41,
//   });

//   // CURRENT LOCATION
//   const [currentLocation, setCurrentLocation] = useState<{
//     latitude: number;
//     longitude: number;
//   } | null>(null);

//   // ROUTE
//   const [routeCoordinates, setRouteCoordinates] = useState<any[]>([]);
//   const routeCoordinatesRef = useRef<any[]>([]);
//   const [remainingRoute, setRemainingRoute] = useState<any[]>([]);
//   const headingRef = useRef(0);
//   const cameraHeadingRef = useRef(0);
//   const markerAnimationRef = useRef<any>(null);   // cancel old animation before new one
//   const headingAnimationRef = useRef<any>(null);  // cancel old heading animation
//   const riderPositionRef = useRef<{ latitude: number; longitude: number } | null>(null); // always fresh position
//   const lastAnimatedBearingRef = useRef<number>(-1); // last bearing jo animate hua — dobara same pe na karo
//   const [riderPosition, setRiderPosition] = useState<{
//     latitude: number;
//     longitude: number;
//   } | null>(null);
//   // CAMERA HEADING
//   const [cameraHeading, setCameraHeading] = useState(0);

//   // SCOOTER HEADING
//   const [markerHeading, setMarkerHeading] = useState(0);
//   const [loading, setLoading] = useState(false);

//   const [locationHistory, setLocationHistory] = useState<
//     { latitude: number; longitude: number }[]
//   >([]);
//   // PREVIOUS LOCATION
//   const previousCoordinateRef = useRef<{
//     latitude: number;
//     longitude: number;
//   } | null>(null);

//   // REQUEST LOCATION PERMISSION
//   const requestLocationPermission = async () => {
//     if (Platform.OS === 'android') {
//       const granted = await PermissionsAndroid.request(
//         PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
//       );

//       if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
//         console.log('Location permission denied');
//       }
//     }
//   };

//   const calculateBearing = (
//     startLat: number,

//     startLng: number,

//     endLat: number,

//     endLng: number,
//   ) => {
//     const dLon = ((endLng - startLng) * Math.PI) / 180;

//     const y = Math.sin(dLon) * Math.cos((endLat * Math.PI) / 180);

//     const x =
//       Math.cos((startLat * Math.PI) / 180) *
//         Math.sin((endLat * Math.PI) / 180) -
//       Math.sin((startLat * Math.PI) / 180) *
//         Math.cos((endLat * Math.PI) / 180) *
//         Math.cos(dLon);

//     const brng = (Math.atan2(y, x) * 180) / Math.PI;

//     return (brng + 360) % 360;
//   };

//   // DISTANCE BETWEEN TWO POINTS
//   const getDistance = (
//     lat1: number,
//     lon1: number,
//     lat2: number,
//     lon2: number,
//   ) => {
//     const R = 6371e3;

//     const φ1 = (lat1 * Math.PI) / 180;
//     const φ2 = (lat2 * Math.PI) / 180;

//     const Δφ = ((lat2 - lat1) * Math.PI) / 180;

//     const Δλ = ((lon2 - lon1) * Math.PI) / 180;

//     const a =
//       Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
//       Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

//     const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

//     return R * c;
//   };

//   const getProjectedPointOnSegment = (
//     lat: number,
//     lng: number,
//     startLat: number,
//     startLng: number,
//     endLat: number,
//     endLng: number,
//   ) => {
//     const dx = endLng - startLng;
//     const dy = endLat - startLat;

//     const lengthSquared = dx * dx + dy * dy;

//     if (lengthSquared === 0) {
//       return {
//         latitude: startLat,
//         longitude: startLng,
//         t: 0,
//       };
//     }

//     let t = ((lng - startLng) * dx + (lat - startLat) * dy) / lengthSquared;

//     t = Math.max(0, Math.min(1, t));

//     return {
//       latitude: startLat + t * dy,
//       longitude: startLng + t * dx,
//       t,
//     };
//   };

//   const getNearestPointOnRoute = (
//     latitude: number,
//     longitude: number,
//     route: any[],
//   ) => {
//     if (route.length < 2) {
//       return null;
//     }

//     let minDistance = Infinity;

//     let nearestIndex = 0;

//     let projectedPoint: any = null;

//     for (let i = 0; i < route.length - 1; i++) {
//       const start = route[i];
//       const end = route[i + 1];

//       const projected = getProjectedPointOnSegment(
//         latitude,
//         longitude,
//         start[1],
//         start[0],
//         end[1],
//         end[0],
//       );

//       const distance = getDistance(
//         latitude,
//         longitude,
//         projected.latitude,
//         projected.longitude,
//       );

//       if (distance < minDistance) {
//         minDistance = distance;
//         nearestIndex = i;
//         projectedPoint = projected;
//       }
//     }

//     return {
//       index: nearestIndex,
//       distance: minDistance,
//       point: projectedPoint,
//     };
//   };
//   // ROUTE API
//   const getRoute = async (
//     startLat: number,
//     startLng: number,
//     endLat: number,
//     endLng: number,
//   ) => {
//     try {
//       const response = await axios.get(
//         `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`,
//       );

//       if (
//         response.data &&
//         response.data.routes &&
//         response.data.routes.length > 0
//       ) {
//         const osrmCoordinates = response.data.routes[0].geometry.coordinates;

//         // Insert actual GPS as first point
//         const coordinates = [[startLng, startLat], ...osrmCoordinates];

//         for (let i = 0; i < 5; i++) {
//           const dist = getDistance(
//             coordinates[i][1],
//             coordinates[i][0],
//             coordinates[i + 1][1],
//             coordinates[i + 1][0],
//           );

//           console.log(`Distance ${i} -> ${i + 1}:`, dist);
//         }
//         setRouteCoordinates(coordinates);
//         routeCoordinatesRef.current = coordinates;

//         console.log('Route Length:', coordinates.length);

//         console.log('First Route Point:', coordinates[0]);

//         console.log('Start GPS:', startLat, startLng);

//         console.log(
//           'Distance Between Start And Route Point:',
//           getDistance(startLat, startLng, coordinates[0][1], coordinates[0][0]),
//         );

//         if (!riderPosition && coordinates.length > 0) {
//           const initialPos = {
//             latitude: coordinates[0][1],
//             longitude: coordinates[0][0],
//           };
//           riderPositionRef.current = initialPos;
//           setRiderPosition(initialPos);

//           lastSnappedIndexRef.current = 0;

//           setRemainingRoute(coordinates);
//         }
//       }
//     } catch (error) {
//       console.log('ROUTE ERROR', error);
//     }
//   };

//   // INITIAL LOCATION
//   const getCurrentLocation = async () => {
//     Geolocation.getCurrentPosition(
//       async position => {
//         const latitude = position.coords.latitude;

//         const longitude = position.coords.longitude;

//         setCurrentLocation({
//           latitude,
//           longitude,
//         });

//         previousCoordinateRef.current = {
//           latitude,
//           longitude,
//         };

//         await getRoute(
//           latitude,
//           longitude,
//           destinationLocation.latitude,
//           destinationLocation.longitude,
//         );
//       },

//       error => {
//         console.log(error);
//       },

//       {
//         enableHighAccuracy: true,
//         timeout: 15000,
//         maximumAge: 10000,
//       },
//     );
//   };

//   // LIVE TRACKING
//   useEffect(() => {
//     requestLocationPermission();

//     getCurrentLocation();

//     // Route ke through animate karo — seedha line nahi, curve follow karega
//     const animateMarkerAlongRoute = (
//       fromLat: number,
//       fromLng: number,
//       toLat: number,
//       toLng: number,
//       fromIndex: number,
//       toIndex: number,
//       fullRoute: any[],
//     ) => {
//       // Cancel purani animation
//       if (markerAnimationRef.current) {
//         clearInterval(markerAnimationRef.current);
//         markerAnimationRef.current = null;
//       }

//       // Route ke waypoints collect karo from -> to ke beech
//       // [fromPoint, ...intermediate route points..., toPoint]
//       const waypoints: { latitude: number; longitude: number }[] = [
//         { latitude: fromLat, longitude: fromLng },
//       ];

//       // fromIndex se toIndex tak ke route points add karo
//       const startIdx = Math.min(fromIndex + 1, fullRoute.length - 1);
//       const endIdx = Math.min(toIndex, fullRoute.length - 1);
//       for (let i = startIdx; i <= endIdx; i++) {
//         waypoints.push({ latitude: fullRoute[i][1], longitude: fullRoute[i][0] });
//       }

//       // End point ensure karo
//       if (
//         waypoints[waypoints.length - 1].latitude !== toLat ||
//         waypoints[waypoints.length - 1].longitude !== toLng
//       ) {
//         waypoints.push({ latitude: toLat, longitude: toLng });
//       }

//       // Agar waypoints sirf 1 ya same hain to directly set karo
//       if (waypoints.length <= 1) {
//         const pos = { latitude: toLat, longitude: toLng };
//         riderPositionRef.current = pos;
//         setRiderPosition(pos);
//         return;
//       }

//       // Har segment ke liye steps calculate karo distance ke basis pe
//       // Taaki speed consistent rahe across segments
//       const SPEED_PER_STEP = 0.000015; // ~1.5 meter per step
//       let allSteps: { latitude: number; longitude: number }[] = [];

//       for (let w = 0; w < waypoints.length - 1; w++) {
//         const wStart = waypoints[w];
//         const wEnd = waypoints[w + 1];
//         const segDist = Math.sqrt(
//           Math.pow(wEnd.latitude - wStart.latitude, 2) +
//           Math.pow(wEnd.longitude - wStart.longitude, 2)
//         );
//         const segSteps = Math.max(3, Math.min(15, Math.round(segDist / SPEED_PER_STEP)));

//         for (let s = 1; s <= segSteps; s++) {
//           const p = s / segSteps;
//           allSteps.push({
//             latitude: wStart.latitude + (wEnd.latitude - wStart.latitude) * p,
//             longitude: wStart.longitude + (wEnd.longitude - wStart.longitude) * p,
//           });
//         }
//       }

//       let stepIndex = 0;
//       const interval = setInterval(() => {
//         if (stepIndex >= allSteps.length) {
//           clearInterval(interval);
//           markerAnimationRef.current = null;
//           return;
//         }
//         const newPos = allSteps[stepIndex];
//         riderPositionRef.current = newPos;
//         setRiderPosition(newPos);

//         // Heading bhi route ke saath update karo — smooth turn
//         if (stepIndex < allSteps.length - 1) {
//           const curr = allSteps[stepIndex];
//           const nxt = allSteps[stepIndex + 1];
//           const stepBearing = calculateBearing(
//             curr.latitude, curr.longitude,
//             nxt.latitude, nxt.longitude,
//           );
//           // Sirf significant change pe heading update karo
//           const diff = Math.abs(stepBearing - headingRef.current);
//           const shortDiff = diff > 180 ? 360 - diff : diff;
//           if (shortDiff > 8) {
//             headingRef.current = stepBearing;
//             setMarkerHeading(stepBearing);
//             setCameraHeading(stepBearing);
//             cameraHeadingRef.current = stepBearing;
//             lastAnimatedBearingRef.current = stepBearing;
//           }
//         }

//         stepIndex++;
//       }, 50);

//       markerAnimationRef.current = interval;
//     };

//     // Legacy wrapper — seedha move (fast/far distance ke liye fallback)
//     const animateMarker = (
//       startLat: number,
//       startLng: number,
//       endLat: number,
//       endLng: number,
//     ) => {
//       if (markerAnimationRef.current) {
//         clearInterval(markerAnimationRef.current);
//         markerAnimationRef.current = null;
//       }
//       const distance = Math.sqrt(
//         Math.pow(endLat - startLat, 2) + Math.pow(endLng - startLng, 2)
//       );
//       const steps = distance > 0.0005 ? 10 : 20;
//       let currentStep = 0;
//       const interval = setInterval(() => {
//         currentStep++;
//         const progress = currentStep / steps;
//         const newPos = {
//           latitude: startLat + (endLat - startLat) * progress,
//           longitude: startLng + (endLng - startLng) * progress,
//         };
//         riderPositionRef.current = newPos;
//         setRiderPosition(newPos);
//         if (currentStep >= steps) {
//           clearInterval(interval);
//           markerAnimationRef.current = null;
//         }
//       }, 50);
//       markerAnimationRef.current = interval;
//     };

//     // SMOOTH HEADING ANIMATION
//     const animateHeading = (fromBearing: number, toBearing: number) => {
//       // CANCEL previous heading animation
//       if (headingAnimationRef.current) {
//         clearInterval(headingAnimationRef.current);
//         headingAnimationRef.current = null;
//       }

//       let delta = toBearing - fromBearing;
//       if (delta > 180) delta -= 360;
//       if (delta < -180) delta += 360;

//       const steps = 15; // fast turn — heading peeche nahi rahegi
//       let currentStep = 0;

//       const interval = setInterval(() => {
//         currentStep++;
//         const progress = currentStep / steps;
//         const newHeading = (fromBearing + delta * progress + 360) % 360;
//         headingRef.current = newHeading;
//         setMarkerHeading(newHeading);
//         setCameraHeading(newHeading);
//         cameraHeadingRef.current = newHeading;

//         if (currentStep >= steps) {
//           clearInterval(interval);
//           headingAnimationRef.current = null;
//         }
//       }, 50);

//       headingAnimationRef.current = interval;
//     };
//     const watchId = Geolocation.watchPosition(
//       async position => {
//         const latitude = position.coords.latitude;

//         const longitude = position.coords.longitude;

//         const previous = previousCoordinateRef.current;

//         if (previous) {
//           const movedDistance = getDistance(
//             previous.latitude,
//             previous.longitude,
//             latitude,
//             longitude,
//           );

//           console.log('GPS Move Distance:', movedDistance);
//         }

//         // UPDATE LOCATION
//         setCurrentLocation({
//           latitude,
//           longitude,
//         });
//         // ARRAY ME STORE KARO
//         setLocationHistory(prev => {
//           const updated = [
//             ...prev,
//             {
//               latitude,
//               longitude,
//             },
//           ];

//           // // TOAST ME DIKHAO
//           // ToastAndroid.show(
//           //   JSON.stringify(updated),
//           //   ToastAndroid.SHORT,
//           // );

//           return updated;
//         });

//         const route = routeCoordinatesRef.current;

//         if (route.length < 2) {
//           return;
//         }
//         // CALCULATE HEADING
//         if (previous) {
//           const movedDistance = getDistance(
//             previous.latitude,
//             previous.longitude,
//             latitude,
//             longitude,
//           );
//           ToastAndroid.show(
//             `Rider moved: ${movedDistance.toFixed(1)} meter`,
//             ToastAndroid.SHORT,
//           );

//           console.log('GPS Move Distance:', movedDistance);
//           // if (movedDistance < 3) {
//           //   return;
//           // }
//           const route = routeCoordinatesRef.current;
//           if (route.length > 1) {
//             const snapped = getNearestPointOnRoute(latitude, longitude, route);

//             if (snapped) {
//               if (riderPositionRef.current) {
//                 // Route ke through animate karo — turn pe jump nahi hoga
//                 animateMarkerAlongRoute(
//                   riderPositionRef.current.latitude,
//                   riderPositionRef.current.longitude,
//                   snapped.point.latitude,
//                   snapped.point.longitude,
//                   lastSnappedIndexRef.current,  // from index
//                   snapped.index,                 // to index
//                   route,
//                 );
//               } else {
//                 const pos = {
//                   latitude: snapped.point.latitude,
//                   longitude: snapped.point.longitude,
//                 };
//                 riderPositionRef.current = pos;
//                 setRiderPosition(pos);
//               }

//               const currentMatchedPoint = [
//                 snapped.point.longitude,
//                 snapped.point.latitude,
//               ];

//               setRemainingRoute([
//                 currentMatchedPoint,
//                 ...route.slice(snapped.index + 1),
//               ]);

//               if (snapped.index !== lastSnappedIndexRef.current) {
//                 lastSnappedIndexRef.current = snapped.index;
//               }

//               // Heading ab animateMarkerAlongRoute ke andar handle hota hai
//               // Har waypoint pe smoothly update hoga — alag animateHeading ki zarurat nahi
//             }
//           }
//         }

//         previousCoordinateRef.current = {
//           latitude,
//           longitude,
//         };
//       },

//       error => {
//         console.log(error);
//       },

//       {
//         enableHighAccuracy: true,
//         distanceFilter: 5,       // walk: 1m theek, bike: 5m better — kam spam
//         interval: 1000,          // har 2 sec update — animation complete hone ka time milta hai
//         fastestInterval: 1000,
//         showLocationDialog: true,
//         forceRequestLocation: true,
//       },
//     );

//     return () => {
//       Geolocation.clearWatch(watchId);
//     };
//   }, []);

//   const sendOTP = async () => {
//     try {
//       setLoading(true);

//       console.log(
//         'Fetching dashboard data with token:',
//         GlobalLoginAuth.refreshToken,
//       );

//       const response = await fetch(
//         `${GlobalApi.baseUrl}api/deliveries/me/orders/${orderDetail?.order.id}/send-otp`,

//         {
//           method: 'POST',

//           headers: {
//             'Content-Type': 'application/json',

//             Authorization: `Bearer ${GlobalLoginAuth.accessToken}`,
//           },
//         },
//       );

//       const result = await response.json();

//       const SendOtpResponse = result as SendOtpResponse; // âœ… Type assertion to ensure it matches our model

//       console.log('Generate OTP Response:', result);

//       if (!response.ok) {
//         Alert.alert('FoodyPly', result.message || 'Failed to load dashboard');

//         return;
//       }

//       if (SendOtpResponse.success) {
//         console.log('OTP sent successfully:', SendOtpResponse.data.otp);

//         navigation.navigate('DeliveryOtpVerification', {
//           orderDetail: orderDetail,
//           otp: SendOtpResponse.data.otp,
//         });
//       }
//     } catch (error) {
//       console.log(error);

//       Alert.alert('FoodyPly', 'Unable to connect to server');
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <View style={styles.container}>
//       <GlobalTopBarDelivery
//         navigation={navigation}
//         notificationClick={() => {}}
//         text="Start Delivery"
//         subtitleText={`#${orderDetail?.order.orderNumber}`}
//         isBackVisible={true}
//         isOnlineVisible={false}
//       />

//       <View style={styles.overlay}>
//         <View style={styles.card}>
//           <View style={styles.mapContainer}>
//             <Map
//               style={styles.map}
//               mapStyle={DARK_MAP_STYLE}
//               logo={false}
//               compass={true}
//             >
//               {/* CAMERA */}
//               {riderPosition && (
//                 <Camera
//                   zoom={18}
//                   pitch={0}
//                   bearing={cameraHeading}
//                   center={[riderPosition.longitude, riderPosition.latitude]}
//                   padding={{
//                     top: 100,
//                     bottom: 300,
//                     left: 0,
//                     right: 0,
//                   }}
//                 />
//               )}

//               {/* DELIVERY BOY MARKER */}
//               {riderPosition && (
//                 <Marker
//                   anchor="center"
//                   lngLat={[riderPosition.longitude, riderPosition.latitude]}
//                 >
//                   <View
//                     style={[
//                       styles.currentMarkerWrapper,
//                       {
//                         // transform: [
//                         //   {
//                         //     rotate: `${markerHeading}deg`,
//                         //   },
//                         // ],
//                       },
//                     ]}
//                   >
//                     <Image
//                       source={require('../assets/images/dman.png')}
//                       style={styles.deliveryIcon}
//                       resizeMode="contain"
//                     />
//                   </View>
//                 </Marker>
//               )}

//               {/* DESTINATION */}
//               <Marker
//                 anchor="center"
//                 lngLat={[
//                   destinationLocation.longitude,
//                   destinationLocation.latitude,
//                 ]}
//               >
//                 <View style={styles.destinationMarkerWrapper}>
//                   <View style={styles.destinationMarker} />
//                 </View>
//               </Marker>

//               {/* ROUTE */}
//               {routeCoordinates.length > 1 && (
//                 <GeoJSONSource
//                   id="routeSource"
//                   data={{
//                     type: 'FeatureCollection',
//                     features: [
//                       {
//                         type: 'Feature',
//                         properties: {},
//                         geometry: {
//                           type: 'LineString',
//                           coordinates: remainingRoute,
//                         },
//                       },
//                     ],
//                   }}
//                 >
//                   {/* ROUTE SHADOW */}
//                   <Layer
//                     id="routeLayerBg"
//                     type="line"
//                     paint={{
//                       'line-color': '#0B3B2E',
//                       'line-width': 10,
//                       'line-opacity': 0.7,
//                     }}
//                     layout={{
//                       'line-cap': 'round',
//                       'line-join': 'round',
//                     }}
//                   />

//                   {/* MAIN ROUTE */}
//                   <Layer
//                     id="routeLayer"
//                     type="line"
//                     paint={{
//                       'line-color': '#00FF9D',
//                       'line-width': 6,
//                       'line-opacity': 1,
//                     }}
//                     layout={{
//                       'line-cap': 'round',
//                       'line-join': 'round',
//                     }}
//                   />
//                 </GeoJSONSource>
//               )}
//             </Map>

//             {/* FLOATING CARD */}
//             {showDetailsCard ? (
//               <View style={styles.card1}>
//                 {/* USER INFO */}
//                 <View style={styles.header}>
//                   <Image
//                     source={
//                       orderDetail?.customer?.profileImageUrl
//                         ? { uri: orderDetail.customer.profileImageUrl }
//                         : require('../assets/images/customer_image.png')
//                     }
//                     style={styles.avatar}
//                   />

//                   <View style={{ flex: 1 }}>
//                     <Text style={styles.name}>{orderDetail.customer.name}</Text>
//                     <Text style={styles.phone}>
//                       {orderDetail.customer.phone}
//                     </Text>
//                     <Text style={styles.address}>
//                       {orderDetail.customer.address.fullText}
//                     </Text>
//                   </View>

//                   <View style={styles.iconColumn}>
//                     <TouchableOpacity style={styles.circleBtn}>
//                       <Image
//                         source={require('../assets/images/call.png')}
//                         style={styles.smallIcon}
//                       />
//                     </TouchableOpacity>
//                   </View>
//                 </View>

//                 {/* ORDER INFO */}
//                 <View style={styles.orderRow}>
//                   <View
//                     style={{
//                       flexDirection: 'row',
//                       alignItems: 'center',
//                       gap: 5,
//                     }}
//                   >
//                     <Image
//                       source={require('../assets/images/shopping_bag.png')}
//                       style={styles.smallIconOrange}
//                     />

//                     <View>
//                       <Text style={styles.smallLabel}>
//                         {orderDetail.items.length} Items •{' '}
//                         {orderDetail.items.reduce(
//                           (acc, item) => acc + item.quantity,
//                           0,
//                         )}{' '}
//                         Qty
//                       </Text>
//                       <View
//                         style={{
//                           flexDirection: 'row',
//                           alignItems: 'center',
//                           gap: 4,
//                           marginTop: 2,
//                         }}
//                       >
//                         <Text style={styles.smallLabel}>Payment Status</Text>
//                         <View style={styles.codBadge}>
//                           <Text style={styles.codText}>
//                             {orderDetail.billing.paymentStatus}
//                           </Text>
//                         </View>
//                       </View>
//                     </View>
//                   </View>
//                   <View>
//                     <Text style={styles.smallLabel}>Order Amount</Text>
//                     <Text style={styles.amount}>
//                       ₹{orderDetail.billing.finalAmount.toFixed(2)}
//                     </Text>
//                   </View>
//                 </View>

//                 {/* LIVE STATUS */}
//                 <View style={styles.liveBox}>
//                   <View style={styles.iconCircle}>
//                     <Image
//                       source={require('../assets/images/scooter.png')}
//                       style={styles.bikeIcon}
//                     />
//                   </View>
//                   <View style={{ marginLeft: 10 }}>
//                     <Text style={styles.liveTitle}>Live Status</Text>
//                     <Text style={styles.liveText}>
//                       You are on the way to the customer
//                     </Text>
//                   </View>
//                 </View>

//                 {/* PROGRESS */}
//                 <View style={{ marginTop: 20 }}>
//                   <Text style={styles.progressTitle}>Order Progress</Text>

//                   <View style={styles.progressRow}>
//                     {[
//                       'Assigned',
//                       'Accepted',
//                       'Picked',
//                       'On The Way',
//                       'Delivered',
//                     ].map((item, index) => {
//                       const isActive = index <= 3;
//                       const isOnWay = item === 'On The Way';

//                       return (
//                         <View key={index} style={styles.stepContainer}>
//                           <View
//                             style={[
//                               styles.stepCircle,
//                               isActive && styles.activeStep,

//                               // LIGHT ORANGE BACKGROUND FOR ON WAY
//                               isOnWay && styles.onWayStep,
//                             ]}
//                           >
//                             {isOnWay ? (
//                               <Image
//                                 source={require('../assets/images/scooter.png')}
//                                 style={styles.scooterIcon}
//                               />
//                             ) : (
//                               <Image
//                                 source={require('../assets/images/check.png')}
//                                 style={[
//                                   styles.checkIcon,
//                                   {
//                                     tintColor: isActive
//                                       ? Colors.primary
//                                       : '#bbb',
//                                   },
//                                 ]}
//                               />
//                             )}
//                           </View>

//                           <Text style={styles.stepText}>{item}</Text>

//                           {index !== 4 && (
//                             <View
//                               style={[
//                                 styles.line,
//                                 index < 3 && styles.activeLine,
//                               ]}
//                             />
//                           )}
//                         </View>
//                       );
//                     })}
//                   </View>
//                 </View>

//                 {/* BUTTONS */}
//                 <View style={styles.buttonRow}>
//                   <TouchableOpacity
//                     style={styles.mapBtn}
//                     onPress={() => setShowDetailsCard(false)}
//                   >
//                     <Text style={styles.mapBtnText}>Open in Maps</Text>
//                   </TouchableOpacity>

//                   <TouchableOpacity
//                     style={styles.deliverBtn}
//                     onPress={() => sendOTP()}
//                   >
//                     <Text style={styles.deliverBtnText}>Order Delivered</Text>
//                   </TouchableOpacity>
//                 </View>
//               </View>
//             ) : (
//               <TouchableOpacity
//                 activeOpacity={0.8}
//                 style={styles.floatingShowButton}
//                 onPress={() => setShowDetailsCard(true)}
//               >
//                 <Image
//                   source={require('../assets/images/shopping_bag.png')}
//                   style={styles.floatingArrow}
//                 />
//               </TouchableOpacity>
//             )}
//           </View>
//         </View>
//       </View>
//       <GlobalLoader visible={loading} />
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: Colors.primary,
//     paddingTop: 100,
//   },

//   overlay: {
//     flex: 1,
//     borderTopLeftRadius: 30,
//     borderTopRightRadius: 30,
//     marginTop: 20,
//   },

//   card: {
//     backgroundColor: '#fff',
//     borderTopLeftRadius: 20,
//     borderTopRightRadius: 20,
//     flex: 1,
//   },

//   mapContainer: {
//     flex: 1,
//     borderTopLeftRadius: 20,
//     borderTopRightRadius: 20,
//     overflow: 'hidden',
//   },

//   map: {
//     flex: 1,
//   },

//   currentMarkerWrapper: {
//     width: 44,
//     height: 44,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },

//   deliveryIcon: {
//     width: 80,
//     height: 80,

//     // REMOVE THIS IF IMAGE ALREADY ORANGE
//     // tintColor: Colors.primary,
//   },

//   destinationMarkerWrapper: {
//     width: 30,
//     height: 30,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },

//   destinationMarker: {
//     width: 18,
//     height: 18,
//     borderRadius: 9,
//     backgroundColor: 'red',
//     borderWidth: 3,
//     borderColor: '#fff',
//   },
//   card1: {
//     position: 'absolute',
//     bottom: 20,
//     left: 15,
//     right: 15,
//     backgroundColor: '#fff',
//     borderRadius: 25,
//     padding: 18,

//     shadowColor: '#000',
//     shadowOpacity: 0.15,
//     shadowRadius: 10,
//     shadowOffset: {
//       width: 0,
//       height: 5,
//     },
//     elevation: 8,
//   },

//   header: {
//     flexDirection: 'row',
//     alignItems: 'flex-start',
//     justifyContent: 'space-between',
//   },

//   avatar: {
//     width: 60,
//     height: 60,
//     borderRadius: 20,
//     marginRight: 12,
//   },

//   name: {
//     fontSize: 18,
//     fontFamily: FontFamily.medium,
//     color: Colors.textColor,
//   },

//   phone: {
//     color: Colors.textBrown,
//     fontFamily: FontFamily.regular,
//     marginTop: 2,
//     fontSize: 12,
//   },

//   address: {
//     color: Colors.textBrown,
//     marginTop: 2,
//     fontSize: 12,
//     fontFamily: FontFamily.regular,
//   },

//   iconColumn: {
//     gap: 0,
//   },

//   circleBtn: {
//     width: 38,
//     height: 38,
//     borderRadius: 19,
//     backgroundColor: '#7bc043',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },

//   orderRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     marginTop: 20,
//   },

//   smallLabel: {
//     color: Colors.textBrown,
//     fontSize: 14,
//     fontFamily: FontFamily.regular,
//   },

//   boldText: {
//     fontFamily: FontFamily.bold,
//     marginTop: 2,
//     fontSize: 14,
//   },

//   amount: {
//     color: Colors.primary,
//     fontSize: 18,
//     fontFamily: FontFamily.regular,
//     marginTop: 2,
//   },

//   liveBox: {
//     flexDirection: 'row',
//     backgroundColor: '#FEF6F3',
//     padding: 6,
//     borderRadius: 10,
//     marginTop: 18,
//     alignItems: 'center',
//   },

//   liveTitle: {
//     color: Colors.textColor,
//     fontFamily: FontFamily.medium,
//   },

//   liveText: {
//     color: Colors.textBrown,
//     marginTop: 3,
//     fontSize: 12,
//     fontFamily: FontFamily.regular,
//   },

//   progressTitle: {
//     fontFamily: FontFamily.medium,
//     marginBottom: 15,
//     color: Colors.textColor,
//   },

//   progressRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//   },

//   stepContainer: {
//     alignItems: 'center',
//     flex: 1,
//     position: 'relative',
//     justifyContent: 'flex-start',
//   },

//   stepCircle: {
//     width: 30,
//     height: 30,
//     borderRadius: 15,
//     backgroundColor: '#e5e5e5',
//     justifyContent: 'center',
//     alignItems: 'center',
//     zIndex: 2,
//   },
//   activeStep: {
//     backgroundColor: Colors.lightOrange,
//   },

//   line: {
//     position: 'absolute',
//     top: 12,
//     left: '50%',
//     width: '100%',
//     height: 3,
//     backgroundColor: '#ddd',
//     zIndex: 1,
//   },

//   activeLine: {
//     backgroundColor: Colors.primary,
//   },

//   stepText: {
//     fontSize: 10,
//     marginTop: 10,
//     color: Colors.textBrown,
//     textAlign: 'center',
//     fontFamily: FontFamily.regular,
//   },

//   buttonRow: {
//     flexDirection: 'row',
//     marginTop: 25,
//     gap: 12,
//   },

//   mapBtn: {
//     flex: 1,
//     backgroundColor: Colors.buttonLight,
//     paddingVertical: 14,
//     borderRadius: 14,
//     alignItems: 'center',
//   },

//   deliverBtn: {
//     flex: 1,
//     backgroundColor: Colors.primary,
//     paddingVertical: 14,
//     borderRadius: 14,
//     alignItems: 'center',
//   },

//   mapBtnText: {
//     color: Colors.primary,
//     fontFamily: FontFamily.regular,
//     fontSize: 16,
//   },

//   deliverBtnText: {
//     color: '#fff',
//     fontFamily: FontFamily.regular,
//     fontSize: 16,
//   },

//   smallIcon: {
//     width: 18,
//     height: 18,
//     tintColor: '#fff',
//   },

//   smallIconOrange: {
//     width: 30,
//     height: 30,
//     tintColor: Colors.primary,
//   },

//   bikeIcon: {
//     width: 24,
//     height: 24,
//     tintColor: Colors.primary,
//   },

//   checkIcon: {
//     width: 16,
//     height: 16,
//   },
//   iconCircle: {
//     width: 60,
//     height: 60,
//     borderRadius: 30,
//     backgroundColor: Colors.lightOrange,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   codBadge: {
//     backgroundColor: Colors.lightBackground,
//     paddingHorizontal: 8,
//     paddingVertical: 3,
//     borderRadius: 20,
//     marginLeft: 2,
//   },

//   codText: {
//     color: Colors.primary,
//     fontSize: 12,
//     fontFamily: FontFamily.semiBold,
//   },
//   onWayStep: {
//     width: 30,
//     height: 30,
//     borderRadius: 15,
//     backgroundColor: Colors.lightOrange,

//     justifyContent: 'center',
//     alignItems: 'center',

//     zIndex: 3,
//   },

//   scooterIcon: {
//     width: 20,
//     height: 20,
//     tintColor: Colors.primary,
//   },
//   hideButton: {
//     width: 32,
//     height: 32,
//     borderRadius: 16,
//     backgroundColor: '#F5F5F5',
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginLeft: 10,
//   },

//   hideIcon: {
//     width: 16,
//     height: 16,
//     tintColor: Colors.textColor,
//   },

//   floatingShowButton: {
//     position: 'absolute',
//     bottom: 30,
//     right: 20,
//     width: 40,
//     height: 40,
//     borderRadius: 20,

//     backgroundColor: Colors.primary,

//     justifyContent: 'center',
//     alignItems: 'center',

//     shadowColor: '#000',
//     shadowOpacity: 0.2,
//     shadowRadius: 8,
//     shadowOffset: {
//       width: 0,
//       height: 4,
//     },

//     elevation: 10,
//   },

//   floatingArrow: {
//     width: 24,
//     height: 24,
//     tintColor: '#fff',
//   },
// });

// re-routing 1

// import React, { useEffect, useState, useRef } from 'react';
// import {
//   View,
//   StyleSheet,
//   PermissionsAndroid,
//   Platform,
//   Image,
//   Text,
//   TouchableOpacity,
//   ToastAndroid,
//   Alert,
// } from 'react-native';

// import {
//   Map,
//   Camera,
//   Marker,
//   GeoJSONSource,
//   Layer,
// } from '@maplibre/maplibre-react-native';

// import Geolocation from 'react-native-geolocation-service';
// import axios from 'axios';
// import { OSM_STYLE } from '../GlobalContainer/mapStyle';

// import Colors from '../assets/Colors/Colors';
// import GlobalTopBarDelivery from '../GlobalContainer/GlobalTopBarDelivery';
// import { DeliveryOrderDetails } from '../Models/DeliveryOrderDetails/DeliveryOrderDetails';
// import { FontFamily } from '../assets/GlobalFont/GlobalFont';
// import GlobalLoginAuth from '../GlobalContainer/GlobalLoginAuth';
// import GlobalApi from '../GlobalContainer/GlobalApi';
// import GlobalLoader from '../GlobalContainer/GlobalLoader';
// import { SendOtpResponse } from '../Models/SendOTP/SendOtpResponse ';

// const DARK_MAP_STYLE =
//   'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

// export default function DeliveryStart({ route, navigation }: any) {
//   const {
//     orderDetail,
//   }: {
//     orderDetail: DeliveryOrderDetails;
//   } = route.params;

//   const [showDetailsCard, setShowDetailsCard] = useState(true);
//   const lastSnappedIndexRef = useRef(-1);
//   // DESTINATION
//   const [destinationLocation] = useState({
//     latitude: orderDetail.customer.address.latitude || 22.8948,

//     longitude: orderDetail.customer.address.longitude || 88.41,
//   });

//   // CURRENT LOCATION
//   const [currentLocation, setCurrentLocation] = useState<{
//     latitude: number;
//     longitude: number;
//   } | null>(null);

//   // ROUTE
//   const [routeCoordinates, setRouteCoordinates] = useState<any[]>([]);
//   const routeCoordinatesRef = useRef<any[]>([]);
//   const [remainingRoute, setRemainingRoute] = useState<any[]>([]);
//   const headingRef = useRef(0);
//   const cameraHeadingRef = useRef(0);
//   const markerAnimationRef = useRef<any>(null); // cancel old animation before new one
//   const headingAnimationRef = useRef<any>(null); // cancel old heading animation
//   const riderPositionRef = useRef<{
//     latitude: number;
//     longitude: number;
//   } | null>(null); // always fresh position
//   const lastAnimatedBearingRef = useRef<number>(-1); // last bearing jo animate hua — dobara same pe na karo
//   const isReroutingRef = useRef(false); // re-route already chal raha hai — double call rok
//   const offRouteCountRef = useRef(0); // kitni baar off-route mila — ek GPS spike pe re-route nahi
//   const [riderPosition, setRiderPosition] = useState<{
//     latitude: number;
//     longitude: number;
//   } | null>(null);

//   // FREE CAMERA MODE — jab user zoom/pan kare to rider follow band ho jaye
//   const [isFollowingRider, setIsFollowingRider] = useState(true);
//   const userInteractingRef = useRef(false);
//   const interactionTimerRef = useRef<any>(null);
//   // CAMERA HEADING
//   const [cameraHeading, setCameraHeading] = useState(0);

//   // SCOOTER HEADING
//   const [markerHeading, setMarkerHeading] = useState(0);
//   const [loading, setLoading] = useState(false);

//   const [locationHistory, setLocationHistory] = useState<
//     { latitude: number; longitude: number }[]
//   >([]);
//   // PREVIOUS LOCATION
//   const previousCoordinateRef = useRef<{
//     latitude: number;
//     longitude: number;
//   } | null>(null);

//   // REQUEST LOCATION PERMISSION
//   const requestLocationPermission = async () => {
//     if (Platform.OS === 'android') {
//       const granted = await PermissionsAndroid.request(
//         PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
//       );

//       if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
//         console.log('Location permission denied');
//       }
//     }
//   };

//   const calculateBearing = (
//     startLat: number,

//     startLng: number,

//     endLat: number,

//     endLng: number,
//   ) => {
//     const dLon = ((endLng - startLng) * Math.PI) / 180;

//     const y = Math.sin(dLon) * Math.cos((endLat * Math.PI) / 180);

//     const x =
//       Math.cos((startLat * Math.PI) / 180) *
//         Math.sin((endLat * Math.PI) / 180) -
//       Math.sin((startLat * Math.PI) / 180) *
//         Math.cos((endLat * Math.PI) / 180) *
//         Math.cos(dLon);

//     const brng = (Math.atan2(y, x) * 180) / Math.PI;

//     return (brng + 360) % 360;
//   };

//   // DISTANCE BETWEEN TWO POINTS
//   const getDistance = (
//     lat1: number,
//     lon1: number,
//     lat2: number,
//     lon2: number,
//   ) => {
//     const R = 6371e3;

//     const φ1 = (lat1 * Math.PI) / 180;
//     const φ2 = (lat2 * Math.PI) / 180;

//     const Δφ = ((lat2 - lat1) * Math.PI) / 180;

//     const Δλ = ((lon2 - lon1) * Math.PI) / 180;

//     const a =
//       Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
//       Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

//     const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

//     return R * c;
//   };

//   const getProjectedPointOnSegment = (
//     lat: number,
//     lng: number,
//     startLat: number,
//     startLng: number,
//     endLat: number,
//     endLng: number,
//   ) => {
//     const dx = endLng - startLng;
//     const dy = endLat - startLat;

//     const lengthSquared = dx * dx + dy * dy;

//     if (lengthSquared === 0) {
//       return {
//         latitude: startLat,
//         longitude: startLng,
//         t: 0,
//       };
//     }

//     let t = ((lng - startLng) * dx + (lat - startLat) * dy) / lengthSquared;

//     t = Math.max(0, Math.min(1, t));

//     return {
//       latitude: startLat + t * dy,
//       longitude: startLng + t * dx,
//       t,
//     };
//   };

//   const getNearestPointOnRoute = (
//     latitude: number,
//     longitude: number,
//     route: any[],
//   ) => {
//     if (route.length < 2) {
//       return null;
//     }

//     let minDistance = Infinity;

//     let nearestIndex = 0;

//     let projectedPoint: any = null;

//     for (let i = 0; i < route.length - 1; i++) {
//       const start = route[i];
//       const end = route[i + 1];

//       const projected = getProjectedPointOnSegment(
//         latitude,
//         longitude,
//         start[1],
//         start[0],
//         end[1],
//         end[0],
//       );

//       const distance = getDistance(
//         latitude,
//         longitude,
//         projected.latitude,
//         projected.longitude,
//       );

//       if (distance < minDistance) {
//         minDistance = distance;
//         nearestIndex = i;
//         projectedPoint = projected;
//       }
//     }

//     return {
//       index: nearestIndex,
//       distance: minDistance,
//       point: projectedPoint,
//     };
//   };
//   // ROUTE API
//   const getRoute = async (
//     startLat: number,
//     startLng: number,
//     endLat: number,
//     endLng: number,
//   ) => {
//     try {
//       const response = await axios.get(
//         `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`,
//       );

//       if (
//         response.data &&
//         response.data.routes &&
//         response.data.routes.length > 0
//       ) {
//         const osrmCoordinates = response.data.routes[0].geometry.coordinates;

//         // Insert actual GPS as first point
//         const coordinates = [[startLng, startLat], ...osrmCoordinates];

//         for (let i = 0; i < 5; i++) {
//           const dist = getDistance(
//             coordinates[i][1],
//             coordinates[i][0],
//             coordinates[i + 1][1],
//             coordinates[i + 1][0],
//           );

//           console.log(`Distance ${i} -> ${i + 1}:`, dist);
//         }
//         setRouteCoordinates(coordinates);
//         routeCoordinatesRef.current = coordinates;

//         console.log('Route Length:', coordinates.length);

//         console.log('First Route Point:', coordinates[0]);

//         console.log('Start GPS:', startLat, startLng);

//         console.log(
//           'Distance Between Start And Route Point:',
//           getDistance(startLat, startLng, coordinates[0][1], coordinates[0][0]),
//         );

//         if (!riderPosition && coordinates.length > 0) {
//           const initialPos = {
//             latitude: coordinates[0][1],
//             longitude: coordinates[0][0],
//           };
//           riderPositionRef.current = initialPos;
//           setRiderPosition(initialPos);

//           lastSnappedIndexRef.current = 0;

//           setRemainingRoute(coordinates);
//         }
//       }
//     } catch (error) {
//       console.log('ROUTE ERROR', error);
//     }
//   };

//   // RE-ROUTE — rider off-route ho gaya, current position se naya route fetch karo
//   // const reRoute = async (currentLat: number, currentLng: number) => {
//   //   if (isReroutingRef.current) return; // already re-routing — skip
//   //   isReroutingRef.current = true;

//   //   console.log('🔄 Re-routing from:', currentLat, currentLng);
//   //   ToastAndroid.show('Re-routing...', ToastAndroid.SHORT);

//   //   try {
//   //     const response = await axios.get(
//   //       `https://router.project-osrm.org/route/v1/driving/${currentLng},${currentLat};${destinationLocation.longitude},${destinationLocation.latitude}?overview=full&geometries=geojson`,
//   //     );

//   //     if (
//   //       response.data &&
//   //       response.data.routes &&
//   //       response.data.routes.length > 0
//   //     ) {
//   //       const osrmCoordinates = response.data.routes[0].geometry.coordinates;

//   //       // Current GPS position ko first point banao
//   //       const newCoordinates = [[currentLng, currentLat], ...osrmCoordinates];

//   //       // State aur ref dono update karo
//   //       setRouteCoordinates(newCoordinates);
//   //       routeCoordinatesRef.current = newCoordinates;
//   //       setRemainingRoute(newCoordinates);

//   //       // Snapped index reset karo
//   //       lastSnappedIndexRef.current = 0;
//   //       offRouteCountRef.current = 0;

//   //       console.log('✅ Re-route success. New route length:', newCoordinates.length);
//   //       ToastAndroid.show('Route updated!', ToastAndroid.SHORT);
//   //     }
//   //   } catch (error) {
//   //     console.log('Re-route error:', error);
//   //   } finally {
//   //     isReroutingRef.current = false;
//   //   }
//   // };

//   // RE-ROUTE — rider off-route ho gaya, current position se naya route fetch karo
//   const reRoute = async (currentLat: number, currentLng: number) => {
//     if (isReroutingRef.current) return;
//     isReroutingRef.current = true;

//     ToastAndroid.show('Re-routing...', ToastAndroid.SHORT);

//     try {
//       const response = await axios.get(
//         `https://router.project-osrm.org/route/v1/driving/${currentLng},${currentLat};${destinationLocation.longitude},${destinationLocation.latitude}?overview=full&geometries=geojson`,
//       );

//       if (response.data?.routes?.length > 0) {
//         const osrmCoordinates = response.data.routes[0].geometry.coordinates;

//         // Naye route ka pehla snapped point nikalo
//         const firstSnapped = osrmCoordinates[0]; // [lng, lat]

//         // ── SMOOTH ANIMATION: rider current pos → naye route ke pehle point tak ──
//         // Rider abhi jahan hai wahan se naye route pe smoothly leke jao
//         const currentRiderPos = riderPositionRef.current;
//         if (currentRiderPos) {
//           const SMOOTH_STEPS = 20;
//           const SMOOTH_INTERVAL = 50; // ms — total ~1 second smooth slide
//           let step = 0;

//           const fromLat = currentRiderPos.latitude;
//           const fromLng = currentRiderPos.longitude;
//           const toLat = firstSnapped[1];
//           const toLng = firstSnapped[0];

//           const slideInterval = setInterval(() => {
//             step++;
//             const progress = step / SMOOTH_STEPS;
//             const easedProgress = 1 - Math.pow(1 - progress, 3); // ease-out cubic

//             const newPos = {
//               latitude: fromLat + (toLat - fromLat) * easedProgress,
//               longitude: fromLng + (toLng - fromLng) * easedProgress,
//             };
//             riderPositionRef.current = newPos;
//             setRiderPosition(newPos);

//             if (step >= SMOOTH_STEPS) {
//               clearInterval(slideInterval);

//               // Animation complete — ab naya route set karo
//               const newCoordinates = [
//                 firstSnapped,
//                 ...osrmCoordinates.slice(1),
//               ];
//               setRouteCoordinates(newCoordinates);
//               routeCoordinatesRef.current = newCoordinates;
//               setRemainingRoute(newCoordinates);
//               lastSnappedIndexRef.current = 0;
//               offRouteCountRef.current = 0;

//               ToastAndroid.show('Route updated!', ToastAndroid.SHORT);
//             }
//           }, SMOOTH_INTERVAL);
//         } else {
//           // Agar riderPosition nahi hai — directly set karo
//           const newCoordinates = [firstSnapped, ...osrmCoordinates.slice(1)];
//           setRouteCoordinates(newCoordinates);
//           routeCoordinatesRef.current = newCoordinates;
//           setRemainingRoute(newCoordinates);
//           lastSnappedIndexRef.current = 0;
//           offRouteCountRef.current = 0;
//           ToastAndroid.show('Route updated!', ToastAndroid.SHORT);
//         }
//       }
//     } catch (error) {
//       console.log('Re-route error:', error);
//     } finally {
//       isReroutingRef.current = false;
//     }
//   };

//   // INITIAL LOCATION
//   const getCurrentLocation = async () => {
//     Geolocation.getCurrentPosition(
//       async position => {
//         const latitude = position.coords.latitude;

//         const longitude = position.coords.longitude;

//         setCurrentLocation({
//           latitude,
//           longitude,
//         });

//         previousCoordinateRef.current = {
//           latitude,
//           longitude,
//         };

//         await getRoute(
//           latitude,
//           longitude,
//           destinationLocation.latitude,
//           destinationLocation.longitude,
//         );
//       },

//       error => {
//         console.log(error);
//       },

//       {
//         enableHighAccuracy: true,
//         timeout: 15000,
//         maximumAge: 10000,
//       },
//     );
//   };

//   // LIVE TRACKING
//   useEffect(() => {
//     requestLocationPermission();

//     getCurrentLocation();

//     const animateMarker = (
//       startLat: number,
//       startLng: number,
//       endLat: number,
//       endLng: number,
//     ) => {
//       // CANCEL previous animation — nahi to purani aur nayi dono chalti hain
//       if (markerAnimationRef.current) {
//         clearInterval(markerAnimationRef.current);
//         markerAnimationRef.current = null;
//       }

//       // Bike fast ho to kam steps — marker peeche nahi rahega
//       const distance = Math.sqrt(
//         Math.pow(endLat - startLat, 2) + Math.pow(endLng - startLng, 2),
//       ); // Fast movement = fewer steps (snap quickly), slow = more steps (smooth)

//       const steps = distance > 0.0005 ? 6 : 10; // ~55m threshold
//       let currentStep = 0;

//       const interval = setInterval(() => {
//         currentStep++;
//         const progress = currentStep / steps;
//         const newPos = {
//           latitude: startLat + (endLat - startLat) * progress,
//           longitude: startLng + (endLng - startLng) * progress,
//         };
//         riderPositionRef.current = newPos;
//         setRiderPosition(newPos);

//         if (currentStep >= steps) {
//           clearInterval(interval);
//           markerAnimationRef.current = null;
//         }
//       }, 50);

//       markerAnimationRef.current = interval;
//     };

//     // SMOOTH HEADING ANIMATION
//     const animateHeading = (fromBearing: number, toBearing: number) => {
//       // CANCEL previous heading animation
//       if (headingAnimationRef.current) {
//         clearInterval(headingAnimationRef.current);
//         headingAnimationRef.current = null;
//       }

//       let delta = toBearing - fromBearing;
//       if (delta > 180) delta -= 360;
//       if (delta < -180) delta += 360;

//       const steps = 15; // fast turn — heading peeche nahi rahegi
//       let currentStep = 0;

//       const interval = setInterval(() => {
//         currentStep++;
//         const progress = currentStep / steps;
//         const newHeading = (fromBearing + delta * progress + 360) % 360;
//         headingRef.current = newHeading;
//         setMarkerHeading(newHeading);
//         setCameraHeading(newHeading);
//         cameraHeadingRef.current = newHeading;

//         if (currentStep >= steps) {
//           clearInterval(interval);
//           headingAnimationRef.current = null;
//         }
//       }, 50);

//       headingAnimationRef.current = interval;
//     };
//     const watchId = Geolocation.watchPosition(
//       async position => {
//         const latitude = position.coords.latitude;

//         const longitude = position.coords.longitude;

//         const previous = previousCoordinateRef.current;

//         if (previous) {
//           const movedDistance = getDistance(
//             previous.latitude,
//             previous.longitude,
//             latitude,
//             longitude,
//           );

//           console.log('GPS Move Distance:', movedDistance);
//         }

//         // UPDATE LOCATION
//         setCurrentLocation({
//           latitude,
//           longitude,
//         });
//         // ARRAY ME STORE KARO
//         setLocationHistory(prev => {
//           const updated = [
//             ...prev,
//             {
//               latitude,
//               longitude,
//             },
//           ];

//           // // TOAST ME DIKHAO
//           // ToastAndroid.show(
//           //   JSON.stringify(updated),
//           //   ToastAndroid.SHORT,
//           // );

//           return updated;
//         });

//         const route = routeCoordinatesRef.current;

//         if (route.length < 2) {
//           return;
//         }
//         // CALCULATE HEADING
//         if (previous) {
//           const movedDistance = getDistance(
//             previous.latitude,
//             previous.longitude,
//             latitude,
//             longitude,
//           );
//           // ToastAndroid.show(
//           //   `Rider moved: ${movedDistance.toFixed(1)} meter`,
//           //   ToastAndroid.SHORT,
//           // );

//           console.log('GPS Move Distance:', movedDistance);
//           // if (movedDistance < 3) {
//           //   return;
//           // }
//           const route = routeCoordinatesRef.current;
//           if (route.length > 1) {
//             const snapped = getNearestPointOnRoute(latitude, longitude, route);

//             if (snapped) {
//               // ─── OFF-ROUTE CHECK ───────────────────────────────────────────
//               // Agar rider route se 40 meter se zyada door hai, re-route karo
//               const OFF_ROUTE_THRESHOLD_METERS = 40; // 40 meters threshold for off-route detection
//               const OFF_ROUTE_CONFIRM_COUNT = 3; // 3 consecutive readings pe re-route (GPS spike se bachao)

//               if (snapped.distance > OFF_ROUTE_THRESHOLD_METERS) {
//                 offRouteCountRef.current += 1;
//                 console.log(
//                   `⚠️ Off-route! Distance: ${snapped.distance.toFixed(
//                     1,
//                   )}m | Count: ${offRouteCountRef.current}`,
//                 );

//                 if (offRouteCountRef.current >= OFF_ROUTE_CONFIRM_COUNT) {
//                   // Re-route trigger karo — current GPS se
//                   reRoute(latitude, longitude);
//                   return; // Is update ko skip karo, naya route aane do
//                 }
//               } else {
//                 // On-route — counter reset karo
//                 offRouteCountRef.current = 0;
//               }
//               // ──────────────────────────────────────────────────────────────

//               // riderPositionRef use karo — state stale hoti hai closure mein
//               if (riderPositionRef.current) {
//                 animateMarker(
//                   riderPositionRef.current.latitude,
//                   riderPositionRef.current.longitude,
//                   snapped.point.latitude,
//                   snapped.point.longitude,
//                 );
//               } else {
//                 const pos = {
//                   latitude: snapped.point.latitude,
//                   longitude: snapped.point.longitude,
//                 };
//                 riderPositionRef.current = pos;
//                 setRiderPosition(pos);
//               }

//               const currentMatchedPoint = [
//                 snapped.point.longitude,
//                 snapped.point.latitude,
//               ];

//               setRemainingRoute([
//                 currentMatchedPoint,
//                 ...route.slice(snapped.index + 1),
//               ]);

//               if (snapped.index !== lastSnappedIndexRef.current) {
//                 lastSnappedIndexRef.current = snapped.index;
//               }

//               if (snapped.index < route.length - 1) {
//                 const current = route[snapped.index];
//                 const next = route[snapped.index + 1];

//                 const routeBearing = calculateBearing(
//                   current[1],
//                   current[0],
//                   next[1],
//                   next[0],
//                 );

//                 const bearingDiff = Math.abs(routeBearing - headingRef.current);

//                 // 15° threshold — choti GPS jitter pe animate nahi hoga
//                 // lastAnimatedBearing check — same bearing pe dobara animate nahi hoga (vibration fix)
//                 const alreadyAnimated =
//                   Math.abs(routeBearing - lastAnimatedBearingRef.current) < 5;

//                 if (bearingDiff > 15 && !alreadyAnimated) {
//                   lastAnimatedBearingRef.current = routeBearing;
//                   animateHeading(headingRef.current, routeBearing);
//                 }
//               }
//             }
//           }
//         }

//         previousCoordinateRef.current = {
//           latitude,
//           longitude,
//         };
//       },

//       error => {
//         console.log(error);
//       },

//       {
//         enableHighAccuracy: true,
//         distanceFilter: 1, // walk: 1m theek, bike: 5m better — kam spam
//         interval: 1000, // har 2 sec update — animation complete hone ka time milta hai
//         fastestInterval: 1000,
//         showLocationDialog: true,
//         forceRequestLocation: true,
//       },
//     );

//     return () => {
//       Geolocation.clearWatch(watchId);
//     };
//   }, []);

//   const sendOTP = async () => {
//     try {
//       setLoading(true);

//       console.log(
//         'Fetching dashboard data with token:',
//         GlobalLoginAuth.refreshToken,
//       );

//       const response = await fetch(
//         `${GlobalApi.baseUrl}api/deliveries/me/orders/${orderDetail?.order.id}/send-otp`,

//         {
//           method: 'POST',

//           headers: {
//             'Content-Type': 'application/json',

//             Authorization: `Bearer ${GlobalLoginAuth.accessToken}`,
//           },
//         },
//       );

//       const result = await response.json();

//       const SendOtpResponse = result as SendOtpResponse; // âœ… Type assertion to ensure it matches our model

//       console.log('Generate OTP Response:', result);

//       if (!response.ok) {
//         Alert.alert('FoodyPly', result.message || 'Failed to load dashboard');

//         return;
//       }

//       if (SendOtpResponse.success) {
//         console.log('OTP sent successfully:', SendOtpResponse.data.otp);

//         navigation.navigate('DeliveryOtpVerification', {
//           orderDetail: orderDetail,
//           otp: SendOtpResponse.data.otp,
//         });
//       }
//     } catch (error) {
//       console.log(error);

//       Alert.alert('FoodyPly', 'Unable to connect to server');
//     } finally {
//       setLoading(false);
//     }
//   };

//   // ─── BEARING → ICON FLIP LOGIC ─────────────────────────────────────────────
//   // PNG image naturally faces RIGHT (east = 90°).
//   // Jab rider right side (0°–180°) mein chal raha ho → normal image
//   // Jab rider left side (180°–360°) mein chal raha ho → scaleX: -1 (mirror)
//   // Is tarah image kabhi ulta nahi dikhega — sirf flip hogi
//   const isMovingLeft = markerHeading > 180 && markerHeading <= 360;

//   // useEffect(() => {
//   //   if (routeCoordinates.length < 2) return;

//   //   let segmentIndex = 0;
//   //   let segmentProgress = 0;
//   //   let lastTimestamp: number | null = null;
//   //   let animFrameId: number;

//   //   const STEPS_PER_SECOND = 5; // ← isko tune karo (kam = slow, zyada = fast)
//   //   const PROGRESS_PER_STEP = 1 / STEPS_PER_SECOND;

//   //   const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

//   //   const animate = (timestamp: number) => {
//   //     if (lastTimestamp === null) lastTimestamp = timestamp;

//   //     const deltaMs = timestamp - lastTimestamp;
//   //     const elapsedSeconds = deltaMs / 1000;
//   //     lastTimestamp = timestamp;

//   //     const current = routeCoordinates[segmentIndex];
//   //     const next = routeCoordinates[segmentIndex + 1];

//   //     if (!current || !next) return;

//   //     // Har second mein STEPS_PER_SECOND steps
//   //     const progressDelta =
//   //       PROGRESS_PER_STEP * (elapsedSeconds * STEPS_PER_SECOND);
//   //     segmentProgress = Math.min(segmentProgress + progressDelta, 1);

//   //     const lat = lerp(current[1], next[1], segmentProgress);
//   //     const lon = lerp(current[0], next[0], segmentProgress);

//   //     const bearing = calculateBearing(
//   //       current[1],
//   //       current[0],
//   //       next[1],
//   //       next[0],
//   //     );

//   //     setMarkerHeading(bearing);
//   //     setCameraHeading(bearing);
//   //     setRiderPosition({ latitude: lat, longitude: lon });

//   //     if (segmentProgress >= 1) {
//   //       segmentIndex++;
//   //       segmentProgress = 0;
//   //       setRemainingRoute(routeCoordinates.slice(segmentIndex));

//   //       if (segmentIndex >= routeCoordinates.length - 1) return;
//   //     }

//   //     animFrameId = requestAnimationFrame(animate);
//   //   };

//   //   animFrameId = requestAnimationFrame(animate);
//   //   return () => cancelAnimationFrame(animFrameId);
//   // }, [routeCoordinates]);

//   return (
//     <View style={styles.container}>
//       <GlobalTopBarDelivery
//         navigation={navigation}
//         notificationClick={() => {}}
//         text="Start Delivery"
//         subtitleText={`#${orderDetail?.order.orderNumber}`}
//         isBackVisible={true}
//         isOnlineVisible={false}
//       />

//       <View style={styles.overlay}>
//         <View style={styles.card}>
//           <View style={styles.mapContainer}>
//             <Map
//               style={styles.map}
//               mapStyle={OSM_STYLE}
//               logo={false}
//               compass={false}
//               onTouchStart={() => {
//                 // User ne map touch kiya — free camera mode ON
//                 userInteractingRef.current = true;
//                 setIsFollowingRider(false);

//                 // Pehla timer clear karo
//                 if (interactionTimerRef.current) {
//                   clearTimeout(interactionTimerRef.current);
//                 }
//               }}
//             >
//               {/* CAMERA */}
//               {riderPosition && isFollowingRider && (
//                 <Camera
//                   zoom={18}
//                   pitch={0}
//                   bearing={cameraHeading}
//                   center={[riderPosition.longitude, riderPosition.latitude]}
//                   animationMode="none"
//                   animationDuration={0}
//                   padding={{
//                     top: 100,
//                     bottom: 300,
//                     left: 0,
//                     right: 0,
//                   }}
//                 />
//               )}

//               {/* DELIVERY BOY MARKER */}
//               {riderPosition && (
//                 <Marker
//                   anchor="center"
//                   lngLat={[riderPosition.longitude, riderPosition.latitude]}
//                 >
//                   <View
//                     style={[
//                       styles.currentMarkerWrapper,
//                       // {
//                       //   transform: [
//                       //     {
//                       //       rotate: `${markerHeading+65}deg`,
//                       //     },
//                       //   ],
//                       // },
//                     ]}
//                   >
//                     <Image
//                       source={require('../assets/images/delivery-foodyply-rider.png')}

//                       style={[
//                         styles.deliveryIcon,
//                         // { transform: [{ rotate: `${markerHeading}deg` }] },
//                          {
//                           // ✅ FIX: rotation band, sirf horizontal flip se direction handle
//                           // Image facing right (east) hai by default
//                           // Left jaate waqt mirror kar do — ulta nahi dikhega
//                           transform: [{ scaleX: isMovingLeft ? -1 : 1 }],
//                         },
//                       ]}
//                       resizeMode="contain"
//                     />
//                   </View>
//                 </Marker>
//               )}

//               {/* DESTINATION */}
//               <Marker
//                 anchor="center"
//                 lngLat={[
//                   destinationLocation.longitude,
//                   destinationLocation.latitude,
//                 ]}
//               >
//                 <View style={styles.destinationMarkerWrapper}>
//                   <View style={styles.destinationMarker} />
//                 </View>
//               </Marker>

//               {/* ROUTE */}
//               {routeCoordinates.length > 1 && (
//                 <GeoJSONSource
//                   id="routeSource"
//                   data={{
//                     type: 'FeatureCollection',
//                     features: [
//                       {
//                         type: 'Feature',
//                         properties: {},
//                         geometry: {
//                           type: 'LineString',
//                           coordinates: remainingRoute,
//                         },
//                       },
//                     ],
//                   }}
//                 >
//                   {/* ROUTE SHADOW */}
//                   <Layer
//                     id="routeLayerBg"
//                     type="line"
//                     paint={{
//                       'line-color': '#0B3B2E',
//                       'line-width': 10,
//                       'line-opacity': 0.7,
//                     }}
//                     layout={{
//                       'line-cap': 'round',
//                       'line-join': 'round',
//                     }}
//                   />

//                   {/* MAIN ROUTE */}
//                   <Layer
//                     id="routeLayer"
//                     type="line"
//                     paint={{
//                       'line-color': '#00b7ff',
//                       'line-width': 6,
//                       'line-opacity': 1,
//                     }}
//                     layout={{
//                       'line-cap': 'round',
//                       'line-join': 'round',
//                     }}
//                   />
//                 </GeoJSONSource>
//               )}
//             </Map>

//             {!isFollowingRider && (
//               <TouchableOpacity
//                 activeOpacity={0.85}
//                 style={styles.reCenterBtn}
//                 onPress={() => {
//                   userInteractingRef.current = false;
//                   setIsFollowingRider(true);
//                 }}
//               >
//                 <Image
//                   source={require('../assets/images/map-point.png')}
//                   style={styles.mapPoint}
//                 />
//                 {/* <Text style={styles.reCenterText}>Re-center</Text> */}
//               </TouchableOpacity>
//             )}

//             {/* FLOATING CARD */}
//             {showDetailsCard ? (
//               <View style={styles.card1}>
//                 {/* USER INFO */}
//                 <View style={styles.header}>
//                   <Image
//                     source={
//                       orderDetail?.customer?.profileImageUrl
//                         ? { uri: orderDetail.customer.profileImageUrl }
//                         : require('../assets/images/customer_image.png')
//                     }
//                     style={styles.avatar}
//                   />

//                   <View style={{ flex: 1 }}>
//                     <Text style={styles.name}>{orderDetail.customer.name}</Text>
//                     <Text style={styles.phone}>
//                       {orderDetail.customer.phone}
//                     </Text>
//                     <Text style={styles.address}>
//                       {orderDetail.customer.address.fullText}
//                     </Text>
//                   </View>

//                   <View style={styles.iconColumn}>
//                     <TouchableOpacity style={styles.circleBtn}>
//                       <Image
//                         source={require('../assets/images/call.png')}
//                         style={styles.smallIcon}
//                       />
//                     </TouchableOpacity>
//                   </View>
//                 </View>

//                 {/* ORDER INFO */}
//                 <View style={styles.orderRow}>
//                   <View
//                     style={{
//                       flexDirection: 'row',
//                       alignItems: 'center',
//                       gap: 5,
//                     }}
//                   >
//                     <Image
//                       source={require('../assets/images/shopping_bag.png')}
//                       style={styles.smallIconOrange}
//                     />

//                     <View>
//                       <Text style={styles.smallLabel}>
//                         {orderDetail.items.length} Items •{' '}
//                         {orderDetail.items.reduce(
//                           (acc, item) => acc + item.quantity,
//                           0,
//                         )}{' '}
//                         Qty
//                       </Text>
//                       <View
//                         style={{
//                           flexDirection: 'row',
//                           alignItems: 'center',
//                           gap: 4,
//                           marginTop: 2,
//                         }}
//                       >
//                         <Text style={styles.smallLabel}>Payment Status</Text>
//                         <View style={styles.codBadge}>
//                           <Text style={styles.codText}>
//                             {orderDetail.billing.paymentStatus}
//                           </Text>
//                         </View>
//                       </View>
//                     </View>
//                   </View>
//                   <View>
//                     <Text style={styles.smallLabel}>Order Amount</Text>
//                     <Text style={styles.amount}>
//                       ₹{orderDetail.billing.finalAmount.toFixed(2)}
//                     </Text>
//                   </View>
//                 </View>

//                 {/* LIVE STATUS */}
//                 <View style={styles.liveBox}>
//                   <View style={styles.iconCircle}>
//                     <Image
//                       source={require('../assets/images/scooter.png')}
//                       style={styles.bikeIcon}
//                     />
//                   </View>
//                   <View style={{ marginLeft: 10 }}>
//                     <Text style={styles.liveTitle}>Live Status</Text>
//                     <Text style={styles.liveText}>
//                       You are on the way to the customer
//                     </Text>
//                   </View>
//                 </View>

//                 {/* PROGRESS */}
//                 <View style={{ marginTop: 20 }}>
//                   <Text style={styles.progressTitle}>Order Progress</Text>

//                   <View style={styles.progressRow}>
//                     {[
//                       'Assigned',
//                       'Accepted',
//                       'Picked',
//                       'On The Way',
//                       'Delivered',
//                     ].map((item, index) => {
//                       const isActive = index <= 3;
//                       const isOnWay = item === 'On The Way';

//                       return (
//                         <View key={index} style={styles.stepContainer}>
//                           <View
//                             style={[
//                               styles.stepCircle,
//                               isActive && styles.activeStep,

//                               // LIGHT ORANGE BACKGROUND FOR ON WAY
//                               isOnWay && styles.onWayStep,
//                             ]}
//                           >
//                             {isOnWay ? (
//                               <Image
//                                 source={require('../assets/images/scooter.png')}
//                                 style={styles.scooterIcon}
//                               />
//                             ) : (
//                               <Image
//                                 source={require('../assets/images/check.png')}
//                                 style={[
//                                   styles.checkIcon,
//                                   {
//                                     tintColor: isActive
//                                       ? Colors.primary
//                                       : '#bbb',
//                                   },
//                                 ]}
//                               />
//                             )}
//                           </View>

//                           <Text style={styles.stepText}>{item}</Text>

//                           {index !== 4 && (
//                             <View
//                               style={[
//                                 styles.line,
//                                 index < 3 && styles.activeLine,
//                               ]}
//                             />
//                           )}
//                         </View>
//                       );
//                     })}
//                   </View>
//                 </View>

//                 {/* BUTTONS */}
//                 <View style={styles.buttonRow}>
//                   <TouchableOpacity
//                     style={styles.mapBtn}
//                     onPress={() => setShowDetailsCard(false)}
//                   >
//                     <Text style={styles.mapBtnText}>Open in Maps</Text>
//                   </TouchableOpacity>

//                   <TouchableOpacity
//                     style={styles.deliverBtn}
//                     onPress={() => sendOTP()}
//                   >
//                     <Text style={styles.deliverBtnText}>Order Delivered</Text>
//                   </TouchableOpacity>
//                 </View>
//               </View>
//             ) : (
//               <TouchableOpacity
//                 activeOpacity={0.8}
//                 style={styles.floatingShowButton}
//                 onPress={() => setShowDetailsCard(true)}
//               >
//                 <Image
//                   source={require('../assets/images/shopping_bag.png')}
//                   style={styles.floatingArrow}
//                 />
//               </TouchableOpacity>
//             )}
//           </View>
//         </View>
//       </View>
//       <GlobalLoader visible={loading} />
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: Colors.primary,
//     paddingTop: 100,
//   },

//   overlay: {
//     flex: 1,
//     borderTopLeftRadius: 30,
//     borderTopRightRadius: 30,
//     marginTop: 20,
//   },

//   card: {
//     backgroundColor: '#fff',
//     borderTopLeftRadius: 20,
//     borderTopRightRadius: 20,
//     flex: 1,
//   },

//   mapContainer: {
//     flex: 1,
//     borderTopLeftRadius: 20,
//     borderTopRightRadius: 20,
//     overflow: 'hidden',
//   },

//   map: {
//     flex: 1,
//   },

//   currentMarkerWrapper: {
//     width: 44,
//     height: 44,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },

//   deliveryIcon: {
//     width: 60,
//     height: 60,

//     // REMOVE THIS IF IMAGE ALREADY ORANGE
//     // tintColor: Colors.primary,
//   },

//   destinationMarkerWrapper: {
//     width: 30,
//     height: 30,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },

//   destinationMarker: {
//     width: 18,
//     height: 18,
//     borderRadius: 9,
//     backgroundColor: 'red',
//     borderWidth: 3,
//     borderColor: '#fff',
//   },
//   card1: {
//     position: 'absolute',
//     bottom: 20,
//     left: 15,
//     right: 15,
//     backgroundColor: '#fff',
//     borderRadius: 25,
//     padding: 18,

//     shadowColor: '#000',
//     shadowOpacity: 0.15,
//     shadowRadius: 10,
//     shadowOffset: {
//       width: 0,
//       height: 5,
//     },
//     elevation: 8,
//   },

//   header: {
//     flexDirection: 'row',
//     alignItems: 'flex-start',
//     justifyContent: 'space-between',
//   },

//   avatar: {
//     width: 60,
//     height: 60,
//     borderRadius: 20,
//     marginRight: 12,
//   },
//   mapPoint: {
//     width: 20,
//     height: 20,
//   },

//   name: {
//     fontSize: 18,
//     fontFamily: FontFamily.medium,
//     color: Colors.textColor,
//   },

//   phone: {
//     color: Colors.textBrown,
//     fontFamily: FontFamily.regular,
//     marginTop: 2,
//     fontSize: 12,
//   },

//   address: {
//     color: Colors.textBrown,
//     marginTop: 2,
//     fontSize: 12,
//     fontFamily: FontFamily.regular,
//   },

//   iconColumn: {
//     gap: 0,
//   },

//   circleBtn: {
//     width: 38,
//     height: 38,
//     borderRadius: 19,
//     backgroundColor: '#7bc043',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },

//   orderRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     marginTop: 20,
//   },

//   smallLabel: {
//     color: Colors.textBrown,
//     fontSize: 14,
//     fontFamily: FontFamily.regular,
//   },

//   boldText: {
//     fontFamily: FontFamily.bold,
//     marginTop: 2,
//     fontSize: 14,
//   },

//   amount: {
//     color: Colors.primary,
//     fontSize: 18,
//     fontFamily: FontFamily.regular,
//     marginTop: 2,
//   },

//   liveBox: {
//     flexDirection: 'row',
//     backgroundColor: '#FEF6F3',
//     padding: 6,
//     borderRadius: 10,
//     marginTop: 18,
//     alignItems: 'center',
//   },

//   liveTitle: {
//     color: Colors.textColor,
//     fontFamily: FontFamily.medium,
//   },

//   liveText: {
//     color: Colors.textBrown,
//     marginTop: 3,
//     fontSize: 12,
//     fontFamily: FontFamily.regular,
//   },

//   progressTitle: {
//     fontFamily: FontFamily.medium,
//     marginBottom: 15,
//     color: Colors.textColor,
//   },

//   progressRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//   },

//   stepContainer: {
//     alignItems: 'center',
//     flex: 1,
//     position: 'relative',
//     justifyContent: 'flex-start',
//   },

//   stepCircle: {
//     width: 30,
//     height: 30,
//     borderRadius: 15,
//     backgroundColor: '#e5e5e5',
//     justifyContent: 'center',
//     alignItems: 'center',
//     zIndex: 2,
//   },
//   activeStep: {
//     backgroundColor: Colors.lightOrange,
//   },

//   line: {
//     position: 'absolute',
//     top: 12,
//     left: '50%',
//     width: '100%',
//     height: 3,
//     backgroundColor: '#ddd',
//     zIndex: 1,
//   },

//   activeLine: {
//     backgroundColor: Colors.primary,
//   },

//   stepText: {
//     fontSize: 10,
//     marginTop: 10,
//     color: Colors.textBrown,
//     textAlign: 'center',
//     fontFamily: FontFamily.regular,
//   },

//   buttonRow: {
//     flexDirection: 'row',
//     marginTop: 25,
//     gap: 12,
//   },

//   mapBtn: {
//     flex: 1,
//     backgroundColor: Colors.buttonLight,
//     paddingVertical: 14,
//     borderRadius: 14,
//     alignItems: 'center',
//   },

//   deliverBtn: {
//     flex: 1,
//     backgroundColor: Colors.primary,
//     paddingVertical: 14,
//     borderRadius: 14,
//     alignItems: 'center',
//   },

//   mapBtnText: {
//     color: Colors.primary,
//     fontFamily: FontFamily.regular,
//     fontSize: 16,
//   },

//   deliverBtnText: {
//     color: '#fff',
//     fontFamily: FontFamily.regular,
//     fontSize: 16,
//   },

//   smallIcon: {
//     width: 18,
//     height: 18,
//     tintColor: '#fff',
//   },

//   smallIconOrange: {
//     width: 30,
//     height: 30,
//     tintColor: Colors.primary,
//   },

//   bikeIcon: {
//     width: 24,
//     height: 24,
//     tintColor: Colors.primary,
//   },

//   checkIcon: {
//     width: 16,
//     height: 16,
//   },
//   iconCircle: {
//     width: 60,
//     height: 60,
//     borderRadius: 30,
//     backgroundColor: Colors.lightOrange,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   codBadge: {
//     backgroundColor: Colors.lightBackground,
//     paddingHorizontal: 8,
//     paddingVertical: 3,
//     borderRadius: 20,
//     marginLeft: 2,
//   },

//   codText: {
//     color: Colors.primary,
//     fontSize: 12,
//     fontFamily: FontFamily.semiBold,
//   },
//   onWayStep: {
//     width: 30,
//     height: 30,
//     borderRadius: 15,
//     backgroundColor: Colors.lightOrange,

//     justifyContent: 'center',
//     alignItems: 'center',

//     zIndex: 3,
//   },

//   scooterIcon: {
//     width: 20,
//     height: 20,
//     tintColor: Colors.primary,
//   },
//   hideButton: {
//     width: 32,
//     height: 32,
//     borderRadius: 16,
//     backgroundColor: '#F5F5F5',
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginLeft: 10,
//   },

//   hideIcon: {
//     width: 16,
//     height: 16,
//     tintColor: Colors.textColor,
//   },

//   floatingShowButton: {
//     position: 'absolute',
//     bottom: 30,
//     right: 20,
//     width: 40,
//     height: 40,
//     borderRadius: 20,

//     backgroundColor: Colors.primary,

//     justifyContent: 'center',
//     alignItems: 'center',

//     shadowColor: '#000',
//     shadowOpacity: 0.2,
//     shadowRadius: 8,
//     shadowOffset: {
//       width: 0,
//       height: 4,
//     },

//     elevation: 10,
//   },

//   floatingArrow: {
//     width: 24,
//     height: 24,
//     tintColor: '#fff',
//   },

//   // RE-CENTER BUTTON
//   reCenterBtn: {
//     position: 'absolute',
//     top: 16,
//     right: 16,
//     backgroundColor: '#fff',
//     paddingHorizontal: 14,
//     paddingVertical: 8,
//     borderRadius: 20,
//     shadowColor: '#000',
//     shadowOpacity: 0.2,
//     shadowRadius: 6,
//     shadowOffset: { width: 0, height: 3 },
//     elevation: 8,
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 4,
//   },

//   reCenterText: {
//     color: Colors.primary,
//     fontSize: 13,
//     fontFamily: FontFamily.semiBold,
//   },
// });

// re-routing 2

// import React, { useEffect, useState, useRef } from 'react';
// import {
//   View,
//   StyleSheet,
//   PermissionsAndroid,
//   Platform,
//   Image,
//   Text,
//   TouchableOpacity,
//   ToastAndroid,
//   Alert,
// } from 'react-native';

// import {
//   Map,
//   Camera,
//   Marker,
//   GeoJSONSource,
//   Layer,
// } from '@maplibre/maplibre-react-native';

// import Geolocation from 'react-native-geolocation-service';
// import axios from 'axios';

// import Colors from '../assets/Colors/Colors';
// import GlobalTopBarDelivery from '../GlobalContainer/GlobalTopBarDelivery';
// import { DeliveryOrderDetails } from '../Models/DeliveryOrderDetails/DeliveryOrderDetails';
// import { FontFamily } from '../assets/GlobalFont/GlobalFont';
// import GlobalLoginAuth from '../GlobalContainer/GlobalLoginAuth';
// import GlobalApi from '../GlobalContainer/GlobalApi';
// import GlobalLoader from '../GlobalContainer/GlobalLoader';
// import { SendOtpResponse } from '../Models/SendOTP/SendOtpResponse ';

// const DARK_MAP_STYLE =
//   'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

// export default function DeliveryStart({ route, navigation }: any) {
//   const {
//     orderDetail,
//   }: {
//     orderDetail: DeliveryOrderDetails;
//   } = route.params;

//   const [showDetailsCard, setShowDetailsCard] = useState(true);
//   const lastSnappedIndexRef = useRef(-1);
//   // DESTINATION
//   const [destinationLocation] = useState({
//     latitude: orderDetail.customer.address.latitude || 22.8948,

//     longitude: orderDetail.customer.address.longitude || 88.41,
//   });

//   // CURRENT LOCATION
//   const [currentLocation, setCurrentLocation] = useState<{
//     latitude: number;
//     longitude: number;
//   } | null>(null);

//   // ROUTE
//   const [routeCoordinates, setRouteCoordinates] = useState<any[]>([]);
//   const routeCoordinatesRef = useRef<any[]>([]);
//   const [remainingRoute, setRemainingRoute] = useState<any[]>([]);
//   const headingRef = useRef(0);
//   const cameraHeadingRef = useRef(0);
//   const markerAnimationRef = useRef<any>(null);   // cancel old animation before new one
//   const headingAnimationRef = useRef<any>(null);  // cancel old heading animation
//   const riderPositionRef = useRef<{ latitude: number; longitude: number } | null>(null); // always fresh position
//   const lastAnimatedBearingRef = useRef<number>(-1); // last bearing jo animate hua — dobara same pe na karo

//   // FREE CAMERA MODE — jab user zoom/pan kare to rider follow band ho jaye
//   const [isFollowingRider, setIsFollowingRider] = useState(true);
//   const userInteractingRef = useRef(false);
//   const interactionTimerRef = useRef<any>(null);
//   const [riderPosition, setRiderPosition] = useState<{
//     latitude: number;
//     longitude: number;
//   } | null>(null);
//   // CAMERA HEADING
//   const [cameraHeading, setCameraHeading] = useState(0);

//   // SCOOTER HEADING
//   const [markerHeading, setMarkerHeading] = useState(0);
//   const [loading, setLoading] = useState(false);

//   const [locationHistory, setLocationHistory] = useState<
//     { latitude: number; longitude: number }[]
//   >([]);
//   // PREVIOUS LOCATION
//   const previousCoordinateRef = useRef<{
//     latitude: number;
//     longitude: number;
//   } | null>(null);

//   // REQUEST LOCATION PERMISSION
//   const requestLocationPermission = async () => {
//     if (Platform.OS === 'android') {
//       const granted = await PermissionsAndroid.request(
//         PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
//       );

//       if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
//         console.log('Location permission denied');
//       }
//     }
//   };

//   const calculateBearing = (
//     startLat: number,

//     startLng: number,

//     endLat: number,

//     endLng: number,
//   ) => {
//     const dLon = ((endLng - startLng) * Math.PI) / 180;

//     const y = Math.sin(dLon) * Math.cos((endLat * Math.PI) / 180);

//     const x =
//       Math.cos((startLat * Math.PI) / 180) *
//         Math.sin((endLat * Math.PI) / 180) -
//       Math.sin((startLat * Math.PI) / 180) *
//         Math.cos((endLat * Math.PI) / 180) *
//         Math.cos(dLon);

//     const brng = (Math.atan2(y, x) * 180) / Math.PI;

//     return (brng + 360) % 360;
//   };

//   // DISTANCE BETWEEN TWO POINTS
//   const getDistance = (
//     lat1: number,
//     lon1: number,
//     lat2: number,
//     lon2: number,
//   ) => {
//     const R = 6371e3;

//     const φ1 = (lat1 * Math.PI) / 180;
//     const φ2 = (lat2 * Math.PI) / 180;

//     const Δφ = ((lat2 - lat1) * Math.PI) / 180;

//     const Δλ = ((lon2 - lon1) * Math.PI) / 180;

//     const a =
//       Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
//       Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

//     const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

//     return R * c;
//   };

//   const getProjectedPointOnSegment = (
//     lat: number,
//     lng: number,
//     startLat: number,
//     startLng: number,
//     endLat: number,
//     endLng: number,
//   ) => {
//     const dx = endLng - startLng;
//     const dy = endLat - startLat;

//     const lengthSquared = dx * dx + dy * dy;

//     if (lengthSquared === 0) {
//       return {
//         latitude: startLat,
//         longitude: startLng,
//         t: 0,
//       };
//     }

//     let t = ((lng - startLng) * dx + (lat - startLat) * dy) / lengthSquared;

//     t = Math.max(0, Math.min(1, t));

//     return {
//       latitude: startLat + t * dy,
//       longitude: startLng + t * dx,
//       t,
//     };
//   };

//   const getNearestPointOnRoute = (
//     latitude: number,
//     longitude: number,
//     route: any[],
//   ) => {
//     if (route.length < 2) {
//       return null;
//     }

//     let minDistance = Infinity;

//     let nearestIndex = 0;

//     let projectedPoint: any = null;

//     for (let i = 0; i < route.length - 1; i++) {
//       const start = route[i];
//       const end = route[i + 1];

//       const projected = getProjectedPointOnSegment(
//         latitude,
//         longitude,
//         start[1],
//         start[0],
//         end[1],
//         end[0],
//       );

//       const distance = getDistance(
//         latitude,
//         longitude,
//         projected.latitude,
//         projected.longitude,
//       );

//       if (distance < minDistance) {
//         minDistance = distance;
//         nearestIndex = i;
//         projectedPoint = projected;
//       }
//     }

//     return {
//       index: nearestIndex,
//       distance: minDistance,
//       point: projectedPoint,
//     };
//   };
//   // ROUTE API
//   const getRoute = async (
//     startLat: number,
//     startLng: number,
//     endLat: number,
//     endLng: number,
//   ) => {
//     try {
//       const response = await axios.get(
//         `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`,
//       );

//       if (
//         response.data &&
//         response.data.routes &&
//         response.data.routes.length > 0
//       ) {
//         const osrmCoordinates = response.data.routes[0].geometry.coordinates;

//         // Insert actual GPS as first point
//         const coordinates = [[startLng, startLat], ...osrmCoordinates];

//         for (let i = 0; i < 5; i++) {
//           const dist = getDistance(
//             coordinates[i][1],
//             coordinates[i][0],
//             coordinates[i + 1][1],
//             coordinates[i + 1][0],
//           );

//           console.log(`Distance ${i} -> ${i + 1}:`, dist);
//         }
//         setRouteCoordinates(coordinates);
//         routeCoordinatesRef.current = coordinates;

//         console.log('Route Length:', coordinates.length);

//         console.log('First Route Point:', coordinates[0]);

//         console.log('Start GPS:', startLat, startLng);

//         console.log(
//           'Distance Between Start And Route Point:',
//           getDistance(startLat, startLng, coordinates[0][1], coordinates[0][0]),
//         );

//         if (!riderPosition && coordinates.length > 0) {
//           const initialPos = {
//             latitude: coordinates[0][1],
//             longitude: coordinates[0][0],
//           };
//           riderPositionRef.current = initialPos;
//           setRiderPosition(initialPos);

//           lastSnappedIndexRef.current = 0;

//           setRemainingRoute(coordinates);
//         }
//       }
//     } catch (error) {
//       console.log('ROUTE ERROR', error);
//     }
//   };

//   // INITIAL LOCATION
//   const getCurrentLocation = async () => {
//     Geolocation.getCurrentPosition(
//       async position => {
//         const latitude = position.coords.latitude;

//         const longitude = position.coords.longitude;

//         setCurrentLocation({
//           latitude,
//           longitude,
//         });

//         previousCoordinateRef.current = {
//           latitude,
//           longitude,
//         };

//         await getRoute(
//           latitude,
//           longitude,
//           destinationLocation.latitude,
//           destinationLocation.longitude,
//         );
//       },

//       error => {
//         console.log(error);
//       },

//       {
//         enableHighAccuracy: true,
//         timeout: 15000,
//         maximumAge: 10000,
//       },
//     );
//   };

//   // LIVE TRACKING
//   useEffect(() => {
//     requestLocationPermission();

//     getCurrentLocation();

//     const animateMarker = (
//       startLat: number,
//       startLng: number,
//       endLat: number,
//       endLng: number,
//     ) => {
//       // CANCEL previous animation — nahi to purani aur nayi dono chalti hain
//       if (markerAnimationRef.current) {
//         clearInterval(markerAnimationRef.current);
//         markerAnimationRef.current = null;
//       }

//       // Bike fast ho to kam steps — marker peeche nahi rahega
//       const distance = Math.sqrt(
//         Math.pow(endLat - startLat, 2) + Math.pow(endLng - startLng, 2)
//       );// Fast movement = fewer steps (snap quickly), slow = more steps (smooth)

//       const steps = distance > 0.0005 ? 6 : 10; // ~55m threshold
//       let currentStep = 0;

//       const interval = setInterval(() => {
//         currentStep++;
//         const progress = currentStep / steps;
//         const newPos = {
//           latitude: startLat + (endLat - startLat) * progress,
//           longitude: startLng + (endLng - startLng) * progress,
//         };
//         riderPositionRef.current = newPos;
//         setRiderPosition(newPos);

//         if (currentStep >= steps) {
//           clearInterval(interval);
//           markerAnimationRef.current = null;
//         }
//       }, 50);

//       markerAnimationRef.current = interval;
//     };

//     // SMOOTH HEADING ANIMATION
//     const animateHeading = (fromBearing: number, toBearing: number) => {
//       // CANCEL previous heading animation
//       if (headingAnimationRef.current) {
//         clearInterval(headingAnimationRef.current);
//         headingAnimationRef.current = null;
//       }

//       let delta = toBearing - fromBearing;
//       if (delta > 180) delta -= 360;
//       if (delta < -180) delta += 360;

//       const steps = 15; // fast turn — heading peeche nahi rahegi
//       let currentStep = 0;

//       const interval = setInterval(() => {
//         currentStep++;
//         const progress = currentStep / steps;
//         const newHeading = (fromBearing + delta * progress + 360) % 360;
//         headingRef.current = newHeading;
//         setMarkerHeading(newHeading);
//         setCameraHeading(newHeading);
//         cameraHeadingRef.current = newHeading;

//         if (currentStep >= steps) {
//           clearInterval(interval);
//           headingAnimationRef.current = null;
//         }
//       }, 50);

//       headingAnimationRef.current = interval;
//     };
//     const watchId = Geolocation.watchPosition(
//       async position => {
//         const latitude = position.coords.latitude;

//         const longitude = position.coords.longitude;

//         const previous = previousCoordinateRef.current;

//         if (previous) {
//           const movedDistance = getDistance(
//             previous.latitude,
//             previous.longitude,
//             latitude,
//             longitude,
//           );

//           console.log('GPS Move Distance:', movedDistance);
//         }

//         // UPDATE LOCATION
//         setCurrentLocation({
//           latitude,
//           longitude,
//         });
//         // ARRAY ME STORE KARO
//         setLocationHistory(prev => {
//           const updated = [
//             ...prev,
//             {
//               latitude,
//               longitude,
//             },
//           ];

//           // // TOAST ME DIKHAO
//           // ToastAndroid.show(
//           //   JSON.stringify(updated),
//           //   ToastAndroid.SHORT,
//           // );

//           return updated;
//         });

//         const route = routeCoordinatesRef.current;

//         if (route.length < 2) {
//           return;
//         }
//         // CALCULATE HEADING
//         if (previous) {
//           const movedDistance = getDistance(
//             previous.latitude,
//             previous.longitude,
//             latitude,
//             longitude,
//           );
//           ToastAndroid.show(
//             `Rider moved: ${movedDistance.toFixed(1)} meter`,
//             ToastAndroid.SHORT,
//           );

//           console.log('GPS Move Distance:', movedDistance);
//           // if (movedDistance < 3) {
//           //   return;
//           // }
//           const route = routeCoordinatesRef.current;
//           if (route.length > 1) {
//             const snapped = getNearestPointOnRoute(latitude, longitude, route);

//             if (snapped) {
//               // riderPositionRef use karo — state stale hoti hai closure mein
//               if (riderPositionRef.current) {
//                 animateMarker(
//                   riderPositionRef.current.latitude,
//                   riderPositionRef.current.longitude,
//                   snapped.point.latitude,
//                   snapped.point.longitude,
//                 );
//               } else {
//                 const pos = {
//                   latitude: snapped.point.latitude,
//                   longitude: snapped.point.longitude,
//                 };
//                 riderPositionRef.current = pos;
//                 setRiderPosition(pos);
//               }

//               const currentMatchedPoint = [
//                 snapped.point.longitude,
//                 snapped.point.latitude,
//               ];

//               setRemainingRoute([
//                 currentMatchedPoint,
//                 ...route.slice(snapped.index + 1),
//               ]);

//               if (snapped.index !== lastSnappedIndexRef.current) {
//                 lastSnappedIndexRef.current = snapped.index;
//               }

//               if (snapped.index < route.length - 1) {
//                 const current = route[snapped.index];
//                 const next = route[snapped.index + 1];

//                 const routeBearing = calculateBearing(
//                   current[1],
//                   current[0],
//                   next[1],
//                   next[0],
//                 );

//                 const bearingDiff = Math.abs(routeBearing - headingRef.current);

//                 // 15° threshold — choti GPS jitter pe animate nahi hoga
//                 // lastAnimatedBearing check — same bearing pe dobara animate nahi hoga (vibration fix)
//                 const alreadyAnimated = Math.abs(routeBearing - lastAnimatedBearingRef.current) < 5;

//                 if (bearingDiff > 15 && !alreadyAnimated) {
//                   lastAnimatedBearingRef.current = routeBearing;
//                   animateHeading(headingRef.current, routeBearing);
//                 }
//               }
//             }
//           }
//         }

//         previousCoordinateRef.current = {
//           latitude,
//           longitude,
//         };
//       },

//       error => {
//         console.log(error);
//       },

//       {
//         enableHighAccuracy: true,
//         distanceFilter: 1,       // walk: 1m theek, bike: 5m better — kam spam
//         interval: 1000,          // har 2 sec update — animation complete hone ka time milta hai
//         fastestInterval: 1000,
//         showLocationDialog: true,
//         forceRequestLocation: true,
//       },
//     );

//     return () => {
//       Geolocation.clearWatch(watchId);
//     };
//   }, []);

//   const sendOTP = async () => {
//     try {
//       setLoading(true);

//       console.log(
//         'Fetching dashboard data with token:',
//         GlobalLoginAuth.refreshToken,
//       );

//       const response = await fetch(
//         `${GlobalApi.baseUrl}api/deliveries/me/orders/${orderDetail?.order.id}/send-otp`,

//         {
//           method: 'POST',

//           headers: {
//             'Content-Type': 'application/json',

//             Authorization: `Bearer ${GlobalLoginAuth.accessToken}`,
//           },
//         },
//       );

//       const result = await response.json();

//       const SendOtpResponse = result as SendOtpResponse; // âœ… Type assertion to ensure it matches our model

//       console.log('Generate OTP Response:', result);

//       if (!response.ok) {
//         Alert.alert('FoodyPly', result.message || 'Failed to load dashboard');

//         return;
//       }

//       if (SendOtpResponse.success) {
//         console.log('OTP sent successfully:', SendOtpResponse.data.otp);

//         navigation.navigate('DeliveryOtpVerification', {
//           orderDetail: orderDetail,
//           otp: SendOtpResponse.data.otp,
//         });
//       }
//     } catch (error) {
//       console.log(error);

//       Alert.alert('FoodyPly', 'Unable to connect to server');
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <View style={styles.container}>
//       <GlobalTopBarDelivery
//         navigation={navigation}
//         notificationClick={() => {}}
//         text="Start Delivery"
//         subtitleText={`#${orderDetail?.order.orderNumber}`}
//         isBackVisible={true}
//         isOnlineVisible={false}
//       />

//       <View style={styles.overlay}>
//         <View style={styles.card}>
//           <View style={styles.mapContainer}>
//             <Map
//               style={styles.map}
//               mapStyle={DARK_MAP_STYLE}
//               logo={false}
//               onTouchStart={() => {
//                 // User ne map touch kiya — free camera mode ON
//                 userInteractingRef.current = true;
//                 setIsFollowingRider(false);

//                 // Pehla timer clear karo
//                 if (interactionTimerRef.current) {
//                   clearTimeout(interactionTimerRef.current);
//                 }
//               }}
//             compass={false}
//             >
//               {/* CAMERA — sirf follow mode mein rider ke saath move karo */}
//               {riderPosition && isFollowingRider && (
//                 <Camera
//                   zoom={18}
//                   pitch={0}
//                   bearing={cameraHeading}
//                   center={[riderPosition.longitude, riderPosition.latitude]}
//                   animationMode="none"
//                   animationDuration={0}
//                   padding={{
//                     top: 100,
//                     bottom: 300,
//                     left: 0,
//                     right: 0,
//                   }}
//                 />
//               )}

//               {/* DELIVERY BOY MARKER */}
//               {riderPosition && (
//                 <Marker
//                   anchor="center"
//                   lngLat={[riderPosition.longitude, riderPosition.latitude]}
//                 >
//                   <View
//                     style={[
//                       styles.currentMarkerWrapper,
//                       {
//                         // transform: [
//                         //   {
//                         //     rotate: `${markerHeading}deg`,
//                         //   },
//                         // ],
//                       },
//                     ]}
//                   >
//                     <Image
//                       source={require('../assets/images/dman.png')}
//                       style={styles.deliveryIcon}
//                       resizeMode="contain"
//                     />
//                   </View>
//                 </Marker>
//               )}

//               {/* DESTINATION */}
//               <Marker
//                 anchor="center"
//                 lngLat={[
//                   destinationLocation.longitude,
//                   destinationLocation.latitude,
//                 ]}
//               >
//                 <View style={styles.destinationMarkerWrapper}>
//                   <View style={styles.destinationMarker} />
//                 </View>
//               </Marker>

//               {/* ROUTE */}
//               {routeCoordinates.length > 1 && (
//                 <GeoJSONSource
//                   id="routeSource"
//                   data={{
//                     type: 'FeatureCollection',
//                     features: [
//                       {
//                         type: 'Feature',
//                         properties: {},
//                         geometry: {
//                           type: 'LineString',
//                           coordinates: remainingRoute,
//                         },
//                       },
//                     ],
//                   }}
//                 >
//                   {/* ROUTE SHADOW */}
//                   <Layer
//                     id="routeLayerBg"
//                     type="line"
//                     paint={{
//                       'line-color': '#0B3B2E',
//                       'line-width': 10,
//                       'line-opacity': 0.7,
//                     }}
//                     layout={{
//                       'line-cap': 'round',
//                       'line-join': 'round',
//                     }}
//                   />

//                   {/* MAIN ROUTE */}
//                   <Layer
//                     id="routeLayer"
//                     type="line"
//                     paint={{
//                       'line-color': '#00FF9D',
//                       'line-width': 6,
//                       'line-opacity': 1,
//                     }}
//                     layout={{
//                       'line-cap': 'round',
//                       'line-join': 'round',
//                     }}
//                   />
//                 </GeoJSONSource>
//               )}
//             </Map>

//             {!isFollowingRider && (
//               <TouchableOpacity
//                 activeOpacity={0.85}
//                 style={styles.reCenterBtn}
//                 onPress={() => {
//                   userInteractingRef.current = false;
//                   setIsFollowingRider(true);
//                 }}
//               >
//                 <Image
//                     source={

//                       require('../assets/images/map-point.png')
//                     }
//                     style={styles.mapPoint}
//                   />
//                 {/* <Text style={styles.reCenterText}>Re-center</Text> */}
//               </TouchableOpacity>
//             )}

//             {/* FLOATING CARD */}
//             {showDetailsCard ? (
//               <View style={styles.card1}>
//                 {/* USER INFO */}
//                 <View style={styles.header}>
//                   <Image
//                     source={
//                       orderDetail?.customer?.profileImageUrl
//                         ? { uri: orderDetail.customer.profileImageUrl }
//                         : require('../assets/images/customer_image.png')
//                     }
//                     style={styles.avatar}
//                   />

//                   <View style={{ flex: 1 }}>
//                     <Text style={styles.name}>{orderDetail.customer.name}</Text>
//                     <Text style={styles.phone}>
//                       {orderDetail.customer.phone}
//                     </Text>
//                     <Text style={styles.address}>
//                       {orderDetail.customer.address.fullText}
//                     </Text>
//                   </View>

//                   <View style={styles.iconColumn}>
//                     <TouchableOpacity style={styles.circleBtn}>
//                       <Image
//                         source={require('../assets/images/call.png')}
//                         style={styles.smallIcon}
//                       />
//                     </TouchableOpacity>
//                   </View>
//                 </View>

//                 {/* ORDER INFO */}
//                 <View style={styles.orderRow}>
//                   <View
//                     style={{
//                       flexDirection: 'row',
//                       alignItems: 'center',
//                       gap: 5,
//                     }}
//                   >
//                     <Image
//                       source={require('../assets/images/shopping_bag.png')}
//                       style={styles.smallIconOrange}
//                     />

//                     <View>
//                       <Text style={styles.smallLabel}>
//                         {orderDetail.items.length} Items •{' '}
//                         {orderDetail.items.reduce(
//                           (acc, item) => acc + item.quantity,
//                           0,
//                         )}{' '}
//                         Qty
//                       </Text>
//                       <View
//                         style={{
//                           flexDirection: 'row',
//                           alignItems: 'center',
//                           gap: 4,
//                           marginTop: 2,
//                         }}
//                       >
//                         <Text style={styles.smallLabel}>Payment Status</Text>
//                         <View style={styles.codBadge}>
//                           <Text style={styles.codText}>
//                             {orderDetail.billing.paymentStatus}
//                           </Text>
//                         </View>
//                       </View>
//                     </View>
//                   </View>
//                   <View>
//                     <Text style={styles.smallLabel}>Order Amount</Text>
//                     <Text style={styles.amount}>
//                       ₹{orderDetail.billing.finalAmount.toFixed(2)}
//                     </Text>
//                   </View>
//                 </View>

//                 {/* LIVE STATUS */}
//                 <View style={styles.liveBox}>
//                   <View style={styles.iconCircle}>
//                     <Image
//                       source={require('../assets/images/scooter.png')}
//                       style={styles.bikeIcon}
//                     />
//                   </View>
//                   <View style={{ marginLeft: 10 }}>
//                     <Text style={styles.liveTitle}>Live Status</Text>
//                     <Text style={styles.liveText}>
//                       You are on the way to the customer
//                     </Text>
//                   </View>
//                 </View>

//                 {/* PROGRESS */}
//                 <View style={{ marginTop: 20 }}>
//                   <Text style={styles.progressTitle}>Order Progress</Text>

//                   <View style={styles.progressRow}>
//                     {[
//                       'Assigned',
//                       'Accepted',
//                       'Picked',
//                       'On The Way',
//                       'Delivered',
//                     ].map((item, index) => {
//                       const isActive = index <= 3;
//                       const isOnWay = item === 'On The Way';

//                       return (
//                         <View key={index} style={styles.stepContainer}>
//                           <View
//                             style={[
//                               styles.stepCircle,
//                               isActive && styles.activeStep,

//                               // LIGHT ORANGE BACKGROUND FOR ON WAY
//                               isOnWay && styles.onWayStep,
//                             ]}
//                           >
//                             {isOnWay ? (
//                               <Image
//                                 source={require('../assets/images/scooter.png')}
//                                 style={styles.scooterIcon}
//                               />
//                             ) : (
//                               <Image
//                                 source={require('../assets/images/check.png')}
//                                 style={[
//                                   styles.checkIcon,
//                                   {
//                                     tintColor: isActive
//                                       ? Colors.primary
//                                       : '#bbb',
//                                   },
//                                 ]}
//                               />
//                             )}
//                           </View>

//                           <Text style={styles.stepText}>{item}</Text>

//                           {index !== 4 && (
//                             <View
//                               style={[
//                                 styles.line,
//                                 index < 3 && styles.activeLine,
//                               ]}
//                             />
//                           )}
//                         </View>
//                       );
//                     })}
//                   </View>
//                 </View>

//                 {/* BUTTONS */}
//                 <View style={styles.buttonRow}>
//                   <TouchableOpacity
//                     style={styles.mapBtn}
//                     onPress={() => setShowDetailsCard(false)}
//                   >
//                     <Text style={styles.mapBtnText}>Open in Maps</Text>
//                   </TouchableOpacity>

//                   <TouchableOpacity
//                     style={styles.deliverBtn}
//                     onPress={() => sendOTP()}
//                   >
//                     <Text style={styles.deliverBtnText}>Order Delivered</Text>
//                   </TouchableOpacity>
//                 </View>
//               </View>
//             ) : (
//               <TouchableOpacity
//                 activeOpacity={0.8}
//                 style={styles.floatingShowButton}
//                 onPress={() => setShowDetailsCard(true)}
//               >
//                 <Image
//                   source={require('../assets/images/shopping_bag.png')}
//                   style={styles.floatingArrow}
//                 />
//               </TouchableOpacity>
//             )}
//           </View>
//         </View>
//       </View>
//       <GlobalLoader visible={loading} />
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: Colors.primary,
//     paddingTop: 100,
//   },

//   overlay: {
//     flex: 1,
//     borderTopLeftRadius: 30,
//     borderTopRightRadius: 30,
//     marginTop: 20,
//   },

//   card: {
//     backgroundColor: '#fff',
//     borderTopLeftRadius: 20,
//     borderTopRightRadius: 20,
//     flex: 1,
//   },

//   mapContainer: {
//     flex: 1,
//     borderTopLeftRadius: 20,
//     borderTopRightRadius: 20,
//     overflow: 'hidden',
//   },

//   map: {
//     flex: 1,
//   },

//   currentMarkerWrapper: {
//     width: 44,
//     height: 44,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },

//   deliveryIcon: {
//     width: 80,
//     height: 80,

//     // REMOVE THIS IF IMAGE ALREADY ORANGE
//     // tintColor: Colors.primary,
//   },

//   destinationMarkerWrapper: {
//     width: 30,
//     height: 30,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },

//   destinationMarker: {
//     width: 18,
//     height: 18,
//     borderRadius: 9,
//     backgroundColor: 'red',
//     borderWidth: 3,
//     borderColor: '#fff',
//   },
//   card1: {
//     position: 'absolute',
//     bottom: 20,
//     left: 15,
//     right: 15,
//     backgroundColor: '#fff',
//     borderRadius: 25,
//     padding: 18,

//     shadowColor: '#000',
//     shadowOpacity: 0.15,
//     shadowRadius: 10,
//     shadowOffset: {
//       width: 0,
//       height: 5,
//     },
//     elevation: 8,
//   },

//   header: {
//     flexDirection: 'row',
//     alignItems: 'flex-start',
//     justifyContent: 'space-between',
//   },

//   avatar: {
//     width: 60,
//     height: 60,
//     borderRadius: 20,
//     marginRight: 12,
//   },
//   mapPoint: {
//     width: 20,
//     height: 20,
//     },

//   name: {
//     fontSize: 18,
//     fontFamily: FontFamily.medium,
//     color: Colors.textColor,
//   },

//   phone: {
//     color: Colors.textBrown,
//     fontFamily: FontFamily.regular,
//     marginTop: 2,
//     fontSize: 12,
//   },

//   address: {
//     color: Colors.textBrown,
//     marginTop: 2,
//     fontSize: 12,
//     fontFamily: FontFamily.regular,
//   },

//   iconColumn: {
//     gap: 0,
//   },

//   circleBtn: {
//     width: 38,
//     height: 38,
//     borderRadius: 19,
//     backgroundColor: '#7bc043',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },

//   orderRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     marginTop: 20,
//   },

//   smallLabel: {
//     color: Colors.textBrown,
//     fontSize: 14,
//     fontFamily: FontFamily.regular,
//   },

//   boldText: {
//     fontFamily: FontFamily.bold,
//     marginTop: 2,
//     fontSize: 14,
//   },

//   amount: {
//     color: Colors.primary,
//     fontSize: 18,
//     fontFamily: FontFamily.regular,
//     marginTop: 2,
//   },

//   liveBox: {
//     flexDirection: 'row',
//     backgroundColor: '#FEF6F3',
//     padding: 6,
//     borderRadius: 10,
//     marginTop: 18,
//     alignItems: 'center',
//   },

//   liveTitle: {
//     color: Colors.textColor,
//     fontFamily: FontFamily.medium,
//   },

//   liveText: {
//     color: Colors.textBrown,
//     marginTop: 3,
//     fontSize: 12,
//     fontFamily: FontFamily.regular,
//   },

//   progressTitle: {
//     fontFamily: FontFamily.medium,
//     marginBottom: 15,
//     color: Colors.textColor,
//   },

//   progressRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//   },

//   stepContainer: {
//     alignItems: 'center',
//     flex: 1,
//     position: 'relative',
//     justifyContent: 'flex-start',
//   },

//   stepCircle: {
//     width: 30,
//     height: 30,
//     borderRadius: 15,
//     backgroundColor: '#e5e5e5',
//     justifyContent: 'center',
//     alignItems: 'center',
//     zIndex: 2,
//   },
//   activeStep: {
//     backgroundColor: Colors.lightOrange,
//   },

//   line: {
//     position: 'absolute',
//     top: 12,
//     left: '50%',
//     width: '100%',
//     height: 3,
//     backgroundColor: '#ddd',
//     zIndex: 1,
//   },

//   activeLine: {
//     backgroundColor: Colors.primary,
//   },

//   stepText: {
//     fontSize: 10,
//     marginTop: 10,
//     color: Colors.textBrown,
//     textAlign: 'center',
//     fontFamily: FontFamily.regular,
//   },

//   buttonRow: {
//     flexDirection: 'row',
//     marginTop: 25,
//     gap: 12,
//   },

//   mapBtn: {
//     flex: 1,
//     backgroundColor: Colors.buttonLight,
//     paddingVertical: 14,
//     borderRadius: 14,
//     alignItems: 'center',
//   },

//   deliverBtn: {
//     flex: 1,
//     backgroundColor: Colors.primary,
//     paddingVertical: 14,
//     borderRadius: 14,
//     alignItems: 'center',
//   },

//   mapBtnText: {
//     color: Colors.primary,
//     fontFamily: FontFamily.regular,
//     fontSize: 16,
//   },

//   deliverBtnText: {
//     color: '#fff',
//     fontFamily: FontFamily.regular,
//     fontSize: 16,
//   },

//   smallIcon: {
//     width: 18,
//     height: 18,
//     tintColor: '#fff',
//   },

//   smallIconOrange: {
//     width: 30,
//     height: 30,
//     tintColor: Colors.primary,
//   },

//   bikeIcon: {
//     width: 24,
//     height: 24,
//     tintColor: Colors.primary,
//   },

//   checkIcon: {
//     width: 16,
//     height: 16,
//   },
//   iconCircle: {
//     width: 60,
//     height: 60,
//     borderRadius: 30,
//     backgroundColor: Colors.lightOrange,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   codBadge: {
//     backgroundColor: Colors.lightBackground,
//     paddingHorizontal: 8,
//     paddingVertical: 3,
//     borderRadius: 20,
//     marginLeft: 2,
//   },

//   codText: {
//     color: Colors.primary,
//     fontSize: 12,
//     fontFamily: FontFamily.semiBold,
//   },
//   onWayStep: {
//     width: 30,
//     height: 30,
//     borderRadius: 15,
//     backgroundColor: Colors.lightOrange,

//     justifyContent: 'center',
//     alignItems: 'center',

//     zIndex: 3,
//   },

//   scooterIcon: {
//     width: 20,
//     height: 20,
//     tintColor: Colors.primary,
//   },
//   hideButton: {
//     width: 32,
//     height: 32,
//     borderRadius: 16,
//     backgroundColor: '#F5F5F5',
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginLeft: 10,
//   },

//   hideIcon: {
//     width: 16,
//     height: 16,
//     tintColor: Colors.textColor,
//   },

//   floatingShowButton: {
//     position: 'absolute',
//     bottom: 30,
//     right: 20,
//     width: 40,
//     height: 40,
//     borderRadius: 20,

//     backgroundColor: Colors.primary,

//     justifyContent: 'center',
//     alignItems: 'center',

//     shadowColor: '#000',
//     shadowOpacity: 0.2,
//     shadowRadius: 8,
//     shadowOffset: {
//       width: 0,
//       height: 4,
//     },

//     elevation: 10,
//   },

//   floatingArrow: {
//     width: 24,
//     height: 24,
//     tintColor: '#fff',
//   },

//   // RE-CENTER BUTTON
//   reCenterBtn: {
//     position: 'absolute',
//     top: 16,
//     right: 16,
//     backgroundColor: '#fff',
//     paddingHorizontal: 14,
//     paddingVertical: 8,
//     borderRadius: 20,
//     shadowColor: '#000',
//     shadowOpacity: 0.2,
//     shadowRadius: 6,
//     shadowOffset: { width: 0, height: 3 },
//     elevation: 8,
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 4,
//   },

//   reCenterText: {
//     color: Colors.primary,
//     fontSize: 13,
//     fontFamily: FontFamily.semiBold,
//   },
// });

//re-route 3

// import React, { useEffect, useState, useRef } from 'react';
// import {
//   View,
//   StyleSheet,
//   PermissionsAndroid,
//   Platform,
//   Image,
//   Text,
//   TouchableOpacity,
//   ToastAndroid,
//   Alert,
// } from 'react-native';

// import {
//   Map,
//   Camera,
//   Marker,
//   GeoJSONSource,
//   Layer,
// } from '@maplibre/maplibre-react-native';

// import Geolocation from 'react-native-geolocation-service';
// import axios from 'axios';
// import { OSM_STYLE } from '../GlobalContainer/mapStyle';
// import Colors from '../assets/Colors/Colors';
// import GlobalTopBarDelivery from '../GlobalContainer/GlobalTopBarDelivery';
// import { DeliveryOrderDetails } from '../Models/DeliveryOrderDetails/DeliveryOrderDetails';
// import { FontFamily } from '../assets/GlobalFont/GlobalFont';
// import GlobalLoginAuth from '../GlobalContainer/GlobalLoginAuth';
// import GlobalApi from '../GlobalContainer/GlobalApi';
// import GlobalLoader from '../GlobalContainer/GlobalLoader';
// import { SendOtpResponse } from '../Models/SendOTP/SendOtpResponse ';

// const DARK_MAP_STYLE =
//   'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

// export default function DeliveryStart({ route, navigation }: any) {
//   const {
//     orderDetail,
//   }: {
//     orderDetail: DeliveryOrderDetails;
//   } = route.params;

//   const [showDetailsCard, setShowDetailsCard] = useState(true);
//   const lastSnappedIndexRef = useRef(-1);

//   const [destinationLocation] = useState({
//     latitude: orderDetail.customer.address.latitude || 22.8948,
//     longitude: orderDetail.customer.address.longitude || 88.41,
//   });

//   const [currentLocation, setCurrentLocation] = useState<{
//     latitude: number;
//     longitude: number;
//   } | null>(null);

//   const [routeCoordinates, setRouteCoordinates] = useState<any[]>([]);
//   const routeCoordinatesRef = useRef<any[]>([]);
//   const [remainingRoute, setRemainingRoute] = useState<any[]>([]);
//   const headingRef = useRef(0);
//   const cameraHeadingRef = useRef(0);
//   const markerAnimationRef = useRef<any>(null);
//   const headingAnimationRef = useRef<any>(null);
//   const riderPositionRef = useRef<{
//     latitude: number;
//     longitude: number;
//   } | null>(null);
//   const lastAnimatedBearingRef = useRef<number>(-1);
//   const isReroutingRef = useRef(false);
//   const offRouteCountRef = useRef(0);
//   const [riderPosition, setRiderPosition] = useState<{
//     latitude: number;
//     longitude: number;
//   } | null>(null);

//   const [isFollowingRider, setIsFollowingRider] = useState(true);
//   const userInteractingRef = useRef(false);
//   const interactionTimerRef = useRef<any>(null);

//   const [cameraHeading, setCameraHeading] = useState(0);
//   const [markerHeading, setMarkerHeading] = useState(0);
//   const [loading, setLoading] = useState(false);

//   const [locationHistory, setLocationHistory] = useState<
//     { latitude: number; longitude: number }[]
//   >([]);

//   const previousCoordinateRef = useRef<{
//     latitude: number;
//     longitude: number;
//   } | null>(null);

//   const requestLocationPermission = async () => {
//     if (Platform.OS === 'android') {
//       const granted = await PermissionsAndroid.request(
//         PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
//       );
//       if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
//         console.log('Location permission denied');
//       }
//     }
//   };

//   const calculateBearing = (
//     startLat: number,
//     startLng: number,
//     endLat: number,
//     endLng: number,
//   ) => {
//     const dLon = ((endLng - startLng) * Math.PI) / 180;
//     const y = Math.sin(dLon) * Math.cos((endLat * Math.PI) / 180);
//     const x =
//       Math.cos((startLat * Math.PI) / 180) *
//         Math.sin((endLat * Math.PI) / 180) -
//       Math.sin((startLat * Math.PI) / 180) *
//         Math.cos((endLat * Math.PI) / 180) *
//         Math.cos(dLon);
//     const brng = (Math.atan2(y, x) * 180) / Math.PI;
//     return (brng + 360) % 360;
//   };

//   const getDistance = (
//     lat1: number,
//     lon1: number,
//     lat2: number,
//     lon2: number,
//   ) => {
//     const R = 6371e3;
//     const φ1 = (lat1 * Math.PI) / 180;
//     const φ2 = (lat2 * Math.PI) / 180;
//     const Δφ = ((lat2 - lat1) * Math.PI) / 180;
//     const Δλ = ((lon2 - lon1) * Math.PI) / 180;
//     const a =
//       Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
//       Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
//     const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//     return R * c;
//   };

//   const getProjectedPointOnSegment = (
//     lat: number,
//     lng: number,
//     startLat: number,
//     startLng: number,
//     endLat: number,
//     endLng: number,
//   ) => {
//     const dx = endLng - startLng;
//     const dy = endLat - startLat;
//     const lengthSquared = dx * dx + dy * dy;
//     if (lengthSquared === 0) {
//       return { latitude: startLat, longitude: startLng, t: 0 };
//     }
//     let t = ((lng - startLng) * dx + (lat - startLat) * dy) / lengthSquared;
//     t = Math.max(0, Math.min(1, t));
//     return {
//       latitude: startLat + t * dy,
//       longitude: startLng + t * dx,
//       t,
//     };
//   };

//   const getNearestPointOnRoute = (
//     latitude: number,
//     longitude: number,
//     route: any[],
//   ) => {
//     if (route.length < 2) return null;
//     let minDistance = Infinity;
//     let nearestIndex = 0;
//     let projectedPoint: any = null;
//     for (let i = 0; i < route.length - 1; i++) {
//       const start = route[i];
//       const end = route[i + 1];
//       const projected = getProjectedPointOnSegment(
//         latitude,
//         longitude,
//         start[1],
//         start[0],
//         end[1],
//         end[0],
//       );
//       const distance = getDistance(
//         latitude,
//         longitude,
//         projected.latitude,
//         projected.longitude,
//       );
//       if (distance < minDistance) {
//         minDistance = distance;
//         nearestIndex = i;
//         projectedPoint = projected;
//       }
//     }
//     return {
//       index: nearestIndex,
//       distance: minDistance,
//       point: projectedPoint,
//     };
//   };

//   const getRoute = async (
//     startLat: number,
//     startLng: number,
//     endLat: number,
//     endLng: number,
//   ) => {
//     try {
//       const response = await axios.get(
//         `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`,
//       );
//       if (response.data?.routes?.length > 0) {
//         const osrmCoordinates = response.data.routes[0].geometry.coordinates;
//         const coordinates = [[startLng, startLat], ...osrmCoordinates];
//         setRouteCoordinates(coordinates);
//         routeCoordinatesRef.current = coordinates;
//         if (!riderPosition && coordinates.length > 0) {
//           const initialPos = {
//             latitude: coordinates[0][1],
//             longitude: coordinates[0][0],
//           };
//           riderPositionRef.current = initialPos;
//           setRiderPosition(initialPos);
//           lastSnappedIndexRef.current = 0;
//           setRemainingRoute(coordinates);
//         }
//       }
//     } catch (error) {
//       console.log('ROUTE ERROR', error);
//     }
//   };

//   const reRoute = async (currentLat: number, currentLng: number) => {
//     if (isReroutingRef.current) return;
//     isReroutingRef.current = true;
//     ToastAndroid.show('Re-routing...', ToastAndroid.SHORT);
//     try {
//       const response = await axios.get(
//         `https://router.project-osrm.org/route/v1/driving/${currentLng},${currentLat};${destinationLocation.longitude},${destinationLocation.latitude}?overview=full&geometries=geojson`,
//       );
//       if (response.data?.routes?.length > 0) {
//         const osrmCoordinates = response.data.routes[0].geometry.coordinates;
//         const firstSnapped = osrmCoordinates[0];
//         const currentRiderPos = riderPositionRef.current;
//         if (currentRiderPos) {
//           const SMOOTH_STEPS = 20;
//           const SMOOTH_INTERVAL = 50;
//           let step = 0;
//           const fromLat = currentRiderPos.latitude;
//           const fromLng = currentRiderPos.longitude;
//           const toLat = firstSnapped[1];
//           const toLng = firstSnapped[0];
//           const slideInterval = setInterval(() => {
//             step++;
//             const progress = step / SMOOTH_STEPS;
//             const easedProgress = 1 - Math.pow(1 - progress, 3);
//             const newPos = {
//               latitude: fromLat + (toLat - fromLat) * easedProgress,
//               longitude: fromLng + (toLng - fromLng) * easedProgress,
//             };
//             riderPositionRef.current = newPos;
//             setRiderPosition(newPos);
//             if (step >= SMOOTH_STEPS) {
//               clearInterval(slideInterval);
//               const newCoordinates = [
//                 firstSnapped,
//                 ...osrmCoordinates.slice(1),
//               ];
//               setRouteCoordinates(newCoordinates);
//               routeCoordinatesRef.current = newCoordinates;
//               setRemainingRoute(newCoordinates);
//               lastSnappedIndexRef.current = 0;
//               offRouteCountRef.current = 0;
//               ToastAndroid.show('Route updated!', ToastAndroid.SHORT);
//             }
//           }, SMOOTH_INTERVAL);
//         } else {
//           const newCoordinates = [firstSnapped, ...osrmCoordinates.slice(1)];
//           setRouteCoordinates(newCoordinates);
//           routeCoordinatesRef.current = newCoordinates;
//           setRemainingRoute(newCoordinates);
//           lastSnappedIndexRef.current = 0;
//           offRouteCountRef.current = 0;
//           ToastAndroid.show('Route updated!', ToastAndroid.SHORT);
//         }
//       }
//     } catch (error) {
//       console.log('Re-route error:', error);
//     } finally {
//       isReroutingRef.current = false;
//     }
//   };

//   const getCurrentLocation = async () => {
//     Geolocation.getCurrentPosition(
//       async position => {
//         const latitude = position.coords.latitude;
//         const longitude = position.coords.longitude;
//         setCurrentLocation({ latitude, longitude });
//         previousCoordinateRef.current = { latitude, longitude };
//         await getRoute(
//           latitude,
//           longitude,
//           destinationLocation.latitude,
//           destinationLocation.longitude,
//         );
//       },
//       error => console.log(error),
//       { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 },
//     );
//   };

//   useEffect(() => {
//     requestLocationPermission();
//     getCurrentLocation();

//     const animateMarker = (
//       startLat: number,
//       startLng: number,
//       endLat: number,
//       endLng: number,
//     ) => {
//       if (markerAnimationRef.current) {
//         clearInterval(markerAnimationRef.current);
//         markerAnimationRef.current = null;
//       }
//       const distance = Math.sqrt(
//         Math.pow(endLat - startLat, 2) + Math.pow(endLng - startLng, 2),
//       );
//       const steps = distance > 0.0005 ? 6 : 10;
//       let currentStep = 0;
//       const interval = setInterval(() => {
//         currentStep++;
//         const progress = currentStep / steps;
//         const newPos = {
//           latitude: startLat + (endLat - startLat) * progress,
//           longitude: startLng + (endLng - startLng) * progress,
//         };
//         riderPositionRef.current = newPos;
//         setRiderPosition(newPos);
//         if (currentStep >= steps) {
//           clearInterval(interval);
//           markerAnimationRef.current = null;
//         }
//       }, 50);
//       markerAnimationRef.current = interval;
//     };

//     const animateHeading = (fromBearing: number, toBearing: number) => {
//       if (headingAnimationRef.current) {
//         clearInterval(headingAnimationRef.current);
//         headingAnimationRef.current = null;
//       }
//       let delta = toBearing - fromBearing;
//       if (delta > 180) delta -= 360;
//       if (delta < -180) delta += 360;
//       const steps = 15;
//       let currentStep = 0;
//       const interval = setInterval(() => {
//         currentStep++;
//         const progress = currentStep / steps;
//         const newHeading = (fromBearing + delta * progress + 360) % 360;
//         headingRef.current = newHeading;
//         setMarkerHeading(newHeading);
//         setCameraHeading(newHeading);
//         cameraHeadingRef.current = newHeading;
//         if (currentStep >= steps) {
//           clearInterval(interval);
//           headingAnimationRef.current = null;
//         }
//       }, 50);
//       headingAnimationRef.current = interval;
//     };

//     const watchId = Geolocation.watchPosition(
//       async position => {
//         const latitude = position.coords.latitude;
//         const longitude = position.coords.longitude;
//         const previous = previousCoordinateRef.current;
//         setCurrentLocation({ latitude, longitude });
//         setLocationHistory(prev => [...prev, { latitude, longitude }]);
//         const route = routeCoordinatesRef.current;
//         if (route.length < 2) return;
//         if (previous) {
//           const movedDistance = getDistance(
//             previous.latitude,
//             previous.longitude,
//             latitude,
//             longitude,
//           );
//           console.log('GPS Move Distance:', movedDistance);
//           if (route.length > 1) {
//             const snapped = getNearestPointOnRoute(latitude, longitude, route);
//             if (snapped) {
//               const OFF_ROUTE_THRESHOLD_METERS = 40;
//               const OFF_ROUTE_CONFIRM_COUNT = 3;
//               if (snapped.distance > OFF_ROUTE_THRESHOLD_METERS) {
//                 offRouteCountRef.current += 1;
//                 if (offRouteCountRef.current >= OFF_ROUTE_CONFIRM_COUNT) {
//                   reRoute(latitude, longitude);
//                   return;
//                 }
//               } else {
//                 offRouteCountRef.current = 0;
//               }
//               if (riderPositionRef.current) {
//                 animateMarker(
//                   riderPositionRef.current.latitude,
//                   riderPositionRef.current.longitude,
//                   snapped.point.latitude,
//                   snapped.point.longitude,
//                 );
//               } else {
//                 const pos = {
//                   latitude: snapped.point.latitude,
//                   longitude: snapped.point.longitude,
//                 };
//                 riderPositionRef.current = pos;
//                 setRiderPosition(pos);
//               }
//               const currentMatchedPoint = [
//                 snapped.point.longitude,
//                 snapped.point.latitude,
//               ];
//               setRemainingRoute([
//                 currentMatchedPoint,
//                 ...route.slice(snapped.index + 1),
//               ]);
//               if (snapped.index !== lastSnappedIndexRef.current) {
//                 lastSnappedIndexRef.current = snapped.index;
//               }
//               if (snapped.index < route.length - 1) {
//                 const current = route[snapped.index];
//                 const next = route[snapped.index + 1];
//                 const routeBearing = calculateBearing(
//                   current[1],
//                   current[0],
//                   next[1],
//                   next[0],
//                 );
//                 const bearingDiff = Math.abs(routeBearing - headingRef.current);
//                 const alreadyAnimated =
//                   Math.abs(routeBearing - lastAnimatedBearingRef.current) < 5;
//                 if (bearingDiff > 15 && !alreadyAnimated) {
//                   lastAnimatedBearingRef.current = routeBearing;
//                   animateHeading(headingRef.current, routeBearing);
//                 }
//               }
//             }
//           }
//         }
//         previousCoordinateRef.current = { latitude, longitude };
//       },
//       error => console.log(error),
//       {
//         enableHighAccuracy: true,
//         distanceFilter: 1,
//         interval: 1000,
//         fastestInterval: 1000,
//         showLocationDialog: true,
//         forceRequestLocation: true,
//       },
//     );

//     return () => {
//       Geolocation.clearWatch(watchId);
//     };
//   }, []);

//   // useEffect(() => {
//   //   if (routeCoordinates.length < 2) return;
//   //   let segmentIndex = 0;
//   //   let segmentProgress = 0;
//   //   let lastTimestamp: number | null = null;
//   //   let animFrameId: number;
//   //   const STEPS_PER_SECOND = 5;
//   //   const PROGRESS_PER_STEP = 1 / STEPS_PER_SECOND;
//   //   const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
//   //   const animate = (timestamp: number) => {
//   //     if (lastTimestamp === null) lastTimestamp = timestamp;
//   //     const deltaMs = timestamp - lastTimestamp;
//   //     const elapsedSeconds = deltaMs / 1000;
//   //     lastTimestamp = timestamp;
//   //     const current = routeCoordinates[segmentIndex];
//   //     const next = routeCoordinates[segmentIndex + 1];
//   //     if (!current || !next) return;
//   //     const progressDelta = PROGRESS_PER_STEP * (elapsedSeconds * STEPS_PER_SECOND);
//   //     segmentProgress = Math.min(segmentProgress + progressDelta, 1);
//   //     const lat = lerp(current[1], next[1], segmentProgress);
//   //     const lon = lerp(current[0], next[0], segmentProgress);
//   //     const bearing = calculateBearing(current[1], current[0], next[1], next[0]);
//   //     setMarkerHeading(bearing);
//   //     setCameraHeading(bearing);
//   //     setRiderPosition({ latitude: lat, longitude: lon });
//   //     if (segmentProgress >= 1) {
//   //       segmentIndex++;
//   //       segmentProgress = 0;
//   //       setRemainingRoute(routeCoordinates.slice(segmentIndex));
//   //       if (segmentIndex >= routeCoordinates.length - 1) return;
//   //     }
//   //     animFrameId = requestAnimationFrame(animate);
//   //   };
//   //   animFrameId = requestAnimationFrame(animate);
//   //   return () => cancelAnimationFrame(animFrameId);
//   // }, [routeCoordinates]);

//   const sendOTP = async () => {
//     try {
//       setLoading(true);
//       const response = await fetch(
//         `${GlobalApi.baseUrl}api/deliveries/me/orders/${orderDetail?.order.id}/send-otp`,
//         {
//           method: 'POST',
//           headers: {
//             'Content-Type': 'application/json',
//             Authorization: `Bearer ${GlobalLoginAuth.accessToken}`,
//           },
//         },
//       );
//       const result = await response.json();
//       const SendOtpResponseData = result as SendOtpResponse;
//       if (!response.ok) {
//         Alert.alert('FoodyPly', result.message || 'Failed to load dashboard');
//         return;
//       }
//       if (SendOtpResponseData.success) {
//         navigation.navigate('DeliveryOtpVerification', {
//           orderDetail: orderDetail,
//           otp: SendOtpResponseData.data.otp,
//         });
//       }
//     } catch (error) {
//       console.log(error);
//       Alert.alert('FoodyPly', 'Unable to connect to server');
//     } finally {
//       setLoading(false);
//     }
//   };

//   // ─── BEARING → ICON FLIP LOGIC ─────────────────────────────────────────────
//   // PNG image naturally faces RIGHT (east = 90°).
//   // Jab rider right side (0°–180°) mein chal raha ho → normal image
//   // Jab rider left side (180°–360°) mein chal raha ho → scaleX: -1 (mirror)
//   // Is tarah image kabhi ulta nahi dikhega — sirf flip hogi
//   const isMovingLeft = markerHeading > 180 && markerHeading <= 360;

//   return (
//     <View style={styles.container}>
//       <GlobalTopBarDelivery
//         navigation={navigation}
//         notificationClick={() => {}}
//         text="Start Delivery"
//         subtitleText={`#${orderDetail?.order.orderNumber}`}
//         isBackVisible={true}
//         isOnlineVisible={false}
//       />

//       <View style={styles.overlay}>
//         <View style={styles.card}>
//           <View style={styles.mapContainer}>
//             <Map
//               style={styles.map}
//               mapStyle={OSM_STYLE}
//               logo={false}
//               compass={false}
//               onTouchStart={() => {
//                 userInteractingRef.current = true;
//                 setIsFollowingRider(false);
//                 if (interactionTimerRef.current) {
//                   clearTimeout(interactionTimerRef.current);
//                 }
//               }}
//             >
//               {/* CAMERA */}
//               {riderPosition && isFollowingRider && (
//                 <Camera
//                   zoom={18}
//                   pitch={0}
//                   bearing={cameraHeading}
//                   center={[riderPosition.longitude, riderPosition.latitude]}
//                   animationMode="none"
//                   animationDuration={0}
//                   padding={{ top: 100, bottom: 300, left: 0, right: 0 }}
//                 />
//               )}

//               {/* DELIVERY BOY MARKER */}
//               {riderPosition && (
//                 <Marker
//                   anchor="center"
//                   lngLat={[riderPosition.longitude, riderPosition.latitude]}
//                 >
//                   <View style={styles.currentMarkerWrapper}>
//                     <Image
//                       source={require('../assets/images/delivery-foodyply-rider.png')}
//                       style={[
//                         styles.deliveryIcon,
//                         {
//                           // ✅ FIX: rotation band, sirf horizontal flip se direction handle
//                           // Image facing right (east) hai by default
//                           // Left jaate waqt mirror kar do — ulta nahi dikhega
//                           transform: [{ scaleX: isMovingLeft ? -1 : 1 }],
//                         },
//                       ]}
//                       resizeMode="contain"
//                     />
//                   </View>
//                 </Marker>
//               )}

//               {/* DESTINATION */}
//               <Marker
//                 anchor="center"
//                 lngLat={[
//                   destinationLocation.longitude,
//                   destinationLocation.latitude,
//                 ]}
//               >
//                 <View style={styles.destinationMarkerWrapper}>
//                   <View style={styles.destinationMarker} />
//                 </View>
//               </Marker>

//               {/* ROUTE */}
//               {routeCoordinates.length > 1 && (
//                 <GeoJSONSource
//                   id="routeSource"
//                   data={{
//                     type: 'FeatureCollection',
//                     features: [
//                       {
//                         type: 'Feature',
//                         properties: {},
//                         geometry: {
//                           type: 'LineString',
//                           coordinates: remainingRoute,
//                         },
//                       },
//                     ],
//                   }}
//                 >
//                   <Layer
//                     id="routeLayerBg"
//                     type="line"
//                     paint={{
//                       'line-color': '#0B3B2E',
//                       'line-width': 10,
//                       'line-opacity': 0.7,
//                     }}
//                     layout={{ 'line-cap': 'round', 'line-join': 'round' }}
//                   />
//                   <Layer
//                     id="routeLayer"
//                     type="line"
//                     paint={{
//                       'line-color': '#00b7ff',
//                       'line-width': 6,
//                       'line-opacity': 1,
//                     }}
//                     layout={{ 'line-cap': 'round', 'line-join': 'round' }}
//                   />
//                 </GeoJSONSource>
//               )}
//             </Map>

//             {!isFollowingRider && (
//               <TouchableOpacity
//                 activeOpacity={0.85}
//                 style={styles.reCenterBtn}
//                 onPress={() => {
//                   userInteractingRef.current = false;
//                   setIsFollowingRider(true);
//                 }}
//               >
//                 <Image
//                   source={require('../assets/images/map-point.png')}
//                   style={styles.mapPoint}
//                 />
//               </TouchableOpacity>
//             )}

//             {/* FLOATING CARD */}
//             {showDetailsCard ? (
//               <View style={styles.card1}>
//                 <View style={styles.header}>
//                   <Image
//                     source={
//                       orderDetail?.customer?.profileImageUrl
//                         ? { uri: orderDetail.customer.profileImageUrl }
//                         : require('../assets/images/customer_image.png')
//                     }
//                     style={styles.avatar}
//                   />
//                   <View style={{ flex: 1 }}>
//                     <Text style={styles.name}>{orderDetail.customer.name}</Text>
//                     <Text style={styles.phone}>
//                       {orderDetail.customer.phone}
//                     </Text>
//                     <Text style={styles.address}>
//                       {orderDetail.customer.address.fullText}
//                     </Text>
//                   </View>
//                   <View style={styles.iconColumn}>
//                     <TouchableOpacity style={styles.circleBtn}>
//                       <Image
//                         source={require('../assets/images/call.png')}
//                         style={styles.smallIcon}
//                       />
//                     </TouchableOpacity>
//                   </View>
//                 </View>

//                 <View style={styles.orderRow}>
//                   <View
//                     style={{
//                       flexDirection: 'row',
//                       alignItems: 'center',
//                       gap: 5,
//                     }}
//                   >
//                     <Image
//                       source={require('../assets/images/shopping_bag.png')}
//                       style={styles.smallIconOrange}
//                     />
//                     <View>
//                       <Text style={styles.smallLabel}>
//                         {orderDetail.items.length} Items •{' '}
//                         {orderDetail.items.reduce(
//                           (acc, item) => acc + item.quantity,
//                           0,
//                         )}{' '}
//                         Qty
//                       </Text>
//                       <View
//                         style={{
//                           flexDirection: 'row',
//                           alignItems: 'center',
//                           gap: 4,
//                           marginTop: 2,
//                         }}
//                       >
//                         <Text style={styles.smallLabel}>Payment Status</Text>
//                         <View style={styles.codBadge}>
//                           <Text style={styles.codText}>
//                             {orderDetail.billing.paymentStatus}
//                           </Text>
//                         </View>
//                       </View>
//                     </View>
//                   </View>
//                   <View>
//                     <Text style={styles.smallLabel}>Order Amount</Text>
//                     <Text style={styles.amount}>
//                       ₹{orderDetail.billing.finalAmount.toFixed(2)}
//                     </Text>
//                   </View>
//                 </View>

//                 <View style={styles.liveBox}>
//                   <View style={styles.iconCircle}>
//                     <Image
//                       source={require('../assets/images/scooter.png')}
//                       style={styles.bikeIcon}
//                     />
//                   </View>
//                   <View style={{ marginLeft: 10 }}>
//                     <Text style={styles.liveTitle}>Live Status</Text>
//                     <Text style={styles.liveText}>
//                       You are on the way to the customer
//                     </Text>
//                   </View>
//                 </View>

//                 <View style={{ marginTop: 20 }}>
//                   <Text style={styles.progressTitle}>Order Progress</Text>
//                   <View style={styles.progressRow}>
//                     {[
//                       'Assigned',
//                       'Accepted',
//                       'Picked',
//                       'On The Way',
//                       'Delivered',
//                     ].map((item, index) => {
//                       const isActive = index <= 3;
//                       const isOnWay = item === 'On The Way';
//                       return (
//                         <View key={index} style={styles.stepContainer}>
//                           <View
//                             style={[
//                               styles.stepCircle,
//                               isActive && styles.activeStep,
//                               isOnWay && styles.onWayStep,
//                             ]}
//                           >
//                             {isOnWay ? (
//                               <Image
//                                 source={require('../assets/images/scooter.png')}
//                                 style={styles.scooterIcon}
//                               />
//                             ) : (
//                               <Image
//                                 source={require('../assets/images/check.png')}
//                                 style={[
//                                   styles.checkIcon,
//                                   {
//                                     tintColor: isActive
//                                       ? Colors.primary
//                                       : '#bbb',
//                                   },
//                                 ]}
//                               />
//                             )}
//                           </View>
//                           <Text style={styles.stepText}>{item}</Text>
//                           {index !== 4 && (
//                             <View
//                               style={[
//                                 styles.line,
//                                 index < 3 && styles.activeLine,
//                               ]}
//                             />
//                           )}
//                         </View>
//                       );
//                     })}
//                   </View>
//                 </View>

//                 <View style={styles.buttonRow}>
//                   <TouchableOpacity
//                     style={styles.mapBtn}
//                     onPress={() => setShowDetailsCard(false)}
//                   >
//                     <Text style={styles.mapBtnText}>Open in Maps</Text>
//                   </TouchableOpacity>
//                   <TouchableOpacity
//                     style={styles.deliverBtn}
//                     onPress={() => sendOTP()}
//                   >
//                     <Text style={styles.deliverBtnText}>Order Delivered</Text>
//                   </TouchableOpacity>
//                 </View>
//               </View>
//             ) : (
//               <TouchableOpacity
//                 activeOpacity={0.8}
//                 style={styles.floatingShowButton}
//                 onPress={() => setShowDetailsCard(true)}
//               >
//                 <Image
//                   source={require('../assets/images/shopping_bag.png')}
//                   style={styles.floatingArrow}
//                 />
//               </TouchableOpacity>
//             )}
//           </View>
//         </View>
//       </View>
//       <GlobalLoader visible={loading} />
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: Colors.primary, paddingTop: 100 },
//   overlay: {
//     flex: 1,
//     borderTopLeftRadius: 30,
//     borderTopRightRadius: 30,
//     marginTop: 20,
//   },
//   card: {
//     backgroundColor: '#fff',
//     borderTopLeftRadius: 20,
//     borderTopRightRadius: 20,
//     flex: 1,
//   },
//   mapContainer: {
//     flex: 1,
//     borderTopLeftRadius: 20,
//     borderTopRightRadius: 20,
//     overflow: 'hidden',
//   },
//   map: { flex: 1 },
//   currentMarkerWrapper: {
//     width: 44,
//     height: 44,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   deliveryIcon: { width: 70, height: 70 },
//   destinationMarkerWrapper: {
//     width: 30,
//     height: 30,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   destinationMarker: {
//     width: 18,
//     height: 18,
//     borderRadius: 9,
//     backgroundColor: 'red',
//     borderWidth: 3,
//     borderColor: '#fff',
//   },
//   card1: {
//     position: 'absolute',
//     bottom: 20,
//     left: 15,
//     right: 15,
//     backgroundColor: '#fff',
//     borderRadius: 25,
//     padding: 18,
//     shadowColor: '#000',
//     shadowOpacity: 0.15,
//     shadowRadius: 10,
//     shadowOffset: { width: 0, height: 5 },
//     elevation: 8,
//   },
//   header: {
//     flexDirection: 'row',
//     alignItems: 'flex-start',
//     justifyContent: 'space-between',
//   },
//   avatar: { width: 60, height: 60, borderRadius: 20, marginRight: 12 },
//   mapPoint: { width: 20, height: 20 },
//   name: {
//     fontSize: 18,
//     fontFamily: FontFamily.medium,
//     color: Colors.textColor,
//   },
//   phone: {
//     color: Colors.textBrown,
//     fontFamily: FontFamily.regular,
//     marginTop: 2,
//     fontSize: 12,
//   },
//   address: {
//     color: Colors.textBrown,
//     marginTop: 2,
//     fontSize: 12,
//     fontFamily: FontFamily.regular,
//   },
//   iconColumn: { gap: 0 },
//   circleBtn: {
//     width: 38,
//     height: 38,
//     borderRadius: 19,
//     backgroundColor: '#7bc043',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   orderRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     marginTop: 20,
//   },
//   smallLabel: {
//     color: Colors.textBrown,
//     fontSize: 14,
//     fontFamily: FontFamily.regular,
//   },
//   boldText: { fontFamily: FontFamily.bold, marginTop: 2, fontSize: 14 },
//   amount: {
//     color: Colors.primary,
//     fontSize: 18,
//     fontFamily: FontFamily.regular,
//     marginTop: 2,
//   },
//   liveBox: {
//     flexDirection: 'row',
//     backgroundColor: '#FEF6F3',
//     padding: 6,
//     borderRadius: 10,
//     marginTop: 18,
//     alignItems: 'center',
//   },
//   liveTitle: { color: Colors.textColor, fontFamily: FontFamily.medium },
//   liveText: {
//     color: Colors.textBrown,
//     marginTop: 3,
//     fontSize: 12,
//     fontFamily: FontFamily.regular,
//   },
//   progressTitle: {
//     fontFamily: FontFamily.medium,
//     marginBottom: 15,
//     color: Colors.textColor,
//   },
//   progressRow: { flexDirection: 'row', justifyContent: 'space-between' },
//   stepContainer: {
//     alignItems: 'center',
//     flex: 1,
//     position: 'relative',
//     justifyContent: 'flex-start',
//   },
//   stepCircle: {
//     width: 30,
//     height: 30,
//     borderRadius: 15,
//     backgroundColor: '#e5e5e5',
//     justifyContent: 'center',
//     alignItems: 'center',
//     zIndex: 2,
//   },
//   activeStep: { backgroundColor: Colors.lightOrange },
//   line: {
//     position: 'absolute',
//     top: 12,
//     left: '50%',
//     width: '100%',
//     height: 3,
//     backgroundColor: '#ddd',
//     zIndex: 1,
//   },
//   activeLine: { backgroundColor: Colors.primary },
//   stepText: {
//     fontSize: 10,
//     marginTop: 10,
//     color: Colors.textBrown,
//     textAlign: 'center',
//     fontFamily: FontFamily.regular,
//   },
//   buttonRow: { flexDirection: 'row', marginTop: 25, gap: 12 },
//   mapBtn: {
//     flex: 1,
//     backgroundColor: Colors.buttonLight,
//     paddingVertical: 14,
//     borderRadius: 14,
//     alignItems: 'center',
//   },
//   deliverBtn: {
//     flex: 1,
//     backgroundColor: Colors.primary,
//     paddingVertical: 14,
//     borderRadius: 14,
//     alignItems: 'center',
//   },
//   mapBtnText: {
//     color: Colors.primary,
//     fontFamily: FontFamily.regular,
//     fontSize: 16,
//   },
//   deliverBtnText: {
//     color: '#fff',
//     fontFamily: FontFamily.regular,
//     fontSize: 16,
//   },
//   smallIcon: { width: 18, height: 18, tintColor: '#fff' },
//   smallIconOrange: { width: 30, height: 30, tintColor: Colors.primary },
//   bikeIcon: { width: 24, height: 24, tintColor: Colors.primary },
//   checkIcon: { width: 16, height: 16 },
//   iconCircle: {
//     width: 60,
//     height: 60,
//     borderRadius: 30,
//     backgroundColor: Colors.lightOrange,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   codBadge: {
//     backgroundColor: Colors.lightBackground,
//     paddingHorizontal: 8,
//     paddingVertical: 3,
//     borderRadius: 20,
//     marginLeft: 2,
//   },
//   codText: {
//     color: Colors.primary,
//     fontSize: 12,
//     fontFamily: FontFamily.semiBold,
//   },
//   onWayStep: {
//     width: 30,
//     height: 30,
//     borderRadius: 15,
//     backgroundColor: Colors.lightOrange,
//     justifyContent: 'center',
//     alignItems: 'center',
//     zIndex: 3,
//   },
//   scooterIcon: { width: 20, height: 20, tintColor: Colors.primary },
//   hideButton: {
//     width: 32,
//     height: 32,
//     borderRadius: 16,
//     backgroundColor: '#F5F5F5',
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginLeft: 10,
//   },
//   hideIcon: { width: 16, height: 16, tintColor: Colors.textColor },
//   floatingShowButton: {
//     position: 'absolute',
//     bottom: 30,
//     right: 20,
//     width: 40,
//     height: 40,
//     borderRadius: 20,
//     backgroundColor: Colors.primary,
//     justifyContent: 'center',
//     alignItems: 'center',
//     shadowColor: '#000',
//     shadowOpacity: 0.2,
//     shadowRadius: 8,
//     shadowOffset: { width: 0, height: 4 },
//     elevation: 10,
//   },
//   floatingArrow: { width: 24, height: 24, tintColor: '#fff' },
//   reCenterBtn: {
//     position: 'absolute',
//     top: 16,
//     right: 16,
//     backgroundColor: '#fff',
//     paddingHorizontal: 14,
//     paddingVertical: 8,
//     borderRadius: 20,
//     shadowColor: '#000',
//     shadowOpacity: 0.2,
//     shadowRadius: 6,
//     shadowOffset: { width: 0, height: 3 },
//     elevation: 8,
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 4,
//   },
//   reCenterText: {
//     color: Colors.primary,
//     fontSize: 13,
//     fontFamily: FontFamily.semiBold,
//   },
// });

//************************************/

// working code with smooth marker animation along route and heading animation on turns, plus distance-based update filtering.

// import React, { useEffect, useState, useRef } from 'react';
// import {
//   View,
//   StyleSheet,
//   PermissionsAndroid,
//   Platform,
//   Image,
//   Text,
//   TouchableOpacity,
//   ToastAndroid,
//   Alert,
// } from 'react-native';

// import {
//   Map,
//   Camera,
//   Marker,
//   GeoJSONSource,
//   Layer,
// } from '@maplibre/maplibre-react-native';

// import Geolocation from 'react-native-geolocation-service';
// import axios from 'axios';

// import Colors from '../assets/Colors/Colors';
// import GlobalTopBarDelivery from '../GlobalContainer/GlobalTopBarDelivery';
// import { DeliveryOrderDetails } from '../Models/DeliveryOrderDetails/DeliveryOrderDetails';
// import { FontFamily } from '../assets/GlobalFont/GlobalFont';
// import GlobalLoginAuth from '../GlobalContainer/GlobalLoginAuth';
// import GlobalApi from '../GlobalContainer/GlobalApi';
// import GlobalLoader from '../GlobalContainer/GlobalLoader';
// import { SendOtpResponse } from '../Models/SendOTP/SendOtpResponse ';

// const DARK_MAP_STYLE =
//   'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

// export default function DeliveryStart({ route, navigation }: any) {
//   const {
//     orderDetail,
//   }: {
//     orderDetail: DeliveryOrderDetails;
//   } = route.params;

//   const [showDetailsCard, setShowDetailsCard] = useState(true);
//   const lastSnappedIndexRef = useRef(-1);
//   // DESTINATION
//   const [destinationLocation] = useState({
//     latitude: orderDetail.customer.address.latitude || 22.8948,

//     longitude: orderDetail.customer.address.longitude || 88.41,
//   });

//   // CURRENT LOCATION
//   const [currentLocation, setCurrentLocation] = useState<{
//     latitude: number;
//     longitude: number;
//   } | null>(null);

//   // ROUTE
//   const [routeCoordinates, setRouteCoordinates] = useState<any[]>([]);
//   const routeCoordinatesRef = useRef<any[]>([]);
//   const [remainingRoute, setRemainingRoute] = useState<any[]>([]);
//   const headingRef = useRef(0);
//   const cameraHeadingRef = useRef(0);
//   const markerAnimationRef = useRef<any>(null);   // cancel old animation before new one
//   const headingAnimationRef = useRef<any>(null);  // cancel old heading animation
//   const riderPositionRef = useRef<{ latitude: number; longitude: number } | null>(null); // always fresh position
//   const lastAnimatedBearingRef = useRef<number>(-1); // last bearing jo animate hua — dobara same pe na karo
//   const [riderPosition, setRiderPosition] = useState<{
//     latitude: number;
//     longitude: number;
//   } | null>(null);
//   // CAMERA HEADING
//   const [cameraHeading, setCameraHeading] = useState(0);

//   // SCOOTER HEADING
//   const [markerHeading, setMarkerHeading] = useState(0);
//   const [loading, setLoading] = useState(false);

//   const [locationHistory, setLocationHistory] = useState<
//     { latitude: number; longitude: number }[]
//   >([]);
//   // PREVIOUS LOCATION
//   const previousCoordinateRef = useRef<{
//     latitude: number;
//     longitude: number;
//   } | null>(null);

//   // REQUEST LOCATION PERMISSION
//   const requestLocationPermission = async () => {
//     if (Platform.OS === 'android') {
//       const granted = await PermissionsAndroid.request(
//         PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
//       );

//       if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
//         console.log('Location permission denied');
//       }
//     }
//   };

//   const calculateBearing = (
//     startLat: number,

//     startLng: number,

//     endLat: number,

//     endLng: number,
//   ) => {
//     const dLon = ((endLng - startLng) * Math.PI) / 180;

//     const y = Math.sin(dLon) * Math.cos((endLat * Math.PI) / 180);

//     const x =
//       Math.cos((startLat * Math.PI) / 180) *
//         Math.sin((endLat * Math.PI) / 180) -
//       Math.sin((startLat * Math.PI) / 180) *
//         Math.cos((endLat * Math.PI) / 180) *
//         Math.cos(dLon);

//     const brng = (Math.atan2(y, x) * 180) / Math.PI;

//     return (brng + 360) % 360;
//   };

//   // DISTANCE BETWEEN TWO POINTS
//   const getDistance = (
//     lat1: number,
//     lon1: number,
//     lat2: number,
//     lon2: number,
//   ) => {
//     const R = 6371e3;

//     const φ1 = (lat1 * Math.PI) / 180;
//     const φ2 = (lat2 * Math.PI) / 180;

//     const Δφ = ((lat2 - lat1) * Math.PI) / 180;

//     const Δλ = ((lon2 - lon1) * Math.PI) / 180;

//     const a =
//       Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
//       Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

//     const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

//     return R * c;
//   };

//   const getProjectedPointOnSegment = (
//     lat: number,
//     lng: number,
//     startLat: number,
//     startLng: number,
//     endLat: number,
//     endLng: number,
//   ) => {
//     const dx = endLng - startLng;
//     const dy = endLat - startLat;

//     const lengthSquared = dx * dx + dy * dy;

//     if (lengthSquared === 0) {
//       return {
//         latitude: startLat,
//         longitude: startLng,
//         t: 0,
//       };
//     }

//     let t = ((lng - startLng) * dx + (lat - startLat) * dy) / lengthSquared;

//     t = Math.max(0, Math.min(1, t));

//     return {
//       latitude: startLat + t * dy,
//       longitude: startLng + t * dx,
//       t,
//     };
//   };

//   const getNearestPointOnRoute = (
//     latitude: number,
//     longitude: number,
//     route: any[],
//   ) => {
//     if (route.length < 2) {
//       return null;
//     }

//     let minDistance = Infinity;

//     let nearestIndex = 0;

//     let projectedPoint: any = null;

//     for (let i = 0; i < route.length - 1; i++) {
//       const start = route[i];
//       const end = route[i + 1];

//       const projected = getProjectedPointOnSegment(
//         latitude,
//         longitude,
//         start[1],
//         start[0],
//         end[1],
//         end[0],
//       );

//       const distance = getDistance(
//         latitude,
//         longitude,
//         projected.latitude,
//         projected.longitude,
//       );

//       if (distance < minDistance) {
//         minDistance = distance;
//         nearestIndex = i;
//         projectedPoint = projected;
//       }
//     }

//     return {
//       index: nearestIndex,
//       distance: minDistance,
//       point: projectedPoint,
//     };
//   };
//   // ROUTE API
//   const getRoute = async (
//     startLat: number,
//     startLng: number,
//     endLat: number,
//     endLng: number,
//   ) => {
//     try {
//       const response = await axios.get(
//         `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`,
//       );

//       if (
//         response.data &&
//         response.data.routes &&
//         response.data.routes.length > 0
//       ) {
//         const osrmCoordinates = response.data.routes[0].geometry.coordinates;

//         // Insert actual GPS as first point
//         const coordinates = [[startLng, startLat], ...osrmCoordinates];

//         for (let i = 0; i < 5; i++) {
//           const dist = getDistance(
//             coordinates[i][1],
//             coordinates[i][0],
//             coordinates[i + 1][1],
//             coordinates[i + 1][0],
//           );

//           console.log(`Distance ${i} -> ${i + 1}:`, dist);
//         }
//         setRouteCoordinates(coordinates);
//         routeCoordinatesRef.current = coordinates;

//         console.log('Route Length:', coordinates.length);

//         console.log('First Route Point:', coordinates[0]);

//         console.log('Start GPS:', startLat, startLng);

//         console.log(
//           'Distance Between Start And Route Point:',
//           getDistance(startLat, startLng, coordinates[0][1], coordinates[0][0]),
//         );

//         if (!riderPosition && coordinates.length > 0) {
//           const initialPos = {
//             latitude: coordinates[0][1],
//             longitude: coordinates[0][0],
//           };
//           riderPositionRef.current = initialPos;
//           setRiderPosition(initialPos);

//           lastSnappedIndexRef.current = 0;

//           setRemainingRoute(coordinates);
//         }
//       }
//     } catch (error) {
//       console.log('ROUTE ERROR', error);
//     }
//   };

//   // INITIAL LOCATION
//   const getCurrentLocation = async () => {
//     Geolocation.getCurrentPosition(
//       async position => {
//         const latitude = position.coords.latitude;

//         const longitude = position.coords.longitude;

//         setCurrentLocation({
//           latitude,
//           longitude,
//         });

//         previousCoordinateRef.current = {
//           latitude,
//           longitude,
//         };

//         await getRoute(
//           latitude,
//           longitude,
//           destinationLocation.latitude,
//           destinationLocation.longitude,
//         );
//       },

//       error => {
//         console.log(error);
//       },

//       {
//         enableHighAccuracy: true,
//         timeout: 15000,
//         maximumAge: 10000,
//       },
//     );
//   };

//   // LIVE TRACKING
//   useEffect(() => {
//     requestLocationPermission();

//     getCurrentLocation();

//     const animateMarker = (
//       startLat: number,
//       startLng: number,
//       endLat: number,
//       endLng: number,
//     ) => {
//       // CANCEL previous animation — nahi to purani aur nayi dono chalti hain
//       if (markerAnimationRef.current) {
//         clearInterval(markerAnimationRef.current);
//         markerAnimationRef.current = null;
//       }

//       // Bike fast ho to kam steps — marker peeche nahi rahega
//       const distance = Math.sqrt(
//         Math.pow(endLat - startLat, 2) + Math.pow(endLng - startLng, 2)
//       );// Fast movement = fewer steps (snap quickly), slow = more steps (smooth)

//       const steps = distance > 0.0005 ? 6 : 10; // ~55m threshold
//       let currentStep = 0;

//       const interval = setInterval(() => {
//         currentStep++;
//         const progress = currentStep / steps;
//         const newPos = {
//           latitude: startLat + (endLat - startLat) * progress,
//           longitude: startLng + (endLng - startLng) * progress,
//         };
//         riderPositionRef.current = newPos;
//         setRiderPosition(newPos);

//         if (currentStep >= steps) {
//           clearInterval(interval);
//           markerAnimationRef.current = null;
//         }
//       }, 50);

//       markerAnimationRef.current = interval;
//     };

//     // SMOOTH HEADING ANIMATION
//     const animateHeading = (fromBearing: number, toBearing: number) => {
//       // CANCEL previous heading animation
//       if (headingAnimationRef.current) {
//         clearInterval(headingAnimationRef.current);
//         headingAnimationRef.current = null;
//       }

//       let delta = toBearing - fromBearing;
//       if (delta > 180) delta -= 360;
//       if (delta < -180) delta += 360;

//       const steps = 15; // fast turn — heading peeche nahi rahegi
//       let currentStep = 0;

//       const interval = setInterval(() => {
//         currentStep++;
//         const progress = currentStep / steps;
//         const newHeading = (fromBearing + delta * progress + 360) % 360;
//         headingRef.current = newHeading;
//         setMarkerHeading(newHeading);
//         setCameraHeading(newHeading);
//         cameraHeadingRef.current = newHeading;

//         if (currentStep >= steps) {
//           clearInterval(interval);
//           headingAnimationRef.current = null;
//         }
//       }, 50);

//       headingAnimationRef.current = interval;
//     };
//     const watchId = Geolocation.watchPosition(
//       async position => {
//         const latitude = position.coords.latitude;

//         const longitude = position.coords.longitude;

//         const previous = previousCoordinateRef.current;

//         if (previous) {
//           const movedDistance = getDistance(
//             previous.latitude,
//             previous.longitude,
//             latitude,
//             longitude,
//           );

//           console.log('GPS Move Distance:', movedDistance);
//         }

//         // UPDATE LOCATION
//         setCurrentLocation({
//           latitude,
//           longitude,
//         });
//         // ARRAY ME STORE KARO
//         setLocationHistory(prev => {
//           const updated = [
//             ...prev,
//             {
//               latitude,
//               longitude,
//             },
//           ];

//           // // TOAST ME DIKHAO
//           // ToastAndroid.show(
//           //   JSON.stringify(updated),
//           //   ToastAndroid.SHORT,
//           // );

//           return updated;
//         });

//         const route = routeCoordinatesRef.current;

//         if (route.length < 2) {
//           return;
//         }
//         // CALCULATE HEADING
//         if (previous) {
//           const movedDistance = getDistance(
//             previous.latitude,
//             previous.longitude,
//             latitude,
//             longitude,
//           );
//           ToastAndroid.show(
//             `Rider moved: ${movedDistance.toFixed(1)} meter`,
//             ToastAndroid.SHORT,
//           );

//           console.log('GPS Move Distance:', movedDistance);
//           // if (movedDistance < 3) {
//           //   return;
//           // }
//           const route = routeCoordinatesRef.current;
//           if (route.length > 1) {
//             const snapped = getNearestPointOnRoute(latitude, longitude, route);

//             if (snapped) {
//               // riderPositionRef use karo — state stale hoti hai closure mein
//               if (riderPositionRef.current) {
//                 animateMarker(
//                   riderPositionRef.current.latitude,
//                   riderPositionRef.current.longitude,
//                   snapped.point.latitude,
//                   snapped.point.longitude,
//                 );
//               } else {
//                 const pos = {
//                   latitude: snapped.point.latitude,
//                   longitude: snapped.point.longitude,
//                 };
//                 riderPositionRef.current = pos;
//                 setRiderPosition(pos);
//               }

//               const currentMatchedPoint = [
//                 snapped.point.longitude,
//                 snapped.point.latitude,
//               ];

//               setRemainingRoute([
//                 currentMatchedPoint,
//                 ...route.slice(snapped.index + 1),
//               ]);

//               if (snapped.index !== lastSnappedIndexRef.current) {
//                 lastSnappedIndexRef.current = snapped.index;
//               }

//               if (snapped.index < route.length - 1) {
//                 const current = route[snapped.index];
//                 const next = route[snapped.index + 1];

//                 const routeBearing = calculateBearing(
//                   current[1],
//                   current[0],
//                   next[1],
//                   next[0],
//                 );

//                 const bearingDiff = Math.abs(routeBearing - headingRef.current);

//                 // 15° threshold — choti GPS jitter pe animate nahi hoga
//                 // lastAnimatedBearing check — same bearing pe dobara animate nahi hoga (vibration fix)
//                 const alreadyAnimated = Math.abs(routeBearing - lastAnimatedBearingRef.current) < 5;

//                 if (bearingDiff > 15 && !alreadyAnimated) {
//                   lastAnimatedBearingRef.current = routeBearing;
//                   animateHeading(headingRef.current, routeBearing);
//                 }
//               }
//             }
//           }
//         }

//         previousCoordinateRef.current = {
//           latitude,
//           longitude,
//         };
//       },

//       error => {
//         console.log(error);
//       },

//       {
//         enableHighAccuracy: true,
//         distanceFilter: 1,       // walk: 1m theek, bike: 5m better — kam spam
//         interval: 1000,          // har 2 sec update — animation complete hone ka time milta hai
//         fastestInterval: 1000,
//         showLocationDialog: true,
//         forceRequestLocation: true,
//       },
//     );

//     return () => {
//       Geolocation.clearWatch(watchId);
//     };
//   }, []);

//   const sendOTP = async () => {
//     try {
//       setLoading(true);

//       console.log(
//         'Fetching dashboard data with token:',
//         GlobalLoginAuth.refreshToken,
//       );

//       const response = await fetch(
//         `${GlobalApi.baseUrl}api/deliveries/me/orders/${orderDetail?.order.id}/send-otp`,

//         {
//           method: 'POST',

//           headers: {
//             'Content-Type': 'application/json',

//             Authorization: `Bearer ${GlobalLoginAuth.accessToken}`,
//           },
//         },
//       );

//       const result = await response.json();

//       const SendOtpResponse = result as SendOtpResponse; // âœ… Type assertion to ensure it matches our model

//       console.log('Generate OTP Response:', result);

//       if (!response.ok) {
//         Alert.alert('FoodyPly', result.message || 'Failed to load dashboard');

//         return;
//       }

//       if (SendOtpResponse.success) {
//         console.log('OTP sent successfully:', SendOtpResponse.data.otp);

//         navigation.navigate('DeliveryOtpVerification', {
//           orderDetail: orderDetail,
//           otp: SendOtpResponse.data.otp,
//         });
//       }
//     } catch (error) {
//       console.log(error);

//       Alert.alert('FoodyPly', 'Unable to connect to server');
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <View style={styles.container}>
//       <GlobalTopBarDelivery
//         navigation={navigation}
//         notificationClick={() => {}}
//         text="Start Delivery"
//         subtitleText={`#${orderDetail?.order.orderNumber}`}
//         isBackVisible={true}
//         isOnlineVisible={false}
//       />

//       <View style={styles.overlay}>
//         <View style={styles.card}>
//           <View style={styles.mapContainer}>
//             <Map
//               style={styles.map}
//               mapStyle={DARK_MAP_STYLE}
//               logo={false}
//               compass={true}
//             >
//               {/* CAMERA */}
//               {riderPosition && (
//                 <Camera
//                   zoom={18}
//                   pitch={0}
//                   bearing={cameraHeading}
//                   center={[riderPosition.longitude, riderPosition.latitude]}
//                   padding={{
//                     top: 100,
//                     bottom: 300,
//                     left: 0,
//                     right: 0,
//                   }}
//                 />
//               )}

//               {/* DELIVERY BOY MARKER */}
//               {riderPosition && (
//                 <Marker
//                   anchor="center"
//                   lngLat={[riderPosition.longitude, riderPosition.latitude]}
//                 >
//                   <View
//                     style={[
//                       styles.currentMarkerWrapper,
//                       {
//                         // transform: [
//                         //   {
//                         //     rotate: `${markerHeading}deg`,
//                         //   },
//                         // ],
//                       },
//                     ]}
//                   >
//                     <Image
//                       source={require('../assets/images/dman.png')}
//                       style={styles.deliveryIcon}
//                       resizeMode="contain"
//                     />
//                   </View>
//                 </Marker>
//               )}

//               {/* DESTINATION */}
//               <Marker
//                 anchor="center"
//                 lngLat={[
//                   destinationLocation.longitude,
//                   destinationLocation.latitude,
//                 ]}
//               >
//                 <View style={styles.destinationMarkerWrapper}>
//                   <View style={styles.destinationMarker} />
//                 </View>
//               </Marker>

//               {/* ROUTE */}
//               {routeCoordinates.length > 1 && (
//                 <GeoJSONSource
//                   id="routeSource"
//                   data={{
//                     type: 'FeatureCollection',
//                     features: [
//                       {
//                         type: 'Feature',
//                         properties: {},
//                         geometry: {
//                           type: 'LineString',
//                           coordinates: remainingRoute,
//                         },
//                       },
//                     ],
//                   }}
//                 >
//                   {/* ROUTE SHADOW */}
//                   <Layer
//                     id="routeLayerBg"
//                     type="line"
//                     paint={{
//                       'line-color': '#0B3B2E',
//                       'line-width': 10,
//                       'line-opacity': 0.7,
//                     }}
//                     layout={{
//                       'line-cap': 'round',
//                       'line-join': 'round',
//                     }}
//                   />

//                   {/* MAIN ROUTE */}
//                   <Layer
//                     id="routeLayer"
//                     type="line"
//                     paint={{
//                       'line-color': '#00FF9D',
//                       'line-width': 6,
//                       'line-opacity': 1,
//                     }}
//                     layout={{
//                       'line-cap': 'round',
//                       'line-join': 'round',
//                     }}
//                   />
//                 </GeoJSONSource>
//               )}
//             </Map>

//             {/* FLOATING CARD */}
//             {showDetailsCard ? (
//               <View style={styles.card1}>
//                 {/* USER INFO */}
//                 <View style={styles.header}>
//                   <Image
//                     source={
//                       orderDetail?.customer?.profileImageUrl
//                         ? { uri: orderDetail.customer.profileImageUrl }
//                         : require('../assets/images/customer_image.png')
//                     }
//                     style={styles.avatar}
//                   />

//                   <View style={{ flex: 1 }}>
//                     <Text style={styles.name}>{orderDetail.customer.name}</Text>
//                     <Text style={styles.phone}>
//                       {orderDetail.customer.phone}
//                     </Text>
//                     <Text style={styles.address}>
//                       {orderDetail.customer.address.fullText}
//                     </Text>
//                   </View>

//                   <View style={styles.iconColumn}>
//                     <TouchableOpacity style={styles.circleBtn}>
//                       <Image
//                         source={require('../assets/images/call.png')}
//                         style={styles.smallIcon}
//                       />
//                     </TouchableOpacity>
//                   </View>
//                 </View>

//                 {/* ORDER INFO */}
//                 <View style={styles.orderRow}>
//                   <View
//                     style={{
//                       flexDirection: 'row',
//                       alignItems: 'center',
//                       gap: 5,
//                     }}
//                   >
//                     <Image
//                       source={require('../assets/images/shopping_bag.png')}
//                       style={styles.smallIconOrange}
//                     />

//                     <View>
//                       <Text style={styles.smallLabel}>
//                         {orderDetail.items.length} Items •{' '}
//                         {orderDetail.items.reduce(
//                           (acc, item) => acc + item.quantity,
//                           0,
//                         )}{' '}
//                         Qty
//                       </Text>
//                       <View
//                         style={{
//                           flexDirection: 'row',
//                           alignItems: 'center',
//                           gap: 4,
//                           marginTop: 2,
//                         }}
//                       >
//                         <Text style={styles.smallLabel}>Payment Status</Text>
//                         <View style={styles.codBadge}>
//                           <Text style={styles.codText}>
//                             {orderDetail.billing.paymentStatus}
//                           </Text>
//                         </View>
//                       </View>
//                     </View>
//                   </View>
//                   <View>
//                     <Text style={styles.smallLabel}>Order Amount</Text>
//                     <Text style={styles.amount}>
//                       ₹{orderDetail.billing.finalAmount.toFixed(2)}
//                     </Text>
//                   </View>
//                 </View>

//                 {/* LIVE STATUS */}
//                 <View style={styles.liveBox}>
//                   <View style={styles.iconCircle}>
//                     <Image
//                       source={require('../assets/images/scooter.png')}
//                       style={styles.bikeIcon}
//                     />
//                   </View>
//                   <View style={{ marginLeft: 10 }}>
//                     <Text style={styles.liveTitle}>Live Status</Text>
//                     <Text style={styles.liveText}>
//                       You are on the way to the customer
//                     </Text>
//                   </View>
//                 </View>

//                 {/* PROGRESS */}
//                 <View style={{ marginTop: 20 }}>
//                   <Text style={styles.progressTitle}>Order Progress</Text>

//                   <View style={styles.progressRow}>
//                     {[
//                       'Assigned',
//                       'Accepted',
//                       'Picked',
//                       'On The Way',
//                       'Delivered',
//                     ].map((item, index) => {
//                       const isActive = index <= 3;
//                       const isOnWay = item === 'On The Way';

//                       return (
//                         <View key={index} style={styles.stepContainer}>
//                           <View
//                             style={[
//                               styles.stepCircle,
//                               isActive && styles.activeStep,

//                               // LIGHT ORANGE BACKGROUND FOR ON WAY
//                               isOnWay && styles.onWayStep,
//                             ]}
//                           >
//                             {isOnWay ? (
//                               <Image
//                                 source={require('../assets/images/scooter.png')}
//                                 style={styles.scooterIcon}
//                               />
//                             ) : (
//                               <Image
//                                 source={require('../assets/images/check.png')}
//                                 style={[
//                                   styles.checkIcon,
//                                   {
//                                     tintColor: isActive
//                                       ? Colors.primary
//                                       : '#bbb',
//                                   },
//                                 ]}
//                               />
//                             )}
//                           </View>

//                           <Text style={styles.stepText}>{item}</Text>

//                           {index !== 4 && (
//                             <View
//                               style={[
//                                 styles.line,
//                                 index < 3 && styles.activeLine,
//                               ]}
//                             />
//                           )}
//                         </View>
//                       );
//                     })}
//                   </View>
//                 </View>

//                 {/* BUTTONS */}
//                 <View style={styles.buttonRow}>
//                   <TouchableOpacity
//                     style={styles.mapBtn}
//                     onPress={() => setShowDetailsCard(false)}
//                   >
//                     <Text style={styles.mapBtnText}>Open in Maps</Text>
//                   </TouchableOpacity>

//                   <TouchableOpacity
//                     style={styles.deliverBtn}
//                     onPress={() => sendOTP()}
//                   >
//                     <Text style={styles.deliverBtnText}>Order Delivered</Text>
//                   </TouchableOpacity>
//                 </View>
//               </View>
//             ) : (
//               <TouchableOpacity
//                 activeOpacity={0.8}
//                 style={styles.floatingShowButton}
//                 onPress={() => setShowDetailsCard(true)}
//               >
//                 <Image
//                   source={require('../assets/images/shopping_bag.png')}
//                   style={styles.floatingArrow}
//                 />
//               </TouchableOpacity>
//             )}
//           </View>
//         </View>
//       </View>
//       <GlobalLoader visible={loading} />
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: Colors.primary,
//     paddingTop: 100,
//   },

//   overlay: {
//     flex: 1,
//     borderTopLeftRadius: 30,
//     borderTopRightRadius: 30,
//     marginTop: 20,
//   },

//   card: {
//     backgroundColor: '#fff',
//     borderTopLeftRadius: 20,
//     borderTopRightRadius: 20,
//     flex: 1,
//   },

//   mapContainer: {
//     flex: 1,
//     borderTopLeftRadius: 20,
//     borderTopRightRadius: 20,
//     overflow: 'hidden',
//   },

//   map: {
//     flex: 1,
//   },

//   currentMarkerWrapper: {
//     width: 44,
//     height: 44,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },

//   deliveryIcon: {
//     width: 80,
//     height: 80,

//     // REMOVE THIS IF IMAGE ALREADY ORANGE
//     // tintColor: Colors.primary,
//   },

//   destinationMarkerWrapper: {
//     width: 30,
//     height: 30,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },

//   destinationMarker: {
//     width: 18,
//     height: 18,
//     borderRadius: 9,
//     backgroundColor: 'red',
//     borderWidth: 3,
//     borderColor: '#fff',
//   },
//   card1: {
//     position: 'absolute',
//     bottom: 20,
//     left: 15,
//     right: 15,
//     backgroundColor: '#fff',
//     borderRadius: 25,
//     padding: 18,

//     shadowColor: '#000',
//     shadowOpacity: 0.15,
//     shadowRadius: 10,
//     shadowOffset: {
//       width: 0,
//       height: 5,
//     },
//     elevation: 8,
//   },

//   header: {
//     flexDirection: 'row',
//     alignItems: 'flex-start',
//     justifyContent: 'space-between',
//   },

//   avatar: {
//     width: 60,
//     height: 60,
//     borderRadius: 20,
//     marginRight: 12,
//   },

//   name: {
//     fontSize: 18,
//     fontFamily: FontFamily.medium,
//     color: Colors.textColor,
//   },

//   phone: {
//     color: Colors.textBrown,
//     fontFamily: FontFamily.regular,
//     marginTop: 2,
//     fontSize: 12,
//   },

//   address: {
//     color: Colors.textBrown,
//     marginTop: 2,
//     fontSize: 12,
//     fontFamily: FontFamily.regular,
//   },

//   iconColumn: {
//     gap: 0,
//   },

//   circleBtn: {
//     width: 38,
//     height: 38,
//     borderRadius: 19,
//     backgroundColor: '#7bc043',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },

//   orderRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     marginTop: 20,
//   },

//   smallLabel: {
//     color: Colors.textBrown,
//     fontSize: 14,
//     fontFamily: FontFamily.regular,
//   },

//   boldText: {
//     fontFamily: FontFamily.bold,
//     marginTop: 2,
//     fontSize: 14,
//   },

//   amount: {
//     color: Colors.primary,
//     fontSize: 18,
//     fontFamily: FontFamily.regular,
//     marginTop: 2,
//   },

//   liveBox: {
//     flexDirection: 'row',
//     backgroundColor: '#FEF6F3',
//     padding: 6,
//     borderRadius: 10,
//     marginTop: 18,
//     alignItems: 'center',
//   },

//   liveTitle: {
//     color: Colors.textColor,
//     fontFamily: FontFamily.medium,
//   },

//   liveText: {
//     color: Colors.textBrown,
//     marginTop: 3,
//     fontSize: 12,
//     fontFamily: FontFamily.regular,
//   },

//   progressTitle: {
//     fontFamily: FontFamily.medium,
//     marginBottom: 15,
//     color: Colors.textColor,
//   },

//   progressRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//   },

//   stepContainer: {
//     alignItems: 'center',
//     flex: 1,
//     position: 'relative',
//     justifyContent: 'flex-start',
//   },

//   stepCircle: {
//     width: 30,
//     height: 30,
//     borderRadius: 15,
//     backgroundColor: '#e5e5e5',
//     justifyContent: 'center',
//     alignItems: 'center',
//     zIndex: 2,
//   },
//   activeStep: {
//     backgroundColor: Colors.lightOrange,
//   },

//   line: {
//     position: 'absolute',
//     top: 12,
//     left: '50%',
//     width: '100%',
//     height: 3,
//     backgroundColor: '#ddd',
//     zIndex: 1,
//   },

//   activeLine: {
//     backgroundColor: Colors.primary,
//   },

//   stepText: {
//     fontSize: 10,
//     marginTop: 10,
//     color: Colors.textBrown,
//     textAlign: 'center',
//     fontFamily: FontFamily.regular,
//   },

//   buttonRow: {
//     flexDirection: 'row',
//     marginTop: 25,
//     gap: 12,
//   },

//   mapBtn: {
//     flex: 1,
//     backgroundColor: Colors.buttonLight,
//     paddingVertical: 14,
//     borderRadius: 14,
//     alignItems: 'center',
//   },

//   deliverBtn: {
//     flex: 1,
//     backgroundColor: Colors.primary,
//     paddingVertical: 14,
//     borderRadius: 14,
//     alignItems: 'center',
//   },

//   mapBtnText: {
//     color: Colors.primary,
//     fontFamily: FontFamily.regular,
//     fontSize: 16,
//   },

//   deliverBtnText: {
//     color: '#fff',
//     fontFamily: FontFamily.regular,
//     fontSize: 16,
//   },

//   smallIcon: {
//     width: 18,
//     height: 18,
//     tintColor: '#fff',
//   },

//   smallIconOrange: {
//     width: 30,
//     height: 30,
//     tintColor: Colors.primary,
//   },

//   bikeIcon: {
//     width: 24,
//     height: 24,
//     tintColor: Colors.primary,
//   },

//   checkIcon: {
//     width: 16,
//     height: 16,
//   },
//   iconCircle: {
//     width: 60,
//     height: 60,
//     borderRadius: 30,
//     backgroundColor: Colors.lightOrange,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   codBadge: {
//     backgroundColor: Colors.lightBackground,
//     paddingHorizontal: 8,
//     paddingVertical: 3,
//     borderRadius: 20,
//     marginLeft: 2,
//   },

//   codText: {
//     color: Colors.primary,
//     fontSize: 12,
//     fontFamily: FontFamily.semiBold,
//   },
//   onWayStep: {
//     width: 30,
//     height: 30,
//     borderRadius: 15,
//     backgroundColor: Colors.lightOrange,

//     justifyContent: 'center',
//     alignItems: 'center',

//     zIndex: 3,
//   },

//   scooterIcon: {
//     width: 20,
//     height: 20,
//     tintColor: Colors.primary,
//   },
//   hideButton: {
//     width: 32,
//     height: 32,
//     borderRadius: 16,
//     backgroundColor: '#F5F5F5',
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginLeft: 10,
//   },

//   hideIcon: {
//     width: 16,
//     height: 16,
//     tintColor: Colors.textColor,
//   },

//   floatingShowButton: {
//     position: 'absolute',
//     bottom: 30,
//     right: 20,
//     width: 40,
//     height: 40,
//     borderRadius: 20,

//     backgroundColor: Colors.primary,

//     justifyContent: 'center',
//     alignItems: 'center',

//     shadowColor: '#000',
//     shadowOpacity: 0.2,
//     shadowRadius: 8,
//     shadowOffset: {
//       width: 0,
//       height: 4,
//     },

//     elevation: 10,
//   },

//   floatingArrow: {
//     width: 24,
//     height: 24,
//     tintColor: '#fff',
//   },
// });

//************************************ */

// import React, { useEffect, useState, useRef } from 'react';
// import {
//   View,
//   StyleSheet,
//   PermissionsAndroid,
//   Platform,
//   Image,
//   Text,
//   TouchableOpacity,
//   ToastAndroid,
//   Alert,
// } from 'react-native';

// import {
//   Map,
//   Camera,
//   Marker,
//   GeoJSONSource,
//   Layer,
// } from '@maplibre/maplibre-react-native';

// import Geolocation from 'react-native-geolocation-service';
// import axios from 'axios';

// import Colors from '../assets/Colors/Colors';
// import GlobalTopBarDelivery from '../GlobalContainer/GlobalTopBarDelivery';
// import { DeliveryOrderDetails } from '../Models/DeliveryOrderDetails/DeliveryOrderDetails';
// import { FontFamily } from '../assets/GlobalFont/GlobalFont';
// import GlobalLoginAuth from '../GlobalContainer/GlobalLoginAuth';
// import GlobalApi from '../GlobalContainer/GlobalApi';
// import GlobalLoader from '../GlobalContainer/GlobalLoader';
// import { SendOtpResponse } from '../Models/SendOTP/SendOtpResponse ';

// const DARK_MAP_STYLE =
//   'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

// export default function DeliveryStart({ route, navigation }: any) {
//   const {
//     orderDetail,
//   }: {
//     orderDetail: DeliveryOrderDetails;
//   } = route.params;

//   const [showDetailsCard, setShowDetailsCard] = useState(true);
//   const lastSnappedIndexRef = useRef(-1);
//   // DESTINATION
//   const [destinationLocation] = useState({
//     latitude: orderDetail.customer.address.latitude || 22.8948,

//     longitude: orderDetail.customer.address.longitude || 88.41,
//   });

//   // CURRENT LOCATION
//   const [currentLocation, setCurrentLocation] = useState<{
//     latitude: number;
//     longitude: number;
//   } | null>(null);

//   // ROUTE
//   const [routeCoordinates, setRouteCoordinates] = useState<any[]>([]);
//   const routeCoordinatesRef = useRef<any[]>([]);
//   const [remainingRoute, setRemainingRoute] = useState<any[]>([]);
//   const headingRef = useRef(0);
//   const cameraHeadingRef = useRef(0);
//   const markerAnimationRef = useRef<any>(null);   // cancel old animation before new one
//   const headingAnimationRef = useRef<any>(null);  // cancel old heading animation
//   const riderPositionRef = useRef<{ latitude: number; longitude: number } | null>(null); // always fresh position
//   const [riderPosition, setRiderPosition] = useState<{
//     latitude: number;
//     longitude: number;
//   } | null>(null);
//   // CAMERA HEADING
//   const [cameraHeading, setCameraHeading] = useState(0);

//   // SCOOTER HEADING
//   const [markerHeading, setMarkerHeading] = useState(0);
//   const [loading, setLoading] = useState(false);

//   const [locationHistory, setLocationHistory] = useState<
//     { latitude: number; longitude: number }[]
//   >([]);
//   // PREVIOUS LOCATION
//   const previousCoordinateRef = useRef<{
//     latitude: number;
//     longitude: number;
//   } | null>(null);

//   // REQUEST LOCATION PERMISSION
//   const requestLocationPermission = async () => {
//     if (Platform.OS === 'android') {
//       const granted = await PermissionsAndroid.request(
//         PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
//       );

//       if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
//         console.log('Location permission denied');
//       }
//     }
//   };

//   const calculateBearing = (
//     startLat: number,

//     startLng: number,

//     endLat: number,

//     endLng: number,
//   ) => {
//     const dLon = ((endLng - startLng) * Math.PI) / 180;

//     const y = Math.sin(dLon) * Math.cos((endLat * Math.PI) / 180);

//     const x =
//       Math.cos((startLat * Math.PI) / 180) *
//         Math.sin((endLat * Math.PI) / 180) -
//       Math.sin((startLat * Math.PI) / 180) *
//         Math.cos((endLat * Math.PI) / 180) *
//         Math.cos(dLon);

//     const brng = (Math.atan2(y, x) * 180) / Math.PI;

//     return (brng + 360) % 360;
//   };

//   // DISTANCE BETWEEN TWO POINTS
//   const getDistance = (
//     lat1: number,
//     lon1: number,
//     lat2: number,
//     lon2: number,
//   ) => {
//     const R = 6371e3;

//     const φ1 = (lat1 * Math.PI) / 180;
//     const φ2 = (lat2 * Math.PI) / 180;

//     const Δφ = ((lat2 - lat1) * Math.PI) / 180;

//     const Δλ = ((lon2 - lon1) * Math.PI) / 180;

//     const a =
//       Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
//       Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

//     const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

//     return R * c;
//   };

//   const getProjectedPointOnSegment = (
//     lat: number,
//     lng: number,
//     startLat: number,
//     startLng: number,
//     endLat: number,
//     endLng: number,
//   ) => {
//     const dx = endLng - startLng;
//     const dy = endLat - startLat;

//     const lengthSquared = dx * dx + dy * dy;

//     if (lengthSquared === 0) {
//       return {
//         latitude: startLat,
//         longitude: startLng,
//         t: 0,
//       };
//     }

//     let t = ((lng - startLng) * dx + (lat - startLat) * dy) / lengthSquared;

//     t = Math.max(0, Math.min(1, t));

//     return {
//       latitude: startLat + t * dy,
//       longitude: startLng + t * dx,
//       t,
//     };
//   };

//   const getNearestPointOnRoute = (
//     latitude: number,
//     longitude: number,
//     route: any[],
//   ) => {
//     if (route.length < 2) {
//       return null;
//     }

//     let minDistance = Infinity;

//     let nearestIndex = 0;

//     let projectedPoint: any = null;

//     for (let i = 0; i < route.length - 1; i++) {
//       const start = route[i];
//       const end = route[i + 1];

//       const projected = getProjectedPointOnSegment(
//         latitude,
//         longitude,
//         start[1],
//         start[0],
//         end[1],
//         end[0],
//       );

//       const distance = getDistance(
//         latitude,
//         longitude,
//         projected.latitude,
//         projected.longitude,
//       );

//       if (distance < minDistance) {
//         minDistance = distance;
//         nearestIndex = i;
//         projectedPoint = projected;
//       }
//     }

//     return {
//       index: nearestIndex,
//       distance: minDistance,
//       point: projectedPoint,
//     };
//   };
//   // ROUTE API
//   const getRoute = async (
//     startLat: number,
//     startLng: number,
//     endLat: number,
//     endLng: number,
//   ) => {
//     try {
//       const response = await axios.get(
//         `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`,
//       );

//       if (
//         response.data &&
//         response.data.routes &&
//         response.data.routes.length > 0
//       ) {
//         const osrmCoordinates = response.data.routes[0].geometry.coordinates;

//         // Insert actual GPS as first point
//         const coordinates = [[startLng, startLat], ...osrmCoordinates];

//         for (let i = 0; i < 5; i++) {
//           const dist = getDistance(
//             coordinates[i][1],
//             coordinates[i][0],
//             coordinates[i + 1][1],
//             coordinates[i + 1][0],
//           );

//           console.log(`Distance ${i} -> ${i + 1}:`, dist);
//         }
//         setRouteCoordinates(coordinates);
//         routeCoordinatesRef.current = coordinates;

//         console.log('Route Length:', coordinates.length);

//         console.log('First Route Point:', coordinates[0]);

//         console.log('Start GPS:', startLat, startLng);

//         console.log(
//           'Distance Between Start And Route Point:',
//           getDistance(startLat, startLng, coordinates[0][1], coordinates[0][0]),
//         );

//         if (!riderPosition && coordinates.length > 0) {
//           const initialPos = {
//             latitude: coordinates[0][1],
//             longitude: coordinates[0][0],
//           };
//           riderPositionRef.current = initialPos;
//           setRiderPosition(initialPos);

//           lastSnappedIndexRef.current = 0;

//           setRemainingRoute(coordinates);
//         }
//       }
//     } catch (error) {
//       console.log('ROUTE ERROR', error);
//     }
//   };

//   // INITIAL LOCATION
//   const getCurrentLocation = async () => {
//     Geolocation.getCurrentPosition(
//       async position => {
//         const latitude = position.coords.latitude;

//         const longitude = position.coords.longitude;

//         setCurrentLocation({
//           latitude,
//           longitude,
//         });

//         previousCoordinateRef.current = {
//           latitude,
//           longitude,
//         };

//         await getRoute(
//           latitude,
//           longitude,
//           destinationLocation.latitude,
//           destinationLocation.longitude,
//         );
//       },

//       error => {
//         console.log(error);
//       },

//       {
//         enableHighAccuracy: true,
//         timeout: 15000,
//         maximumAge: 10000,
//       },
//     );
//   };

//   // LIVE TRACKING
//   useEffect(() => {
//     requestLocationPermission();

//     getCurrentLocation();

//     const animateMarker = (
//       startLat: number,
//       startLng: number,
//       endLat: number,
//       endLng: number,
//     ) => {
//       // CANCEL previous animation — nahi to purani aur nayi dono chalti hain
//       if (markerAnimationRef.current) {
//         clearInterval(markerAnimationRef.current);
//         markerAnimationRef.current = null;
//       }

//       // Bike fast ho to kam steps — marker peeche nahi rahega
//       const distance = Math.sqrt(
//         Math.pow(endLat - startLat, 2) + Math.pow(endLng - startLng, 2)
//       );
//       // Fast movement = fewer steps (snap quickly), slow = more steps (smooth)
//       const steps = distance > 0.0005 ? 10 : 20; // ~55m threshold
//       let currentStep = 0;

//       const interval = setInterval(() => {
//         currentStep++;
//         const progress = currentStep / steps;
//         const newPos = {
//           latitude: startLat + (endLat - startLat) * progress,
//           longitude: startLng + (endLng - startLng) * progress,
//         };
//         riderPositionRef.current = newPos;
//         setRiderPosition(newPos);

//         if (currentStep >= steps) {
//           clearInterval(interval);
//           markerAnimationRef.current = null;
//         }
//       }, 50);

//       markerAnimationRef.current = interval;
//     };

//     // SMOOTH HEADING ANIMATION
//     const animateHeading = (fromBearing: number, toBearing: number) => {
//       // CANCEL previous heading animation
//       if (headingAnimationRef.current) {
//         clearInterval(headingAnimationRef.current);
//         headingAnimationRef.current = null;
//       }

//       let delta = toBearing - fromBearing;
//       if (delta > 180) delta -= 360;
//       if (delta < -180) delta += 360;

//       const steps = 15; // fast turn — heading peeche nahi rahegi
//       let currentStep = 0;

//       const interval = setInterval(() => {
//         currentStep++;
//         const progress = currentStep / steps;
//         const newHeading = (fromBearing + delta * progress + 360) % 360;
//         headingRef.current = newHeading;
//         setMarkerHeading(newHeading);
//         setCameraHeading(newHeading);
//         cameraHeadingRef.current = newHeading;

//         if (currentStep >= steps) {
//           clearInterval(interval);
//           headingAnimationRef.current = null;
//         }
//       }, 50);

//       headingAnimationRef.current = interval;
//     };
//     const watchId = Geolocation.watchPosition(
//       async position => {
//         const latitude = position.coords.latitude;

//         const longitude = position.coords.longitude;

//         const previous = previousCoordinateRef.current;

//         if (previous) {
//           const movedDistance = getDistance(
//             previous.latitude,
//             previous.longitude,
//             latitude,
//             longitude,
//           );

//           console.log('GPS Move Distance:', movedDistance);
//         }

//         // UPDATE LOCATION
//         setCurrentLocation({
//           latitude,
//           longitude,
//         });
//         // ARRAY ME STORE KARO
//         setLocationHistory(prev => {
//           const updated = [
//             ...prev,
//             {
//               latitude,
//               longitude,
//             },
//           ];

//           // // TOAST ME DIKHAO
//           // ToastAndroid.show(
//           //   JSON.stringify(updated),
//           //   ToastAndroid.SHORT,
//           // );

//           return updated;
//         });

//         const route = routeCoordinatesRef.current;

//         if (route.length < 2) {
//           return;
//         }
//         // CALCULATE HEADING
//         if (previous) {
//           const movedDistance = getDistance(
//             previous.latitude,
//             previous.longitude,
//             latitude,
//             longitude,
//           );
//           ToastAndroid.show(
//             `Rider moved: ${movedDistance.toFixed(1)} meter`,
//             ToastAndroid.SHORT,
//           );

//           console.log('GPS Move Distance:', movedDistance);
//           // if (movedDistance < 3) {
//           //   return;
//           // }
//           const route = routeCoordinatesRef.current;
//           if (route.length > 1) {
//             const snapped = getNearestPointOnRoute(latitude, longitude, route);

//             if (snapped) {
//               // riderPositionRef use karo — state stale hoti hai closure mein
//               if (riderPositionRef.current) {
//                 animateMarker(
//                   riderPositionRef.current.latitude,
//                   riderPositionRef.current.longitude,
//                   snapped.point.latitude,
//                   snapped.point.longitude,
//                 );
//               } else {
//                 const pos = {
//                   latitude: snapped.point.latitude,
//                   longitude: snapped.point.longitude,
//                 };
//                 riderPositionRef.current = pos;
//                 setRiderPosition(pos);
//               }

//               const currentMatchedPoint = [
//                 snapped.point.longitude,
//                 snapped.point.latitude,
//               ];

//               setRemainingRoute([
//                 currentMatchedPoint,
//                 ...route.slice(snapped.index + 1),
//               ]);

//               if (snapped.index !== lastSnappedIndexRef.current) {
//                 lastSnappedIndexRef.current = snapped.index;
//               }

//               if (snapped.index < route.length - 1) {
//                 const current = route[snapped.index];
//                 const next = route[snapped.index + 1];

//                 const routeBearing = calculateBearing(
//                   current[1],
//                   current[0],
//                   next[1],
//                   next[0],
//                 );

//                 if (Math.abs(routeBearing - headingRef.current) > 5) {
//                   animateHeading(headingRef.current, routeBearing);
//                 }
//               }
//             }
//           }
//         }

//         previousCoordinateRef.current = {
//           latitude,
//           longitude,
//         };
//       },

//       error => {
//         console.log(error);
//       },

//       {
//         enableHighAccuracy: true,
//         distanceFilter: 5,       // walk: 1m theek, bike: 5m better — kam spam
//         interval: 2000,          // har 2 sec update — animation complete hone ka time milta hai
//         fastestInterval: 1000,
//         showLocationDialog: true,
//         forceRequestLocation: true,
//       },
//     );

//     return () => {
//       Geolocation.clearWatch(watchId);
//     };
//   }, []);

//   const sendOTP = async () => {
//     try {
//       setLoading(true);

//       console.log(
//         'Fetching dashboard data with token:',
//         GlobalLoginAuth.refreshToken,
//       );

//       const response = await fetch(
//         `${GlobalApi.baseUrl}api/deliveries/me/orders/${orderDetail?.order.id}/send-otp`,

//         {
//           method: 'POST',

//           headers: {
//             'Content-Type': 'application/json',

//             Authorization: `Bearer ${GlobalLoginAuth.accessToken}`,
//           },
//         },
//       );

//       const result = await response.json();

//       const SendOtpResponse = result as SendOtpResponse; // âœ… Type assertion to ensure it matches our model

//       console.log('Generate OTP Response:', result);

//       if (!response.ok) {
//         Alert.alert('FoodyPly', result.message || 'Failed to load dashboard');

//         return;
//       }

//       if (SendOtpResponse.success) {
//         console.log('OTP sent successfully:', SendOtpResponse.data.otp);

//         navigation.navigate('DeliveryOtpVerification', {
//           orderDetail: orderDetail,
//           otp: SendOtpResponse.data.otp,
//         });
//       }
//     } catch (error) {
//       console.log(error);

//       Alert.alert('FoodyPly', 'Unable to connect to server');
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <View style={styles.container}>
//       <GlobalTopBarDelivery
//         navigation={navigation}
//         notificationClick={() => {}}
//         text="Start Delivery"
//         subtitleText={`#${orderDetail?.order.orderNumber}`}
//         isBackVisible={true}
//         isOnlineVisible={false}
//       />

//       <View style={styles.overlay}>
//         <View style={styles.card}>
//           <View style={styles.mapContainer}>
//             <Map
//               style={styles.map}
//               mapStyle={DARK_MAP_STYLE}
//               logo={false}
//               compass={true}
//             >
//               {/* CAMERA */}
//               {riderPosition && (
//                 <Camera
//                   zoom={18}
//                   pitch={0}
//                   bearing={cameraHeading}
//                   center={[riderPosition.longitude, riderPosition.latitude]}
//                   padding={{
//                     top: 100,
//                     bottom: 300,
//                     left: 0,
//                     right: 0,
//                   }}
//                 />
//               )}

//               {/* DELIVERY BOY MARKER */}
//               {riderPosition && (
//                 <Marker
//                   anchor="center"
//                   lngLat={[riderPosition.longitude, riderPosition.latitude]}
//                 >
//                   <View
//                     style={[
//                       styles.currentMarkerWrapper,
//                       {
//                         // transform: [
//                         //   {
//                         //     rotate: `${markerHeading}deg`,
//                         //   },
//                         // ],
//                       },
//                     ]}
//                   >
//                     <Image
//                       source={require('../assets/images/dman.png')}
//                       style={styles.deliveryIcon}
//                       resizeMode="contain"
//                     />
//                   </View>
//                 </Marker>
//               )}

//               {/* DESTINATION */}
//               <Marker
//                 anchor="center"
//                 lngLat={[
//                   destinationLocation.longitude,
//                   destinationLocation.latitude,
//                 ]}
//               >
//                 <View style={styles.destinationMarkerWrapper}>
//                   <View style={styles.destinationMarker} />
//                 </View>
//               </Marker>

//               {/* ROUTE */}
//               {routeCoordinates.length > 1 && (
//                 <GeoJSONSource
//                   id="routeSource"
//                   data={{
//                     type: 'FeatureCollection',
//                     features: [
//                       {
//                         type: 'Feature',
//                         properties: {},
//                         geometry: {
//                           type: 'LineString',
//                           coordinates: remainingRoute,
//                         },
//                       },
//                     ],
//                   }}
//                 >
//                   {/* ROUTE SHADOW */}
//                   <Layer
//                     id="routeLayerBg"
//                     type="line"
//                     paint={{
//                       'line-color': '#0B3B2E',
//                       'line-width': 10,
//                       'line-opacity': 0.7,
//                     }}
//                     layout={{
//                       'line-cap': 'round',
//                       'line-join': 'round',
//                     }}
//                   />

//                   {/* MAIN ROUTE */}
//                   <Layer
//                     id="routeLayer"
//                     type="line"
//                     paint={{
//                       'line-color': '#00FF9D',
//                       'line-width': 6,
//                       'line-opacity': 1,
//                     }}
//                     layout={{
//                       'line-cap': 'round',
//                       'line-join': 'round',
//                     }}
//                   />
//                 </GeoJSONSource>
//               )}
//             </Map>

//             {/* FLOATING CARD */}
//             {showDetailsCard ? (
//               <View style={styles.card1}>
//                 {/* USER INFO */}
//                 <View style={styles.header}>
//                   <Image
//                     source={
//                       orderDetail?.customer?.profileImageUrl
//                         ? { uri: orderDetail.customer.profileImageUrl }
//                         : require('../assets/images/customer_image.png')
//                     }
//                     style={styles.avatar}
//                   />

//                   <View style={{ flex: 1 }}>
//                     <Text style={styles.name}>{orderDetail.customer.name}</Text>
//                     <Text style={styles.phone}>
//                       {orderDetail.customer.phone}
//                     </Text>
//                     <Text style={styles.address}>
//                       {orderDetail.customer.address.fullText}
//                     </Text>
//                   </View>

//                   <View style={styles.iconColumn}>
//                     <TouchableOpacity style={styles.circleBtn}>
//                       <Image
//                         source={require('../assets/images/call.png')}
//                         style={styles.smallIcon}
//                       />
//                     </TouchableOpacity>
//                   </View>
//                 </View>

//                 {/* ORDER INFO */}
//                 <View style={styles.orderRow}>
//                   <View
//                     style={{
//                       flexDirection: 'row',
//                       alignItems: 'center',
//                       gap: 5,
//                     }}
//                   >
//                     <Image
//                       source={require('../assets/images/shopping_bag.png')}
//                       style={styles.smallIconOrange}
//                     />

//                     <View>
//                       <Text style={styles.smallLabel}>
//                         {orderDetail.items.length} Items •{' '}
//                         {orderDetail.items.reduce(
//                           (acc, item) => acc + item.quantity,
//                           0,
//                         )}{' '}
//                         Qty
//                       </Text>
//                       <View
//                         style={{
//                           flexDirection: 'row',
//                           alignItems: 'center',
//                           gap: 4,
//                           marginTop: 2,
//                         }}
//                       >
//                         <Text style={styles.smallLabel}>Payment Status</Text>
//                         <View style={styles.codBadge}>
//                           <Text style={styles.codText}>
//                             {orderDetail.billing.paymentStatus}
//                           </Text>
//                         </View>
//                       </View>
//                     </View>
//                   </View>
//                   <View>
//                     <Text style={styles.smallLabel}>Order Amount</Text>
//                     <Text style={styles.amount}>
//                       ₹{orderDetail.billing.finalAmount.toFixed(2)}
//                     </Text>
//                   </View>
//                 </View>

//                 {/* LIVE STATUS */}
//                 <View style={styles.liveBox}>
//                   <View style={styles.iconCircle}>
//                     <Image
//                       source={require('../assets/images/scooter.png')}
//                       style={styles.bikeIcon}
//                     />
//                   </View>
//                   <View style={{ marginLeft: 10 }}>
//                     <Text style={styles.liveTitle}>Live Status</Text>
//                     <Text style={styles.liveText}>
//                       You are on the way to the customer
//                     </Text>
//                   </View>
//                 </View>

//                 {/* PROGRESS */}
//                 <View style={{ marginTop: 20 }}>
//                   <Text style={styles.progressTitle}>Order Progress</Text>

//                   <View style={styles.progressRow}>
//                     {[
//                       'Assigned',
//                       'Accepted',
//                       'Picked',
//                       'On The Way',
//                       'Delivered',
//                     ].map((item, index) => {
//                       const isActive = index <= 3;
//                       const isOnWay = item === 'On The Way';

//                       return (
//                         <View key={index} style={styles.stepContainer}>
//                           <View
//                             style={[
//                               styles.stepCircle,
//                               isActive && styles.activeStep,

//                               // LIGHT ORANGE BACKGROUND FOR ON WAY
//                               isOnWay && styles.onWayStep,
//                             ]}
//                           >
//                             {isOnWay ? (
//                               <Image
//                                 source={require('../assets/images/scooter.png')}
//                                 style={styles.scooterIcon}
//                               />
//                             ) : (
//                               <Image
//                                 source={require('../assets/images/check.png')}
//                                 style={[
//                                   styles.checkIcon,
//                                   {
//                                     tintColor: isActive
//                                       ? Colors.primary
//                                       : '#bbb',
//                                   },
//                                 ]}
//                               />
//                             )}
//                           </View>

//                           <Text style={styles.stepText}>{item}</Text>

//                           {index !== 4 && (
//                             <View
//                               style={[
//                                 styles.line,
//                                 index < 3 && styles.activeLine,
//                               ]}
//                             />
//                           )}
//                         </View>
//                       );
//                     })}
//                   </View>
//                 </View>

//                 {/* BUTTONS */}
//                 <View style={styles.buttonRow}>
//                   <TouchableOpacity
//                     style={styles.mapBtn}
//                     onPress={() => setShowDetailsCard(false)}
//                   >
//                     <Text style={styles.mapBtnText}>Open in Maps</Text>
//                   </TouchableOpacity>

//                   <TouchableOpacity
//                     style={styles.deliverBtn}
//                     onPress={() => sendOTP()}
//                   >
//                     <Text style={styles.deliverBtnText}>Order Delivered</Text>
//                   </TouchableOpacity>
//                 </View>
//               </View>
//             ) : (
//               <TouchableOpacity
//                 activeOpacity={0.8}
//                 style={styles.floatingShowButton}
//                 onPress={() => setShowDetailsCard(true)}
//               >
//                 <Image
//                   source={require('../assets/images/shopping_bag.png')}
//                   style={styles.floatingArrow}
//                 />
//               </TouchableOpacity>
//             )}
//           </View>
//         </View>
//       </View>
//       <GlobalLoader visible={loading} />
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: Colors.primary,
//     paddingTop: 100,
//   },

//   overlay: {
//     flex: 1,
//     borderTopLeftRadius: 30,
//     borderTopRightRadius: 30,
//     marginTop: 20,
//   },

//   card: {
//     backgroundColor: '#fff',
//     borderTopLeftRadius: 20,
//     borderTopRightRadius: 20,
//     flex: 1,
//   },

//   mapContainer: {
//     flex: 1,
//     borderTopLeftRadius: 20,
//     borderTopRightRadius: 20,
//     overflow: 'hidden',
//   },

//   map: {
//     flex: 1,
//   },

//   currentMarkerWrapper: {
//     width: 44,
//     height: 44,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },

//   deliveryIcon: {
//     width: 80,
//     height: 80,

//     // REMOVE THIS IF IMAGE ALREADY ORANGE
//     // tintColor: Colors.primary,
//   },

//   destinationMarkerWrapper: {
//     width: 30,
//     height: 30,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },

//   destinationMarker: {
//     width: 18,
//     height: 18,
//     borderRadius: 9,
//     backgroundColor: 'red',
//     borderWidth: 3,
//     borderColor: '#fff',
//   },
//   card1: {
//     position: 'absolute',
//     bottom: 20,
//     left: 15,
//     right: 15,
//     backgroundColor: '#fff',
//     borderRadius: 25,
//     padding: 18,

//     shadowColor: '#000',
//     shadowOpacity: 0.15,
//     shadowRadius: 10,
//     shadowOffset: {
//       width: 0,
//       height: 5,
//     },
//     elevation: 8,
//   },

//   header: {
//     flexDirection: 'row',
//     alignItems: 'flex-start',
//     justifyContent: 'space-between',
//   },

//   avatar: {
//     width: 60,
//     height: 60,
//     borderRadius: 20,
//     marginRight: 12,
//   },

//   name: {
//     fontSize: 18,
//     fontFamily: FontFamily.medium,
//     color: Colors.textColor,
//   },

//   phone: {
//     color: Colors.textBrown,
//     fontFamily: FontFamily.regular,
//     marginTop: 2,
//     fontSize: 12,
//   },

//   address: {
//     color: Colors.textBrown,
//     marginTop: 2,
//     fontSize: 12,
//     fontFamily: FontFamily.regular,
//   },

//   iconColumn: {
//     gap: 0,
//   },

//   circleBtn: {
//     width: 38,
//     height: 38,
//     borderRadius: 19,
//     backgroundColor: '#7bc043',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },

//   orderRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     marginTop: 20,
//   },

//   smallLabel: {
//     color: Colors.textBrown,
//     fontSize: 14,
//     fontFamily: FontFamily.regular,
//   },

//   boldText: {
//     fontFamily: FontFamily.bold,
//     marginTop: 2,
//     fontSize: 14,
//   },

//   amount: {
//     color: Colors.primary,
//     fontSize: 18,
//     fontFamily: FontFamily.regular,
//     marginTop: 2,
//   },

//   liveBox: {
//     flexDirection: 'row',
//     backgroundColor: '#FEF6F3',
//     padding: 6,
//     borderRadius: 10,
//     marginTop: 18,
//     alignItems: 'center',
//   },

//   liveTitle: {
//     color: Colors.textColor,
//     fontFamily: FontFamily.medium,
//   },

//   liveText: {
//     color: Colors.textBrown,
//     marginTop: 3,
//     fontSize: 12,
//     fontFamily: FontFamily.regular,
//   },

//   progressTitle: {
//     fontFamily: FontFamily.medium,
//     marginBottom: 15,
//     color: Colors.textColor,
//   },

//   progressRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//   },

//   stepContainer: {
//     alignItems: 'center',
//     flex: 1,
//     position: 'relative',
//     justifyContent: 'flex-start',
//   },

//   stepCircle: {
//     width: 30,
//     height: 30,
//     borderRadius: 15,
//     backgroundColor: '#e5e5e5',
//     justifyContent: 'center',
//     alignItems: 'center',
//     zIndex: 2,
//   },
//   activeStep: {
//     backgroundColor: Colors.lightOrange,
//   },

//   line: {
//     position: 'absolute',
//     top: 12,
//     left: '50%',
//     width: '100%',
//     height: 3,
//     backgroundColor: '#ddd',
//     zIndex: 1,
//   },

//   activeLine: {
//     backgroundColor: Colors.primary,
//   },

//   stepText: {
//     fontSize: 10,
//     marginTop: 10,
//     color: Colors.textBrown,
//     textAlign: 'center',
//     fontFamily: FontFamily.regular,
//   },

//   buttonRow: {
//     flexDirection: 'row',
//     marginTop: 25,
//     gap: 12,
//   },

//   mapBtn: {
//     flex: 1,
//     backgroundColor: Colors.buttonLight,
//     paddingVertical: 14,
//     borderRadius: 14,
//     alignItems: 'center',
//   },

//   deliverBtn: {
//     flex: 1,
//     backgroundColor: Colors.primary,
//     paddingVertical: 14,
//     borderRadius: 14,
//     alignItems: 'center',
//   },

//   mapBtnText: {
//     color: Colors.primary,
//     fontFamily: FontFamily.regular,
//     fontSize: 16,
//   },

//   deliverBtnText: {
//     color: '#fff',
//     fontFamily: FontFamily.regular,
//     fontSize: 16,
//   },

//   smallIcon: {
//     width: 18,
//     height: 18,
//     tintColor: '#fff',
//   },

//   smallIconOrange: {
//     width: 30,
//     height: 30,
//     tintColor: Colors.primary,
//   },

//   bikeIcon: {
//     width: 24,
//     height: 24,
//     tintColor: Colors.primary,
//   },

//   checkIcon: {
//     width: 16,
//     height: 16,
//   },
//   iconCircle: {
//     width: 60,
//     height: 60,
//     borderRadius: 30,
//     backgroundColor: Colors.lightOrange,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   codBadge: {
//     backgroundColor: Colors.lightBackground,
//     paddingHorizontal: 8,
//     paddingVertical: 3,
//     borderRadius: 20,
//     marginLeft: 2,
//   },

//   codText: {
//     color: Colors.primary,
//     fontSize: 12,
//     fontFamily: FontFamily.semiBold,
//   },
//   onWayStep: {
//     width: 30,
//     height: 30,
//     borderRadius: 15,
//     backgroundColor: Colors.lightOrange,

//     justifyContent: 'center',
//     alignItems: 'center',

//     zIndex: 3,
//   },

//   scooterIcon: {
//     width: 20,
//     height: 20,
//     tintColor: Colors.primary,
//   },
//   hideButton: {
//     width: 32,
//     height: 32,
//     borderRadius: 16,
//     backgroundColor: '#F5F5F5',
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginLeft: 10,
//   },

//   hideIcon: {
//     width: 16,
//     height: 16,
//     tintColor: Colors.textColor,
//   },

//   floatingShowButton: {
//     position: 'absolute',
//     bottom: 30,
//     right: 20,
//     width: 40,
//     height: 40,
//     borderRadius: 20,

//     backgroundColor: Colors.primary,

//     justifyContent: 'center',
//     alignItems: 'center',

//     shadowColor: '#000',
//     shadowOpacity: 0.2,
//     shadowRadius: 8,
//     shadowOffset: {
//       width: 0,
//       height: 4,
//     },

//     elevation: 10,
//   },

//   floatingArrow: {
//     width: 24,
//     height: 24,
//     tintColor: '#fff',
//   },
// });

//************************************************* */

// import React, { useEffect, useState, useRef } from 'react';
// import {
//   View,
//   StyleSheet,
//   PermissionsAndroid,
//   Platform,
//   Image,
//   Text,
//   TouchableOpacity,
//   ToastAndroid,
//   Alert,
// } from 'react-native';

// import {
//   Map,
//   Camera,
//   Marker,
//   GeoJSONSource,
//   Layer,
// } from '@maplibre/maplibre-react-native';

// import Geolocation from 'react-native-geolocation-service';
// import axios from 'axios';

// import Colors from '../assets/Colors/Colors';
// import GlobalTopBarDelivery from '../GlobalContainer/GlobalTopBarDelivery';
// import { DeliveryOrderDetails } from '../Models/DeliveryOrderDetails/DeliveryOrderDetails';
// import { FontFamily } from '../assets/GlobalFont/GlobalFont';
// import GlobalLoginAuth from '../GlobalContainer/GlobalLoginAuth';
// import GlobalApi from '../GlobalContainer/GlobalApi';
// import GlobalLoader from '../GlobalContainer/GlobalLoader';
// import { SendOtpResponse } from '../Models/SendOTP/SendOtpResponse ';

// const DARK_MAP_STYLE =
//   'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

// export default function DeliveryStart({ route, navigation }: any) {
//   const {
//     orderDetail,
//   }: {
//     orderDetail: DeliveryOrderDetails;
//   } = route.params;

//   const [showDetailsCard, setShowDetailsCard] = useState(true);
//   const lastSnappedIndexRef = useRef(-1);
//   // DESTINATION
//   const [destinationLocation] = useState({
//     latitude: orderDetail.customer.address.latitude || 22.8948,

//     longitude: orderDetail.customer.address.longitude || 88.41,
//   });

//   // CURRENT LOCATION
//   const [currentLocation, setCurrentLocation] = useState<{
//     latitude: number;
//     longitude: number;
//   } | null>(null);

//   // ROUTE
//   const [routeCoordinates, setRouteCoordinates] = useState<any[]>([]);
//   const routeCoordinatesRef = useRef<any[]>([]);
//   const [remainingRoute, setRemainingRoute] = useState<any[]>([]);
//   const headingRef = useRef(0);
//   const cameraHeadingRef = useRef(0);
//   const [riderPosition, setRiderPosition] = useState<{
//     latitude: number;
//     longitude: number;
//   } | null>(null);
//   // CAMERA HEADING
//   const [cameraHeading, setCameraHeading] = useState(0);

//   // SCOOTER HEADING
//   const [markerHeading, setMarkerHeading] = useState(0);
//   const [loading, setLoading] = useState(false);

//   const [locationHistory, setLocationHistory] = useState<
//     { latitude: number; longitude: number }[]
//   >([]);
//   // PREVIOUS LOCATION
//   const previousCoordinateRef = useRef<{
//     latitude: number;
//     longitude: number;
//   } | null>(null);

//   // REQUEST LOCATION PERMISSION
//   const requestLocationPermission = async () => {
//     if (Platform.OS === 'android') {
//       const granted = await PermissionsAndroid.request(
//         PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
//       );

//       if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
//         console.log('Location permission denied');
//       }
//     }
//   };

//   const calculateBearing = (
//     startLat: number,

//     startLng: number,

//     endLat: number,

//     endLng: number,
//   ) => {
//     const dLon = ((endLng - startLng) * Math.PI) / 180;

//     const y = Math.sin(dLon) * Math.cos((endLat * Math.PI) / 180);

//     const x =
//       Math.cos((startLat * Math.PI) / 180) *
//         Math.sin((endLat * Math.PI) / 180) -
//       Math.sin((startLat * Math.PI) / 180) *
//         Math.cos((endLat * Math.PI) / 180) *
//         Math.cos(dLon);

//     const brng = (Math.atan2(y, x) * 180) / Math.PI;

//     return (brng + 360) % 360;
//   };

//   // DISTANCE BETWEEN TWO POINTS
//   const getDistance = (
//     lat1: number,
//     lon1: number,
//     lat2: number,
//     lon2: number,
//   ) => {
//     const R = 6371e3;

//     const φ1 = (lat1 * Math.PI) / 180;
//     const φ2 = (lat2 * Math.PI) / 180;

//     const Δφ = ((lat2 - lat1) * Math.PI) / 180;

//     const Δλ = ((lon2 - lon1) * Math.PI) / 180;

//     const a =
//       Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
//       Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

//     const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

//     return R * c;
//   };

//   const getProjectedPointOnSegment = (
//     lat: number,
//     lng: number,
//     startLat: number,
//     startLng: number,
//     endLat: number,
//     endLng: number,
//   ) => {
//     const dx = endLng - startLng;
//     const dy = endLat - startLat;

//     const lengthSquared = dx * dx + dy * dy;

//     if (lengthSquared === 0) {
//       return {
//         latitude: startLat,
//         longitude: startLng,
//         t: 0,
//       };
//     }

//     let t = ((lng - startLng) * dx + (lat - startLat) * dy) / lengthSquared;

//     t = Math.max(0, Math.min(1, t));

//     return {
//       latitude: startLat + t * dy,
//       longitude: startLng + t * dx,
//       t,
//     };
//   };

//   const getNearestPointOnRoute = (
//     latitude: number,
//     longitude: number,
//     route: any[],
//   ) => {
//     if (route.length < 2) {
//       return null;
//     }

//     let minDistance = Infinity;

//     let nearestIndex = 0;

//     let projectedPoint: any = null;

//     for (let i = 0; i < route.length - 1; i++) {
//       const start = route[i];
//       const end = route[i + 1];

//       const projected = getProjectedPointOnSegment(
//         latitude,
//         longitude,
//         start[1],
//         start[0],
//         end[1],
//         end[0],
//       );

//       const distance = getDistance(
//         latitude,
//         longitude,
//         projected.latitude,
//         projected.longitude,
//       );

//       if (distance < minDistance) {
//         minDistance = distance;
//         nearestIndex = i;
//         projectedPoint = projected;
//       }
//     }

//     return {
//       index: nearestIndex,
//       distance: minDistance,
//       point: projectedPoint,
//     };
//   };
//   // ROUTE API
//   const getRoute = async (
//     startLat: number,
//     startLng: number,
//     endLat: number,
//     endLng: number,
//   ) => {
//     try {
//       const response = await axios.get(
//         `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`,
//       );

//       if (
//         response.data &&
//         response.data.routes &&
//         response.data.routes.length > 0
//       ) {
//         const osrmCoordinates = response.data.routes[0].geometry.coordinates;

//         // Insert actual GPS as first point
//         const coordinates = [[startLng, startLat], ...osrmCoordinates];

//         for (let i = 0; i < 5; i++) {
//           const dist = getDistance(
//             coordinates[i][1],
//             coordinates[i][0],
//             coordinates[i + 1][1],
//             coordinates[i + 1][0],
//           );

//           console.log(`Distance ${i} -> ${i + 1}:`, dist);
//         }
//         setRouteCoordinates(coordinates);
//         routeCoordinatesRef.current = coordinates;

//         console.log('Route Length:', coordinates.length);

//         console.log('First Route Point:', coordinates[0]);

//         console.log('Start GPS:', startLat, startLng);

//         console.log(
//           'Distance Between Start And Route Point:',
//           getDistance(startLat, startLng, coordinates[0][1], coordinates[0][0]),
//         );

//         if (!riderPosition && coordinates.length > 0) {
//           setRiderPosition({
//             latitude: coordinates[0][1],
//             longitude: coordinates[0][0],
//           });

//           lastSnappedIndexRef.current = 0;

//           setRemainingRoute(coordinates);
//         }
//       }
//     } catch (error) {
//       console.log('ROUTE ERROR', error);
//     }
//   };

//   // INITIAL LOCATION
//   const getCurrentLocation = async () => {
//     Geolocation.getCurrentPosition(
//       async position => {
//         const latitude = position.coords.latitude;

//         const longitude = position.coords.longitude;

//         setCurrentLocation({
//           latitude,
//           longitude,
//         });

//         previousCoordinateRef.current = {
//           latitude,
//           longitude,
//         };

//         await getRoute(
//           latitude,
//           longitude,
//           destinationLocation.latitude,
//           destinationLocation.longitude,
//         );
//       },

//       error => {
//         console.log(error);
//       },

//       {
//         enableHighAccuracy: true,
//         timeout: 15000,
//         maximumAge: 10000,
//       },
//     );
//   };

//   // LIVE TRACKING
//   useEffect(() => {
//     requestLocationPermission();

//     getCurrentLocation();

//     const animateMarker = (
//       startLat: number,
//       startLng: number,
//       endLat: number,
//       endLng: number,
//     ) => {
//       const steps = 30;
//       let currentStep = 0;

//       const interval = setInterval(() => {
//         currentStep++;

//         const progress = currentStep / steps;

//         setRiderPosition({
//           latitude: startLat + (endLat - startLat) * progress,
//           longitude: startLng + (endLng - startLng) * progress,
//         });

//         if (currentStep >= steps) {
//           clearInterval(interval);
//         }
//       }, 50);
//     };

//     // SMOOTH HEADING ANIMATION
//     const animateHeading = (fromBearing: number, toBearing: number) => {
//       let delta = toBearing - fromBearing;
//       if (delta > 180) delta -= 360;
//       if (delta < -180) delta += 360;

//       const steps = 30;
//       let currentStep = 0;

//       const interval = setInterval(() => {
//         currentStep++;
//         const progress = currentStep / steps;
//         const newHeading = (fromBearing + delta * progress + 360) % 360;
//         headingRef.current = newHeading;
//         setMarkerHeading(newHeading);
//         setCameraHeading(newHeading);
//         cameraHeadingRef.current = newHeading;

//         if (currentStep >= steps) {
//           clearInterval(interval);
//         }
//       }, 50);
//     };
//     const watchId = Geolocation.watchPosition(
//       async position => {
//         const latitude = position.coords.latitude;

//         const longitude = position.coords.longitude;

//         const previous = previousCoordinateRef.current;

//         if (previous) {
//           const movedDistance = getDistance(
//             previous.latitude,
//             previous.longitude,
//             latitude,
//             longitude,
//           );

//           console.log('GPS Move Distance:', movedDistance);
//         }

//         // UPDATE LOCATION
//         setCurrentLocation({
//           latitude,
//           longitude,
//         });
//         // ARRAY ME STORE KARO
//         setLocationHistory(prev => {
//           const updated = [
//             ...prev,
//             {
//               latitude,
//               longitude,
//             },
//           ];

//           // // TOAST ME DIKHAO
//           // ToastAndroid.show(
//           //   JSON.stringify(updated),
//           //   ToastAndroid.SHORT,
//           // );

//           return updated;
//         });

//         const route = routeCoordinatesRef.current;

//         if (route.length < 2) {
//           return;
//         }
//         // CALCULATE HEADING
//         if (previous) {
//           const movedDistance = getDistance(
//             previous.latitude,
//             previous.longitude,
//             latitude,
//             longitude,
//           );
//           ToastAndroid.show(
//             `Rider moved: ${movedDistance.toFixed(1)} meter`,
//             ToastAndroid.SHORT,
//           );

//           console.log('GPS Move Distance:', movedDistance);
//           // if (movedDistance < 3) {
//           //   return;
//           // }
//           const route = routeCoordinatesRef.current;
//           if (route.length > 1) {
//             const snapped = getNearestPointOnRoute(latitude, longitude, route);

//             if (snapped) {
//               if (riderPosition) {
//                 animateMarker(
//                   riderPosition.latitude,
//                   riderPosition.longitude,
//                   snapped.point.latitude,
//                   snapped.point.longitude,
//                 );
//               } else {
//                 setRiderPosition({
//                   latitude: snapped.point.latitude,
//                   longitude: snapped.point.longitude,
//                 });
//               }

//               const currentMatchedPoint = [
//                 snapped.point.longitude,
//                 snapped.point.latitude,
//               ];

//               setRemainingRoute([
//                 currentMatchedPoint,
//                 ...route.slice(snapped.index + 1),
//               ]);

//               if (snapped.index !== lastSnappedIndexRef.current) {
//                 lastSnappedIndexRef.current = snapped.index;
//               }

//               if (snapped.index < route.length - 1) {
//                 const current = route[snapped.index];
//                 const next = route[snapped.index + 1];

//                 const routeBearing = calculateBearing(
//                   current[1],
//                   current[0],
//                   next[1],
//                   next[0],
//                 );

//                 if (Math.abs(routeBearing - headingRef.current) > 5) {
//                   animateHeading(headingRef.current, routeBearing);
//                 }
//               }
//             }
//           }
//         }

//         previousCoordinateRef.current = {
//           latitude,
//           longitude,
//         };
//       },

//       error => {
//         console.log(error);
//       },

//       {
//         enableHighAccuracy: true,
//         distanceFilter: 1,
//         interval: 1000,
//         fastestInterval: 500,
//         showLocationDialog: true,
//         forceRequestLocation: true,
//       },
//     );

//     return () => {
//       Geolocation.clearWatch(watchId);
//     };
//   }, []);

//   const sendOTP = async () => {
//     try {
//       setLoading(true);

//       console.log(
//         'Fetching dashboard data with token:',
//         GlobalLoginAuth.refreshToken,
//       );

//       const response = await fetch(
//         `${GlobalApi.baseUrl}api/deliveries/me/orders/${orderDetail?.order.id}/send-otp`,

//         {
//           method: 'POST',

//           headers: {
//             'Content-Type': 'application/json',

//             Authorization: `Bearer ${GlobalLoginAuth.accessToken}`,
//           },
//         },
//       );

//       const result = await response.json();

//       const SendOtpResponse = result as SendOtpResponse; // âœ… Type assertion to ensure it matches our model

//       console.log('Generate OTP Response:', result);

//       if (!response.ok) {
//         Alert.alert('FoodyPly', result.message || 'Failed to load dashboard');

//         return;
//       }

//       if (SendOtpResponse.success) {
//         console.log('OTP sent successfully:', SendOtpResponse.data.otp);

//         navigation.navigate('DeliveryOtpVerification', {
//           orderDetail: orderDetail,
//           otp: SendOtpResponse.data.otp,
//         });
//       }
//     } catch (error) {
//       console.log(error);

//       Alert.alert('FoodyPly', 'Unable to connect to server');
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <View style={styles.container}>
//       <GlobalTopBarDelivery
//         navigation={navigation}
//         notificationClick={() => {}}
//         text="Start Delivery"
//         subtitleText={`#${orderDetail?.order.orderNumber}`}
//         isBackVisible={true}
//         isOnlineVisible={false}
//       />

//       <View style={styles.overlay}>
//         <View style={styles.card}>
//           <View style={styles.mapContainer}>
//             <Map
//               style={styles.map}
//               mapStyle={DARK_MAP_STYLE}
//               logo={false}
//               compass={true}
//             >
//               {/* CAMERA */}
//               {riderPosition && (
//                 <Camera
//                   zoom={18}
//                   pitch={0}
//                   bearing={cameraHeading}
//                   center={[riderPosition.longitude, riderPosition.latitude]}
//                   padding={{
//                     top: 100,
//                     bottom: 300,
//                     left: 0,
//                     right: 0,
//                   }}
//                 />
//               )}

//               {/* DELIVERY BOY MARKER */}
//               {riderPosition && (
//                 <Marker
//                   anchor="center"
//                   lngLat={[riderPosition.longitude, riderPosition.latitude]}
//                 >
//                   <View
//                     style={[
//                       styles.currentMarkerWrapper,
//                       {
//                         // transform: [
//                         //   {
//                         //     rotate: `${markerHeading}deg`,
//                         //   },
//                         // ],
//                       },
//                     ]}
//                   >
//                     <Image
//                       source={require('../assets/images/dman.png')}
//                       style={styles.deliveryIcon}
//                       resizeMode="contain"
//                     />
//                   </View>
//                 </Marker>
//               )}

//               {/* DESTINATION */}
//               <Marker
//                 anchor="center"
//                 lngLat={[
//                   destinationLocation.longitude,
//                   destinationLocation.latitude,
//                 ]}
//               >
//                 <View style={styles.destinationMarkerWrapper}>
//                   <View style={styles.destinationMarker} />
//                 </View>
//               </Marker>

//               {/* ROUTE */}
//               {routeCoordinates.length > 1 && (
//                 <GeoJSONSource
//                   id="routeSource"
//                   data={{
//                     type: 'FeatureCollection',
//                     features: [
//                       {
//                         type: 'Feature',
//                         properties: {},
//                         geometry: {
//                           type: 'LineString',
//                           coordinates: remainingRoute,
//                         },
//                       },
//                     ],
//                   }}
//                 >
//                   {/* ROUTE SHADOW */}
//                   <Layer
//                     id="routeLayerBg"
//                     type="line"
//                     paint={{
//                       'line-color': '#0B3B2E',
//                       'line-width': 10,
//                       'line-opacity': 0.7,
//                     }}
//                     layout={{
//                       'line-cap': 'round',
//                       'line-join': 'round',
//                     }}
//                   />

//                   {/* MAIN ROUTE */}
//                   <Layer
//                     id="routeLayer"
//                     type="line"
//                     paint={{
//                       'line-color': '#00FF9D',
//                       'line-width': 6,
//                       'line-opacity': 1,
//                     }}
//                     layout={{
//                       'line-cap': 'round',
//                       'line-join': 'round',
//                     }}
//                   />
//                 </GeoJSONSource>
//               )}
//             </Map>

//             {/* FLOATING CARD */}
//             {showDetailsCard ? (
//               <View style={styles.card1}>
//                 {/* USER INFO */}
//                 <View style={styles.header}>
//                   <Image
//                     source={
//                       orderDetail?.customer?.profileImageUrl
//                         ? { uri: orderDetail.customer.profileImageUrl }
//                         : require('../assets/images/customer_image.png')
//                     }
//                     style={styles.avatar}
//                   />

//                   <View style={{ flex: 1 }}>
//                     <Text style={styles.name}>{orderDetail.customer.name}</Text>
//                     <Text style={styles.phone}>
//                       {orderDetail.customer.phone}
//                     </Text>
//                     <Text style={styles.address}>
//                       {orderDetail.customer.address.fullText}
//                     </Text>
//                   </View>

//                   <View style={styles.iconColumn}>
//                     <TouchableOpacity style={styles.circleBtn}>
//                       <Image
//                         source={require('../assets/images/call.png')}
//                         style={styles.smallIcon}
//                       />
//                     </TouchableOpacity>
//                   </View>
//                 </View>

//                 {/* ORDER INFO */}
//                 <View style={styles.orderRow}>
//                   <View
//                     style={{
//                       flexDirection: 'row',
//                       alignItems: 'center',
//                       gap: 5,
//                     }}
//                   >
//                     <Image
//                       source={require('../assets/images/shopping_bag.png')}
//                       style={styles.smallIconOrange}
//                     />

//                     <View>
//                       <Text style={styles.smallLabel}>
//                         {orderDetail.items.length} Items •{' '}
//                         {orderDetail.items.reduce(
//                           (acc, item) => acc + item.quantity,
//                           0,
//                         )}{' '}
//                         Qty
//                       </Text>
//                       <View
//                         style={{
//                           flexDirection: 'row',
//                           alignItems: 'center',
//                           gap: 4,
//                           marginTop: 2,
//                         }}
//                       >
//                         <Text style={styles.smallLabel}>Payment Status</Text>
//                         <View style={styles.codBadge}>
//                           <Text style={styles.codText}>
//                             {orderDetail.billing.paymentStatus}
//                           </Text>
//                         </View>
//                       </View>
//                     </View>
//                   </View>
//                   <View>
//                     <Text style={styles.smallLabel}>Order Amount</Text>
//                     <Text style={styles.amount}>
//                       ₹{orderDetail.billing.finalAmount.toFixed(2)}
//                     </Text>
//                   </View>
//                 </View>

//                 {/* LIVE STATUS */}
//                 <View style={styles.liveBox}>
//                   <View style={styles.iconCircle}>
//                     <Image
//                       source={require('../assets/images/scooter.png')}
//                       style={styles.bikeIcon}
//                     />
//                   </View>
//                   <View style={{ marginLeft: 10 }}>
//                     <Text style={styles.liveTitle}>Live Status</Text>
//                     <Text style={styles.liveText}>
//                       You are on the way to the customer
//                     </Text>
//                   </View>
//                 </View>

//                 {/* PROGRESS */}
//                 <View style={{ marginTop: 20 }}>
//                   <Text style={styles.progressTitle}>Order Progress</Text>

//                   <View style={styles.progressRow}>
//                     {[
//                       'Assigned',
//                       'Accepted',
//                       'Picked',
//                       'On The Way',
//                       'Delivered',
//                     ].map((item, index) => {
//                       const isActive = index <= 3;
//                       const isOnWay = item === 'On The Way';

//                       return (
//                         <View key={index} style={styles.stepContainer}>
//                           <View
//                             style={[
//                               styles.stepCircle,
//                               isActive && styles.activeStep,

//                               // LIGHT ORANGE BACKGROUND FOR ON WAY
//                               isOnWay && styles.onWayStep,
//                             ]}
//                           >
//                             {isOnWay ? (
//                               <Image
//                                 source={require('../assets/images/scooter.png')}
//                                 style={styles.scooterIcon}
//                               />
//                             ) : (
//                               <Image
//                                 source={require('../assets/images/check.png')}
//                                 style={[
//                                   styles.checkIcon,
//                                   {
//                                     tintColor: isActive
//                                       ? Colors.primary
//                                       : '#bbb',
//                                   },
//                                 ]}
//                               />
//                             )}
//                           </View>

//                           <Text style={styles.stepText}>{item}</Text>

//                           {index !== 4 && (
//                             <View
//                               style={[
//                                 styles.line,
//                                 index < 3 && styles.activeLine,
//                               ]}
//                             />
//                           )}
//                         </View>
//                       );
//                     })}
//                   </View>
//                 </View>

//                 {/* BUTTONS */}
//                 <View style={styles.buttonRow}>
//                   <TouchableOpacity
//                     style={styles.mapBtn}
//                     onPress={() => setShowDetailsCard(false)}
//                   >
//                     <Text style={styles.mapBtnText}>Open in Maps</Text>
//                   </TouchableOpacity>

//                   <TouchableOpacity
//                     style={styles.deliverBtn}
//                     onPress={() => sendOTP()}
//                   >
//                     <Text style={styles.deliverBtnText}>Order Delivered</Text>
//                   </TouchableOpacity>
//                 </View>
//               </View>
//             ) : (
//               <TouchableOpacity
//                 activeOpacity={0.8}
//                 style={styles.floatingShowButton}
//                 onPress={() => setShowDetailsCard(true)}
//               >
//                 <Image
//                   source={require('../assets/images/shopping_bag.png')}
//                   style={styles.floatingArrow}
//                 />
//               </TouchableOpacity>
//             )}
//           </View>
//         </View>
//       </View>
//       <GlobalLoader visible={loading} />
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: Colors.primary,
//     paddingTop: 100,
//   },

//   overlay: {
//     flex: 1,
//     borderTopLeftRadius: 30,
//     borderTopRightRadius: 30,
//     marginTop: 20,
//   },

//   card: {
//     backgroundColor: '#fff',
//     borderTopLeftRadius: 20,
//     borderTopRightRadius: 20,
//     flex: 1,
//   },

//   mapContainer: {
//     flex: 1,
//     borderTopLeftRadius: 20,
//     borderTopRightRadius: 20,
//     overflow: 'hidden',
//   },

//   map: {
//     flex: 1,
//   },

//   currentMarkerWrapper: {
//     width: 44,
//     height: 44,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },

//   deliveryIcon: {
//     width: 80,
//     height: 80,

//     // REMOVE THIS IF IMAGE ALREADY ORANGE
//     // tintColor: Colors.primary,
//   },

//   destinationMarkerWrapper: {
//     width: 30,
//     height: 30,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },

//   destinationMarker: {
//     width: 18,
//     height: 18,
//     borderRadius: 9,
//     backgroundColor: 'red',
//     borderWidth: 3,
//     borderColor: '#fff',
//   },
//   card1: {
//     position: 'absolute',
//     bottom: 20,
//     left: 15,
//     right: 15,
//     backgroundColor: '#fff',
//     borderRadius: 25,
//     padding: 18,

//     shadowColor: '#000',
//     shadowOpacity: 0.15,
//     shadowRadius: 10,
//     shadowOffset: {
//       width: 0,
//       height: 5,
//     },
//     elevation: 8,
//   },

//   header: {
//     flexDirection: 'row',
//     alignItems: 'flex-start',
//     justifyContent: 'space-between',
//   },

//   avatar: {
//     width: 60,
//     height: 60,
//     borderRadius: 20,
//     marginRight: 12,
//   },

//   name: {
//     fontSize: 18,
//     fontFamily: FontFamily.medium,
//     color: Colors.textColor,
//   },

//   phone: {
//     color: Colors.textBrown,
//     fontFamily: FontFamily.regular,
//     marginTop: 2,
//     fontSize: 12,
//   },

//   address: {
//     color: Colors.textBrown,
//     marginTop: 2,
//     fontSize: 12,
//     fontFamily: FontFamily.regular,
//   },

//   iconColumn: {
//     gap: 0,
//   },

//   circleBtn: {
//     width: 38,
//     height: 38,
//     borderRadius: 19,
//     backgroundColor: '#7bc043',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },

//   orderRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     marginTop: 20,
//   },

//   smallLabel: {
//     color: Colors.textBrown,
//     fontSize: 14,
//     fontFamily: FontFamily.regular,
//   },

//   boldText: {
//     fontFamily: FontFamily.bold,
//     marginTop: 2,
//     fontSize: 14,
//   },

//   amount: {
//     color: Colors.primary,
//     fontSize: 18,
//     fontFamily: FontFamily.regular,
//     marginTop: 2,
//   },

//   liveBox: {
//     flexDirection: 'row',
//     backgroundColor: '#FEF6F3',
//     padding: 6,
//     borderRadius: 10,
//     marginTop: 18,
//     alignItems: 'center',
//   },

//   liveTitle: {
//     color: Colors.textColor,
//     fontFamily: FontFamily.medium,
//   },

//   liveText: {
//     color: Colors.textBrown,
//     marginTop: 3,
//     fontSize: 12,
//     fontFamily: FontFamily.regular,
//   },

//   progressTitle: {
//     fontFamily: FontFamily.medium,
//     marginBottom: 15,
//     color: Colors.textColor,
//   },

//   progressRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//   },

//   stepContainer: {
//     alignItems: 'center',
//     flex: 1,
//     position: 'relative',
//     justifyContent: 'flex-start',
//   },

//   stepCircle: {
//     width: 30,
//     height: 30,
//     borderRadius: 15,
//     backgroundColor: '#e5e5e5',
//     justifyContent: 'center',
//     alignItems: 'center',
//     zIndex: 2,
//   },
//   activeStep: {
//     backgroundColor: Colors.lightOrange,
//   },

//   line: {
//     position: 'absolute',
//     top: 12,
//     left: '50%',
//     width: '100%',
//     height: 3,
//     backgroundColor: '#ddd',
//     zIndex: 1,
//   },

//   activeLine: {
//     backgroundColor: Colors.primary,
//   },

//   stepText: {
//     fontSize: 10,
//     marginTop: 10,
//     color: Colors.textBrown,
//     textAlign: 'center',
//     fontFamily: FontFamily.regular,
//   },

//   buttonRow: {
//     flexDirection: 'row',
//     marginTop: 25,
//     gap: 12,
//   },

//   mapBtn: {
//     flex: 1,
//     backgroundColor: Colors.buttonLight,
//     paddingVertical: 14,
//     borderRadius: 14,
//     alignItems: 'center',
//   },

//   deliverBtn: {
//     flex: 1,
//     backgroundColor: Colors.primary,
//     paddingVertical: 14,
//     borderRadius: 14,
//     alignItems: 'center',
//   },

//   mapBtnText: {
//     color: Colors.primary,
//     fontFamily: FontFamily.regular,
//     fontSize: 16,
//   },

//   deliverBtnText: {
//     color: '#fff',
//     fontFamily: FontFamily.regular,
//     fontSize: 16,
//   },

//   smallIcon: {
//     width: 18,
//     height: 18,
//     tintColor: '#fff',
//   },

//   smallIconOrange: {
//     width: 30,
//     height: 30,
//     tintColor: Colors.primary,
//   },

//   bikeIcon: {
//     width: 24,
//     height: 24,
//     tintColor: Colors.primary,
//   },

//   checkIcon: {
//     width: 16,
//     height: 16,
//   },
//   iconCircle: {
//     width: 60,
//     height: 60,
//     borderRadius: 30,
//     backgroundColor: Colors.lightOrange,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   codBadge: {
//     backgroundColor: Colors.lightBackground,
//     paddingHorizontal: 8,
//     paddingVertical: 3,
//     borderRadius: 20,
//     marginLeft: 2,
//   },

//   codText: {
//     color: Colors.primary,
//     fontSize: 12,
//     fontFamily: FontFamily.semiBold,
//   },
//   onWayStep: {
//     width: 30,
//     height: 30,
//     borderRadius: 15,
//     backgroundColor: Colors.lightOrange,

//     justifyContent: 'center',
//     alignItems: 'center',

//     zIndex: 3,
//   },

//   scooterIcon: {
//     width: 20,
//     height: 20,
//     tintColor: Colors.primary,
//   },
//   hideButton: {
//     width: 32,
//     height: 32,
//     borderRadius: 16,
//     backgroundColor: '#F5F5F5',
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginLeft: 10,
//   },

//   hideIcon: {
//     width: 16,
//     height: 16,
//     tintColor: Colors.textColor,
//   },

//   floatingShowButton: {
//     position: 'absolute',
//     bottom: 30,
//     right: 20,
//     width: 40,
//     height: 40,
//     borderRadius: 20,

//     backgroundColor: Colors.primary,

//     justifyContent: 'center',
//     alignItems: 'center',

//     shadowColor: '#000',
//     shadowOpacity: 0.2,
//     shadowRadius: 8,
//     shadowOffset: {
//       width: 0,
//       height: 4,
//     },

//     elevation: 10,
//   },

//   floatingArrow: {
//     width: 24,
//     height: 24,
//     tintColor: '#fff',
//   },
// });

// import React, { useEffect, useState, useRef } from 'react';
// import {
//   View,
//   StyleSheet,
//   PermissionsAndroid,
//   Platform,
//   Image,
//   Text,
//   TouchableOpacity,
//   ToastAndroid,
//   Alert,
// } from 'react-native';

// import {
//   Map,
//   Camera,
//   Marker,
//   GeoJSONSource,
//   Layer,
// } from '@maplibre/maplibre-react-native';

// import Geolocation from 'react-native-geolocation-service';
// import axios from 'axios';

// import Colors from '../assets/Colors/Colors';
// import GlobalTopBarDelivery from '../GlobalContainer/GlobalTopBarDelivery';
// import { DeliveryOrderDetails } from '../Models/DeliveryOrderDetails/DeliveryOrderDetails';
// import { FontFamily } from '../assets/GlobalFont/GlobalFont';
// import GlobalLoginAuth from '../GlobalContainer/GlobalLoginAuth';
// import GlobalApi from '../GlobalContainer/GlobalApi';
// import GlobalLoader from '../GlobalContainer/GlobalLoader';
// import { SendOtpResponse } from '../Models/SendOTP/SendOtpResponse ';

// const DARK_MAP_STYLE =
//   'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

// export default function DeliveryStart({ route, navigation }: any) {
//   const {
//     orderDetail,
//   }: {
//     orderDetail: DeliveryOrderDetails;
//   } = route.params;

//   const [showDetailsCard, setShowDetailsCard] = useState(true);
//   const lastSnappedIndexRef = useRef(-1);
//   // DESTINATION
//   const [destinationLocation] = useState({
//     latitude: orderDetail.customer.address.latitude || 22.8948,

//     longitude: orderDetail.customer.address.longitude || 88.41,
//   });

//   // CURRENT LOCATION
//   const [currentLocation, setCurrentLocation] = useState<{
//     latitude: number;
//     longitude: number;
//   } | null>(null);

//   // ROUTE
//   const [routeCoordinates, setRouteCoordinates] = useState<any[]>([]);
//   const routeCoordinatesRef = useRef<any[]>([]);
//   const [remainingRoute, setRemainingRoute] = useState<any[]>([]);
//   const headingRef = useRef(0);
//   const cameraHeadingRef = useRef(0);
//   const [riderPosition, setRiderPosition] = useState<{
//     latitude: number;
//     longitude: number;
//   } | null>(null);
//   // CAMERA HEADING
//   const [cameraHeading, setCameraHeading] = useState(0);

//   // SCOOTER HEADING
//   const [markerHeading, setMarkerHeading] = useState(0);
//   const [loading, setLoading] = useState(false);

//   const [locationHistory, setLocationHistory] = useState<
//     { latitude: number; longitude: number }[]
//   >([]);
//   // PREVIOUS LOCATION
//   const previousCoordinateRef = useRef<{
//     latitude: number;
//     longitude: number;
//   } | null>(null);

//   // REQUEST LOCATION PERMISSION
//   const requestLocationPermission = async () => {
//     if (Platform.OS === 'android') {
//       const granted = await PermissionsAndroid.request(
//         PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
//       );

//       if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
//         console.log('Location permission denied');
//       }
//     }
//   };

//   const calculateBearing = (
//     startLat: number,

//     startLng: number,

//     endLat: number,

//     endLng: number,
//   ) => {
//     const dLon = ((endLng - startLng) * Math.PI) / 180;

//     const y = Math.sin(dLon) * Math.cos((endLat * Math.PI) / 180);

//     const x =
//       Math.cos((startLat * Math.PI) / 180) *
//         Math.sin((endLat * Math.PI) / 180) -
//       Math.sin((startLat * Math.PI) / 180) *
//         Math.cos((endLat * Math.PI) / 180) *
//         Math.cos(dLon);

//     const brng = (Math.atan2(y, x) * 180) / Math.PI;

//     return (brng + 360) % 360;
//   };

//   // DISTANCE BETWEEN TWO POINTS
//   const getDistance = (
//     lat1: number,
//     lon1: number,
//     lat2: number,
//     lon2: number,
//   ) => {
//     const R = 6371e3;

//     const φ1 = (lat1 * Math.PI) / 180;
//     const φ2 = (lat2 * Math.PI) / 180;

//     const Δφ = ((lat2 - lat1) * Math.PI) / 180;

//     const Δλ = ((lon2 - lon1) * Math.PI) / 180;

//     const a =
//       Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
//       Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

//     const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

//     return R * c;
//   };

//   const getProjectedPointOnSegment = (
//     lat: number,
//     lng: number,
//     startLat: number,
//     startLng: number,
//     endLat: number,
//     endLng: number,
//   ) => {
//     const dx = endLng - startLng;
//     const dy = endLat - startLat;

//     const lengthSquared = dx * dx + dy * dy;

//     if (lengthSquared === 0) {
//       return {
//         latitude: startLat,
//         longitude: startLng,
//         t: 0,
//       };
//     }

//     let t = ((lng - startLng) * dx + (lat - startLat) * dy) / lengthSquared;

//     t = Math.max(0, Math.min(1, t));

//     return {
//       latitude: startLat + t * dy,
//       longitude: startLng + t * dx,
//       t,
//     };
//   };

//   const getNearestPointOnRoute = (
//     latitude: number,
//     longitude: number,
//     route: any[],
//   ) => {
//     if (route.length < 2) {
//       return null;
//     }

//     let minDistance = Infinity;

//     let nearestIndex = 0;

//     let projectedPoint: any = null;

//     for (let i = 0; i < route.length - 1; i++) {
//       const start = route[i];
//       const end = route[i + 1];

//       const projected = getProjectedPointOnSegment(
//         latitude,
//         longitude,
//         start[1],
//         start[0],
//         end[1],
//         end[0],
//       );

//       const distance = getDistance(
//         latitude,
//         longitude,
//         projected.latitude,
//         projected.longitude,
//       );

//       if (distance < minDistance) {
//         minDistance = distance;
//         nearestIndex = i;
//         projectedPoint = projected;
//       }
//     }

//     return {
//       index: nearestIndex,
//       distance: minDistance,
//       point: projectedPoint,
//     };
//   };
//   // ROUTE API
//   const getRoute = async (
//     startLat: number,
//     startLng: number,
//     endLat: number,
//     endLng: number,
//   ) => {
//     try {
//       const response = await axios.get(
//         `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`,
//       );

//       if (
//         response.data &&
//         response.data.routes &&
//         response.data.routes.length > 0
//       ) {
//         const osrmCoordinates = response.data.routes[0].geometry.coordinates;

//         // Insert actual GPS as first point
//         const coordinates = [[startLng, startLat], ...osrmCoordinates];

//         for (let i = 0; i < 5; i++) {
//           const dist = getDistance(
//             coordinates[i][1],
//             coordinates[i][0],
//             coordinates[i + 1][1],
//             coordinates[i + 1][0],
//           );

//           console.log(`Distance ${i} -> ${i + 1}:`, dist);
//         }
//         setRouteCoordinates(coordinates);
//         routeCoordinatesRef.current = coordinates;

//         console.log('Route Length:', coordinates.length);

//         console.log('First Route Point:', coordinates[0]);

//         console.log('Start GPS:', startLat, startLng);

//         console.log(
//           'Distance Between Start And Route Point:',
//           getDistance(startLat, startLng, coordinates[0][1], coordinates[0][0]),
//         );

//         if (!riderPosition && coordinates.length > 0) {
//           setRiderPosition({
//             latitude: coordinates[0][1],
//             longitude: coordinates[0][0],
//           });

//           lastSnappedIndexRef.current = 0;

//           setRemainingRoute(coordinates);
//         }
//       }
//     } catch (error) {
//       console.log('ROUTE ERROR', error);
//     }
//   };

//   // INITIAL LOCATION
//   const getCurrentLocation = async () => {
//     Geolocation.getCurrentPosition(
//       async position => {
//         const latitude = position.coords.latitude;

//         const longitude = position.coords.longitude;

//         setCurrentLocation({
//           latitude,
//           longitude,
//         });

//         previousCoordinateRef.current = {
//           latitude,
//           longitude,
//         };

//         await getRoute(
//           latitude,
//           longitude,
//           destinationLocation.latitude,
//           destinationLocation.longitude,
//         );
//       },

//       error => {
//         console.log(error);
//       },

//       {
//         enableHighAccuracy: true,
//         timeout: 15000,
//         maximumAge: 10000,
//       },
//     );
//   };

//   // LIVE TRACKING
//   useEffect(() => {
//     requestLocationPermission();

//     getCurrentLocation();

//     const animateMarker = (
//       startLat: number,
//       startLng: number,
//       endLat: number,
//       endLng: number,
//     ) => {
//       const steps = 30;
//       let currentStep = 0;

//       const interval = setInterval(() => {
//         currentStep++;

//         const progress = currentStep / steps;

//         setRiderPosition({
//           latitude: startLat + (endLat - startLat) * progress,
//           longitude: startLng + (endLng - startLng) * progress,
//         });

//         if (currentStep >= steps) {
//           clearInterval(interval);
//         }
//       }, 50);
//     };

//     // SMOOTH HEADING ANIMATION
//     const animateHeading = (fromBearing: number, toBearing: number) => {
//       let delta = toBearing - fromBearing;
//       if (delta > 180) delta -= 360;
//       if (delta < -180) delta += 360;

//       const steps = 30;
//       let currentStep = 0;

//       const interval = setInterval(() => {
//         currentStep++;
//         const progress = currentStep / steps;
//         const newHeading = (fromBearing + delta * progress + 360) % 360;
//         headingRef.current = newHeading;
//         setMarkerHeading(newHeading);
//         setCameraHeading(newHeading);
//         cameraHeadingRef.current = newHeading;

//         if (currentStep >= steps) {
//           clearInterval(interval);
//         }
//       }, 50);
//     };
//     const watchId = Geolocation.watchPosition(
//       async position => {
//         const latitude = position.coords.latitude;

//         const longitude = position.coords.longitude;

//         const previous = previousCoordinateRef.current;

//         if (previous) {
//           const movedDistance = getDistance(
//             previous.latitude,
//             previous.longitude,
//             latitude,
//             longitude,
//           );

//           console.log('GPS Move Distance:', movedDistance);
//         }

//         // UPDATE LOCATION
//         setCurrentLocation({
//           latitude,
//           longitude,
//         });
//         // ARRAY ME STORE KARO
//         setLocationHistory(prev => {
//           const updated = [
//             ...prev,
//             {
//               latitude,
//               longitude,
//             },
//           ];

//           // // TOAST ME DIKHAO
//           // ToastAndroid.show(
//           //   JSON.stringify(updated),
//           //   ToastAndroid.SHORT,
//           // );

//           return updated;
//         });

//         const route = routeCoordinatesRef.current;

//         if (route.length < 2) {
//           return;
//         }
//         // CALCULATE HEADING
//         if (previous) {
//           const movedDistance = getDistance(
//             previous.latitude,
//             previous.longitude,
//             latitude,
//             longitude,
//           );
//           ToastAndroid.show(
//             `Rider moved: ${movedDistance.toFixed(1)} meter`,
//             ToastAndroid.SHORT,
//           );

//           console.log('GPS Move Distance:', movedDistance);
//           // if (movedDistance < 3) {
//           //   return;
//           // }
//           const route = routeCoordinatesRef.current;
//           if (route.length > 1) {
//             const snapped = getNearestPointOnRoute(latitude, longitude, route);

//             if (snapped) {
//               if (riderPosition) {
//                 animateMarker(
//                   riderPosition.latitude,
//                   riderPosition.longitude,
//                   snapped.point.latitude,
//                   snapped.point.longitude,
//                 );
//               } else {
//                 setRiderPosition({
//                   latitude: snapped.point.latitude,
//                   longitude: snapped.point.longitude,
//                 });
//               }

//               const currentMatchedPoint = [
//                 snapped.point.longitude,
//                 snapped.point.latitude,
//               ];

//               setRemainingRoute([
//                 currentMatchedPoint,
//                 ...route.slice(snapped.index + 1),
//               ]);

//               if (snapped.index !== lastSnappedIndexRef.current) {
//                 lastSnappedIndexRef.current = snapped.index;
//               }

//               if (snapped.index < route.length - 1) {
//                 const current = route[snapped.index];
//                 const next = route[snapped.index + 1];

//                 const routeBearing = calculateBearing(
//                   current[1],
//                   current[0],
//                   next[1],
//                   next[0],
//                 );

//                 if (Math.abs(routeBearing - headingRef.current) > 5) {
//                   animateHeading(headingRef.current, routeBearing);
//                 }
//               }
//             }
//           }
//         }

//         previousCoordinateRef.current = {
//           latitude,
//           longitude,
//         };
//       },

//       error => {
//         console.log(error);
//       },

//       {
//         enableHighAccuracy: true,
//         distanceFilter: 1,
//         interval: 1000,
//         fastestInterval: 500,
//         showLocationDialog: true,
//         forceRequestLocation: true,
//       },
//     );

//     return () => {
//       Geolocation.clearWatch(watchId);
//     };
//   }, []);

//   const sendOTP = async () => {
//     try {
//       setLoading(true);

//       console.log(
//         'Fetching dashboard data with token:',
//         GlobalLoginAuth.refreshToken,
//       );

//       const response = await fetch(
//         `${GlobalApi.baseUrl}api/deliveries/me/orders/${orderDetail?.order.id}/send-otp`,

//         {
//           method: 'POST',

//           headers: {
//             'Content-Type': 'application/json',

//             Authorization: `Bearer ${GlobalLoginAuth.accessToken}`,
//           },
//         },
//       );

//       const result = await response.json();

//       const SendOtpResponse = result as SendOtpResponse; // âœ… Type assertion to ensure it matches our model

//       console.log('Generate OTP Response:', result);

//       if (!response.ok) {
//         Alert.alert('FoodyPly', result.message || 'Failed to load dashboard');

//         return;
//       }

//       if (SendOtpResponse.success) {
//         console.log('OTP sent successfully:', SendOtpResponse.data.otp);

//         navigation.navigate('DeliveryOtpVerification', {
//           orderDetail: orderDetail,
//           otp: SendOtpResponse.data.otp,
//         });
//       }
//     } catch (error) {
//       console.log(error);

//       Alert.alert('FoodyPly', 'Unable to connect to server');
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <View style={styles.container}>
//       <GlobalTopBarDelivery
//         navigation={navigation}
//         notificationClick={() => {}}
//         text="Start Delivery"
//         subtitleText={`#${orderDetail?.order.orderNumber}`}
//         isBackVisible={true}
//         isOnlineVisible={false}
//       />

//       <View style={styles.overlay}>
//         <View style={styles.card}>
//           <View style={styles.mapContainer}>
//             <Map
//               style={styles.map}
//               mapStyle={DARK_MAP_STYLE}
//               logo={false}
//               compass={true}
//             >
//               {/* CAMERA */}
//               {riderPosition && (
//                 <Camera
//                   zoom={18}
//                   pitch={60}
//                   bearing={cameraHeading}
//                   center={[riderPosition.longitude, riderPosition.latitude]}
//                   padding={{
//                     top: 100,
//                     bottom: 350,
//                     left: 0,
//                     right: 0,
//                   }}
//                 />
//               )}

//               {/* DELIVERY BOY MARKER */}
//               {riderPosition && (
//                 <Marker
//                   anchor="center"
//                   lngLat={[riderPosition.longitude, riderPosition.latitude]}
//                 >
//                   <View
//                     style={[
//                       styles.currentMarkerWrapper,
//                       {
//                         // transform: [
//                         //   {
//                         //     rotate: `${markerHeading}deg`,
//                         //   },
//                         // ],
//                       },
//                     ]}
//                   >
//                     <Image
//                       source={require('../assets/images/dman.png')}
//                       style={styles.deliveryIcon}
//                       resizeMode="contain"
//                     />
//                   </View>
//                 </Marker>
//               )}

//               {/* DESTINATION */}
//               <Marker
//                 anchor="center"
//                 lngLat={[
//                   destinationLocation.longitude,
//                   destinationLocation.latitude,
//                 ]}
//               >
//                 <View style={styles.destinationMarkerWrapper}>
//                   <View style={styles.destinationMarker} />
//                 </View>
//               </Marker>

//               {/* ROUTE */}
//               {routeCoordinates.length > 1 && (
//                 <GeoJSONSource
//                   id="routeSource"
//                   data={{
//                     type: 'FeatureCollection',
//                     features: [
//                       {
//                         type: 'Feature',
//                         properties: {},
//                         geometry: {
//                           type: 'LineString',
//                           coordinates: remainingRoute,
//                         },
//                       },
//                     ],
//                   }}
//                 >
//                   {/* ROUTE SHADOW */}
//                   <Layer
//                     id="routeLayerBg"
//                     type="line"
//                     paint={{
//                       'line-color': '#0B3B2E',
//                       'line-width': 10,
//                       'line-opacity': 0.7,
//                     }}
//                     layout={{
//                       'line-cap': 'round',
//                       'line-join': 'round',
//                     }}
//                   />

//                   {/* MAIN ROUTE */}
//                   <Layer
//                     id="routeLayer"
//                     type="line"
//                     paint={{
//                       'line-color': '#00FF9D',
//                       'line-width': 6,
//                       'line-opacity': 1,
//                     }}
//                     layout={{
//                       'line-cap': 'round',
//                       'line-join': 'round',
//                     }}
//                   />
//                 </GeoJSONSource>
//               )}
//             </Map>

//             {/* FLOATING CARD */}
//             {showDetailsCard ? (
//               <View style={styles.card1}>
//                 {/* USER INFO */}
//                 <View style={styles.header}>
//                   <Image
//                     source={
//                       orderDetail?.customer?.profileImageUrl
//                         ? { uri: orderDetail.customer.profileImageUrl }
//                         : require('../assets/images/customer_image.png')
//                     }
//                     style={styles.avatar}
//                   />

//                   <View style={{ flex: 1 }}>
//                     <Text style={styles.name}>{orderDetail.customer.name}</Text>
//                     <Text style={styles.phone}>
//                       {orderDetail.customer.phone}
//                     </Text>
//                     <Text style={styles.address}>
//                       {orderDetail.customer.address.fullText}
//                     </Text>
//                   </View>

//                   <View style={styles.iconColumn}>
//                     <TouchableOpacity style={styles.circleBtn}>
//                       <Image
//                         source={require('../assets/images/call.png')}
//                         style={styles.smallIcon}
//                       />
//                     </TouchableOpacity>
//                   </View>
//                 </View>

//                 {/* ORDER INFO */}
//                 <View style={styles.orderRow}>
//                   <View
//                     style={{
//                       flexDirection: 'row',
//                       alignItems: 'center',
//                       gap: 5,
//                     }}
//                   >
//                     <Image
//                       source={require('../assets/images/shopping_bag.png')}
//                       style={styles.smallIconOrange}
//                     />

//                     <View>
//                       <Text style={styles.smallLabel}>
//                         {orderDetail.items.length} Items •{' '}
//                         {orderDetail.items.reduce(
//                           (acc, item) => acc + item.quantity,
//                           0,
//                         )}{' '}
//                         Qty
//                       </Text>
//                       <View
//                         style={{
//                           flexDirection: 'row',
//                           alignItems: 'center',
//                           gap: 4,
//                           marginTop: 2,
//                         }}
//                       >
//                         <Text style={styles.smallLabel}>Payment Status</Text>
//                         <View style={styles.codBadge}>
//                           <Text style={styles.codText}>
//                             {orderDetail.billing.paymentStatus}
//                           </Text>
//                         </View>
//                       </View>
//                     </View>
//                   </View>
//                   <View>
//                     <Text style={styles.smallLabel}>Order Amount</Text>
//                     <Text style={styles.amount}>
//                       ₹{orderDetail.billing.finalAmount.toFixed(2)}
//                     </Text>
//                   </View>
//                 </View>

//                 {/* LIVE STATUS */}
//                 <View style={styles.liveBox}>
//                   <View style={styles.iconCircle}>
//                     <Image
//                       source={require('../assets/images/scooter.png')}
//                       style={styles.bikeIcon}
//                     />
//                   </View>
//                   <View style={{ marginLeft: 10 }}>
//                     <Text style={styles.liveTitle}>Live Status</Text>
//                     <Text style={styles.liveText}>
//                       You are on the way to the customer
//                     </Text>
//                   </View>
//                 </View>

//                 {/* PROGRESS */}
//                 <View style={{ marginTop: 20 }}>
//                   <Text style={styles.progressTitle}>Order Progress</Text>

//                   <View style={styles.progressRow}>
//                     {[
//                       'Assigned',
//                       'Accepted',
//                       'Picked',
//                       'On The Way',
//                       'Delivered',
//                     ].map((item, index) => {
//                       const isActive = index <= 3;
//                       const isOnWay = item === 'On The Way';

//                       return (
//                         <View key={index} style={styles.stepContainer}>
//                           <View
//                             style={[
//                               styles.stepCircle,
//                               isActive && styles.activeStep,

//                               // LIGHT ORANGE BACKGROUND FOR ON WAY
//                               isOnWay && styles.onWayStep,
//                             ]}
//                           >
//                             {isOnWay ? (
//                               <Image
//                                 source={require('../assets/images/scooter.png')}
//                                 style={styles.scooterIcon}
//                               />
//                             ) : (
//                               <Image
//                                 source={require('../assets/images/check.png')}
//                                 style={[
//                                   styles.checkIcon,
//                                   {
//                                     tintColor: isActive
//                                       ? Colors.primary
//                                       : '#bbb',
//                                   },
//                                 ]}
//                               />
//                             )}
//                           </View>

//                           <Text style={styles.stepText}>{item}</Text>

//                           {index !== 4 && (
//                             <View
//                               style={[
//                                 styles.line,
//                                 index < 3 && styles.activeLine,
//                               ]}
//                             />
//                           )}
//                         </View>
//                       );
//                     })}
//                   </View>
//                 </View>

//                 {/* BUTTONS */}
//                 <View style={styles.buttonRow}>
//                   <TouchableOpacity
//                     style={styles.mapBtn}
//                     onPress={() => setShowDetailsCard(false)}
//                   >
//                     <Text style={styles.mapBtnText}>Open in Maps</Text>
//                   </TouchableOpacity>

//                   <TouchableOpacity
//                     style={styles.deliverBtn}
//                     onPress={() => sendOTP()}
//                   >
//                     <Text style={styles.deliverBtnText}>Order Delivered</Text>
//                   </TouchableOpacity>
//                 </View>
//               </View>
//             ) : (
//               <TouchableOpacity
//                 activeOpacity={0.8}
//                 style={styles.floatingShowButton}
//                 onPress={() => setShowDetailsCard(true)}
//               >
//                 <Image
//                   source={require('../assets/images/shopping_bag.png')}
//                   style={styles.floatingArrow}
//                 />
//               </TouchableOpacity>
//             )}
//           </View>
//         </View>
//       </View>
//       <GlobalLoader visible={loading} />
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: Colors.primary,
//     paddingTop: 100,
//   },

//   overlay: {
//     flex: 1,
//     borderTopLeftRadius: 30,
//     borderTopRightRadius: 30,
//     marginTop: 20,
//   },

//   card: {
//     backgroundColor: '#fff',
//     borderTopLeftRadius: 20,
//     borderTopRightRadius: 20,
//     flex: 1,
//   },

//   mapContainer: {
//     flex: 1,
//     borderTopLeftRadius: 20,
//     borderTopRightRadius: 20,
//     overflow: 'hidden',
//   },

//   map: {
//     flex: 1,
//   },

//   currentMarkerWrapper: {
//     width: 44,
//     height: 44,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },

//   deliveryIcon: {
//     width: 80,
//     height: 80,

//     // REMOVE THIS IF IMAGE ALREADY ORANGE
//     // tintColor: Colors.primary,
//   },

//   destinationMarkerWrapper: {
//     width: 30,
//     height: 30,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },

//   destinationMarker: {
//     width: 18,
//     height: 18,
//     borderRadius: 9,
//     backgroundColor: 'red',
//     borderWidth: 3,
//     borderColor: '#fff',
//   },
//   card1: {
//     position: 'absolute',
//     bottom: 20,
//     left: 15,
//     right: 15,
//     backgroundColor: '#fff',
//     borderRadius: 25,
//     padding: 18,

//     shadowColor: '#000',
//     shadowOpacity: 0.15,
//     shadowRadius: 10,
//     shadowOffset: {
//       width: 0,
//       height: 5,
//     },
//     elevation: 8,
//   },

//   header: {
//     flexDirection: 'row',
//     alignItems: 'flex-start',
//     justifyContent: 'space-between',
//   },

//   avatar: {
//     width: 60,
//     height: 60,
//     borderRadius: 20,
//     marginRight: 12,
//   },

//   name: {
//     fontSize: 18,
//     fontFamily: FontFamily.medium,
//     color: Colors.textColor,
//   },

//   phone: {
//     color: Colors.textBrown,
//     fontFamily: FontFamily.regular,
//     marginTop: 2,
//     fontSize: 12,
//   },

//   address: {
//     color: Colors.textBrown,
//     marginTop: 2,
//     fontSize: 12,
//     fontFamily: FontFamily.regular,
//   },

//   iconColumn: {
//     gap: 0,
//   },

//   circleBtn: {
//     width: 38,
//     height: 38,
//     borderRadius: 19,
//     backgroundColor: '#7bc043',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },

//   orderRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     marginTop: 20,
//   },

//   smallLabel: {
//     color: Colors.textBrown,
//     fontSize: 14,
//     fontFamily: FontFamily.regular,
//   },

//   boldText: {
//     fontFamily: FontFamily.bold,
//     marginTop: 2,
//     fontSize: 14,
//   },

//   amount: {
//     color: Colors.primary,
//     fontSize: 18,
//     fontFamily: FontFamily.regular,
//     marginTop: 2,
//   },

//   liveBox: {
//     flexDirection: 'row',
//     backgroundColor: '#FEF6F3',
//     padding: 6,
//     borderRadius: 10,
//     marginTop: 18,
//     alignItems: 'center',
//   },

//   liveTitle: {
//     color: Colors.textColor,
//     fontFamily: FontFamily.medium,
//   },

//   liveText: {
//     color: Colors.textBrown,
//     marginTop: 3,
//     fontSize: 12,
//     fontFamily: FontFamily.regular,
//   },

//   progressTitle: {
//     fontFamily: FontFamily.medium,
//     marginBottom: 15,
//     color: Colors.textColor,
//   },

//   progressRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//   },

//   stepContainer: {
//     alignItems: 'center',
//     flex: 1,
//     position: 'relative',
//     justifyContent: 'flex-start',
//   },

//   stepCircle: {
//     width: 30,
//     height: 30,
//     borderRadius: 15,
//     backgroundColor: '#e5e5e5',
//     justifyContent: 'center',
//     alignItems: 'center',
//     zIndex: 2,
//   },
//   activeStep: {
//     backgroundColor: Colors.lightOrange,
//   },

//   line: {
//     position: 'absolute',
//     top: 12,
//     left: '50%',
//     width: '100%',
//     height: 3,
//     backgroundColor: '#ddd',
//     zIndex: 1,
//   },

//   activeLine: {
//     backgroundColor: Colors.primary,
//   },

//   stepText: {
//     fontSize: 10,
//     marginTop: 10,
//     color: Colors.textBrown,
//     textAlign: 'center',
//     fontFamily: FontFamily.regular,
//   },

//   buttonRow: {
//     flexDirection: 'row',
//     marginTop: 25,
//     gap: 12,
//   },

//   mapBtn: {
//     flex: 1,
//     backgroundColor: Colors.buttonLight,
//     paddingVertical: 14,
//     borderRadius: 14,
//     alignItems: 'center',
//   },

//   deliverBtn: {
//     flex: 1,
//     backgroundColor: Colors.primary,
//     paddingVertical: 14,
//     borderRadius: 14,
//     alignItems: 'center',
//   },

//   mapBtnText: {
//     color: Colors.primary,
//     fontFamily: FontFamily.regular,
//     fontSize: 16,
//   },

//   deliverBtnText: {
//     color: '#fff',
//     fontFamily: FontFamily.regular,
//     fontSize: 16,
//   },

//   smallIcon: {
//     width: 18,
//     height: 18,
//     tintColor: '#fff',
//   },

//   smallIconOrange: {
//     width: 30,
//     height: 30,
//     tintColor: Colors.primary,
//   },

//   bikeIcon: {
//     width: 24,
//     height: 24,
//     tintColor: Colors.primary,
//   },

//   checkIcon: {
//     width: 16,
//     height: 16,
//   },
//   iconCircle: {
//     width: 60,
//     height: 60,
//     borderRadius: 30,
//     backgroundColor: Colors.lightOrange,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   codBadge: {
//     backgroundColor: Colors.lightBackground,
//     paddingHorizontal: 8,
//     paddingVertical: 3,
//     borderRadius: 20,
//     marginLeft: 2,
//   },

//   codText: {
//     color: Colors.primary,
//     fontSize: 12,
//     fontFamily: FontFamily.semiBold,
//   },
//   onWayStep: {
//     width: 30,
//     height: 30,
//     borderRadius: 15,
//     backgroundColor: Colors.lightOrange,

//     justifyContent: 'center',
//     alignItems: 'center',

//     zIndex: 3,
//   },

//   scooterIcon: {
//     width: 20,
//     height: 20,
//     tintColor: Colors.primary,
//   },
//   hideButton: {
//     width: 32,
//     height: 32,
//     borderRadius: 16,
//     backgroundColor: '#F5F5F5',
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginLeft: 10,
//   },

//   hideIcon: {
//     width: 16,
//     height: 16,
//     tintColor: Colors.textColor,
//   },

//   floatingShowButton: {
//     position: 'absolute',
//     bottom: 30,
//     right: 20,
//     width: 40,
//     height: 40,
//     borderRadius: 20,

//     backgroundColor: Colors.primary,

//     justifyContent: 'center',
//     alignItems: 'center',

//     shadowColor: '#000',
//     shadowOpacity: 0.2,
//     shadowRadius: 8,
//     shadowOffset: {
//       width: 0,
//       height: 4,
//     },

//     elevation: 10,
//   },

//   floatingArrow: {
//     width: 24,
//     height: 24,
//     tintColor: '#fff',
//   },
// });

// import React, { useEffect, useState, useRef } from 'react';
// import {
//   View,
//   StyleSheet,
//   PermissionsAndroid,
//   Platform,
//   Image,
//   Text,
//   TouchableOpacity,
//   ToastAndroid,
//   Alert,
// } from 'react-native';

// import {
//   Map,
//   Camera,
//   Marker,
//   GeoJSONSource,
//   Layer,
// } from '@maplibre/maplibre-react-native';

// import Geolocation from 'react-native-geolocation-service';
// import axios from 'axios';

// import Colors from '../assets/Colors/Colors';
// import GlobalTopBarDelivery from '../GlobalContainer/GlobalTopBarDelivery';
// import { DeliveryOrderDetails } from '../Models/DeliveryOrderDetails/DeliveryOrderDetails';
// import { FontFamily } from '../assets/GlobalFont/GlobalFont';
// import GlobalLoginAuth from '../GlobalContainer/GlobalLoginAuth';
// import GlobalApi from '../GlobalContainer/GlobalApi';
// import GlobalLoader from '../GlobalContainer/GlobalLoader';
// import { SendOtpResponse } from '../Models/SendOTP/SendOtpResponse ';

// const DARK_MAP_STYLE =
//   'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

// export default function DeliveryStart({ route, navigation }: any) {
//   const {
//     orderDetail,
//   }: {
//     orderDetail: DeliveryOrderDetails;
//   } = route.params;

//   const [showDetailsCard, setShowDetailsCard] = useState(true);
//   const lastSnappedIndexRef = useRef(-1);
//   // DESTINATION
//   const [destinationLocation] = useState({
//     latitude: orderDetail.customer.address.latitude || 22.8948,

//     longitude: orderDetail.customer.address.longitude || 88.41,
//   });

//   // CURRENT LOCATION
//   const [currentLocation, setCurrentLocation] = useState<{
//     latitude: number;
//     longitude: number;
//   } | null>(null);

//   // ROUTE
//   const [routeCoordinates, setRouteCoordinates] = useState<any[]>([]);
//   const routeCoordinatesRef = useRef<any[]>([]);
//   const [remainingRoute, setRemainingRoute] = useState<any[]>([]);
//   const headingRef = useRef(0);
//   const cameraHeadingRef = useRef(0);
//   const [riderPosition, setRiderPosition] = useState<{
//     latitude: number;
//     longitude: number;
//   } | null>(null);
//   // CAMERA HEADING
//   const [cameraHeading, setCameraHeading] = useState(0);

//   // SCOOTER HEADING
//   const [markerHeading, setMarkerHeading] = useState(0);
//   const [loading, setLoading] = useState(false);

//   const [locationHistory, setLocationHistory] = useState<
//     { latitude: number; longitude: number }[]
//   >([]);
//   // PREVIOUS LOCATION
//   const previousCoordinateRef = useRef<{
//     latitude: number;
//     longitude: number;
//   } | null>(null);

//   // REQUEST LOCATION PERMISSION
//   const requestLocationPermission = async () => {
//     if (Platform.OS === 'android') {
//       const granted = await PermissionsAndroid.request(
//         PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
//       );

//       if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
//         console.log('Location permission denied');
//       }
//     }
//   };

//   const calculateBearing = (
//     startLat: number,

//     startLng: number,

//     endLat: number,

//     endLng: number,
//   ) => {
//     const dLon = ((endLng - startLng) * Math.PI) / 180;

//     const y = Math.sin(dLon) * Math.cos((endLat * Math.PI) / 180);

//     const x =
//       Math.cos((startLat * Math.PI) / 180) *
//         Math.sin((endLat * Math.PI) / 180) -
//       Math.sin((startLat * Math.PI) / 180) *
//         Math.cos((endLat * Math.PI) / 180) *
//         Math.cos(dLon);

//     const brng = (Math.atan2(y, x) * 180) / Math.PI;

//     return (brng + 360) % 360;
//   };

//   // DISTANCE BETWEEN TWO POINTS
//   const getDistance = (
//     lat1: number,
//     lon1: number,
//     lat2: number,
//     lon2: number,
//   ) => {
//     const R = 6371e3;

//     const φ1 = (lat1 * Math.PI) / 180;
//     const φ2 = (lat2 * Math.PI) / 180;

//     const Δφ = ((lat2 - lat1) * Math.PI) / 180;

//     const Δλ = ((lon2 - lon1) * Math.PI) / 180;

//     const a =
//       Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
//       Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

//     const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

//     return R * c;
//   };

//   const getProjectedPointOnSegment = (
//     lat: number,
//     lng: number,
//     startLat: number,
//     startLng: number,
//     endLat: number,
//     endLng: number,
//   ) => {
//     const dx = endLng - startLng;
//     const dy = endLat - startLat;

//     const lengthSquared = dx * dx + dy * dy;

//     if (lengthSquared === 0) {
//       return {
//         latitude: startLat,
//         longitude: startLng,
//         t: 0,
//       };
//     }

//     let t = ((lng - startLng) * dx + (lat - startLat) * dy) / lengthSquared;

//     t = Math.max(0, Math.min(1, t));

//     return {
//       latitude: startLat + t * dy,
//       longitude: startLng + t * dx,
//       t,
//     };
//   };

//   const getNearestPointOnRoute = (
//     latitude: number,
//     longitude: number,
//     route: any[],
//   ) => {
//     if (route.length < 2) {
//       return null;
//     }

//     let minDistance = Infinity;

//     let nearestIndex = 0;

//     let projectedPoint: any = null;

//     for (let i = 0; i < route.length - 1; i++) {
//       const start = route[i];
//       const end = route[i + 1];

//       const projected = getProjectedPointOnSegment(
//         latitude,
//         longitude,
//         start[1],
//         start[0],
//         end[1],
//         end[0],
//       );

//       const distance = getDistance(
//         latitude,
//         longitude,
//         projected.latitude,
//         projected.longitude,
//       );

//       if (distance < minDistance) {
//         minDistance = distance;
//         nearestIndex = i;
//         projectedPoint = projected;
//       }
//     }

//     return {
//       index: nearestIndex,
//       distance: minDistance,
//       point: projectedPoint,
//     };
//   };
//   // ROUTE API
//   const getRoute = async (
//     startLat: number,
//     startLng: number,
//     endLat: number,
//     endLng: number,
//   ) => {
//     try {
//       const response = await axios.get(
//         `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`,
//       );

//       if (
//         response.data &&
//         response.data.routes &&
//         response.data.routes.length > 0
//       ) {
//         const osrmCoordinates = response.data.routes[0].geometry.coordinates;

//         // Insert actual GPS as first point
//         const coordinates = [[startLng, startLat], ...osrmCoordinates];

//         for (let i = 0; i < 5; i++) {
//           const dist = getDistance(
//             coordinates[i][1],
//             coordinates[i][0],
//             coordinates[i + 1][1],
//             coordinates[i + 1][0],
//           );

//           console.log(`Distance ${i} -> ${i + 1}:`, dist);
//         }
//         setRouteCoordinates(coordinates);
//         routeCoordinatesRef.current = coordinates;

//         console.log('Route Length:', coordinates.length);

//         console.log('First Route Point:', coordinates[0]);

//         console.log('Start GPS:', startLat, startLng);

//         console.log(
//           'Distance Between Start And Route Point:',
//           getDistance(startLat, startLng, coordinates[0][1], coordinates[0][0]),
//         );

//         if (!riderPosition && coordinates.length > 0) {
//           setRiderPosition({
//             latitude: coordinates[0][1],
//             longitude: coordinates[0][0],
//           });

//           lastSnappedIndexRef.current = 0;

//           setRemainingRoute(coordinates);
//         }
//       }
//     } catch (error) {
//       console.log('ROUTE ERROR', error);
//     }
//   };

//   // INITIAL LOCATION
//   const getCurrentLocation = async () => {
//     Geolocation.getCurrentPosition(
//       async position => {
//         const latitude = position.coords.latitude;

//         const longitude = position.coords.longitude;

//         setCurrentLocation({
//           latitude,
//           longitude,
//         });

//         previousCoordinateRef.current = {
//           latitude,
//           longitude,
//         };

//         await getRoute(
//           latitude,
//           longitude,
//           destinationLocation.latitude,
//           destinationLocation.longitude,
//         );
//       },

//       error => {
//         console.log(error);
//       },

//       {
//         enableHighAccuracy: true,
//         timeout: 15000,
//         maximumAge: 10000,
//       },
//     );
//   };

//   // LIVE TRACKING
//   useEffect(() => {
//     requestLocationPermission();

//     getCurrentLocation();

//     const animateMarker = (
//       startLat: number,
//       startLng: number,
//       endLat: number,
//       endLng: number,
//     ) => {
//       const steps = 30;       // 30 steps x 50ms = 1.5 seconds
//       let currentStep = 0;

//       const interval = setInterval(() => {
//         currentStep++;
//         const progress = currentStep / steps;

//         setRiderPosition({
//           latitude: startLat + (endLat - startLat) * progress,
//           longitude: startLng + (endLng - startLng) * progress,
//         });

//         if (currentStep >= steps) {
//           clearInterval(interval);
//         }
//       }, 50);
//     };

//     // SMOOTH HEADING ANIMATION — marker + camera dono
//     const animateHeading = (fromBearing: number, toBearing: number) => {
//       // Shortest arc: 350 to 10 = +20, not -340
//       let delta = toBearing - fromBearing;
//       if (delta > 180) delta -= 360;
//       if (delta < -180) delta += 360;

//       const steps = 30;       // 30 steps x 50ms = 1.5 seconds
//       let currentStep = 0;

//       const interval = setInterval(() => {
//         currentStep++;
//         const progress = currentStep / steps;
//         const newHeading = (fromBearing + delta * progress + 360) % 360;

//         headingRef.current = newHeading;
//         setMarkerHeading(newHeading);
//         setCameraHeading(newHeading);
//         cameraHeadingRef.current = newHeading;

//         if (currentStep >= steps) {
//           clearInterval(interval);
//         }
//       }, 50); // 30 steps x 50ms = 1.5 seconds total
//     };
//     const watchId = Geolocation.watchPosition(
//       async position => {
//         const latitude = position.coords.latitude;

//         const longitude = position.coords.longitude;

//         const previous = previousCoordinateRef.current;

//         if (previous) {
//           const movedDistance = getDistance(
//             previous.latitude,
//             previous.longitude,
//             latitude,
//             longitude,
//           );

//           console.log('GPS Move Distance:', movedDistance);
//         }

//         // UPDATE LOCATION
//         setCurrentLocation({
//           latitude,
//           longitude,
//         });
//         // ARRAY ME STORE KARO
//         setLocationHistory(prev => {
//           const updated = [
//             ...prev,
//             {
//               latitude,
//               longitude,
//             },
//           ];

//           // // TOAST ME DIKHAO
//           // ToastAndroid.show(
//           //   JSON.stringify(updated),
//           //   ToastAndroid.SHORT,
//           // );

//           return updated;
//         });

//         const route = routeCoordinatesRef.current;

//         if (route.length < 2) {
//           return;
//         }
//         // CALCULATE HEADING
//         if (previous) {
//           const movedDistance = getDistance(
//             previous.latitude,
//             previous.longitude,
//             latitude,
//             longitude,
//           );
//           ToastAndroid.show(
//             `Rider moved: ${movedDistance.toFixed(1)} meter`,
//             ToastAndroid.SHORT,
//           );

//           console.log('GPS Move Distance:', movedDistance);
//           // if (movedDistance < 3) {
//           //   return;
//           // }
//           const route = routeCoordinatesRef.current;
//           if (route.length > 1) {
//             const snapped = getNearestPointOnRoute(latitude, longitude, route);

//             if (snapped) {
//               if (riderPosition) {
//                 animateMarker(
//                   riderPosition.latitude,
//                   riderPosition.longitude,
//                   snapped.point.latitude,
//                   snapped.point.longitude,
//                 );
//               } else {
//                 setRiderPosition({
//                   latitude: snapped.point.latitude,
//                   longitude: snapped.point.longitude,
//                 });
//               }

//               const currentMatchedPoint = [
//                 snapped.point.longitude,
//                 snapped.point.latitude,
//               ];

//               setRemainingRoute([
//                 currentMatchedPoint,
//                 ...route.slice(snapped.index + 1),
//               ]);

//               if (snapped.index !== lastSnappedIndexRef.current) {
//                 lastSnappedIndexRef.current = snapped.index;
//               }

//               if (snapped.index < route.length - 1) {
//                 const current = route[snapped.index];
//                 const next = route[snapped.index + 1];

//                 const routeBearing = calculateBearing(
//                   current[1],
//                   current[0],
//                   next[1],
//                   next[0],
//                 );

//                 if (Math.abs(routeBearing - headingRef.current) > 5) {
//                   animateHeading(headingRef.current, routeBearing);
//                 }
//               }
//             }
//           }
//         }

//         previousCoordinateRef.current = {
//           latitude,
//           longitude,
//         };
//       },

//       error => {
//         console.log(error);
//       },

//       {
//         enableHighAccuracy: true,
//         distanceFilter: 1,
//         interval: 1000,
//         fastestInterval: 500,
//         showLocationDialog: true,
//         forceRequestLocation: true,
//       },
//     );

//     return () => {
//       Geolocation.clearWatch(watchId);
//     };
//   }, []);

//   const sendOTP = async () => {
//     try {
//       setLoading(true);

//       console.log(
//         'Fetching dashboard data with token:',
//         GlobalLoginAuth.refreshToken,
//       );

//       const response = await fetch(
//         `${GlobalApi.baseUrl}api/deliveries/me/orders/${orderDetail?.order.id}/send-otp`,

//         {
//           method: 'POST',

//           headers: {
//             'Content-Type': 'application/json',

//             Authorization: `Bearer ${GlobalLoginAuth.accessToken}`,
//           },
//         },
//       );

//       const result = await response.json();

//       const SendOtpResponse = result as SendOtpResponse; // âœ… Type assertion to ensure it matches our model

//       console.log('Generate OTP Response:', result);

//       if (!response.ok) {
//         Alert.alert('FoodyPly', result.message || 'Failed to load dashboard');

//         return;
//       }

//       if (SendOtpResponse.success) {
//         console.log('OTP sent successfully:', SendOtpResponse.data.otp);

//         navigation.navigate('DeliveryOtpVerification', {
//           orderDetail: orderDetail,
//           otp: SendOtpResponse.data.otp,
//         });
//       }
//     } catch (error) {
//       console.log(error);

//       Alert.alert('FoodyPly', 'Unable to connect to server');
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <View style={styles.container}>
//       <GlobalTopBarDelivery
//         navigation={navigation}
//         notificationClick={() => {}}
//         text="Start Delivery"
//         subtitleText={`#${orderDetail?.order.orderNumber}`}
//         isBackVisible={true}
//         isOnlineVisible={false}
//       />

//       <View style={styles.overlay}>
//         <View style={styles.card}>
//           <View style={styles.mapContainer}>
//             <Map
//               style={styles.map}
//               mapStyle={DARK_MAP_STYLE}
//               logo={false}
//               compass={true}
//             >
//               {/* CAMERA */}
//               {riderPosition && (
//                 <Camera
//                   zoom={19}
//                   pitch={70}
//                   bearing={cameraHeading}
//                   center={[riderPosition.longitude, riderPosition.latitude]}
//                   padding={{
//                     top: 800,
//                     bottom: 500,
//                     left: 0,
//                     right: 0,
//                   }}
//                 />
//               )}

//               {/* DELIVERY BOY MARKER */}
//               {riderPosition && (
//                 <Marker
//                   anchor="center"
//                   lngLat={[riderPosition.longitude, riderPosition.latitude]}
//                 >
//                   <View
//                     style={[
//                       styles.currentMarkerWrapper,
//                       {
//                         transform: [
//                           {
//                             rotate: `${markerHeading}deg`,
//                           },
//                         ],
//                       },
//                     ]}
//                   >
//                     <Image
//                       source={require('../assets/images/dman.png')}
//                       style={styles.deliveryIcon}
//                       resizeMode="contain"
//                     />
//                   </View>
//                 </Marker>
//               )}

//               {/* DESTINATION */}
//               <Marker
//                 anchor="center"
//                 lngLat={[
//                   destinationLocation.longitude,
//                   destinationLocation.latitude,
//                 ]}
//               >
//                 <View style={styles.destinationMarkerWrapper}>
//                   <View style={styles.destinationMarker} />
//                 </View>
//               </Marker>

//               {/* ROUTE */}
//               {routeCoordinates.length > 1 && (
//                 <GeoJSONSource
//                   id="routeSource"
//                   data={{
//                     type: 'FeatureCollection',
//                     features: [
//                       {
//                         type: 'Feature',
//                         properties: {},
//                         geometry: {
//                           type: 'LineString',
//                           coordinates: remainingRoute,
//                         },
//                       },
//                     ],
//                   }}
//                 >
//                   {/* ROUTE SHADOW */}
//                   <Layer
//                     id="routeLayerBg"
//                     type="line"
//                     paint={{
//                       'line-color': '#0B3B2E',
//                       'line-width': 10,
//                       'line-opacity': 0.7,
//                     }}
//                     layout={{
//                       'line-cap': 'round',
//                       'line-join': 'round',
//                     }}
//                   />

//                   {/* MAIN ROUTE */}
//                   <Layer
//                     id="routeLayer"
//                     type="line"
//                     paint={{
//                       'line-color': '#00FF9D',
//                       'line-width': 6,
//                       'line-opacity': 1,
//                     }}
//                     layout={{
//                       'line-cap': 'round',
//                       'line-join': 'round',
//                     }}
//                   />
//                 </GeoJSONSource>
//               )}
//             </Map>

//             {/* FLOATING CARD */}
//             {showDetailsCard ? (
//               <View style={styles.card1}>
//                 {/* USER INFO */}
//                 <View style={styles.header}>
//                   <Image
//                     source={
//                       orderDetail?.customer?.profileImageUrl
//                         ? { uri: orderDetail.customer.profileImageUrl }
//                         : require('../assets/images/customer_image.png')
//                     }
//                     style={styles.avatar}
//                   />

//                   <View style={{ flex: 1 }}>
//                     <Text style={styles.name}>{orderDetail.customer.name}</Text>
//                     <Text style={styles.phone}>
//                       {orderDetail.customer.phone}
//                     </Text>
//                     <Text style={styles.address}>
//                       {orderDetail.customer.address.fullText}
//                     </Text>
//                   </View>

//                   <View style={styles.iconColumn}>
//                     <TouchableOpacity style={styles.circleBtn}>
//                       <Image
//                         source={require('../assets/images/call.png')}
//                         style={styles.smallIcon}
//                       />
//                     </TouchableOpacity>
//                   </View>
//                 </View>

//                 {/* ORDER INFO */}
//                 <View style={styles.orderRow}>
//                   <View
//                     style={{
//                       flexDirection: 'row',
//                       alignItems: 'center',
//                       gap: 5,
//                     }}
//                   >
//                     <Image
//                       source={require('../assets/images/shopping_bag.png')}
//                       style={styles.smallIconOrange}
//                     />

//                     <View>
//                       <Text style={styles.smallLabel}>
//                         {orderDetail.items.length} Items •{' '}
//                         {orderDetail.items.reduce(
//                           (acc, item) => acc + item.quantity,
//                           0,
//                         )}{' '}
//                         Qty
//                       </Text>
//                       <View
//                         style={{
//                           flexDirection: 'row',
//                           alignItems: 'center',
//                           gap: 4,
//                           marginTop: 2,
//                         }}
//                       >
//                         <Text style={styles.smallLabel}>Payment Status</Text>
//                         <View style={styles.codBadge}>
//                           <Text style={styles.codText}>
//                             {orderDetail.billing.paymentStatus}
//                           </Text>
//                         </View>
//                       </View>
//                     </View>
//                   </View>
//                   <View>
//                     <Text style={styles.smallLabel}>Order Amount</Text>
//                     <Text style={styles.amount}>
//                       ₹{orderDetail.billing.finalAmount.toFixed(2)}
//                     </Text>
//                   </View>
//                 </View>

//                 {/* LIVE STATUS */}
//                 <View style={styles.liveBox}>
//                   <View style={styles.iconCircle}>
//                     <Image
//                       source={require('../assets/images/scooter.png')}
//                       style={styles.bikeIcon}
//                     />
//                   </View>
//                   <View style={{ marginLeft: 10 }}>
//                     <Text style={styles.liveTitle}>Live Status</Text>
//                     <Text style={styles.liveText}>
//                       You are on the way to the customer
//                     </Text>
//                   </View>
//                 </View>

//                 {/* PROGRESS */}
//                 <View style={{ marginTop: 20 }}>
//                   <Text style={styles.progressTitle}>Order Progress</Text>

//                   <View style={styles.progressRow}>
//                     {[
//                       'Assigned',
//                       'Accepted',
//                       'Picked',
//                       'On The Way',
//                       'Delivered',
//                     ].map((item, index) => {
//                       const isActive = index <= 3;
//                       const isOnWay = item === 'On The Way';

//                       return (
//                         <View key={index} style={styles.stepContainer}>
//                           <View
//                             style={[
//                               styles.stepCircle,
//                               isActive && styles.activeStep,

//                               // LIGHT ORANGE BACKGROUND FOR ON WAY
//                               isOnWay && styles.onWayStep,
//                             ]}
//                           >
//                             {isOnWay ? (
//                               <Image
//                                 source={require('../assets/images/scooter.png')}
//                                 style={styles.scooterIcon}
//                               />
//                             ) : (
//                               <Image
//                                 source={require('../assets/images/check.png')}
//                                 style={[
//                                   styles.checkIcon,
//                                   {
//                                     tintColor: isActive
//                                       ? Colors.primary
//                                       : '#bbb',
//                                   },
//                                 ]}
//                               />
//                             )}
//                           </View>

//                           <Text style={styles.stepText}>{item}</Text>

//                           {index !== 4 && (
//                             <View
//                               style={[
//                                 styles.line,
//                                 index < 3 && styles.activeLine,
//                               ]}
//                             />
//                           )}
//                         </View>
//                       );
//                     })}
//                   </View>
//                 </View>

//                 {/* BUTTONS */}
//                 <View style={styles.buttonRow}>
//                   <TouchableOpacity
//                     style={styles.mapBtn}
//                     onPress={() => setShowDetailsCard(false)}
//                   >
//                     <Text style={styles.mapBtnText}>Open in Maps</Text>
//                   </TouchableOpacity>

//                   <TouchableOpacity
//                     style={styles.deliverBtn}
//                     onPress={() => sendOTP()}
//                   >
//                     <Text style={styles.deliverBtnText}>Order Delivered</Text>
//                   </TouchableOpacity>
//                 </View>
//               </View>
//             ) : (
//               <TouchableOpacity
//                 activeOpacity={0.8}
//                 style={styles.floatingShowButton}
//                 onPress={() => setShowDetailsCard(true)}
//               >
//                 <Image
//                   source={require('../assets/images/shopping_bag.png')}
//                   style={styles.floatingArrow}
//                 />
//               </TouchableOpacity>
//             )}
//           </View>
//         </View>
//       </View>
//       <GlobalLoader visible={loading} />
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: Colors.primary,
//     paddingTop: 100,
//   },

//   overlay: {
//     flex: 1,
//     borderTopLeftRadius: 30,
//     borderTopRightRadius: 30,
//     marginTop: 20,
//   },

//   card: {
//     backgroundColor: '#fff',
//     borderTopLeftRadius: 20,
//     borderTopRightRadius: 20,
//     flex: 1,
//   },

//   mapContainer: {
//     flex: 1,
//     borderTopLeftRadius: 20,
//     borderTopRightRadius: 20,
//     overflow: 'hidden',
//   },

//   map: {
//     flex: 1,
//   },

//   currentMarkerWrapper: {
//     width: 44,
//     height: 44,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },

//   deliveryIcon: {
//     width: 80,
//     height: 80,

//     // REMOVE THIS IF IMAGE ALREADY ORANGE
//     // tintColor: Colors.primary,
//   },

//   destinationMarkerWrapper: {
//     width: 30,
//     height: 30,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },

//   destinationMarker: {
//     width: 18,
//     height: 18,
//     borderRadius: 9,
//     backgroundColor: 'red',
//     borderWidth: 3,
//     borderColor: '#fff',
//   },
//   card1: {
//     position: 'absolute',
//     bottom: 20,
//     left: 15,
//     right: 15,
//     backgroundColor: '#fff',
//     borderRadius: 25,
//     padding: 18,

//     shadowColor: '#000',
//     shadowOpacity: 0.15,
//     shadowRadius: 10,
//     shadowOffset: {
//       width: 0,
//       height: 5,
//     },
//     elevation: 8,
//   },

//   header: {
//     flexDirection: 'row',
//     alignItems: 'flex-start',
//     justifyContent: 'space-between',
//   },

//   avatar: {
//     width: 60,
//     height: 60,
//     borderRadius: 20,
//     marginRight: 12,
//   },

//   name: {
//     fontSize: 18,
//     fontFamily: FontFamily.medium,
//     color: Colors.textColor,
//   },

//   phone: {
//     color: Colors.textBrown,
//     fontFamily: FontFamily.regular,
//     marginTop: 2,
//     fontSize: 12,
//   },

//   address: {
//     color: Colors.textBrown,
//     marginTop: 2,
//     fontSize: 12,
//     fontFamily: FontFamily.regular,
//   },

//   iconColumn: {
//     gap: 0,
//   },

//   circleBtn: {
//     width: 38,
//     height: 38,
//     borderRadius: 19,
//     backgroundColor: '#7bc043',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },

//   orderRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     marginTop: 20,
//   },

//   smallLabel: {
//     color: Colors.textBrown,
//     fontSize: 14,
//     fontFamily: FontFamily.regular,
//   },

//   boldText: {
//     fontFamily: FontFamily.bold,
//     marginTop: 2,
//     fontSize: 14,
//   },

//   amount: {
//     color: Colors.primary,
//     fontSize: 18,
//     fontFamily: FontFamily.regular,
//     marginTop: 2,
//   },

//   liveBox: {
//     flexDirection: 'row',
//     backgroundColor: '#FEF6F3',
//     padding: 6,
//     borderRadius: 10,
//     marginTop: 18,
//     alignItems: 'center',
//   },

//   liveTitle: {
//     color: Colors.textColor,
//     fontFamily: FontFamily.medium,
//   },

//   liveText: {
//     color: Colors.textBrown,
//     marginTop: 3,
//     fontSize: 12,
//     fontFamily: FontFamily.regular,
//   },

//   progressTitle: {
//     fontFamily: FontFamily.medium,
//     marginBottom: 15,
//     color: Colors.textColor,
//   },

//   progressRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//   },

//   stepContainer: {
//     alignItems: 'center',
//     flex: 1,
//     position: 'relative',
//     justifyContent: 'flex-start',
//   },

//   stepCircle: {
//     width: 30,
//     height: 30,
//     borderRadius: 15,
//     backgroundColor: '#e5e5e5',
//     justifyContent: 'center',
//     alignItems: 'center',
//     zIndex: 2,
//   },
//   activeStep: {
//     backgroundColor: Colors.lightOrange,
//   },

//   line: {
//     position: 'absolute',
//     top: 12,
//     left: '50%',
//     width: '100%',
//     height: 3,
//     backgroundColor: '#ddd',
//     zIndex: 1,
//   },

//   activeLine: {
//     backgroundColor: Colors.primary,
//   },

//   stepText: {
//     fontSize: 10,
//     marginTop: 10,
//     color: Colors.textBrown,
//     textAlign: 'center',
//     fontFamily: FontFamily.regular,
//   },

//   buttonRow: {
//     flexDirection: 'row',
//     marginTop: 25,
//     gap: 12,
//   },

//   mapBtn: {
//     flex: 1,
//     backgroundColor: Colors.buttonLight,
//     paddingVertical: 14,
//     borderRadius: 14,
//     alignItems: 'center',
//   },

//   deliverBtn: {
//     flex: 1,
//     backgroundColor: Colors.primary,
//     paddingVertical: 14,
//     borderRadius: 14,
//     alignItems: 'center',
//   },

//   mapBtnText: {
//     color: Colors.primary,
//     fontFamily: FontFamily.regular,
//     fontSize: 16,
//   },

//   deliverBtnText: {
//     color: '#fff',
//     fontFamily: FontFamily.regular,
//     fontSize: 16,
//   },

//   smallIcon: {
//     width: 18,
//     height: 18,
//     tintColor: '#fff',
//   },

//   smallIconOrange: {
//     width: 30,
//     height: 30,
//     tintColor: Colors.primary,
//   },

//   bikeIcon: {
//     width: 24,
//     height: 24,
//     tintColor: Colors.primary,
//   },

//   checkIcon: {
//     width: 16,
//     height: 16,
//   },
//   iconCircle: {
//     width: 60,
//     height: 60,
//     borderRadius: 30,
//     backgroundColor: Colors.lightOrange,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   codBadge: {
//     backgroundColor: Colors.lightBackground,
//     paddingHorizontal: 8,
//     paddingVertical: 3,
//     borderRadius: 20,
//     marginLeft: 2,
//   },

//   codText: {
//     color: Colors.primary,
//     fontSize: 12,
//     fontFamily: FontFamily.semiBold,
//   },
//   onWayStep: {
//     width: 30,
//     height: 30,
//     borderRadius: 15,
//     backgroundColor: Colors.lightOrange,

//     justifyContent: 'center',
//     alignItems: 'center',

//     zIndex: 3,
//   },

//   scooterIcon: {
//     width: 20,
//     height: 20,
//     tintColor: Colors.primary,
//   },
//   hideButton: {
//     width: 32,
//     height: 32,
//     borderRadius: 16,
//     backgroundColor: '#F5F5F5',
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginLeft: 10,
//   },

//   hideIcon: {
//     width: 16,
//     height: 16,
//     tintColor: Colors.textColor,
//   },

//   floatingShowButton: {
//     position: 'absolute',
//     bottom: 30,
//     right: 20,
//     width: 40,
//     height: 40,
//     borderRadius: 20,

//     backgroundColor: Colors.primary,

//     justifyContent: 'center',
//     alignItems: 'center',

//     shadowColor: '#000',
//     shadowOpacity: 0.2,
//     shadowRadius: 8,
//     shadowOffset: {
//       width: 0,
//       height: 4,
//     },

//     elevation: 10,
//   },

//   floatingArrow: {
//     width: 24,
//     height: 24,
//     tintColor: '#fff',
//   },
// });

// import React, { useEffect, useState, useRef } from 'react';
// import {
//   View,
//   StyleSheet,
//   PermissionsAndroid,
//   Platform,
//   Image,
//   Text,
//   TouchableOpacity,
//   ToastAndroid,
//   Alert,
// } from 'react-native';

// import {
//   Map,
//   Camera,
//   Marker,
//   GeoJSONSource,
//   Layer,
// } from '@maplibre/maplibre-react-native';

// import Geolocation from 'react-native-geolocation-service';
// import axios from 'axios';

// import Colors from '../assets/Colors/Colors';
// import GlobalTopBarDelivery from '../GlobalContainer/GlobalTopBarDelivery';
// import { DeliveryOrderDetails } from '../Models/DeliveryOrderDetails/DeliveryOrderDetails';
// import { FontFamily } from '../assets/GlobalFont/GlobalFont';
// import GlobalLoginAuth from '../GlobalContainer/GlobalLoginAuth';
// import GlobalApi from '../GlobalContainer/GlobalApi';
// import GlobalLoader from '../GlobalContainer/GlobalLoader';
// import { SendOtpResponse } from '../Models/SendOTP/SendOtpResponse ';

// const DARK_MAP_STYLE =
//   'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

// export default function DeliveryStart({ route, navigation }: any) {
//   const {
//     orderDetail,
//   }: {
//     orderDetail: DeliveryOrderDetails;
//   } = route.params;

//   const [showDetailsCard, setShowDetailsCard] = useState(true);
//   const lastSnappedIndexRef = useRef(-1);
//   // DESTINATION
//   const [destinationLocation] = useState({
//     latitude: orderDetail.customer.address.latitude || 22.8948,

//     longitude: orderDetail.customer.address.longitude || 88.41,
//   });

//   // CURRENT LOCATION
//   const [currentLocation, setCurrentLocation] = useState<{
//     latitude: number;
//     longitude: number;
//   } | null>(null);

//   // ROUTE
//   const [routeCoordinates, setRouteCoordinates] = useState<any[]>([]);
//   const routeCoordinatesRef = useRef<any[]>([]);
//   const [remainingRoute, setRemainingRoute] = useState<any[]>([]);
//   const headingRef = useRef(0);
//   const cameraHeadingRef = useRef(0);
//   const [riderPosition, setRiderPosition] = useState<{
//     latitude: number;
//     longitude: number;
//   } | null>(null);
//   // CAMERA HEADING
//   const [cameraHeading, setCameraHeading] = useState(0);

//   // SCOOTER HEADING
//   const [markerHeading, setMarkerHeading] = useState(0);
//   const [loading, setLoading] = useState(false);

//   const [locationHistory, setLocationHistory] = useState<
//     { latitude: number; longitude: number }[]
//   >([]);
//   // PREVIOUS LOCATION
//   const previousCoordinateRef = useRef<{
//     latitude: number;
//     longitude: number;
//   } | null>(null);

//   // REQUEST LOCATION PERMISSION
//   const requestLocationPermission = async () => {
//     if (Platform.OS === 'android') {
//       const granted = await PermissionsAndroid.request(
//         PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
//       );

//       if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
//         console.log('Location permission denied');
//       }
//     }
//   };

//   const calculateBearing = (
//     startLat: number,

//     startLng: number,

//     endLat: number,

//     endLng: number,
//   ) => {
//     const dLon = ((endLng - startLng) * Math.PI) / 180;

//     const y = Math.sin(dLon) * Math.cos((endLat * Math.PI) / 180);

//     const x =
//       Math.cos((startLat * Math.PI) / 180) *
//         Math.sin((endLat * Math.PI) / 180) -
//       Math.sin((startLat * Math.PI) / 180) *
//         Math.cos((endLat * Math.PI) / 180) *
//         Math.cos(dLon);

//     const brng = (Math.atan2(y, x) * 180) / Math.PI;

//     return (brng + 360) % 360;
//   };

//   // DISTANCE BETWEEN TWO POINTS
//   const getDistance = (
//     lat1: number,
//     lon1: number,
//     lat2: number,
//     lon2: number,
//   ) => {
//     const R = 6371e3;

//     const φ1 = (lat1 * Math.PI) / 180;
//     const φ2 = (lat2 * Math.PI) / 180;

//     const Δφ = ((lat2 - lat1) * Math.PI) / 180;

//     const Δλ = ((lon2 - lon1) * Math.PI) / 180;

//     const a =
//       Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
//       Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

//     const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

//     return R * c;
//   };

//   const getProjectedPointOnSegment = (
//     lat: number,
//     lng: number,
//     startLat: number,
//     startLng: number,
//     endLat: number,
//     endLng: number,
//   ) => {
//     const dx = endLng - startLng;
//     const dy = endLat - startLat;

//     const lengthSquared = dx * dx + dy * dy;

//     if (lengthSquared === 0) {
//       return {
//         latitude: startLat,
//         longitude: startLng,
//         t: 0,
//       };
//     }

//     let t = ((lng - startLng) * dx + (lat - startLat) * dy) / lengthSquared;

//     t = Math.max(0, Math.min(1, t));

//     return {
//       latitude: startLat + t * dy,
//       longitude: startLng + t * dx,
//       t,
//     };
//   };

//   const getNearestPointOnRoute = (
//     latitude: number,
//     longitude: number,
//     route: any[],
//   ) => {
//     if (route.length < 2) {
//       return null;
//     }

//     let minDistance = Infinity;

//     let nearestIndex = 0;

//     let projectedPoint: any = null;

//     for (let i = 0; i < route.length - 1; i++) {
//       const start = route[i];
//       const end = route[i + 1];

//       const projected = getProjectedPointOnSegment(
//         latitude,
//         longitude,
//         start[1],
//         start[0],
//         end[1],
//         end[0],
//       );

//       const distance = getDistance(
//         latitude,
//         longitude,
//         projected.latitude,
//         projected.longitude,
//       );

//       if (distance < minDistance) {
//         minDistance = distance;
//         nearestIndex = i;
//         projectedPoint = projected;
//       }
//     }

//     return {
//       index: nearestIndex,
//       distance: minDistance,
//       point: projectedPoint,
//     };
//   };
//   // ROUTE API
//   const getRoute = async (
//     startLat: number,
//     startLng: number,
//     endLat: number,
//     endLng: number,
//   ) => {
//     try {
//       const response = await axios.get(
//         `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`,
//       );

//       if (
//         response.data &&
//         response.data.routes &&
//         response.data.routes.length > 0
//       ) {
//         const osrmCoordinates = response.data.routes[0].geometry.coordinates;

//         // Insert actual GPS as first point
//         const coordinates = [[startLng, startLat], ...osrmCoordinates];

//         for (let i = 0; i < 5; i++) {
//           const dist = getDistance(
//             coordinates[i][1],
//             coordinates[i][0],
//             coordinates[i + 1][1],
//             coordinates[i + 1][0],
//           );

//           console.log(`Distance ${i} -> ${i + 1}:`, dist);
//         }
//         setRouteCoordinates(coordinates);
//         routeCoordinatesRef.current = coordinates;

//         console.log('Route Length:', coordinates.length);

//         console.log('First Route Point:', coordinates[0]);

//         console.log('Start GPS:', startLat, startLng);

//         console.log(
//           'Distance Between Start And Route Point:',
//           getDistance(startLat, startLng, coordinates[0][1], coordinates[0][0]),
//         );

//         if (!riderPosition && coordinates.length > 0) {
//           setRiderPosition({
//             latitude: coordinates[0][1],
//             longitude: coordinates[0][0],
//           });

//           lastSnappedIndexRef.current = 0;

//           setRemainingRoute(coordinates);
//         }
//       }
//     } catch (error) {
//       console.log('ROUTE ERROR', error);
//     }
//   };

//   // INITIAL LOCATION
//   const getCurrentLocation = async () => {
//     Geolocation.getCurrentPosition(
//       async position => {
//         const latitude = position.coords.latitude;

//         const longitude = position.coords.longitude;

//         setCurrentLocation({
//           latitude,
//           longitude,
//         });

//         previousCoordinateRef.current = {
//           latitude,
//           longitude,
//         };

//         await getRoute(
//           latitude,
//           longitude,
//           destinationLocation.latitude,
//           destinationLocation.longitude,
//         );
//       },

//       error => {
//         console.log(error);
//       },

//       {
//         enableHighAccuracy: true,
//         timeout: 15000,
//         maximumAge: 10000,
//       },
//     );
//   };

//   // LIVE TRACKING
//   useEffect(() => {
//     requestLocationPermission();

//     getCurrentLocation();

//     const animateMarker = (
//       startLat: number,
//       startLng: number,
//       endLat: number,
//       endLng: number,
//     ) => {
//       const steps = 20;
//       let currentStep = 0;

//       const interval = setInterval(() => {
//         currentStep++;

//         const progress = currentStep / steps;

//         setRiderPosition({
//           latitude: startLat + (endLat - startLat) * progress,
//           longitude: startLng + (endLng - startLng) * progress,
//         });

//         if (currentStep >= steps) {
//           clearInterval(interval);
//         }
//       }, 50);
//     };

//     // SMOOTH HEADING ANIMATION
//     const animateHeading = (fromBearing: number, toBearing: number) => {
//       // Always rotate the SHORT way: e.g. 350° → 10° = +20°, not -340°
//       let delta = toBearing - fromBearing;
//       if (delta > 180) delta -= 360;
//       if (delta < -180) delta += 360;

//       const steps = 20;
//       let currentStep = 0;

//       const interval = setInterval(() => {
//         currentStep++;
//         const progress = currentStep / steps;
//         const newHeading = (fromBearing + delta * progress + 360) % 360;

//         // Keep ref in sync so next turn starts from the correct angle
//         headingRef.current = newHeading;
//         setMarkerHeading(newHeading);

//         if (currentStep >= steps) {
//           clearInterval(interval);
//         }
//       }, 50); // 20 steps × 50ms = 1 second, matches animateMarker
//     };
//     const watchId = Geolocation.watchPosition(
//       async position => {
//         const latitude = position.coords.latitude;

//         const longitude = position.coords.longitude;

//         const previous = previousCoordinateRef.current;

//         if (previous) {
//           const movedDistance = getDistance(
//             previous.latitude,
//             previous.longitude,
//             latitude,
//             longitude,
//           );

//           console.log('GPS Move Distance:', movedDistance);
//         }

//         // UPDATE LOCATION
//         setCurrentLocation({
//           latitude,
//           longitude,
//         });
//         // ARRAY ME STORE KARO
//         setLocationHistory(prev => {
//           const updated = [
//             ...prev,
//             {
//               latitude,
//               longitude,
//             },
//           ];

//           // // TOAST ME DIKHAO
//           // ToastAndroid.show(
//           //   JSON.stringify(updated),
//           //   ToastAndroid.SHORT,
//           // );

//           return updated;
//         });

//         const route = routeCoordinatesRef.current;

//         if (route.length < 2) {
//           return;
//         }
//         // CALCULATE HEADING
//         if (previous) {
//           const movedDistance = getDistance(
//             previous.latitude,
//             previous.longitude,
//             latitude,
//             longitude,
//           );
//           ToastAndroid.show(
//             `Rider moved: ${movedDistance.toFixed(1)} meter`,
//             ToastAndroid.SHORT,
//           );

//           console.log('GPS Move Distance:', movedDistance);
//           // if (movedDistance < 3) {
//           //   return;
//           // }
//           const route = routeCoordinatesRef.current;
//           if (route.length > 1) {
//             const snapped = getNearestPointOnRoute(latitude, longitude, route);

//             if (snapped) {
//               if (riderPosition) {
//                 animateMarker(
//                   riderPosition.latitude,
//                   riderPosition.longitude,
//                   snapped.point.latitude,
//                   snapped.point.longitude,
//                 );
//               } else {
//                 setRiderPosition({
//                   latitude: snapped.point.latitude,
//                   longitude: snapped.point.longitude,
//                 });
//               }

//               const currentMatchedPoint = [
//                 snapped.point.longitude,
//                 snapped.point.latitude,
//               ];

//               setRemainingRoute([
//                 currentMatchedPoint,
//                 ...route.slice(snapped.index + 1),
//               ]);

//               if (snapped.index !== lastSnappedIndexRef.current) {
//                 lastSnappedIndexRef.current = snapped.index;
//               }

//               if (snapped.index < route.length - 1) {
//                 const current = route[snapped.index];
//                 const next = route[snapped.index + 1];

//                 const routeBearing = calculateBearing(
//                   current[1],
//                   current[0],
//                   next[1],
//                   next[0],
//                 );

//                 if (Math.abs(routeBearing - headingRef.current) > 5) {
//                   // SMOOTH TURN: animate from current heading to new bearing
//                   animateHeading(headingRef.current, routeBearing);
//                   // Camera snaps instantly — feels natural for map re-orientation
//                   setCameraHeading(routeBearing);
//                 }
//               }
//             }
//           }
//         }

//         previousCoordinateRef.current = {
//           latitude,
//           longitude,
//         };
//       },

//       error => {
//         console.log(error);
//       },

//       {
//         enableHighAccuracy: true,
//         distanceFilter: 1,
//         interval: 1000,
//         fastestInterval: 500,
//         showLocationDialog: true,
//         forceRequestLocation: true,
//       },
//     );

//     return () => {
//       Geolocation.clearWatch(watchId);
//     };
//   }, []);

//   const sendOTP = async () => {
//     try {
//       setLoading(true);

//       console.log(
//         'Fetching dashboard data with token:',
//         GlobalLoginAuth.refreshToken,
//       );

//       const response = await fetch(
//         `${GlobalApi.baseUrl}api/deliveries/me/orders/${orderDetail?.order.id}/send-otp`,

//         {
//           method: 'POST',

//           headers: {
//             'Content-Type': 'application/json',

//             Authorization: `Bearer ${GlobalLoginAuth.accessToken}`,
//           },
//         },
//       );

//       const result = await response.json();

//       const SendOtpResponse = result as SendOtpResponse; // âœ… Type assertion to ensure it matches our model

//       console.log('Generate OTP Response:', result);

//       if (!response.ok) {
//         Alert.alert('FoodyPly', result.message || 'Failed to load dashboard');

//         return;
//       }

//       if (SendOtpResponse.success) {
//         console.log('OTP sent successfully:', SendOtpResponse.data.otp);

//         navigation.navigate('DeliveryOtpVerification', {
//           orderDetail: orderDetail,
//           otp: SendOtpResponse.data.otp,
//         });
//       }
//     } catch (error) {
//       console.log(error);

//       Alert.alert('FoodyPly', 'Unable to connect to server');
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <View style={styles.container}>
//       <GlobalTopBarDelivery
//         navigation={navigation}
//         notificationClick={() => {}}
//         text="Start Delivery"
//         subtitleText={`#${orderDetail?.order.orderNumber}`}
//         isBackVisible={true}
//         isOnlineVisible={false}
//       />

//       <View style={styles.overlay}>
//         <View style={styles.card}>
//           <View style={styles.mapContainer}>
//             <Map
//               style={styles.map}
//               mapStyle={DARK_MAP_STYLE}
//               logo={false}
//               compass={true}
//             >
//               {/* CAMERA */}
//               {riderPosition && (
//                 <Camera
//                   zoom={19}
//                   pitch={70}
//                   bearing={markerHeading}
//                   center={[riderPosition.longitude, riderPosition.latitude]}
//                   padding={{
//                     top: 800,
//                     bottom: 500,
//                     left: 0,
//                     right: 0,
//                   }}
//                 />
//               )}

//               {/* DELIVERY BOY MARKER */}
//               {riderPosition && (
//                 <Marker
//                   anchor="center"
//                   lngLat={[riderPosition.longitude, riderPosition.latitude]}
//                 >
//                   <View
//                     style={[
//                       styles.currentMarkerWrapper,
//                       {
//                         // transform: [
//                         //   {
//                         //     rotate: `${markerHeading}deg`,
//                         //   },
//                         // ],
//                       },
//                     ]}
//                   >
//                     <Image
//                       source={require('../assets/images/dman.png')}
//                       style={styles.deliveryIcon}
//                       resizeMode="contain"
//                     />
//                   </View>
//                 </Marker>
//               )}

//               {/* DESTINATION */}
//               <Marker
//                 anchor="center"
//                 lngLat={[
//                   destinationLocation.longitude,
//                   destinationLocation.latitude,
//                 ]}
//               >
//                 <View style={styles.destinationMarkerWrapper}>
//                   <View style={styles.destinationMarker} />
//                 </View>
//               </Marker>

//               {/* ROUTE */}
//               {routeCoordinates.length > 1 && (
//                 <GeoJSONSource
//                   id="routeSource"
//                   data={{
//                     type: 'FeatureCollection',
//                     features: [
//                       {
//                         type: 'Feature',
//                         properties: {},
//                         geometry: {
//                           type: 'LineString',
//                           coordinates: remainingRoute,
//                         },
//                       },
//                     ],
//                   }}
//                 >
//                   {/* ROUTE SHADOW */}
//                   <Layer
//                     id="routeLayerBg"
//                     type="line"
//                     paint={{
//                       'line-color': '#0B3B2E',
//                       'line-width': 10,
//                       'line-opacity': 0.7,
//                     }}
//                     layout={{
//                       'line-cap': 'round',
//                       'line-join': 'round',
//                     }}
//                   />

//                   {/* MAIN ROUTE */}
//                   <Layer
//                     id="routeLayer"
//                     type="line"
//                     paint={{
//                       'line-color': '#00FF9D',
//                       'line-width': 6,
//                       'line-opacity': 1,
//                     }}
//                     layout={{
//                       'line-cap': 'round',
//                       'line-join': 'round',
//                     }}
//                   />
//                 </GeoJSONSource>
//               )}
//             </Map>

//             {/* FLOATING CARD */}
//             {showDetailsCard ? (
//               <View style={styles.card1}>
//                 {/* USER INFO */}
//                 <View style={styles.header}>
//                   <Image
//                     source={
//                       orderDetail?.customer?.profileImageUrl
//                         ? { uri: orderDetail.customer.profileImageUrl }
//                         : require('../assets/images/customer_image.png')
//                     }
//                     style={styles.avatar}
//                   />

//                   <View style={{ flex: 1 }}>
//                     <Text style={styles.name}>{orderDetail.customer.name}</Text>
//                     <Text style={styles.phone}>
//                       {orderDetail.customer.phone}
//                     </Text>
//                     <Text style={styles.address}>
//                       {orderDetail.customer.address.fullText}
//                     </Text>
//                   </View>

//                   <View style={styles.iconColumn}>
//                     <TouchableOpacity style={styles.circleBtn}>
//                       <Image
//                         source={require('../assets/images/call.png')}
//                         style={styles.smallIcon}
//                       />
//                     </TouchableOpacity>
//                   </View>
//                 </View>

//                 {/* ORDER INFO */}
//                 <View style={styles.orderRow}>
//                   <View
//                     style={{
//                       flexDirection: 'row',
//                       alignItems: 'center',
//                       gap: 5,
//                     }}
//                   >
//                     <Image
//                       source={require('../assets/images/shopping_bag.png')}
//                       style={styles.smallIconOrange}
//                     />

//                     <View>
//                       <Text style={styles.smallLabel}>
//                         {orderDetail.items.length} Items •{' '}
//                         {orderDetail.items.reduce(
//                           (acc, item) => acc + item.quantity,
//                           0,
//                         )}{' '}
//                         Qty
//                       </Text>
//                       <View
//                         style={{
//                           flexDirection: 'row',
//                           alignItems: 'center',
//                           gap: 4,
//                           marginTop: 2,
//                         }}
//                       >
//                         <Text style={styles.smallLabel}>Payment Status</Text>
//                         <View style={styles.codBadge}>
//                           <Text style={styles.codText}>
//                             {orderDetail.billing.paymentStatus}
//                           </Text>
//                         </View>
//                       </View>
//                     </View>
//                   </View>
//                   <View>
//                     <Text style={styles.smallLabel}>Order Amount</Text>
//                     <Text style={styles.amount}>
//                       ₹{orderDetail.billing.finalAmount.toFixed(2)}
//                     </Text>
//                   </View>
//                 </View>

//                 {/* LIVE STATUS */}
//                 <View style={styles.liveBox}>
//                   <View style={styles.iconCircle}>
//                     <Image
//                       source={require('../assets/images/scooter.png')}
//                       style={styles.bikeIcon}
//                     />
//                   </View>
//                   <View style={{ marginLeft: 10 }}>
//                     <Text style={styles.liveTitle}>Live Status</Text>
//                     <Text style={styles.liveText}>
//                       You are on the way to the customer
//                     </Text>
//                   </View>
//                 </View>

//                 {/* PROGRESS */}
//                 <View style={{ marginTop: 20 }}>
//                   <Text style={styles.progressTitle}>Order Progress</Text>

//                   <View style={styles.progressRow}>
//                     {[
//                       'Assigned',
//                       'Accepted',
//                       'Picked',
//                       'On The Way',
//                       'Delivered',
//                     ].map((item, index) => {
//                       const isActive = index <= 3;
//                       const isOnWay = item === 'On The Way';

//                       return (
//                         <View key={index} style={styles.stepContainer}>
//                           <View
//                             style={[
//                               styles.stepCircle,
//                               isActive && styles.activeStep,

//                               // LIGHT ORANGE BACKGROUND FOR ON WAY
//                               isOnWay && styles.onWayStep,
//                             ]}
//                           >
//                             {isOnWay ? (
//                               <Image
//                                 source={require('../assets/images/scooter.png')}
//                                 style={styles.scooterIcon}
//                               />
//                             ) : (
//                               <Image
//                                 source={require('../assets/images/check.png')}
//                                 style={[
//                                   styles.checkIcon,
//                                   {
//                                     tintColor: isActive
//                                       ? Colors.primary
//                                       : '#bbb',
//                                   },
//                                 ]}
//                               />
//                             )}
//                           </View>

//                           <Text style={styles.stepText}>{item}</Text>

//                           {index !== 4 && (
//                             <View
//                               style={[
//                                 styles.line,
//                                 index < 3 && styles.activeLine,
//                               ]}
//                             />
//                           )}
//                         </View>
//                       );
//                     })}
//                   </View>
//                 </View>

//                 {/* BUTTONS */}
//                 <View style={styles.buttonRow}>
//                   <TouchableOpacity
//                     style={styles.mapBtn}
//                     onPress={() => setShowDetailsCard(false)}
//                   >
//                     <Text style={styles.mapBtnText}>Open in Maps</Text>
//                   </TouchableOpacity>

//                   <TouchableOpacity
//                     style={styles.deliverBtn}
//                     onPress={() => sendOTP()}
//                   >
//                     <Text style={styles.deliverBtnText}>Order Delivered</Text>
//                   </TouchableOpacity>
//                 </View>
//               </View>
//             ) : (
//               <TouchableOpacity
//                 activeOpacity={0.8}
//                 style={styles.floatingShowButton}
//                 onPress={() => setShowDetailsCard(true)}
//               >
//                 <Image
//                   source={require('../assets/images/shopping_bag.png')}
//                   style={styles.floatingArrow}
//                 />
//               </TouchableOpacity>
//             )}
//           </View>
//         </View>
//       </View>
//       <GlobalLoader visible={loading} />
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: Colors.primary,
//     paddingTop: 100,
//   },

//   overlay: {
//     flex: 1,
//     borderTopLeftRadius: 30,
//     borderTopRightRadius: 30,
//     marginTop: 20,
//   },

//   card: {
//     backgroundColor: '#fff',
//     borderTopLeftRadius: 20,
//     borderTopRightRadius: 20,
//     flex: 1,
//   },

//   mapContainer: {
//     flex: 1,
//     borderTopLeftRadius: 20,
//     borderTopRightRadius: 20,
//     overflow: 'hidden',
//   },

//   map: {
//     flex: 1,
//   },

//   currentMarkerWrapper: {
//     width: 44,
//     height: 44,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },

//   deliveryIcon: {
//     width: 80,
//     height: 80,

//     // REMOVE THIS IF IMAGE ALREADY ORANGE
//     // tintColor: Colors.primary,
//   },

//   destinationMarkerWrapper: {
//     width: 30,
//     height: 30,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },

//   destinationMarker: {
//     width: 18,
//     height: 18,
//     borderRadius: 9,
//     backgroundColor: 'red',
//     borderWidth: 3,
//     borderColor: '#fff',
//   },
//   card1: {
//     position: 'absolute',
//     bottom: 20,
//     left: 15,
//     right: 15,
//     backgroundColor: '#fff',
//     borderRadius: 25,
//     padding: 18,

//     shadowColor: '#000',
//     shadowOpacity: 0.15,
//     shadowRadius: 10,
//     shadowOffset: {
//       width: 0,
//       height: 5,
//     },
//     elevation: 8,
//   },

//   header: {
//     flexDirection: 'row',
//     alignItems: 'flex-start',
//     justifyContent: 'space-between',
//   },

//   avatar: {
//     width: 60,
//     height: 60,
//     borderRadius: 20,
//     marginRight: 12,
//   },

//   name: {
//     fontSize: 18,
//     fontFamily: FontFamily.medium,
//     color: Colors.textColor,
//   },

//   phone: {
//     color: Colors.textBrown,
//     fontFamily: FontFamily.regular,
//     marginTop: 2,
//     fontSize: 12,
//   },

//   address: {
//     color: Colors.textBrown,
//     marginTop: 2,
//     fontSize: 12,
//     fontFamily: FontFamily.regular,
//   },

//   iconColumn: {
//     gap: 0,
//   },

//   circleBtn: {
//     width: 38,
//     height: 38,
//     borderRadius: 19,
//     backgroundColor: '#7bc043',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },

//   orderRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     marginTop: 20,
//   },

//   smallLabel: {
//     color: Colors.textBrown,
//     fontSize: 14,
//     fontFamily: FontFamily.regular,
//   },

//   boldText: {
//     fontFamily: FontFamily.bold,
//     marginTop: 2,
//     fontSize: 14,
//   },

//   amount: {
//     color: Colors.primary,
//     fontSize: 18,
//     fontFamily: FontFamily.regular,
//     marginTop: 2,
//   },

//   liveBox: {
//     flexDirection: 'row',
//     backgroundColor: '#FEF6F3',
//     padding: 6,
//     borderRadius: 10,
//     marginTop: 18,
//     alignItems: 'center',
//   },

//   liveTitle: {
//     color: Colors.textColor,
//     fontFamily: FontFamily.medium,
//   },

//   liveText: {
//     color: Colors.textBrown,
//     marginTop: 3,
//     fontSize: 12,
//     fontFamily: FontFamily.regular,
//   },

//   progressTitle: {
//     fontFamily: FontFamily.medium,
//     marginBottom: 15,
//     color: Colors.textColor,
//   },

//   progressRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//   },

//   stepContainer: {
//     alignItems: 'center',
//     flex: 1,
//     position: 'relative',
//     justifyContent: 'flex-start',
//   },

//   stepCircle: {
//     width: 30,
//     height: 30,
//     borderRadius: 15,
//     backgroundColor: '#e5e5e5',
//     justifyContent: 'center',
//     alignItems: 'center',
//     zIndex: 2,
//   },
//   activeStep: {
//     backgroundColor: Colors.lightOrange,
//   },

//   line: {
//     position: 'absolute',
//     top: 12,
//     left: '50%',
//     width: '100%',
//     height: 3,
//     backgroundColor: '#ddd',
//     zIndex: 1,
//   },

//   activeLine: {
//     backgroundColor: Colors.primary,
//   },

//   stepText: {
//     fontSize: 10,
//     marginTop: 10,
//     color: Colors.textBrown,
//     textAlign: 'center',
//     fontFamily: FontFamily.regular,
//   },

//   buttonRow: {
//     flexDirection: 'row',
//     marginTop: 25,
//     gap: 12,
//   },

//   mapBtn: {
//     flex: 1,
//     backgroundColor: Colors.buttonLight,
//     paddingVertical: 14,
//     borderRadius: 14,
//     alignItems: 'center',
//   },

//   deliverBtn: {
//     flex: 1,
//     backgroundColor: Colors.primary,
//     paddingVertical: 14,
//     borderRadius: 14,
//     alignItems: 'center',
//   },

//   mapBtnText: {
//     color: Colors.primary,
//     fontFamily: FontFamily.regular,
//     fontSize: 16,
//   },

//   deliverBtnText: {
//     color: '#fff',
//     fontFamily: FontFamily.regular,
//     fontSize: 16,
//   },

//   smallIcon: {
//     width: 18,
//     height: 18,
//     tintColor: '#fff',
//   },

//   smallIconOrange: {
//     width: 30,
//     height: 30,
//     tintColor: Colors.primary,
//   },

//   bikeIcon: {
//     width: 24,
//     height: 24,
//     tintColor: Colors.primary,
//   },

//   checkIcon: {
//     width: 16,
//     height: 16,
//   },
//   iconCircle: {
//     width: 60,
//     height: 60,
//     borderRadius: 30,
//     backgroundColor: Colors.lightOrange,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   codBadge: {
//     backgroundColor: Colors.lightBackground,
//     paddingHorizontal: 8,
//     paddingVertical: 3,
//     borderRadius: 20,
//     marginLeft: 2,
//   },

//   codText: {
//     color: Colors.primary,
//     fontSize: 12,
//     fontFamily: FontFamily.semiBold,
//   },
//   onWayStep: {
//     width: 30,
//     height: 30,
//     borderRadius: 15,
//     backgroundColor: Colors.lightOrange,

//     justifyContent: 'center',
//     alignItems: 'center',

//     zIndex: 3,
//   },

//   scooterIcon: {
//     width: 20,
//     height: 20,
//     tintColor: Colors.primary,
//   },
//   hideButton: {
//     width: 32,
//     height: 32,
//     borderRadius: 16,
//     backgroundColor: '#F5F5F5',
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginLeft: 10,
//   },

//   hideIcon: {
//     width: 16,
//     height: 16,
//     tintColor: Colors.textColor,
//   },

//   floatingShowButton: {
//     position: 'absolute',
//     bottom: 30,
//     right: 20,
//     width: 40,
//     height: 40,
//     borderRadius: 20,

//     backgroundColor: Colors.primary,

//     justifyContent: 'center',
//     alignItems: 'center',

//     shadowColor: '#000',
//     shadowOpacity: 0.2,
//     shadowRadius: 8,
//     shadowOffset: {
//       width: 0,
//       height: 4,
//     },

//     elevation: 10,
//   },

//   floatingArrow: {
//     width: 24,
//     height: 24,
//     tintColor: '#fff',
//   },
// });

// import React, { useEffect, useState, useRef } from 'react';
// import {
//   View,
//   StyleSheet,
//   PermissionsAndroid,
//   Platform,
//   Image,
//   Text,
//   TouchableOpacity,
//   ToastAndroid,
//   Alert,
// } from 'react-native';

// import {
//   Map,
//   Camera,
//   Marker,
//   GeoJSONSource,
//   Layer,
// } from '@maplibre/maplibre-react-native';

// import Geolocation from 'react-native-geolocation-service';
// import axios from 'axios';

// import Colors from '../assets/Colors/Colors';
// import GlobalTopBarDelivery from '../GlobalContainer/GlobalTopBarDelivery';
// import { DeliveryOrderDetails } from '../Models/DeliveryOrderDetails/DeliveryOrderDetails';
// import { FontFamily } from '../assets/GlobalFont/GlobalFont';
// import GlobalLoginAuth from '../GlobalContainer/GlobalLoginAuth';
// import GlobalApi from '../GlobalContainer/GlobalApi';
// import GlobalLoader from '../GlobalContainer/GlobalLoader';
// import { SendOtpResponse } from '../Models/SendOTP/SendOtpResponse ';

// const DARK_MAP_STYLE =
//   'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

// export default function DeliveryStart({ route, navigation }: any) {
//   const {
//     orderDetail,
//   }: {
//     orderDetail: DeliveryOrderDetails;
//   } = route.params;

//   const [showDetailsCard, setShowDetailsCard] = useState(true);
//   const lastSnappedIndexRef = useRef(-1);
//   // DESTINATION
//   const [destinationLocation] = useState({
//     latitude: orderDetail.customer.address.latitude || 22.8948,

//     longitude: orderDetail.customer.address.longitude || 88.41,
//   });

//   // CURRENT LOCATION
//   const [currentLocation, setCurrentLocation] = useState<{
//     latitude: number;
//     longitude: number;
//   } | null>(null);

//   // ROUTE
//   const [routeCoordinates, setRouteCoordinates] = useState<any[]>([]);
//   const routeCoordinatesRef = useRef<any[]>([]);
//   const [remainingRoute, setRemainingRoute] = useState<any[]>([]);
//   const headingRef = useRef(0);
//   const cameraHeadingRef = useRef(0);
//   const [riderPosition, setRiderPosition] = useState<{
//     latitude: number;
//     longitude: number;
//   } | null>(null);
//   // CAMERA HEADING
//   const [cameraHeading, setCameraHeading] = useState(0);
//   const markerHeadingRef = useRef(0);
//   // SCOOTER HEADING
//   const [markerHeading, setMarkerHeading] = useState(0);
//   const [loading, setLoading] = useState(false);

//   const [locationHistory, setLocationHistory] = useState<
//     { latitude: number; longitude: number }[]
//   >([]);
//   // PREVIOUS LOCATION
//   const previousCoordinateRef = useRef<{
//     latitude: number;
//     longitude: number;
//   } | null>(null);

//   // REQUEST LOCATION PERMISSION
//   const requestLocationPermission = async () => {
//     if (Platform.OS === 'android') {
//       const granted = await PermissionsAndroid.request(
//         PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
//       );

//       if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
//         console.log('Location permission denied');
//       }
//     }
//   };

//   const calculateBearing = (
//     startLat: number,

//     startLng: number,

//     endLat: number,

//     endLng: number,
//   ) => {
//     const dLon = ((endLng - startLng) * Math.PI) / 180;

//     const y = Math.sin(dLon) * Math.cos((endLat * Math.PI) / 180);

//     const x =
//       Math.cos((startLat * Math.PI) / 180) *
//         Math.sin((endLat * Math.PI) / 180) -
//       Math.sin((startLat * Math.PI) / 180) *
//         Math.cos((endLat * Math.PI) / 180) *
//         Math.cos(dLon);

//     const brng = (Math.atan2(y, x) * 180) / Math.PI;

//     return (brng + 360) % 360;
//   };

//   // DISTANCE BETWEEN TWO POINTS
//   const getDistance = (
//     lat1: number,
//     lon1: number,
//     lat2: number,
//     lon2: number,
//   ) => {
//     const R = 6371e3;

//     const φ1 = (lat1 * Math.PI) / 180;
//     const φ2 = (lat2 * Math.PI) / 180;

//     const Δφ = ((lat2 - lat1) * Math.PI) / 180;

//     const Δλ = ((lon2 - lon1) * Math.PI) / 180;

//     const a =
//       Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
//       Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

//     const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

//     return R * c;
//   };

//   const getProjectedPointOnSegment = (
//     lat: number,
//     lng: number,
//     startLat: number,
//     startLng: number,
//     endLat: number,
//     endLng: number,
//   ) => {
//     const dx = endLng - startLng;
//     const dy = endLat - startLat;

//     const lengthSquared = dx * dx + dy * dy;

//     if (lengthSquared === 0) {
//       return {
//         latitude: startLat,
//         longitude: startLng,
//         t: 0,
//       };
//     }

//     let t = ((lng - startLng) * dx + (lat - startLat) * dy) / lengthSquared;

//     t = Math.max(0, Math.min(1, t));

//     return {
//       latitude: startLat + t * dy,
//       longitude: startLng + t * dx,
//       t,
//     };
//   };

//   const getNearestPointOnRoute = (
//     latitude: number,
//     longitude: number,
//     route: any[],
//   ) => {
//     if (route.length < 2) {
//       return null;
//     }

//     let minDistance = Infinity;

//     let nearestIndex = 0;

//     let projectedPoint: any = null;

//     for (let i = 0; i < route.length - 1; i++) {
//       const start = route[i];
//       const end = route[i + 1];

//       const projected = getProjectedPointOnSegment(
//         latitude,
//         longitude,
//         start[1],
//         start[0],
//         end[1],
//         end[0],
//       );

//       const distance = getDistance(
//         latitude,
//         longitude,
//         projected.latitude,
//         projected.longitude,
//       );

//       if (distance < minDistance) {
//         minDistance = distance;
//         nearestIndex = i;
//         projectedPoint = projected;
//       }
//     }

//     return {
//       index: nearestIndex,
//       distance: minDistance,
//       point: projectedPoint,
//     };
//   };
//   // ROUTE API
//   const getRoute = async (
//     startLat: number,
//     startLng: number,
//     endLat: number,
//     endLng: number,
//   ) => {
//     try {
//       const response = await axios.get(
//         `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`,
//       );

//       if (
//         response.data &&
//         response.data.routes &&
//         response.data.routes.length > 0
//       ) {
//         const osrmCoordinates = response.data.routes[0].geometry.coordinates;

//         // Insert actual GPS as first point
//         const coordinates = [[startLng, startLat], ...osrmCoordinates];

//         for (let i = 0; i < 5; i++) {
//           const dist = getDistance(
//             coordinates[i][1],
//             coordinates[i][0],
//             coordinates[i + 1][1],
//             coordinates[i + 1][0],
//           );

//           console.log(`Distance ${i} -> ${i + 1}:`, dist);
//         }
//         setRouteCoordinates(coordinates);
//         routeCoordinatesRef.current = coordinates;

//         console.log('Route Length:', coordinates.length);

//         console.log('First Route Point:', coordinates[0]);

//         console.log('Start GPS:', startLat, startLng);

//         console.log(
//           'Distance Between Start And Route Point:',
//           getDistance(startLat, startLng, coordinates[0][1], coordinates[0][0]),
//         );

//         if (!riderPosition && coordinates.length > 0) {
//           setRiderPosition({
//             latitude: coordinates[0][1],
//             longitude: coordinates[0][0],
//           });

//           lastSnappedIndexRef.current = 0;

//           setRemainingRoute(coordinates);
//         }
//       }
//     } catch (error) {
//       console.log('ROUTE ERROR', error);
//     }
//   };

//   // INITIAL LOCATION
//   const getCurrentLocation = async () => {
//     Geolocation.getCurrentPosition(
//       async position => {
//         const latitude = position.coords.latitude;

//         const longitude = position.coords.longitude;

//         setCurrentLocation({
//           latitude,
//           longitude,
//         });

//         previousCoordinateRef.current = {
//           latitude,
//           longitude,
//         };

//         await getRoute(
//           latitude,
//           longitude,
//           destinationLocation.latitude,
//           destinationLocation.longitude,
//         );
//       },

//       error => {
//         console.log(error);
//       },

//       {
//         enableHighAccuracy: true,
//         timeout: 15000,
//         maximumAge: 10000,
//       },
//     );
//   };

//   // LIVE TRACKING
//   useEffect(() => {
//     requestLocationPermission();

//     getCurrentLocation();

//     const animateMarker = (
//       startLat: number,
//       startLng: number,
//       endLat: number,
//       endLng: number,
//     ) => {
//       const steps = 20;
//       let currentStep = 0;

//       const interval = setInterval(() => {
//         currentStep++;

//         const progress = currentStep / steps;

//         setRiderPosition({
//           latitude: startLat + (endLat - startLat) * progress,
//           longitude: startLng + (endLng - startLng) * progress,
//         });

//         if (currentStep >= steps) {
//           clearInterval(interval);
//         }
//       }, 50);
//     };

//     const animateHeading = (fromBearing: number, toBearing: number) => {
//       // Shortest rotation path: e.g. 350° → 10° should go +20°, not -340°
//       let delta = toBearing - fromBearing;
//       if (delta > 180) delta -= 360;
//       if (delta < -180) delta += 360;

//       const steps = 20;
//       let currentStep = 0;

//       const interval = setInterval(() => {
//         currentStep++;
//         const progress = currentStep / steps;

//         const newHeading = (fromBearing + delta * progress + 360) % 360;
//         markerHeadingRef.current = newHeading;
//         setMarkerHeading(newHeading);

//         if (currentStep >= steps) {
//           clearInterval(interval);
//         }
//       }, 50); // same 50ms × 20 steps = 1 second, matches animateMarker
//     };
//     const watchId = Geolocation.watchPosition(
//       async position => {
//         const latitude = position.coords.latitude;

//         const longitude = position.coords.longitude;

//         const previous = previousCoordinateRef.current;

//         if (previous) {
//           const movedDistance = getDistance(
//             previous.latitude,
//             previous.longitude,
//             latitude,
//             longitude,
//           );

//           console.log('GPS Move Distance:', movedDistance);
//         }

//         // UPDATE LOCATION
//         setCurrentLocation({
//           latitude,
//           longitude,
//         });
//         // ARRAY ME STORE KARO
//         setLocationHistory(prev => {
//           const updated = [
//             ...prev,
//             {
//               latitude,
//               longitude,
//             },
//           ];

//           // // TOAST ME DIKHAO
//           // ToastAndroid.show(
//           //   JSON.stringify(updated),
//           //   ToastAndroid.SHORT,
//           // );

//           return updated;
//         });

//         const route = routeCoordinatesRef.current;

//         if (route.length < 2) {
//           return;
//         }
//         // CALCULATE HEADING
//         if (previous) {
//           const movedDistance = getDistance(
//             previous.latitude,
//             previous.longitude,
//             latitude,
//             longitude,
//           );
//           ToastAndroid.show(
//             `Rider moved: ${movedDistance.toFixed(1)} meter`,
//             ToastAndroid.SHORT,
//           );

//           console.log('GPS Move Distance:', movedDistance);
//           // if (movedDistance < 3) {
//           //   return;
//           // }
//           const route = routeCoordinatesRef.current;
//           if (route.length > 1) {
//             const snapped = getNearestPointOnRoute(latitude, longitude, route);

//             if (snapped) {
//               if (riderPosition) {
//                 animateMarker(
//                   riderPosition.latitude,
//                   riderPosition.longitude,
//                   snapped.point.latitude,
//                   snapped.point.longitude,
//                 );
//               } else {
//                 setRiderPosition({
//                   latitude: snapped.point.latitude,
//                   longitude: snapped.point.longitude,
//                 });
//               }

//               const currentMatchedPoint = [
//                 snapped.point.longitude,
//                 snapped.point.latitude,
//               ];

//               setRemainingRoute([
//                 currentMatchedPoint,
//                 ...route.slice(snapped.index + 1),
//               ]);

//               if (snapped.index !== lastSnappedIndexRef.current) {
//                 lastSnappedIndexRef.current = snapped.index;
//               }

//               if (snapped.index < route.length - 1) {
//                 const current = route[snapped.index];
//                 const next = route[snapped.index + 1];

//                 const routeBearing = calculateBearing(
//                   current[1],
//                   current[0],
//                   next[1],
//                   next[0],
//                 );

//                 // if (Math.abs(routeBearing - markerHeading) > 5) {
//                 //   setMarkerHeading(routeBearing);
//                 //   setCameraHeading(routeBearing);
//                 // }

//                 if (Math.abs(routeBearing - markerHeadingRef.current) > 5) {
//                   animateHeading(markerHeadingRef.current, routeBearing);
//                   setCameraHeading(routeBearing); // camera can snap instantly, feels natural
//                 }
//               }
//             }
//           }
//         }

//         previousCoordinateRef.current = {
//           latitude,
//           longitude,
//         };
//       },

//       error => {
//         console.log(error);
//       },

//       {
//         enableHighAccuracy: true,
//         distanceFilter: 1,
//         interval: 1000,
//         fastestInterval: 500,
//         showLocationDialog: true,
//         forceRequestLocation: true,
//       },
//     );

//     return () => {
//       Geolocation.clearWatch(watchId);
//     };
//   }, []);

//   const sendOTP = async () => {
//     try {
//       setLoading(true);

//       console.log(
//         'Fetching dashboard data with token:',
//         GlobalLoginAuth.refreshToken,
//       );

//       const response = await fetch(
//         `${GlobalApi.baseUrl}api/deliveries/me/orders/${orderDetail?.order.id}/send-otp`,

//         {
//           method: 'POST',

//           headers: {
//             'Content-Type': 'application/json',

//             Authorization: `Bearer ${GlobalLoginAuth.accessToken}`,
//           },
//         },
//       );

//       const result = await response.json();

//       const SendOtpResponse = result as SendOtpResponse; // âœ… Type assertion to ensure it matches our model

//       console.log('Generate OTP Response:', result);

//       if (!response.ok) {
//         Alert.alert('FoodyPly', result.message || 'Failed to load dashboard');

//         return;
//       }

//       if (SendOtpResponse.success) {
//         console.log('OTP sent successfully:', SendOtpResponse.data.otp);

//         navigation.navigate('DeliveryOtpVerification', {
//           orderDetail: orderDetail,
//           otp: SendOtpResponse.data.otp,
//         });
//       }
//     } catch (error) {
//       console.log(error);

//       Alert.alert('FoodyPly', 'Unable to connect to server');
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <View style={styles.container}>
//       <GlobalTopBarDelivery
//         navigation={navigation}
//         notificationClick={() => {}}
//         text="Start Delivery"
//         subtitleText={`#${orderDetail?.order.orderNumber}`}
//         isBackVisible={true}
//         isOnlineVisible={false}
//       />

//       <View style={styles.overlay}>
//         <View style={styles.card}>
//           <View style={styles.mapContainer}>
//             <Map
//               style={styles.map}
//               mapStyle={DARK_MAP_STYLE}
//               logo={false}
//               compass={true}
//             >
//               {/* CAMERA */}
//               {riderPosition && (
//                 <Camera
//                   zoom={19}
//                   pitch={70}
//                   bearing={markerHeading}
//                   center={[riderPosition.longitude, riderPosition.latitude]}
//                   padding={{
//                     top: 800,
//                     bottom: 500,
//                     left: 0,
//                     right: 0,
//                   }}
//                 />
//               )}

//               {/* DELIVERY BOY MARKER */}
//               {riderPosition && (
//                 <Marker
//                   anchor="center"
//                   lngLat={[riderPosition.longitude, riderPosition.latitude]}
//                 >
//                   <View
//                     style={[
//                       styles.currentMarkerWrapper,
//                       {
//                         transform: [
//                           {
//                             rotate: `${markerHeading}deg`,
//                           },
//                         ],
//                       },
//                     ]}
//                   >
//                     <Image
//                       source={require('../assets/images/dman.png')}
//                       style={styles.deliveryIcon}
//                       resizeMode="contain"
//                     />
//                   </View>
//                 </Marker>
//               )}

//               {/* DESTINATION */}
//               <Marker
//                 anchor="center"
//                 lngLat={[
//                   destinationLocation.longitude,
//                   destinationLocation.latitude,
//                 ]}
//               >
//                 <View style={styles.destinationMarkerWrapper}>
//                   <View style={styles.destinationMarker} />
//                 </View>
//               </Marker>

//               {/* ROUTE */}
//               {routeCoordinates.length > 1 && (
//                 <GeoJSONSource
//                   id="routeSource"
//                   data={{
//                     type: 'FeatureCollection',
//                     features: [
//                       {
//                         type: 'Feature',
//                         properties: {},
//                         geometry: {
//                           type: 'LineString',
//                           coordinates: remainingRoute,
//                         },
//                       },
//                     ],
//                   }}
//                 >
//                   {/* ROUTE SHADOW */}
//                   <Layer
//                     id="routeLayerBg"
//                     type="line"
//                     paint={{
//                       'line-color': '#0B3B2E',
//                       'line-width': 10,
//                       'line-opacity': 0.7,
//                     }}
//                     layout={{
//                       'line-cap': 'round',
//                       'line-join': 'round',
//                     }}
//                   />

//                   {/* MAIN ROUTE */}
//                   <Layer
//                     id="routeLayer"
//                     type="line"
//                     paint={{
//                       'line-color': '#00FF9D',
//                       'line-width': 6,
//                       'line-opacity': 1,
//                     }}
//                     layout={{
//                       'line-cap': 'round',
//                       'line-join': 'round',
//                     }}
//                   />
//                 </GeoJSONSource>
//               )}
//             </Map>

//             {/* FLOATING CARD */}
//             {showDetailsCard ? (
//               <View style={styles.card1}>
//                 {/* USER INFO */}
//                 <View style={styles.header}>
//                   <Image
//                     source={
//                       orderDetail?.customer?.profileImageUrl
//                         ? { uri: orderDetail.customer.profileImageUrl }
//                         : require('../assets/images/customer_image.png')
//                     }
//                     style={styles.avatar}
//                   />

//                   <View style={{ flex: 1 }}>
//                     <Text style={styles.name}>{orderDetail.customer.name}</Text>
//                     <Text style={styles.phone}>
//                       {orderDetail.customer.phone}
//                     </Text>
//                     <Text style={styles.address}>
//                       {orderDetail.customer.address.fullText}
//                     </Text>
//                   </View>

//                   <View style={styles.iconColumn}>
//                     <TouchableOpacity style={styles.circleBtn}>
//                       <Image
//                         source={require('../assets/images/call.png')}
//                         style={styles.smallIcon}
//                       />
//                     </TouchableOpacity>
//                   </View>
//                 </View>

//                 {/* ORDER INFO */}
//                 <View style={styles.orderRow}>
//                   <View
//                     style={{
//                       flexDirection: 'row',
//                       alignItems: 'center',
//                       gap: 5,
//                     }}
//                   >
//                     <Image
//                       source={require('../assets/images/shopping_bag.png')}
//                       style={styles.smallIconOrange}
//                     />

//                     <View>
//                       <Text style={styles.smallLabel}>
//                         {orderDetail.items.length} Items •{' '}
//                         {orderDetail.items.reduce(
//                           (acc, item) => acc + item.quantity,
//                           0,
//                         )}{' '}
//                         Qty
//                       </Text>
//                       <View
//                         style={{
//                           flexDirection: 'row',
//                           alignItems: 'center',
//                           gap: 4,
//                           marginTop: 2,
//                         }}
//                       >
//                         <Text style={styles.smallLabel}>Payment Status</Text>
//                         <View style={styles.codBadge}>
//                           <Text style={styles.codText}>
//                             {orderDetail.billing.paymentStatus}
//                           </Text>
//                         </View>
//                       </View>
//                     </View>
//                   </View>
//                   <View>
//                     <Text style={styles.smallLabel}>Order Amount</Text>
//                     <Text style={styles.amount}>
//                       ₹{orderDetail.billing.finalAmount.toFixed(2)}
//                     </Text>
//                   </View>
//                 </View>

//                 {/* LIVE STATUS */}
//                 <View style={styles.liveBox}>
//                   <View style={styles.iconCircle}>
//                     <Image
//                       source={require('../assets/images/scooter.png')}
//                       style={styles.bikeIcon}
//                     />
//                   </View>
//                   <View style={{ marginLeft: 10 }}>
//                     <Text style={styles.liveTitle}>Live Status</Text>
//                     <Text style={styles.liveText}>
//                       You are on the way to the customer
//                     </Text>
//                   </View>
//                 </View>

//                 {/* PROGRESS */}
//                 <View style={{ marginTop: 20 }}>
//                   <Text style={styles.progressTitle}>Order Progress</Text>

//                   <View style={styles.progressRow}>
//                     {[
//                       'Assigned',
//                       'Accepted',
//                       'Picked',
//                       'On The Way',
//                       'Delivered',
//                     ].map((item, index) => {
//                       const isActive = index <= 3;
//                       const isOnWay = item === 'On The Way';

//                       return (
//                         <View key={index} style={styles.stepContainer}>
//                           <View
//                             style={[
//                               styles.stepCircle,
//                               isActive && styles.activeStep,

//                               // LIGHT ORANGE BACKGROUND FOR ON WAY
//                               isOnWay && styles.onWayStep,
//                             ]}
//                           >
//                             {isOnWay ? (
//                               <Image
//                                 source={require('../assets/images/scooter.png')}
//                                 style={styles.scooterIcon}
//                               />
//                             ) : (
//                               <Image
//                                 source={require('../assets/images/check.png')}
//                                 style={[
//                                   styles.checkIcon,
//                                   {
//                                     tintColor: isActive
//                                       ? Colors.primary
//                                       : '#bbb',
//                                   },
//                                 ]}
//                               />
//                             )}
//                           </View>

//                           <Text style={styles.stepText}>{item}</Text>

//                           {index !== 4 && (
//                             <View
//                               style={[
//                                 styles.line,
//                                 index < 3 && styles.activeLine,
//                               ]}
//                             />
//                           )}
//                         </View>
//                       );
//                     })}
//                   </View>
//                 </View>

//                 {/* BUTTONS */}
//                 <View style={styles.buttonRow}>
//                   <TouchableOpacity
//                     style={styles.mapBtn}
//                     onPress={() => setShowDetailsCard(false)}
//                   >
//                     <Text style={styles.mapBtnText}>Open in Maps</Text>
//                   </TouchableOpacity>

//                   <TouchableOpacity
//                     style={styles.deliverBtn}
//                     onPress={() => sendOTP()}
//                   >
//                     <Text style={styles.deliverBtnText}>Order Delivered</Text>
//                   </TouchableOpacity>
//                 </View>
//               </View>
//             ) : (
//               <TouchableOpacity
//                 activeOpacity={0.8}
//                 style={styles.floatingShowButton}
//                 onPress={() => setShowDetailsCard(true)}
//               >
//                 <Image
//                   source={require('../assets/images/shopping_bag.png')}
//                   style={styles.floatingArrow}
//                 />
//               </TouchableOpacity>
//             )}
//           </View>
//         </View>
//       </View>
//       <GlobalLoader visible={loading} />
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: Colors.primary,
//     paddingTop: 100,
//   },

//   overlay: {
//     flex: 1,
//     borderTopLeftRadius: 30,
//     borderTopRightRadius: 30,
//     marginTop: 20,
//   },

//   card: {
//     backgroundColor: '#fff',
//     borderTopLeftRadius: 20,
//     borderTopRightRadius: 20,
//     flex: 1,
//   },

//   mapContainer: {
//     flex: 1,
//     borderTopLeftRadius: 20,
//     borderTopRightRadius: 20,
//     overflow: 'hidden',
//   },

//   map: {
//     flex: 1,
//   },

//   currentMarkerWrapper: {
//     width: 44,
//     height: 44,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },

//   deliveryIcon: {
//     width: 80,
//     height: 80,

//     // REMOVE THIS IF IMAGE ALREADY ORANGE
//     // tintColor: Colors.primary,
//   },

//   destinationMarkerWrapper: {
//     width: 30,
//     height: 30,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },

//   destinationMarker: {
//     width: 18,
//     height: 18,
//     borderRadius: 9,
//     backgroundColor: 'red',
//     borderWidth: 3,
//     borderColor: '#fff',
//   },
//   card1: {
//     position: 'absolute',
//     bottom: 20,
//     left: 15,
//     right: 15,
//     backgroundColor: '#fff',
//     borderRadius: 25,
//     padding: 18,

//     shadowColor: '#000',
//     shadowOpacity: 0.15,
//     shadowRadius: 10,
//     shadowOffset: {
//       width: 0,
//       height: 5,
//     },
//     elevation: 8,
//   },

//   header: {
//     flexDirection: 'row',
//     alignItems: 'flex-start',
//     justifyContent: 'space-between',
//   },

//   avatar: {
//     width: 60,
//     height: 60,
//     borderRadius: 20,
//     marginRight: 12,
//   },

//   name: {
//     fontSize: 18,
//     fontFamily: FontFamily.medium,
//     color: Colors.textColor,
//   },

//   phone: {
//     color: Colors.textBrown,
//     fontFamily: FontFamily.regular,
//     marginTop: 2,
//     fontSize: 12,
//   },

//   address: {
//     color: Colors.textBrown,
//     marginTop: 2,
//     fontSize: 12,
//     fontFamily: FontFamily.regular,
//   },

//   iconColumn: {
//     gap: 0,
//   },

//   circleBtn: {
//     width: 38,
//     height: 38,
//     borderRadius: 19,
//     backgroundColor: '#7bc043',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },

//   orderRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     marginTop: 20,
//   },

//   smallLabel: {
//     color: Colors.textBrown,
//     fontSize: 14,
//     fontFamily: FontFamily.regular,
//   },

//   boldText: {
//     fontFamily: FontFamily.bold,
//     marginTop: 2,
//     fontSize: 14,
//   },

//   amount: {
//     color: Colors.primary,
//     fontSize: 18,
//     fontFamily: FontFamily.regular,
//     marginTop: 2,
//   },

//   liveBox: {
//     flexDirection: 'row',
//     backgroundColor: '#FEF6F3',
//     padding: 6,
//     borderRadius: 10,
//     marginTop: 18,
//     alignItems: 'center',
//   },

//   liveTitle: {
//     color: Colors.textColor,
//     fontFamily: FontFamily.medium,
//   },

//   liveText: {
//     color: Colors.textBrown,
//     marginTop: 3,
//     fontSize: 12,
//     fontFamily: FontFamily.regular,
//   },

//   progressTitle: {
//     fontFamily: FontFamily.medium,
//     marginBottom: 15,
//     color: Colors.textColor,
//   },

//   progressRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//   },

//   stepContainer: {
//     alignItems: 'center',
//     flex: 1,
//     position: 'relative',
//     justifyContent: 'flex-start',
//   },

//   stepCircle: {
//     width: 30,
//     height: 30,
//     borderRadius: 15,
//     backgroundColor: '#e5e5e5',
//     justifyContent: 'center',
//     alignItems: 'center',
//     zIndex: 2,
//   },
//   activeStep: {
//     backgroundColor: Colors.lightOrange,
//   },

//   line: {
//     position: 'absolute',
//     top: 12,
//     left: '50%',
//     width: '100%',
//     height: 3,
//     backgroundColor: '#ddd',
//     zIndex: 1,
//   },

//   activeLine: {
//     backgroundColor: Colors.primary,
//   },

//   stepText: {
//     fontSize: 10,
//     marginTop: 10,
//     color: Colors.textBrown,
//     textAlign: 'center',
//     fontFamily: FontFamily.regular,
//   },

//   buttonRow: {
//     flexDirection: 'row',
//     marginTop: 25,
//     gap: 12,
//   },

//   mapBtn: {
//     flex: 1,
//     backgroundColor: Colors.buttonLight,
//     paddingVertical: 14,
//     borderRadius: 14,
//     alignItems: 'center',
//   },

//   deliverBtn: {
//     flex: 1,
//     backgroundColor: Colors.primary,
//     paddingVertical: 14,
//     borderRadius: 14,
//     alignItems: 'center',
//   },

//   mapBtnText: {
//     color: Colors.primary,
//     fontFamily: FontFamily.regular,
//     fontSize: 16,
//   },

//   deliverBtnText: {
//     color: '#fff',
//     fontFamily: FontFamily.regular,
//     fontSize: 16,
//   },

//   smallIcon: {
//     width: 18,
//     height: 18,
//     tintColor: '#fff',
//   },

//   smallIconOrange: {
//     width: 30,
//     height: 30,
//     tintColor: Colors.primary,
//   },

//   bikeIcon: {
//     width: 24,
//     height: 24,
//     tintColor: Colors.primary,
//   },

//   checkIcon: {
//     width: 16,
//     height: 16,
//   },
//   iconCircle: {
//     width: 60,
//     height: 60,
//     borderRadius: 30,
//     backgroundColor: Colors.lightOrange,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   codBadge: {
//     backgroundColor: Colors.lightBackground,
//     paddingHorizontal: 8,
//     paddingVertical: 3,
//     borderRadius: 20,
//     marginLeft: 2,
//   },

//   codText: {
//     color: Colors.primary,
//     fontSize: 12,
//     fontFamily: FontFamily.semiBold,
//   },
//   onWayStep: {
//     width: 30,
//     height: 30,
//     borderRadius: 15,
//     backgroundColor: Colors.lightOrange,

//     justifyContent: 'center',
//     alignItems: 'center',

//     zIndex: 3,
//   },

//   scooterIcon: {
//     width: 20,
//     height: 20,
//     tintColor: Colors.primary,
//   },
//   hideButton: {
//     width: 32,
//     height: 32,
//     borderRadius: 16,
//     backgroundColor: '#F5F5F5',
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginLeft: 10,
//   },

//   hideIcon: {
//     width: 16,
//     height: 16,
//     tintColor: Colors.textColor,
//   },

//   floatingShowButton: {
//     position: 'absolute',
//     bottom: 30,
//     right: 20,
//     width: 40,
//     height: 40,
//     borderRadius: 20,

//     backgroundColor: Colors.primary,

//     justifyContent: 'center',
//     alignItems: 'center',

//     shadowColor: '#000',
//     shadowOpacity: 0.2,
//     shadowRadius: 8,
//     shadowOffset: {
//       width: 0,
//       height: 4,
//     },

//     elevation: 10,
//   },

//   floatingArrow: {
//     width: 24,
//     height: 24,
//     tintColor: '#fff',
//   },
// });
