/**
 * Haversine formula to compute great-circle distance between two coordinates in metres
 * SPEC §10.5 (F-ATT-02)
 */
export function calculateDistanceMetres(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth's radius in metres
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

/**
 * Checks if a given coordinate is within a campus geofence radius
 */
export function isWithinGeofence(
  userLat: number,
  userLng: number,
  campusLat: number,
  campusLng: number,
  radiusMetres = 200
): { within: boolean; distanceMetres: number } {
  const distance = calculateDistanceMetres(userLat, userLng, campusLat, campusLng);
  return {
    within: distance <= radiusMetres,
    distanceMetres: distance,
  };
}
