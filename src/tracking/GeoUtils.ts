import {LatLng} from './types';

export const calculateBearing = (
  start: LatLng,
  end: LatLng,
): number => {
  const lat1 = start.latitude * Math.PI / 180;
  const lon1 = start.longitude * Math.PI / 180;

  const lat2 = end.latitude * Math.PI / 180;
  const lon2 = end.longitude * Math.PI / 180;

  const dLon = lon2 - lon1;

  const y = Math.sin(dLon) * Math.cos(lat2);

  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) *
      Math.cos(lat2) *
      Math.cos(dLon);

  let bearing = Math.atan2(y, x);

  bearing = bearing * 180 / Math.PI;

  return (bearing + 360) % 360;
};