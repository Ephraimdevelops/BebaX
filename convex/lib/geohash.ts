import ngeohash from "ngeohash";

/**
 * Encode a latitude and longitude into a geohash.
 * @param lat Latitude
 * @param lng Longitude
 * @param precision Precision (default 9 characters, ~5m error)
 */
export function encodeGeohash(lat: number, lng: number, precision: number = 9): string {
    return ngeohash.encode(lat, lng, precision);
}

/**
 * Decode a geohash into latitude and longitude.
 * @param hash Geohash string
 */
export function decodeGeohash(hash: string): { lat: number; lng: number; error: { lat: number; lng: number } } {
    const decoded = ngeohash.decode(hash);
    return {
        lat: decoded.latitude,
        lng: decoded.longitude,
        error: {
            lat: decoded.error.latitude,
            lng: decoded.error.longitude,
        },
    };
}

/**
 * Get neighboring geohashes for a given geohash.
 * Useful for finding items in adjacent grid cells.
 * @param hash Geohash string
 */
export function getNeighbors(hash: string): string[] {
    return ngeohash.neighbors(hash);
}

/**
 * Get the bounding box of a geohash.
 * @param hash Geohash string
 */
export function getBoundingBox(hash: string): [number, number, number, number] {
    return ngeohash.decode_bbox(hash);
}

/**
 * Calculate the geohash range for a given center and radius (approximate).
 * This is a simplified approach. For strict radius queries, you'd typically
 * query the center geohash and its neighbors, then filter by exact distance.
 */
export function getGeohashQueryArea(lat: number, lng: number, precision: number = 5): string[] {
    const centerHash = encodeGeohash(lat, lng, precision);
    const neighbors = getNeighbors(centerHash);
    return [centerHash, ...neighbors];
}
