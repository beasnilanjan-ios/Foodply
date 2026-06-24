// //re-route rnd 1

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
import socket, {
  disconnectSocket,
  connectSocket,
  getSocket,
} from '../services/socketService';

const DARK_MAP_STYLE =
  'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';


const ON_ROUTE_SNAP_THRESHOLD = 15; // meters

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
  
  const LOCATION_PUSH_THRESHOLD_METERS = 20;
  // ROUTE
  const [routeCoordinates, setRouteCoordinates] = useState<any[]>([]);
  const routeCoordinatesRef = useRef<any[]>([]);
  const [remainingRoute, setRemainingRoute] = useState<any[]>([]);
  const headingRef = useRef(0);
  const cameraHeadingRef = useRef(0);
  const markerAnimationRef = useRef<any>(null);
  const headingAnimationRef = useRef<any>(null);
  const riderPositionRef = useRef<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const lastAnimatedBearingRef = useRef<number>(-1);
  const isReroutingRef = useRef(false);
  const offRouteCountRef = useRef(0);
  const [riderPosition, setRiderPosition] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  // CAMERA HEADING
  const [cameraHeading, setCameraHeading] = useState(0);
  
  const lastSentLocationRef = useRef<{
    latitude: number;
    longitude: number;
  } | null>(null);
  // SCOOTER HEADING
  const [markerHeading, setMarkerHeading] = useState(0);
  const [loading, setLoading] = useState(false);
  // FREE CAMERA MODE
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
      return { latitude: startLat, longitude: startLng, t: 0 };
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
    if (route.length < 2) return null;
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

  
  const reRoute = async (currentLat: number, currentLng: number) => {
    if (isReroutingRef.current) return;

    
    const existingRoute = routeCoordinatesRef.current;
    if (existingRoute.length >= 2) {
      const snapCheck = getNearestPointOnRoute(
        currentLat,
        currentLng,
        existingRoute,
      );
      if (snapCheck && snapCheck.distance <= ON_ROUTE_SNAP_THRESHOLD) {
        console.log(
          'Rider back on route, skipping re-route. Distance:',
          snapCheck.distance,
        );
        offRouteCountRef.current = 0;
        return;
      }
    }

    isReroutingRef.current = true;

    try {
      const response = await axios.get(
        `https://router.project-osrm.org/route/v1/driving/${currentLng},${currentLat};${destinationLocation.longitude},${destinationLocation.latitude}?overview=full&geometries=geojson`,
      );

      if (response.data?.routes?.length > 0) {
        const osrmCoordinates = response.data.routes[0].geometry.coordinates;
        const firstSnapped = osrmCoordinates[0];
        const currentRiderPos = riderPositionRef.current;

        if (markerAnimationRef.current) {
          clearInterval(markerAnimationRef.current);
          markerAnimationRef.current = null;
        }

        if (currentRiderPos) {
          const SMOOTH_STEPS = 12;
          const SMOOTH_INTERVAL = 50;
          let step = 0;
          const fromLat = currentRiderPos.latitude;
          const fromLng = currentRiderPos.longitude;
          const toLat = firstSnapped[1];
          const toLng = firstSnapped[0];

          const newCoordinates = [firstSnapped, ...osrmCoordinates.slice(1)];

          
          const tail = newCoordinates.slice(1);

          const slideInterval = setInterval(() => {
            step++;
            const progress = step / SMOOTH_STEPS;

            const newPos = {
              latitude: fromLat + (toLat - fromLat) * progress,
              longitude: fromLng + (toLng - fromLng) * progress,
            };
            riderPositionRef.current = newPos;
            setRiderPosition(newPos);

           
            setRemainingRoute([[newPos.longitude, newPos.latitude], ...tail]);

            if (step >= SMOOTH_STEPS) {
              clearInterval(slideInterval);
              setRouteCoordinates(newCoordinates);
              routeCoordinatesRef.current = newCoordinates;
              setRemainingRoute(newCoordinates);
              lastSnappedIndexRef.current = 0;
              offRouteCountRef.current = 0;
              isReroutingRef.current = false;
            }
          }, SMOOTH_INTERVAL);
        } else {
          const newCoordinates = [firstSnapped, ...osrmCoordinates.slice(1)];
          setRouteCoordinates(newCoordinates);
          routeCoordinatesRef.current = newCoordinates;
          setRemainingRoute(newCoordinates);
          lastSnappedIndexRef.current = 0;
          offRouteCountRef.current = 0;
          isReroutingRef.current = false;
        }
      } else {
        isReroutingRef.current = false;
      }
    } catch (error) {
      console.log('Re-route error:', error);
      isReroutingRef.current = false;
    }
  };

  // INITIAL LOCATION
  const getCurrentLocation = async () => {
    Geolocation.getCurrentPosition(
      async position => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        ToastAndroid.show(
          `Current Location: Latitude ${latitude} Longitude ${longitude}`,
          ToastAndroid.SHORT,
        );
        sendLocation(latitude, longitude, orderDetail.order.id);
        setCurrentLocation({ latitude, longitude });
        previousCoordinateRef.current = { latitude, longitude };
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
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 },
    );
  };

  const sendLocation = (
    latitude: number,
    longitude: number,
    orderId: string | number,
  ) => {
    const payload = {
      orderId: orderId,
      latitude: latitude,
      longitude: longitude,
      speed: 20,
      heading: 150,
    };

    try {
      console.log('Emitting location update', payload);
     
      const s = getSocket();

      if (s && typeof s.emit === 'function') {
        s.emit('delivery:location', payload, (response: any) => {
          console.log('ACK:', response);
        });
      } else {
        console.log('sendLocation: socket not available');
      }
    } catch (e) {
      console.log('sendLocation emit error', e);
    }
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
      routeTailAfterEnd?: any[], 
    ) => {
      const dist = getDistance(startLat, startLng, endLat, endLng);
      if (dist < 0.5) return;

      if (markerAnimationRef.current) {
        clearInterval(markerAnimationRef.current);
        markerAnimationRef.current = null;
      }

      const distance = Math.sqrt(
        Math.pow(endLat - startLat, 2) + Math.pow(endLng - startLng, 2),
      );
      const steps = distance > 0.0005 ? 6 : 10;
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

       
        if (routeTailAfterEnd) {
          setRemainingRoute([
            [newPos.longitude, newPos.latitude],
            ...routeTailAfterEnd,
          ]);
        }

        if (currentStep >= steps) {
          clearInterval(interval);
          markerAnimationRef.current = null;
        }
      }, 50);

      markerAnimationRef.current = interval;
    };

    const animateHeading = (fromBearing: number, toBearing: number) => {
      if (headingAnimationRef.current) {
        clearInterval(headingAnimationRef.current);
        headingAnimationRef.current = null;
      }
      let delta = toBearing - fromBearing;
      if (delta > 180) delta -= 360;
      if (delta < -180) delta += 360;
      const steps = 10;
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
          if (movedDistance < 0.5) return;
        }

        setCurrentLocation({ latitude, longitude });
        setLocationHistory(prev => [...prev, { latitude, longitude }]);

       
        const lastSent = lastSentLocationRef.current;
        const distanceFromLastSent = lastSent
          ? getDistance(
              lastSent.latitude,
              lastSent.longitude,
              latitude,
              longitude,
            )
          : Infinity;

        if (
          !lastSent ||
          distanceFromLastSent >= LOCATION_PUSH_THRESHOLD_METERS
        ) {
          sendLocation(latitude, longitude, orderDetail.order.id);
          lastSentLocationRef.current = { latitude, longitude };
        }

        const route = routeCoordinatesRef.current;
        if (route.length < 2) return;

        if (previous) {
          const route = routeCoordinatesRef.current;
          if (route.length > 1) {
            if (isReroutingRef.current) {
              previousCoordinateRef.current = { latitude, longitude };
              return;
            }

            
            const movementBearing = calculateBearing(
              previous.latitude,
              previous.longitude,
              latitude,
              longitude,
            );

            const snapped = getNearestPointOnRoute(latitude, longitude, route);

            if (snapped) {
              
              const OFF_ROUTE_THRESHOLD_METERS = 12;
              const OFF_ROUTE_CONFIRM_COUNT = 4;

              if (snapped.distance > OFF_ROUTE_THRESHOLD_METERS) {
                offRouteCountRef.current += 1;

               
                if (riderPositionRef.current) {
                  animateMarker(
                    riderPositionRef.current.latitude,
                    riderPositionRef.current.longitude,
                    latitude,
                    longitude,
                  );
                }

                if (offRouteCountRef.current >= OFF_ROUTE_CONFIRM_COUNT) {
                  reRoute(latitude, longitude);
                  offRouteCountRef.current = 0;
                  return;
                }

               
                previousCoordinateRef.current = { latitude, longitude };
                return;
              } else {
               
                offRouteCountRef.current = 0;

               
                const tailAfterSnap = route.slice(snapped.index + 1);

                if (riderPositionRef.current) {
                  animateMarker(
                    riderPositionRef.current.latitude,
                    riderPositionRef.current.longitude,
                    snapped.point.latitude,
                    snapped.point.longitude,
                    tailAfterSnap,
                  );
                } else {
                  const pos = {
                    latitude: snapped.point.latitude,
                    longitude: snapped.point.longitude,
                  };
                  riderPositionRef.current = pos;
                  setRiderPosition(pos);
                }

                setRemainingRoute([
                  [snapped.point.longitude, snapped.point.latitude],
                  ...tailAfterSnap,
                ]);

                if (snapped.index !== lastSnappedIndexRef.current) {
                  lastSnappedIndexRef.current = snapped.index;
                }
              }

              
              const bearingDiff = Math.abs(
                movementBearing - headingRef.current,
              );
              const normalizedDiff =
                bearingDiff > 180 ? 360 - bearingDiff : bearingDiff;
              const alreadyAnimated =
                Math.abs(movementBearing - lastAnimatedBearingRef.current) < 5;

              if (normalizedDiff > 15 && !alreadyAnimated) {
                lastAnimatedBearingRef.current = movementBearing;
                animateHeading(headingRef.current, movementBearing);
              }
            }
          }
        }

        previousCoordinateRef.current = { latitude, longitude };
      },
      error => console.log(error),
      {
        enableHighAccuracy: true,
        distanceFilter: 1,
        interval: 1000,
        fastestInterval: 1000,
        showLocationDialog: true,
        forceRequestLocation: true,
      },
    );

    console.log('Auth', GlobalLoginAuth.accessToken);
  

    if (!GlobalLoginAuth.accessToken) {
      console.log('Token is missing');
      return;
    }
    console.log('Access Token:', GlobalLoginAuth.accessToken);
    console.log('Type:', typeof GlobalLoginAuth.accessToken);
    console.log('Parts:', GlobalLoginAuth.accessToken?.split('.').length);
    const s = connectSocket();
    console.log('socket status:', s ? s.connected : 'no-socket', 'id:', s?.id);

    

    if (s && typeof s.onAny === 'function') {
      s.onAny((event, ...args) => {
        console.log('socket event:', event, args);
      });
    }

    if (s) {
      s.on('newMessage', data => {
        console.log('Connected:', s.id);
        console.log('newMessage:', data);
      });

      s.on('message', data => {
        console.log('Message:', data);
      });
    }

    return () => {
      Geolocation.clearWatch(watchId);

      const s = getSocket();
      if (s) {
        s.off('message');
      }
      disconnectSocket();
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
      const SendOtpResponse = result as SendOtpResponse;
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
              mapStyle={DARK_MAP_STYLE}
              logo={false}
              compass={false}
              onTouchStart={() => {
                userInteractingRef.current = true;
                setIsFollowingRider(false);
                if (interactionTimerRef.current) {
                  clearTimeout(interactionTimerRef.current);
                }
              }}
            >
              {/* CAMERA */}
              {riderPosition && isFollowingRider && (
                <Camera
                  zoom={18}
                  pitch={0}
                  bearing={0}
                  animationMode="none"
                  animationDuration={0}
                  center={[riderPosition.longitude, riderPosition.latitude]}
                  padding={{ top: 100, bottom: 300, left: 0, right: 0 }}
                />
              )}

              {/* DELIVERY BOY MARKER */}
              {riderPosition && (
                <Marker
                  anchor="center"
                  lngLat={[riderPosition.longitude, riderPosition.latitude]}
                >
                  <View
                    style={[
                      styles.currentMarkerWrapper,
                      { transform: [{ rotate: `${markerHeading}deg` }] },
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
                  <Layer
                    id="routeLayerBg"
                    type="line"
                    paint={{
                      'line-color': '#0B3B2E',
                      'line-width': 10,
                      'line-opacity': 0.7,
                    }}
                    layout={{ 'line-cap': 'round', 'line-join': 'round' }}
                  />
                  <Layer
                    id="routeLayer"
                    type="line"
                    paint={{
                      'line-color': '#00FF9D',
                      'line-width': 6,
                      'line-opacity': 1,
                    }}
                    layout={{ 'line-cap': 'round', 'line-join': 'round' }}
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
              </TouchableOpacity>
            )}

            {/* FLOATING CARD */}
            {showDetailsCard ? (
              <View style={styles.card1}>
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
                    <TouchableOpacity
                      style={styles.circleBtn}
                      // onPress={() => {
                      //   const { latitude, longitude } = currentLocation || {};
                      //   if (latitude === undefined || longitude === undefined)
                      //     return;
                      //   sendLocation(latitude, longitude, orderDetail.order.id);
                      // }}
                    >
                      <Image
                        source={require('../assets/images/call.png')}
                        style={styles.smallIcon}
                      />
                    </TouchableOpacity>
                  </View>
                </View>

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
  container: { flex: 1, backgroundColor: Colors.primary, paddingTop: 100 },
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
  map: { flex: 1 },
  mapPoint: { width: 20, height: 20 },
  currentMarkerWrapper: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deliveryIcon: { width: 60, height: 60 },
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
    shadowOffset: { width: 0, height: 5 },
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  avatar: { width: 60, height: 60, borderRadius: 20, marginRight: 12 },
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
  iconColumn: { gap: 0 },
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
  boldText: { fontFamily: FontFamily.bold, marginTop: 2, fontSize: 14 },
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
  liveTitle: { color: Colors.textColor, fontFamily: FontFamily.medium },
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
  progressRow: { flexDirection: 'row', justifyContent: 'space-between' },
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
  activeStep: { backgroundColor: Colors.lightOrange },
  line: {
    position: 'absolute',
    top: 12,
    left: '50%',
    width: '100%',
    height: 3,
    backgroundColor: '#ddd',
    zIndex: 1,
  },
  activeLine: { backgroundColor: Colors.primary },
  stepText: {
    fontSize: 10,
    marginTop: 10,
    color: Colors.textBrown,
    textAlign: 'center',
    fontFamily: FontFamily.regular,
  },
  buttonRow: { flexDirection: 'row', marginTop: 25, gap: 12 },
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
  smallIcon: { width: 18, height: 18, tintColor: '#fff' },
  smallIconOrange: { width: 30, height: 30, tintColor: Colors.primary },
  bikeIcon: { width: 24, height: 24, tintColor: Colors.primary },
  checkIcon: { width: 16, height: 16 },
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
  scooterIcon: { width: 20, height: 20, tintColor: Colors.primary },
  hideButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  hideIcon: { width: 16, height: 16, tintColor: Colors.textColor },
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
    shadowOffset: { width: 0, height: 4 },
    elevation: 10,
  },
  floatingArrow: { width: 24, height: 24, tintColor: '#fff' },
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

