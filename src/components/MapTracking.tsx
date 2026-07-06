import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  View,
  Image,
  StyleSheet,
} from 'react-native';



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

const DEFAULT_STYLE =
  'https://tiles.openfreemap.org/styles/liberty';

const ROUTE_LINE_STYLE = {
  lineColor: '#FF5722',
  lineWidth: 5 as const,
  lineCap: 'round' as const,
  lineJoin: 'round' as const,
} as const;

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
  const [initialCenter, setInitialCenter] = useState<[number, number] | null>(null);
  const lastRouteRequest = useRef(0);
  const lastCameraUpdate = useRef(0);

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
   * Initial camera position.
   */
//   const hasFitted = useRef(false);

//   useEffect(() => {
//     if (!initialCenter && riderLocation) {
//       setInitialCenter([
//         riderLocation.longitude,
//         riderLocation.latitude,
//       ]);
//     }

//     if (hasFitted.current) {
//       return;
//     }

//     if (!riderLocation || !deliveryLocation) {
//       return;
//     }

//     hasFitted.current = true;

//     cameraRef.current?.fitBounds(
//   [
//     Math.min(
//       riderLocation.longitude,
//       deliveryLocation.longitude,
//     ),

//     Math.min(
//       riderLocation.latitude,
//       deliveryLocation.latitude,
//     ),

//     Math.max(
//       riderLocation.longitude,
//       deliveryLocation.longitude,
//     ),

//     Math.max(
//       riderLocation.latitude,
//       deliveryLocation.latitude,
//     ),
//   ],
//   {
//     padding: {
//       top: 100,
//       right: 100,
//       bottom: 100,
//       left: 100,
//     },

//     duration: 1000,
//   },
// );
//   }, [riderLocation, deliveryLocation, initialCenter]);

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
      center: [
        deliveryLocation.longitude,
        deliveryLocation.latitude,
      ],
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
      center: [
        animatedLocation.longitude,
        animatedLocation.latitude,
      ],
      bearing: bearing,
      duration: 800,
    });
  }, [animatedLocation, bearing]);

  useEffect(() => {
      if (!riderLocation) {
        return;
      }

      if (
        animatedLocation &&
        animatedLocation.latitude === riderLocation.latitude &&
        animatedLocation.longitude === riderLocation.longitude
      ) {
        return;
      }

      animateTo(riderLocation);
    }, [riderLocation, animateTo, animatedLocation]);

  

const fetchBikeRoute = useCallback(async () => {
  if (!riderLocation || !deliveryLocation || !showRoute) {
    return;
  }

  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${
      riderLocation.longitude
    },${riderLocation.latitude};${
      deliveryLocation.longitude
    },${deliveryLocation.latitude}?overview=full&geometries=geojson`;

    const response = await fetch(url);
    const json = await response.json();

    if (json.code !== 'Ok') {
      return;
    }

    setRouteFeature({
      type: 'Feature',
      geometry: json.routes[0].geometry,
      properties: {},
    });
  } catch (e) {
    console.log(e);
  }
}, [riderLocation, deliveryLocation, showRoute]);


// AFTER fetchBikeRoute

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
  }
}, [showRoute]);

  return (
    <View style={styles.container}>
      <Map
        style={styles.map}
        mapStyle={mapStyle}
      >
        <Camera
          ref={cameraRef}
          zoom={16}
          center={initialCenter ?? undefined}
        />

        {showRoute && routeFeature && (
          <GeoJSONSource
            id="route"
            data={routeFeature}
          >
            <Layer
              id="route-line"
              type="line"
              style={ROUTE_LINE_STYLE}
            />
          </GeoJSONSource>
        )}


        {/* DELIVERY */}
          {deliveryLocation && (
          <Marker
            anchor="center"
            lngLat={[
              deliveryLocation.longitude,
              deliveryLocation.latitude,
            ]}
          >
              <View style={styles.markerContainer}>
                <Image
                  source={require('../assets/images/delivery_location.png')}
                  style={styles.home}
                />
              </View>
          </Marker>
        )}

        {/* RIDER */}
        {showRider && currentRider?.latitude != null &&
          currentRider?.longitude != null && (
            <Marker
              anchor="center"
              lngLat={[
                currentRider.longitude,
                currentRider.latitude,
              ]}
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
                          { translateY: -15 },
                          {rotate: `${bearing}deg`}],
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
  width: 24,
  height: 24,
  resizeMode: 'contain',
  tintColor: Colors.primary
},
});