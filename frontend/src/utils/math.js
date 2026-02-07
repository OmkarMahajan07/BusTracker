/**
 * Calculates the distance between two geographical points using the Haversine formula.
 * @param {number} lat1 - Latitude of the first point
 * @param {number} lng1 - Longitude of the first point
 * @param {number} lat2 - Latitude of the second point
 * @param {number} lng2 - Longitude of the second point
 * @returns {number} Distance in kilometers
 */
export const getDistanceKm = (lat1, lng1, lat2, lng2) => {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
};

const deg2rad = (deg) => {
  return deg * (Math.PI / 180);
};
