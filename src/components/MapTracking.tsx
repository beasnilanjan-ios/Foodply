import React, { useCallback, useEffect, useRef, useState } from 'react';

import { View, Image, StyleSheet } from 'react-native';

import * as turf from '@turf/turf';

import {
  Map,
  Camera,
  CameraRef,
  Marker,
  GeoJSONSource,
  Layer,
} from '@maplibre/maplibre-react-native';

import useAnimatedMarker from '../tracking/useAnimatedMarker';

import Colors from '../assets/Colors/Colors';

const riderImage = require('../assets/images/delivery_boy.png');

export interface LatLng {
  latitude: number;

  longitude: number;
}

interface MapTrackingProps {
  riderLocation: LatLng | null;

  deliveryLocation: LatLng | null;

  showRoute?: boolean;

  showRider?: boolean;

  currentIndex: number;

  /**

   * Style URL

   */

  mapStyle?: string;
}

const DEFAULT_STYLE = 'https://tiles.openfreemap.org/styles/liberty';

const ROUTE_LINE_STYLE = {
  lineColor: '#FF5722',

  lineWidth: 5 as const,

  lineCap: 'round' as const,

  lineJoin: 'round' as const,
} as const;

// Agar rider isse zyada (meters) route line se door ho, to snapping

// force nahi karenge — real (raw) location dikhayenge.

const MAX_SNAP_DISTANCE_METERS = 50;

const MapTracking = ({
  riderLocation,

  deliveryLocation,

  showRoute = false,

  showRider = false,

  mapStyle = DEFAULT_STYLE,
}: MapTrackingProps) => {
  const cameraRef = useRef<CameraRef>(null);

  const [routeFeature, setRouteFeature] = useState<any>(null);

  const [riderImageError, setRiderImageError] = useState(false);

  const [initialCenter, _setInitialCenter] = useState<[number, number] | null>(
    null,
  );

  const [routeBearing, setRouteBearing] = useState(0);

  const lastRouteRequest = useRef(0);

  const lastCameraUpdate = useRef(0);

  // turf LineString of the current route, route-snapping ke liye

  const routeLineRef = useRef<any>(null);

  const routeLengthKmRef = useRef<number>(0);

  // Route pe ab tak kitni door (km) tak rider aage badh chuka hai —

  // isse peeche jump hone se rokte hain (monotonic progress).

  const progressKmRef = useRef<number | null>(null);

  const {
    animatedLocation,

    animateTo,

    bearing,
  } = useAnimatedMarker();

  /**

   * Marker should use animated location

   * if available.

   */

  const currentRider = showRider ? animatedLocation || riderLocation : null;

  /**

   * Initial camera fit / center.

   */

  const hasFitted = useRef(false);

  useEffect(() => {
    if (hasFitted.current) return;

    if (showRider && riderLocation && deliveryLocation) {
      hasFitted.current = true;

      cameraRef.current?.fitBounds(
        [
          Math.min(riderLocation.longitude, deliveryLocation.longitude),

          Math.min(riderLocation.latitude, deliveryLocation.latitude),

          Math.max(riderLocation.longitude, deliveryLocation.longitude),

          Math.max(riderLocation.latitude, deliveryLocation.latitude),
        ],

        {
          padding: {
            top: 120,
            right: 80,
            bottom: 120,
            left: 80,
          },

          duration: 1000,
        },
      );
    } else if (deliveryLocation) {
      hasFitted.current = true;

      cameraRef.current?.easeTo({
        center: [deliveryLocation.longitude, deliveryLocation.latitude],
        zoom: 15,
        duration: 1000,
      });
    }
  }, [showRider, riderLocation, deliveryLocation]);

  useEffect(() => {
    if (!animatedLocation) {
      return;
    }

    const now = Date.now();

    if (now - lastCameraUpdate.current < 500) {
      return;
    }

    lastCameraUpdate.current = now;

    cameraRef.current?.easeTo({
      center: [animatedLocation.longitude, animatedLocation.latitude],

      //bearing: bearing,

      duration: 800,
    });
  }, [animatedLocation, bearing]);

  // GPS noise ki wajah se thoda peeche jaana allow karte hain,

  // isse zyada peeche gaya to real u-turn/wrong-route maana jayega.

  const BACKWARD_TOLERANCE_KM = 0.02; // ~20 meters

  /**

   * Raw GPS point ko route polyline pe snap karta hai, taaki

   * marker route se off zig-zag na kare ("dance" na kare).

   *

   * Important: sirf nearest-point-on-line kaafi nahi hai, kyunki

   * agar road khud ke paas se guzarti hai (loop/parallel road/

   * intersection), to nearest point kabhi aage kabhi peeche jump

   * kar sakta hai — yahi "dance" jaisa dikhta hai.

   *

   * Isliye hum route pe "progress" (kitni door tak chal chuke)

   * track karte hain aur naya snapped point hamesha usi se aage

   * (ya thodi si tolerance ke andar) hona chahiye, warna use

   * reject kar dete hain.

   */

  const snapToRoute = useCallback(
    (point: LatLng): LatLng => {
      if (!showRoute || !routeLineRef.current) {
        return point;
      }

      try {
        const pt = turf.point([point.longitude, point.latitude]);

        const snapped = turf.nearestPointOnLine(routeLineRef.current, pt, {
          units: 'kilometers',
        });

        const [lng, lat] = snapped.geometry.coordinates;

        const locationKm = snapped.properties.location as number;

        const distanceMeters = turf.distance(pt, snapped, { units: 'meters' });

        if (distanceMeters > MAX_SNAP_DISTANCE_METERS) {
          // Route se bahut door — raw GPS point hi use karo, progress

          // ko touch mat karo (agla valid ping se recover ho jayega).

          return point;
        }

        if (
          progressKmRef.current !== null &&
          locationKm < progressKmRef.current - BACKWARD_TOLERANCE_KM
        ) {
          // Ye naya nearest point route pe peeche hai — noise/ambiguous

          // match maan ke ignore karo, last accepted position pe raho.

          return point;
        }

        progressKmRef.current =
          progressKmRef.current === null
            ? locationKm
            : Math.max(progressKmRef.current, locationKm);

        return { latitude: lat, longitude: lng };
      } catch {
        return point;
      }
    },
    [showRoute],
  );

  const normalizeAngle = useCallback((angle: number) => {
      let a = angle;

      while (a < 0) a += 360;
      while (a >= 360) a -= 360;

      return a;
    }, []);

  const smoothBearing = useCallback(
      (current: number, target: number) => {
        let delta = target - current;

        if (delta > 180) delta -= 360;
        if (delta < -180) delta += 360;

        return normalizeAngle(current + delta * 0.2);
      },
      [normalizeAngle],
    );

   
  useEffect(() => {
    if (!riderLocation || !showRoute || !routeLineRef.current) {
      return;
    }

    const target = snapToRoute(riderLocation);

    if (
      animatedLocation &&
      animatedLocation.latitude === target.latitude &&
      animatedLocation.longitude === target.longitude
    ) {
      return;
    }

    // Calculate bearing from polyline direction at the snapped point
    try {
      const routeCoords = routeLineRef.current.geometry.coordinates;
      const snappedPt = turf.point([target.longitude, target.latitude]);

      // Find the closest polyline point
      let closestIdx = 0;
      let closestDist = Infinity;

      for (let i = 0; i < routeCoords.length; i++) {
        const ptDist = turf.distance(snappedPt, turf.point(routeCoords[i]), {
          units: 'meters',
        });

        if (ptDist < closestDist) {
          closestDist = ptDist;
          closestIdx = i;
        }
      }

      // Get the bearing from the polyline segment ahead
      // if (closestIdx < routeCoords.length - 1) {
      //   const segStart = routeCoords[closestIdx];
      //   const segEnd = routeCoords[closestIdx + 1];

      //   const polyBearing = turf.bearing(
      //     turf.point(segStart),
      //     turf.point(segEnd),
      //   );

      //   setRouteBearing(polyBearing >= 0 ? polyBearing : polyBearing + 360);
      // }

    const snapped = turf.nearestPointOnLine(
        routeLineRef.current,
        turf.point([target.longitude, target.latitude]),
        { units: 'kilometers' }
    );

    const distance = snapped.properties.location;

    const start = turf.along(
        routeLineRef.current,
        Math.max(distance - 0.005, 0),
        { units: 'kilometers' },
    );

    const end = turf.along(
        routeLineRef.current,
        Math.min(
            distance + 0.005,
            routeLengthKmRef.current,
        ),
        { units: 'kilometers' },
    );

    const b = turf.bearing(start, end);

    //setRouteBearing((b + 360) % 360);

    setRouteBearing(prev =>
    smoothBearing(prev, (b + 360) % 360)
);

    } catch {
      console.log('Error calculating route bearing');
    }

    animateTo(target);
  }, [riderLocation, animateTo, animatedLocation, snapToRoute, showRoute,  smoothBearing,]);


  const fetchBikeRoute = useCallback(async () => {
    if (!riderLocation || !deliveryLocation || !showRoute) {
      return;
    }

    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${riderLocation.longitude},${riderLocation.latitude};${deliveryLocation.longitude},${deliveryLocation.latitude}?overview=full&geometries=geojson`;

      const response = await fetch(url);

      const json = await response.json();

      if (json.code !== 'Ok') {
        return;
      }

      const geometry = json.routes[0].geometry;

      setRouteFeature({
        type: 'Feature',

        geometry,

        properties: {},
      });

      // Snapping ke liye turf LineString bhi bana ke rakh lo

      const line = turf.lineString(geometry.coordinates);

      routeLineRef.current = line;

      routeLengthKmRef.current = turf.length(line, { units: 'kilometers' });

      // Naya route mila to progress fresh se track karo

      progressKmRef.current = null;
    } catch (e) {
      console.log(e);
    }
  }, [riderLocation, deliveryLocation, showRoute]);

  useEffect(() => {
    if (!riderLocation || !deliveryLocation || !showRoute) {
      return;
    }

    const now = Date.now();

    if (
      lastRouteRequest.current === 0 ||
      now - lastRouteRequest.current > 30000
    ) {
      lastRouteRequest.current = now;

      fetchBikeRoute();
    }
  }, [riderLocation, deliveryLocation, fetchBikeRoute, showRoute]);

  useEffect(() => {
    if (!showRoute) {
      setRouteFeature(null);

      routeLineRef.current = null;

      routeLengthKmRef.current = 0;

      progressKmRef.current = null;
    }
  }, [showRoute]);

  return (
    <View style={styles.container}>
      <Map style={styles.map} mapStyle={mapStyle}>
        <Camera ref={cameraRef} zoom={16} center={initialCenter ?? undefined} />

        {showRoute && routeFeature && (
          <GeoJSONSource id="route" data={routeFeature}>
            <Layer id="route-line" type="line" style={ROUTE_LINE_STYLE} />
          </GeoJSONSource>
        )}

        {/* DELIVERY */}

        {deliveryLocation && (
          <Marker
            anchor="center"
            lngLat={[deliveryLocation.longitude, deliveryLocation.latitude]}
          >
            <View style={styles.markerContainer}>
              <Image
                source={require('../assets/images/delivery-foodyply-rider.png')}
                style={styles.home}
              />
            </View>
          </Marker>
        )}

        {/* RIDER */}

        {showRider &&
          currentRider?.latitude != null &&
          currentRider?.longitude != null && (
            <Marker
              anchor="center"
              lngLat={[currentRider.longitude, currentRider.latitude]}
            >
              <View style={styles.riderContainer}>
                <View style={styles.riderPlaceholder} />

                {riderImageError ? (
                  <View style={styles.riderFallback} />
                ) : (
                  <Image
                    source={riderImage}
                    onError={event => {
                      console.log('Rider image error:', event.nativeEvent);

                      setRiderImageError(true);
                    }}
                    resizeMode="contain"
                    style={[
                      styles.rider,

                      {
                        transform: [
                          {
                            rotate: `${
                              showRoute ? routeBearing : bearing + 50
                            }deg`,
                          },
                        ],
                      },
                    ]}
                  />
                )}
              </View>
            </Marker>
          )}
      </Map>
    </View>
  );
};

export default MapTracking;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  map: {
    flex: 1,
  },

  rider: {
    width: 32,
    height: 40,
    resizeMode: 'contain',
  },

  riderContainer: {
    width: 64,
    height: 64,
    justifyContent: 'center',
    alignItems: 'center',
  },

  markerContainer: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },

  riderPlaceholder: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    opacity: 0.15,
  },

  riderFallback: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },

  home: {
    width: 26,
    height: 30,
    resizeMode: 'contain',
  },
});
