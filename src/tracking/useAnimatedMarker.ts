import {useState, useCallback, useRef} from 'react';
import {LatLng} from './types';
import {calculateBearing} from './GeoUtils';

export default function useAnimatedMarker() {

  const [animatedLocation, setAnimatedLocation] =
    useState<LatLng | null>(null);

  const [bearing, setBearing] = useState(0);
  const animatedLocationRef = useRef<LatLng | null>(null);
  const animationTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const animateTo = useCallback((target: LatLng) => {
    const currentLocation = animatedLocationRef.current;

    if (
      currentLocation &&
      currentLocation.latitude === target.latitude &&
      currentLocation.longitude === target.longitude
    ) {
      return;
    }

    if (!currentLocation) {
      animatedLocationRef.current = target;
      setAnimatedLocation(target);
      return;
    }

    const start = currentLocation;
    setBearing(calculateBearing(start, target));

    if (animationTimer.current) {
      clearInterval(animationTimer.current);
      animationTimer.current = null;
    }

    const frames = 40;
    const latStep = (target.latitude - start.latitude) / frames;
    const lngStep = (target.longitude - start.longitude) / frames;
    let current = 0;

    animationTimer.current = setInterval(() => {
      current += 1;

      setAnimatedLocation(prev => {
        const position = prev ?? start;
        const next = {
          latitude: position.latitude + latStep,
          longitude: position.longitude + lngStep,
        };
        animatedLocationRef.current = next;
        return next;
      });

      if (current >= frames && animationTimer.current) {
        clearInterval(animationTimer.current);
        animationTimer.current = null;
      }
    }, 40);
  }, []);

  return {
    animatedLocation,
    animateTo,
    bearing,
  };
}