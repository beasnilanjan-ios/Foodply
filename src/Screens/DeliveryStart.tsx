// // //re-route rnd 1

// import React, { useEffect, useState, useRef, useMemo } from 'react';
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
//   Linking,
//   NativeSyntheticEvent,
// } from 'react-native';

// import {
//   Map,
//   Camera,
//   Marker,
//   GeoJSONSource,
//   Layer,
//   ViewStateChangeEvent,
//   CameraRef,
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
// import socket, {
//   disconnectSocket,
//   connectSocket,
//   getSocket,
// } from '../services/socketService';

// const NAVIGATION_MAP_STYLE =
//   'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json';

// const NAVIGATION_ZOOM = 19;
// const NAVIGATION_PITCH = 55;
// const MAP_PADDING = { top: 100, bottom: 300, left: 0, right: 0 };

// const OSRM_ENDPOINTS = [
//   'https://router.project-osrm.org',
//   'https://routing.openstreetmap.de/routed-car',
// ];

// const ON_ROUTE_SNAP_THRESHOLD = 15;
// const OFF_ROUTE_THRESHOLD_METERS = 25;
// const OFF_ROUTE_CONFIRM_COUNT = 3;
// const MIN_TURN_ANGLE_FOR_HEADING = 22;
// const HEADING_ANIMATION_SPEED = 0.08;
// const TURN_HEADING_ANIMATION_SPEED = 0.1;
// const TURN_BLEND_WALKING_METERS = 1;
// const TURN_BLEND_VEHICLE_METERS = 2;
// const WALKING_MAX_SPEED_MPS = 1.5;
// const SEGMENT_ADVANCE_DISTANCE_METERS = 1.5;
// const SEGMENT_ADVANCE_PROGRESS = 0.99;
// const MANEUVER_LOOKAHEAD_METERS = 250;
// const MIN_TURN_ANGLE = 28;

// type RouteCoordinate = [number, number];

// type UpcomingManeuver = {
//   label: string;
//   distanceMeters: number;
// };

// const getSignedTurnAngle = (incomingBearing: number, outgoingBearing: number) => {
//   let delta = outgoingBearing - incomingBearing;
//   if (delta > 180) {
//     delta -= 360;
//   }
//   if (delta < -180) {
//     delta += 360;
//   }
//   return delta;
// };

// const getManeuverLabel = (turnAngle: number) => {
//   const absAngle = Math.abs(turnAngle);
//   if (absAngle < MIN_TURN_ANGLE) {
//     return null;
//   }
//   if (absAngle > 150) {
//     return 'Take a U-turn';
//   }
//   if (turnAngle < 0) {
//     return absAngle < 60 ? 'Bear left' : 'Take left turn';
//   }
//   return absAngle < 60 ? 'Bear right' : 'Take right turn';
// };

// const getDistanceAlongRouteToVertex = (
//   route: RouteCoordinate[],
//   fromIndex: number,
//   fromPoint: { latitude: number; longitude: number },
//   vertexIndex: number,
// ) => {
//   if (vertexIndex <= fromIndex) {
//     return 0;
//   }

//   let total = getDistance(
//     fromPoint.latitude,
//     fromPoint.longitude,
//     route[fromIndex + 1][1],
//     route[fromIndex + 1][0],
//   );

//   for (let index = fromIndex + 1; index < vertexIndex; index += 1) {
//     total += getDistance(
//       route[index][1],
//       route[index][0],
//       route[index + 1][1],
//       route[index + 1][0],
//     );
//   }

//   return total;
// };

// const getUpcomingManeuver = (
//   route: RouteCoordinate[],
//   fromIndex: number,
//   fromPoint: { latitude: number; longitude: number },
// ): UpcomingManeuver | null => {
//   if (route.length < 2) {
//     return null;
//   }

//   const destination = route[route.length - 1];
//   const distanceToDestination = getDistance(
//     fromPoint.latitude,
//     fromPoint.longitude,
//     destination[1],
//     destination[0],
//   );

//   if (distanceToDestination <= 35) {
//     return {
//       label: 'You have arrived',
//       distanceMeters: distanceToDestination,
//     };
//   }

//   if (route.length < 3) {
//     return {
//       label: 'Continue to destination',
//       distanceMeters: distanceToDestination,
//     };
//   }

//   for (
//     let vertexIndex = Math.max(fromIndex + 1, 1);
//     vertexIndex < route.length - 1;
//     vertexIndex += 1
//   ) {
//     const incomingBearing = calculateBearing(
//       route[vertexIndex - 1][1],
//       route[vertexIndex - 1][0],
//       route[vertexIndex][1],
//       route[vertexIndex][0],
//     );
//     const outgoingBearing = calculateBearing(
//       route[vertexIndex][1],
//       route[vertexIndex][0],
//       route[vertexIndex + 1][1],
//       route[vertexIndex + 1][0],
//     );
//     const turnAngle = getSignedTurnAngle(incomingBearing, outgoingBearing);
//     const label = getManeuverLabel(turnAngle);

//     if (!label) {
//       continue;
//     }

//     const distanceMeters = getDistanceAlongRouteToVertex(
//       route,
//       fromIndex,
//       fromPoint,
//       vertexIndex,
//     );

//     if (distanceMeters <= MANEUVER_LOOKAHEAD_METERS) {
//       return { label, distanceMeters };
//     }
//   }

//   return {
//     label: 'Continue straight',
//     distanceMeters: Math.min(distanceToDestination, MANEUVER_LOOKAHEAD_METERS),
//   };
// };

// const formatManeuverInstruction = (maneuver: UpcomingManeuver) => {
//   if (maneuver.label === 'You have arrived') {
//     return maneuver.label;
//   }

//   const meters = Math.max(1, Math.round(maneuver.distanceMeters));

//   if (meters <= 30) {
//     return `${maneuver.label} within ${meters} meters`;
//   }

//   if (meters < 1000) {
//     return `${maneuver.label} in ${meters} m`;
//   }

//   return `${maneuver.label} in ${(meters / 1000).toFixed(1)} km`;
// };

// const calculateBearing = (
//   startLat: number,
//   startLng: number,
//   endLat: number,
//   endLng: number,
// ) => {
//   const dLon = ((endLng - startLng) * Math.PI) / 180;
//   const y = Math.sin(dLon) * Math.cos((endLat * Math.PI) / 180);
//   const x =
//     Math.cos((startLat * Math.PI) / 180) * Math.sin((endLat * Math.PI) / 180) -
//     Math.sin((startLat * Math.PI) / 180) *
//       Math.cos((endLat * Math.PI) / 180) *
//       Math.cos(dLon);
//   return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
// };

// const getDistance = (
//   lat1: number,
//   lon1: number,
//   lat2: number,
//   lon2: number,
// ) => {
//   const earthRadius = 6371e3;
//   const phi1 = (lat1 * Math.PI) / 180;
//   const phi2 = (lat2 * Math.PI) / 180;
//   const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
//   const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;
//   const a =
//     Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
//     Math.cos(phi1) *
//       Math.cos(phi2) *
//       Math.sin(deltaLambda / 2) *
//       Math.sin(deltaLambda / 2);
//   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//   return earthRadius * c;
// };

// const getProjectedPointOnSegment = (
//   lat: number,
//   lng: number,
//   startLat: number,
//   startLng: number,
//   endLat: number,
//   endLng: number,
// ) => {
//   const dx = endLng - startLng;
//   const dy = endLat - startLat;
//   const lengthSquared = dx * dx + dy * dy;
//   if (lengthSquared === 0) {
//     return { latitude: startLat, longitude: startLng, t: 0 };
//   }
//   let t = ((lng - startLng) * dx + (lat - startLat) * dy) / lengthSquared;
//   t = Math.max(0, Math.min(1, t));
//   return {
//     latitude: startLat + t * dy,
//     longitude: startLng + t * dx,
//     t,
//   };
// };

// const getNearestPointOnRoute = (
//   latitude: number,
//   longitude: number,
//   route: RouteCoordinate[],
//   minIndex = 0,
// ) => {
//   if (route.length < 2) {
//     return null;
//   }

//   const searchStart = Math.max(0, Math.min(minIndex, route.length - 2));
//   let minDistance = Infinity;
//   let nearestIndex = searchStart;
//   let projectedPoint: {
//     latitude: number;
//     longitude: number;
//     t: number;
//   } | null = null;

//   for (let index = searchStart; index < route.length - 1; index += 1) {
//     const start = route[index];
//     const end = route[index + 1];
//     const projected = getProjectedPointOnSegment(
//       latitude,
//       longitude,
//       start[1],
//       start[0],
//       end[1],
//       end[0],
//     );
//     const distance = getDistance(
//       latitude,
//       longitude,
//       projected.latitude,
//       projected.longitude,
//     );
//     if (distance < minDistance) {
//       minDistance = distance;
//       nearestIndex = index;
//       projectedPoint = projected;
//     }
//   }

//   if (!projectedPoint) {
//     return null;
//   }

//   return {
//     index: nearestIndex,
//     distance: minDistance,
//     point: projectedPoint,
//   };
// };

// const buildRemainingRoute = (
//   route: RouteCoordinate[],
//   snapIndex: number,
//   snapPoint: { latitude: number; longitude: number },
// ): RouteCoordinate[] => {
//   if (route.length < 2) {
//     return [];
//   }

//   const startIndex = Math.max(0, Math.min(snapIndex, route.length - 1));
//   const remaining = route.slice(startIndex);
//   if (remaining.length === 0) {
//     return [];
//   }

//   return [[snapPoint.longitude, snapPoint.latitude], ...remaining.slice(1)];
// };

// const getRouteSegmentBearing = (
//   route: RouteCoordinate[],
//   index: number,
//   snapPoint?: { latitude: number; longitude: number },
// ) => {
//   const nextIndex = Math.min(index + 1, route.length - 1);
//   const end = route[nextIndex];

//   if (nextIndex === index) {
//     const start = route[Math.max(0, route.length - 2)];
//     return calculateBearing(start[1], start[0], end[1], end[0]);
//   }

//   const fromLat = snapPoint?.latitude ?? route[index][1];
//   const fromLng = snapPoint?.longitude ?? route[index][0];

//   return calculateBearing(fromLat, fromLng, end[1], end[0]);
// };

// const interpolateBearing = (from: number, to: number, progress: number) => {
//   let delta = to - from;
//   if (delta > 180) {
//     delta -= 360;
//   }
//   if (delta < -180) {
//     delta += 360;
//   }
//   return (from + delta * progress + 360) % 360;
// };

// const smoothstep = (value: number) => value * value * (3 - 2 * value);

// const smootherstep = (value: number) => {
//   const clamped = Math.max(0, Math.min(1, value));
//   return clamped * clamped * clamped * (clamped * (clamped * 6 - 15) + 10);
// };

// const getSegmentDirection = (route: RouteCoordinate[], index: number) => {
//   const start = route[Math.max(0, Math.min(index, route.length - 2))];
//   const end = route[Math.min(index + 1, route.length - 1)];
//   return calculateBearing(start[1], start[0], end[1], end[0]);
// };

// const getTurnBlendDistanceMeters = (speedMps: number | null | undefined) => {
//   const speed = speedMps ?? 0;
//   if (!Number.isFinite(speed) || speed < WALKING_MAX_SPEED_MPS) {
//     return TURN_BLEND_WALKING_METERS;
//   }
//   return TURN_BLEND_VEHICLE_METERS;
// };

// const getNavigationHeading = (
//   route: RouteCoordinate[],
//   index: number,
//   point: { latitude: number; longitude: number },
//   segmentProgress?: number,
//   speedMps?: number | null,
// ) => {
//   const incoming = getSegmentDirection(route, index);

//   if (index + 2 >= route.length) {
//     return incoming;
//   }

//   const outgoing = getSegmentDirection(route, index + 1);
//   const turnAngle = getSignedTurnAngle(incoming, outgoing);

//   if (Math.abs(turnAngle) < MIN_TURN_ANGLE_FOR_HEADING) {
//     return incoming;
//   }

//   let distToVertex: number;
//   if (
//     segmentProgress != null &&
//     Number.isFinite(segmentProgress) &&
//     index + 1 < route.length
//   ) {
//     const segStart = route[index];
//     const segEnd = route[index + 1];
//     const segmentLength = getDistance(
//       segStart[1],
//       segStart[0],
//       segEnd[1],
//       segEnd[0],
//     );
//     distToVertex = segmentLength * (1 - Math.max(0, Math.min(1, segmentProgress)));
//   } else {
//     const vertex = route[index + 1];
//     distToVertex = getDistance(
//       point.latitude,
//       point.longitude,
//       vertex[1],
//       vertex[0],
//     );
//   }

//   const blendDistanceMeters = getTurnBlendDistanceMeters(speedMps);

//   if (distToVertex > blendDistanceMeters) {
//     return incoming;
//   }

//   const blendProgress = 1 - distToVertex / blendDistanceMeters;
//   return interpolateBearing(incoming, outgoing, smootherstep(blendProgress));
// };

// const resolveRouteSnap = (
//   route: RouteCoordinate[],
//   gpsLat: number,
//   gpsLng: number,
//   minIndex: number,
// ) => {
//   const baseSnap = getNearestPointOnRoute(gpsLat, gpsLng, route, minIndex);
//   if (!baseSnap?.point || baseSnap.index + 1 >= route.length) {
//     return baseSnap;
//   }

//   const segmentStart = route[baseSnap.index];
//   const segmentEnd = route[baseSnap.index + 1];
//   const gpsOnSegment = getProjectedPointOnSegment(
//     gpsLat,
//     gpsLng,
//     segmentStart[1],
//     segmentStart[0],
//     segmentEnd[1],
//     segmentEnd[0],
//   );

//   const crossTrackDistance = getDistance(
//     gpsLat,
//     gpsLng,
//     gpsOnSegment.latitude,
//     gpsOnSegment.longitude,
//   );

//   if (crossTrackDistance > OFF_ROUTE_THRESHOLD_METERS) {
//     return baseSnap;
//   }

//   let routeIndex = baseSnap.index;
//   let routePoint = gpsOnSegment;

//   const distToVertex = getDistance(
//     gpsOnSegment.latitude,
//     gpsOnSegment.longitude,
//     segmentEnd[1],
//     segmentEnd[0],
//   );

//   if (
//     routeIndex + 2 < route.length &&
//     (distToVertex <= SEGMENT_ADVANCE_DISTANCE_METERS ||
//       gpsOnSegment.t >= SEGMENT_ADVANCE_PROGRESS)
//   ) {
//     const nextStart = segmentEnd;
//     const nextEnd = route[routeIndex + 2];
//     const gpsOnNextSegment = getProjectedPointOnSegment(
//       gpsLat,
//       gpsLng,
//       nextStart[1],
//       nextStart[0],
//       nextEnd[1],
//       nextEnd[0],
//     );
//     const nextCrossTrack = getDistance(
//       gpsLat,
//       gpsLng,
//       gpsOnNextSegment.latitude,
//       gpsOnNextSegment.longitude,
//     );

//     if (
//       nextCrossTrack <= OFF_ROUTE_THRESHOLD_METERS &&
//       gpsOnNextSegment.t > 0.04
//     ) {
//       routeIndex += 1;
//       routePoint = gpsOnNextSegment;
//     }
//   }

//   return {
//     index: routeIndex,
//     distance: crossTrackDistance,
//     point: routePoint,
//   };
// };

// const formatRouteDistance = (meters: number) => {
//   if (!Number.isFinite(meters) || meters <= 0) {
//     return '--';
//   }
//   if (meters < 1000) {
//     return `${Math.round(meters)} m`;
//   }
//   return `${(meters / 1000).toFixed(1)} km`;
// };

// const formatRouteDuration = (seconds: number) => {
//   if (!Number.isFinite(seconds) || seconds <= 0) {
//     return '--';
//   }
//   const minutes = Math.max(1, Math.round(seconds / 60));
//   return `${minutes} min`;
// };

// const formatSpeedKmh = (speedMps: number | null | undefined) => {
//   if (speedMps == null || !Number.isFinite(speedMps) || speedMps < 0) {
//     return 0;
//   }
//   return Math.round(speedMps * 3.6);
// };

// const fetchDrivingRoute = async (
//   startLat: number,
//   startLng: number,
//   endLat: number,
//   endLng: number,
// ) => {
//   for (const baseUrl of OSRM_ENDPOINTS) {
//     try {
//       const response = await axios.get(
//         `${baseUrl}/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`,
//       );
//       const route = response.data?.routes?.[0];
//       if (route?.geometry?.coordinates?.length) {
//         return {
//           coordinates: route.geometry.coordinates as RouteCoordinate[],
//           distanceMeters: route.distance ?? 0,
//           durationSeconds: route.duration ?? 0,
//         };
//       }
//     } catch {
//       // try next endpoint
//     }
//   }

//   return null;
// };

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
  
//   const LOCATION_PUSH_THRESHOLD_METERS = 20;
//   // ROUTE
//   const [routeCoordinates, setRouteCoordinates] = useState<RouteCoordinate[]>([]);
//   const routeCoordinatesRef = useRef<RouteCoordinate[]>([]);
//   const [remainingRoute, setRemainingRoute] = useState<RouteCoordinate[]>([]);
//   const [routeDistanceMeters, setRouteDistanceMeters] = useState(0);
//   const [routeDurationSeconds, setRouteDurationSeconds] = useState(0);
//   const headingRef = useRef(0);
//   const targetHeadingRef = useRef(0);
//   const headingRafRef = useRef<number | null>(null);
//   const headingAnimationSpeedRef = useRef(HEADING_ANIMATION_SPEED);
//   const riderPositionRef = useRef<{
//     latitude: number;
//     longitude: number;
//   } | null>(null);
//   const isReroutingRef = useRef(false);
//   const offRouteCountRef = useRef(0);
//   const [riderPosition, setRiderPosition] = useState<{
//     latitude: number;
//     longitude: number;
//   } | null>(null);
//   const lastSentLocationRef = useRef<{
//     latitude: number;
//     longitude: number;
//   } | null>(null);
//   const [markerHeading, setMarkerHeading] = useState(0);
//   const [navigationInstruction, setNavigationInstruction] = useState<string | null>(
//     null,
//   );
//   const [currentSpeedKmh, setCurrentSpeedKmh] = useState(0);
//   const [loading, setLoading] = useState(false);
//   const [isFollowingRider, setIsFollowingRider] = useState(true);
//   const isFollowingRiderRef = useRef(true);
//   const [mapBearing, setMapBearing] = useState(0);
//   const userInteractingRef = useRef(false);
//   const interactionTimerRef = useRef<any>(null);
//   const cameraRef = useRef<CameraRef>(null);
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

//   // ROUTE API
//   const getRoute = async (
//     startLat: number,
//     startLng: number,
//     endLat: number,
//     endLng: number,
//   ) => {
//     try {
//       const result = await fetchDrivingRoute(startLat, startLng, endLat, endLng);
//       if (!result) {
//         return;
//       }

//       const { coordinates, distanceMeters, durationSeconds } = result;
//       setRouteDistanceMeters(distanceMeters);
//       setRouteDurationSeconds(durationSeconds);
//       setRouteCoordinates(coordinates);
//       routeCoordinatesRef.current = coordinates;
//       setRemainingRoute(coordinates);

//       if (!riderPosition && coordinates.length > 0) {
//         const initialPos = {
//           latitude: coordinates[0][1],
//           longitude: coordinates[0][0],
//         };
//         riderPositionRef.current = initialPos;
//         setRiderPosition(initialPos);
//         lastSnappedIndexRef.current = 0;

//         if (coordinates.length > 1) {
//           const initialBearing = getSegmentDirection(coordinates, 0);
//           headingRef.current = initialBearing;
//           targetHeadingRef.current = initialBearing;
//           setMarkerHeading(initialBearing);
//         }

//         const maneuver = getUpcomingManeuver(coordinates, 0, initialPos);
//         setNavigationInstruction(
//           maneuver ? formatManeuverInstruction(maneuver) : null,
//         );
//       }
//     } catch (error) {
//       console.log('ROUTE ERROR', error);
//     }
//   };

//   const reRoute = async (currentLat: number, currentLng: number) => {
//     if (isReroutingRef.current) {
//       return;
//     }

//     const existingRoute = routeCoordinatesRef.current;
//     if (existingRoute.length >= 2) {
//       const snapCheck = getNearestPointOnRoute(
//         currentLat,
//         currentLng,
//         existingRoute,
//       );
//       if (snapCheck && snapCheck.distance <= ON_ROUTE_SNAP_THRESHOLD) {
//         offRouteCountRef.current = 0;
//         return;
//       }
//     }

//     isReroutingRef.current = true;

//     try {
//       const result = await fetchDrivingRoute(
//         currentLat,
//         currentLng,
//         destinationLocation.latitude,
//         destinationLocation.longitude,
//       );

//       if (!result?.coordinates?.length) {
//         isReroutingRef.current = false;
//         return;
//       }

//       const newCoordinates = result.coordinates;
//       const firstSnapped = newCoordinates[0];
//       setRouteDistanceMeters(result.distanceMeters);
//       setRouteDurationSeconds(result.durationSeconds);
//       setRouteCoordinates(newCoordinates);
//       routeCoordinatesRef.current = newCoordinates;
//       setRemainingRoute(newCoordinates);
//       lastSnappedIndexRef.current = 0;
//       offRouteCountRef.current = 0;

//       const snapPos = {
//         latitude: firstSnapped[1],
//         longitude: firstSnapped[0],
//       };
//       riderPositionRef.current = snapPos;
//       setRiderPosition(snapPos);

//       if (newCoordinates.length > 1) {
//         const segmentBearing = getSegmentDirection(newCoordinates, 0);
//         headingRef.current = segmentBearing;
//         targetHeadingRef.current = segmentBearing;
//         setMarkerHeading(segmentBearing);
//       }

//       const maneuver = getUpcomingManeuver(newCoordinates, 0, snapPos);
//       setNavigationInstruction(
//         maneuver ? formatManeuverInstruction(maneuver) : null,
//       );

//       isReroutingRef.current = false;
//     } catch (error) {
//       console.log('Re-route error:', error);
//       isReroutingRef.current = false;
//     }
//   };

//   // INITIAL LOCATION
//   const getCurrentLocation = async () => {
//     Geolocation.getCurrentPosition(
//       async position => {
//         const latitude = position.coords.latitude;
//         const longitude = position.coords.longitude;
//         ToastAndroid.show(
//           `Current Location: Latitude ${latitude} Longitude ${longitude}`,
//           ToastAndroid.SHORT,
//         );
//         sendLocation(latitude, longitude, orderDetail.order.id);
//         setCurrentLocation({ latitude, longitude });
//         previousCoordinateRef.current = { latitude, longitude };
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
//       { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 },
//     );
//   };

//   const sendLocation = (
//     latitude: number,
//     longitude: number,
//     orderId: string | number,
//     heading = headingRef.current,
//     speed = 0,
//   ) => {
//     const payload = {
//       orderId: orderId,
//       latitude: latitude,
//       longitude: longitude,
//       speed: speed,
//       heading: heading,
//     };

//     try {
//       console.log('Emitting location update', payload);
     
//       const s = getSocket();

//       if (s && typeof s.emit === 'function') {
//         s.emit('delivery:location', payload, (response: any) => {
//           console.log('ACK:', response);
//         });
//       } else {
//         console.log('sendLocation: socket not available');
//       }
//     } catch (e) {
//       console.log('sendLocation emit error', e);
//     }
//   };

//   // LIVE TRACKING
//   useEffect(() => {
//     requestLocationPermission();
//     getCurrentLocation();

//     const startHeadingAnimation = () => {
//       const animateHeading = () => {
//         const currentHeading = headingRef.current;
//         const targetHeading = targetHeadingRef.current;
//         let delta = targetHeading - currentHeading;

//         if (delta > 180) {
//           delta -= 360;
//         }
//         if (delta < -180) {
//           delta += 360;
//         }

//         if (Math.abs(delta) > 0.2) {
//           const speed = headingAnimationSpeedRef.current;
//           const nextHeading = (currentHeading + delta * speed + 360) % 360;
//           headingRef.current = nextHeading;
//           setMarkerHeading(nextHeading);
//         } else if (headingAnimationSpeedRef.current !== HEADING_ANIMATION_SPEED) {
//           headingAnimationSpeedRef.current = HEADING_ANIMATION_SPEED;
//         }

//         headingRafRef.current = requestAnimationFrame(animateHeading);
//       };

//       headingRafRef.current = requestAnimationFrame(animateHeading);
//     };

//     startHeadingAnimation();

//     const applySnapToRoute = (
//       route: RouteCoordinate[],
//       snapped: NonNullable<ReturnType<typeof getNearestPointOnRoute>>,
//       gpsSpeed?: number | null,
//     ) => {
//       if (!snapped.point) {
//         return;
//       }

//       const previousIndex = lastSnappedIndexRef.current;
//       const routeIndex = Math.max(snapped.index, previousIndex);
//       const segmentProgress = snapped.point.t ?? 0;
//       const snapPos = {
//         latitude: snapped.point.latitude,
//         longitude: snapped.point.longitude,
//       };

//       riderPositionRef.current = snapPos;
//       setRiderPosition(snapPos);
//       lastSnappedIndexRef.current = routeIndex;
//       setRemainingRoute(
//         buildRemainingRoute(route, routeIndex, snapPos),
//       );

//       targetHeadingRef.current = getNavigationHeading(
//         route,
//         routeIndex,
//         snapPos,
//         segmentProgress,
//         gpsSpeed,
//       );

//       if (routeIndex > previousIndex && previousIndex >= 0) {
//         headingAnimationSpeedRef.current = TURN_HEADING_ANIMATION_SPEED;
//       }

//       const maneuver = getUpcomingManeuver(route, routeIndex, snapped.point);
//       setNavigationInstruction(
//         maneuver ? formatManeuverInstruction(maneuver) : null,
//       );
//     };

//     const watchId = Geolocation.watchPosition(
//       position => {
//         const latitude = position.coords.latitude;
//         const longitude = position.coords.longitude;
//         const gpsSpeed = position.coords.speed;
//         setCurrentSpeedKmh(formatSpeedKmh(gpsSpeed));

//         setCurrentLocation({ latitude, longitude });

//         const lastSent = lastSentLocationRef.current;
//         const distanceFromLastSent = lastSent
//           ? getDistance(
//               lastSent.latitude,
//               lastSent.longitude,
//               latitude,
//               longitude,
//             )
//           : Infinity;

//         if (
//           !lastSent ||
//           distanceFromLastSent >= LOCATION_PUSH_THRESHOLD_METERS
//         ) {
//           sendLocation(
//             latitude,
//             longitude,
//             orderDetail.order.id,
//             headingRef.current,
//             gpsSpeed ?? 0,
//           );
//           lastSentLocationRef.current = { latitude, longitude };
//         }

//         const route = routeCoordinatesRef.current;
//         if (route.length < 2) {
//           previousCoordinateRef.current = { latitude, longitude };
//           return;
//         }

//         if (isReroutingRef.current) {
//           previousCoordinateRef.current = { latitude, longitude };
//           return;
//         }

//         const snapped = resolveRouteSnap(
//           route,
//           latitude,
//           longitude,
//           lastSnappedIndexRef.current,
//         );

//         if (!snapped?.point) {
//           previousCoordinateRef.current = { latitude, longitude };
//           return;
//         }

//         if (snapped.distance > OFF_ROUTE_THRESHOLD_METERS) {
//           offRouteCountRef.current += 1;

//           if (offRouteCountRef.current >= OFF_ROUTE_CONFIRM_COUNT) {
//             reRoute(latitude, longitude);
//             offRouteCountRef.current = 0;
//           }

//           previousCoordinateRef.current = { latitude, longitude };
//           return;
//         }

//         offRouteCountRef.current = 0;
//         applySnapToRoute(route, snapped, gpsSpeed);
//         previousCoordinateRef.current = { latitude, longitude };
//       },
//       error => console.log(error),
//       {
//         enableHighAccuracy: true,
//         distanceFilter: 0,
//         interval: 250,
//         fastestInterval: 250,
//         showLocationDialog: true,
//         forceRequestLocation: true,
//       },
//     );

//     console.log('Auth', GlobalLoginAuth.accessToken);
  

//     if (!GlobalLoginAuth.accessToken) {
//       console.log('Token is missing');
//       return;
//     }
//     console.log('Access Token:', GlobalLoginAuth.accessToken);
//     console.log('Type:', typeof GlobalLoginAuth.accessToken);
//     console.log('Parts:', GlobalLoginAuth.accessToken?.split('.').length);
//     const s = connectSocket();
//     console.log('socket status:', s ? s.connected : 'no-socket', 'id:', s?.id);

    

//     if (s && typeof s.onAny === 'function') {
//       s.onAny((event, ...args) => {
//         console.log('socket event:', event, args);
//       });
//     }

//     if (s) {
//       s.on('newMessage', data => {
//         console.log('Connected:', s.id);
//         console.log('newMessage:', data);
//       });

//       s.on('message', data => {
//         console.log('Message:', data);
//       });
//     }

//     return () => {
//       if (headingRafRef.current != null) {
//         cancelAnimationFrame(headingRafRef.current);
//         headingRafRef.current = null;
//       }
//       Geolocation.clearWatch(watchId);

//       const s = getSocket();
//       if (s) {
//         s.off('message');
//       }
//       disconnectSocket();
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
//       const SendOtpResponse = result as SendOtpResponse;
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

//   const makePhoneCall = (phoneNumber?: string) => {
//       if (!phoneNumber) {
//         Alert.alert('Error', 'Phone number not available');
//         return;
//       }

//       Linking.openURL(`tel:${phoneNumber}`).catch(() => {
//         Alert.alert('Error', 'Unable to make a phone call');
//       });
//     };

//   const handleRegionDidChange = (
//     event: NativeSyntheticEvent<ViewStateChangeEvent>,
//   ) => {
//     const bearing = event.nativeEvent.bearing;
//     if (Number.isFinite(bearing)) {
//       setMapBearing(bearing);
//     }

//     if (event.nativeEvent.userInteraction) {
//       userInteractingRef.current = true;
//       setIsFollowingRider(false);
//       if (interactionTimerRef.current) {
//         clearTimeout(interactionTimerRef.current);
//       }
//     }
//   };

//   useEffect(() => {
//     isFollowingRiderRef.current = isFollowingRider;
//   }, [isFollowingRider]);

//   const displayRoute =
//     remainingRoute.length > 1 ? remainingRoute : routeCoordinates;

//   // Follow mode: map bearing tracks heading, icon points up.
//   // Free pan/zoom: rotate icon relative to current map bearing.
//   const markerIconRotation = isFollowingRider
//     ? 0
//     : ((markerHeading - mapBearing) % 360 + 360) % 360;

//   const mapCameraCenter = useMemo<[number, number]>(() => {
//     if (riderPosition) {
//       return [riderPosition.longitude, riderPosition.latitude];
//     }

//     return [destinationLocation.longitude, destinationLocation.latitude];
//   }, [
//     riderPosition?.latitude,
//     riderPosition?.longitude,
//     destinationLocation.latitude,
//     destinationLocation.longitude,
//   ]);

//   const handleRecenter = () => {
//     userInteractingRef.current = false;
//     setIsFollowingRider(true);

//     const center = riderPosition
//       ? ([riderPosition.longitude, riderPosition.latitude] as [number, number])
//       : ([destinationLocation.longitude, destinationLocation.latitude] as [
//           number,
//           number,
//         ]);

//     cameraRef.current?.easeTo({
//       center,
//       zoom: NAVIGATION_ZOOM,
//       pitch: NAVIGATION_PITCH,
//       bearing: markerHeading,
//       padding: MAP_PADDING,
//       duration: 400,
//     });
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
//               mapStyle={NAVIGATION_MAP_STYLE}
//               logo={false}
//               onRegionDidChange={handleRegionDidChange}>
//               {isFollowingRider && (
//                 <Camera
//                   ref={cameraRef}
//                   minZoom={14}
//                   initialViewState={{
//                     center: [
//                       destinationLocation.longitude,
//                       destinationLocation.latitude,
//                     ],
//                     zoom: NAVIGATION_ZOOM,
//                     pitch: NAVIGATION_PITCH,
//                     bearing: markerHeading,
//                   }}
//                   zoom={NAVIGATION_ZOOM}
//                   pitch={NAVIGATION_PITCH}
//                   bearing={markerHeading}
//                   center={mapCameraCenter}
//                   padding={MAP_PADDING}
//                 />
//               )}

//               {displayRoute.length > 1 && (
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
//                           coordinates: displayRoute,
//                         },
//                       },
//                     ],
//                   }}>
//                   <Layer
//                     id="routeLayerBg"
//                     type="line"
//                     paint={{
//                       'line-color': '#1B4332',
//                       'line-width': 12,
//                       'line-opacity': 0.85,
//                     }}
//                     layout={{ 'line-cap': 'round', 'line-join': 'round' }}
//                   />
//                   <Layer
//                     id="routeLayer"
//                     type="line"
//                     paint={{
//                       'line-color': Colors.primary,
//                       'line-width': 7,
//                       'line-opacity': 1,
//                     }}
//                     layout={{ 'line-cap': 'round', 'line-join': 'round' }}
//                   />
//                 </GeoJSONSource>
//               )}

//               {riderPosition && (
//                 <Marker
//                   anchor="center"
//                   lngLat={[riderPosition.longitude, riderPosition.latitude]}>
//                   <View style={styles.riderMarkerContainer}>
//                     <View style={styles.riderPulse} />
//                     <View
//                       style={[
//                         styles.riderMarkerWrapper,
//                         { transform: [{ rotate: `${markerIconRotation}deg` }] },
//                       ]}>
//                       <Image
//                         source={require('../assets/images/delivery-foodyply-rider.png')}
//                         style={styles.deliveryIcon}
//                         resizeMode="contain"
//                       />
//                     </View>
//                   </View>
//                 </Marker>
//               )}

//               <Marker
//                 anchor="center"
//                 lngLat={[
//                   destinationLocation.longitude,
//                   destinationLocation.latitude,
//                 ]}>
//                 <View style={styles.destinationMarkerOuter}>
//                   <View style={styles.destinationMarkerInner} />
//                 </View>
//               </Marker>
//             </Map>

//             {(routeDistanceMeters > 0 ||
//               routeDurationSeconds > 0 ||
//               displayRoute.length > 1) && (
//               <View style={styles.etaChip}>
//                 <Text style={styles.etaChipTitle}>ETA</Text>
//                 <Text style={styles.etaChipValue}>
//                   {formatRouteDuration(routeDurationSeconds)}
//                 </Text>
//                 <Text style={styles.etaChipMeta}>
//                   {formatRouteDistance(routeDistanceMeters)}
//                 </Text>
//               </View>
//             )}

//             <View style={styles.speedChip}>
//               <Text style={styles.speedChipValue}>{currentSpeedKmh}</Text>
//               <Text style={styles.speedChipUnit}>km/h</Text>
//             </View>

//             {navigationInstruction ? (
//               <View
//                 style={[
//                   styles.maneuverChip,
//                   showDetailsCard
//                     ? styles.maneuverChipAboveCard
//                     : styles.maneuverChipBottom,
//                 ]}>
//                 <Text style={styles.maneuverChipText}>
//                   {navigationInstruction}
//                 </Text>
//               </View>
//             ) : null}

//             {!isFollowingRider && (
//               <TouchableOpacity
//                 activeOpacity={0.85}
//                 style={styles.reCenterBtn}
//                 onPress={handleRecenter}>
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
//                     <TouchableOpacity
//                       style={styles.circleBtn}
//                       // onPress={() => {
//                       //   const { latitude, longitude } = currentLocation || {};
//                       //   if (latitude === undefined || longitude === undefined)
//                       //     return;
//                       //   sendLocation(latitude, longitude, orderDetail.order.id);
//                       // }}
//                       onPress={() => {
//                         // Call action
//                         makePhoneCall(orderDetail?.customer?.phone)
//                       }}>
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
//   mapPoint: { width: 22, height: 22, tintColor: Colors.primary },
//   riderMarkerContainer: {
//     width: 56,
//     height: 56,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   riderPulse: {
//     position: 'absolute',
//     width: 42,
//     height: 42,
//     borderRadius: 21,
//     backgroundColor: 'rgba(255, 106, 0, 0.18)',
//   },
//   riderMarkerWrapper: {
//     width: 44,
//     height: 44,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   deliveryIcon: { width: 52, height: 52 },
//   destinationMarkerOuter: {
//     width: 28,
//     height: 28,
//     borderRadius: 14,
//     backgroundColor: 'rgba(239, 68, 68, 0.18)',
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   destinationMarkerInner: {
//     width: 16,
//     height: 16,
//     borderRadius: 8,
//     backgroundColor: '#EF4444',
//     borderWidth: 3,
//     borderColor: '#FFFFFF',
//   },
//   etaChip: {
//     position: 'absolute',
//     top: 16,
//     left: 16,
//     minWidth: 92,
//     backgroundColor: '#FFFFFF',
//     borderRadius: 16,
//     paddingHorizontal: 14,
//     paddingVertical: 10,
//     shadowColor: '#000',
//     shadowOpacity: 0.12,
//     shadowRadius: 8,
//     shadowOffset: { width: 0, height: 3 },
//     elevation: 5,
//   },
//   etaChipTitle: {
//     fontSize: 11,
//     color: '#6B7280',
//     fontFamily: FontFamily.medium,
//   },
//   etaChipValue: {
//     marginTop: 2,
//     fontSize: 18,
//     color: Colors.textColor,
//     fontFamily: FontFamily.bold,
//   },
//   etaChipMeta: {
//     marginTop: 2,
//     fontSize: 12,
//     color: Colors.primary,
//     fontFamily: FontFamily.medium,
//   },
//   speedChip: {
//     position: 'absolute',
//     top: 16,
//     right: 16,
//     minWidth: 64,
//     alignItems: 'center',
//     backgroundColor: '#FFFFFF',
//     borderRadius: 16,
//     paddingHorizontal: 12,
//     paddingVertical: 8,
//     shadowColor: '#000',
//     shadowOpacity: 0.12,
//     shadowRadius: 8,
//     shadowOffset: { width: 0, height: 3 },
//     elevation: 5,
//   },
//   speedChipValue: {
//     fontSize: 22,
//     color: Colors.textColor,
//     fontFamily: FontFamily.bold,
//     lineHeight: 26,
//   },
//   speedChipUnit: {
//     fontSize: 11,
//     color: '#6B7280',
//     fontFamily: FontFamily.medium,
//   },

//   maneuverChip: {
//     position: 'absolute',
//     left: 24,
//     right: 24,
//     alignItems: 'center',
//     backgroundColor: '#111827',
//     borderRadius: 18,
//     paddingHorizontal: 16,
//     paddingVertical: 10,
//     shadowColor: '#000',
//     shadowOpacity: 0.18,
//     shadowRadius: 8,
//     shadowOffset: { width: 0, height: 3 },
//     elevation: 6,
//     zIndex: 5,
//   },

//   maneuverChipAboveCard: {
//     bottom: 310,
//   },

//   maneuverChipBottom: {
//     bottom: 24,
//   },

//   maneuverChipText: {
//     color: '#FFFFFF',
//     fontSize: 14,
//     textAlign: 'center',
//     fontFamily: FontFamily.semiBold,
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
//     right: 16,
//     bottom: 16,
//     width: 44,
//     height: 44,
//     borderRadius: 22,
//     backgroundColor: '#FFFFFF',
//     alignItems: 'center',
//     justifyContent: 'center',
//     shadowColor: '#000',
//     shadowOpacity: 0.12,
//     shadowRadius: 8,
//     shadowOffset: { width: 0, height: 3 },
//     elevation: 5,
//   },
//   reCenterText: {
//     color: Colors.primary,
//     fontSize: 13,
//     fontFamily: FontFamily.semiBold,
//   },
// });