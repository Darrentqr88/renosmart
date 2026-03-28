/**
 * Geofencing utilities for worker auto check-in/check-out.
 * Uses Haversine formula to calculate distance between two GPS coordinates.
 */

const EARTH_RADIUS_METERS = 6_371_000;

function toRadians(deg: number): number {
  return (deg * Math.PI) / 180;
}

/**
 * Calculate distance in meters between two GPS coordinates using Haversine formula.
 */
export function haversineDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number,
): number {
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_METERS * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Check if a worker's GPS position is within a radius of the project site.
 * Default radius: 200 meters.
 */
export function isWithinRadius(
  workerLat: number, workerLng: number,
  siteLat: number, siteLng: number,
  radiusMeters = 200,
): { within: boolean; distance: number } {
  const distance = haversineDistance(workerLat, workerLng, siteLat, siteLng);
  return { within: distance <= radiusMeters, distance: Math.round(distance) };
}

/**
 * Start watching the worker's position for geofencing.
 * Returns a cleanup function to stop watching.
 */
export function watchGeofence(
  siteLat: number,
  siteLng: number,
  options: {
    radiusMeters?: number;
    onEnter?: (distance: number) => void;
    onLeave?: (distance: number) => void;
    onError?: (err: GeolocationPositionError) => void;
  },
): () => void {
  if (typeof navigator === 'undefined' || !navigator.geolocation) return () => {};

  const radius = options.radiusMeters ?? 200;
  let wasInside = false;

  const watchId = navigator.geolocation.watchPosition(
    (pos) => {
      const { within, distance } = isWithinRadius(
        pos.coords.latitude, pos.coords.longitude,
        siteLat, siteLng,
        radius,
      );
      if (within && !wasInside) {
        wasInside = true;
        options.onEnter?.(distance);
      } else if (!within && wasInside) {
        wasInside = false;
        options.onLeave?.(distance);
      }
    },
    (err) => options.onError?.(err),
    { enableHighAccuracy: true, maximumAge: 30_000, timeout: 15_000 },
  );

  return () => navigator.geolocation.clearWatch(watchId);
}
