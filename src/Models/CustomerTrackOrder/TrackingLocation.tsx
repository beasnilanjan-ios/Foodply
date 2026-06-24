export interface TrackingLocation {
  id: number;
  deliveryId: number;
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
  recordedAt: string;
}