import { describe, it, expect } from "vitest";
import { calculateDistanceMetres, isWithinGeofence } from "@/lib/geo/haversine";
import { isIpInRanges } from "@/lib/geo/ip";

describe("Geofence & IP Verification (F-ATT-02)", () => {
  it("computes accurate distance in metres between two points", () => {
    // SMRU Campus coordinates vs nearby location (~150m away)
    const lat1 = 16.3067;
    const lon1 = 80.4365;
    const lat2 = 16.3075;
    const lon2 = 80.4372;

    const distance = calculateDistanceMetres(lat1, lon1, lat2, lon2);
    expect(distance).toBeGreaterThan(50);
    expect(distance).toBeLessThan(250);
  });

  it("identifies when location is within campus geofence", () => {
    const campusLat = 16.3067;
    const campusLng = 80.4365;

    // Within 200m
    const res1 = isWithinGeofence(16.3070, 80.4367, campusLat, campusLng, 200);
    expect(res1.within).toBe(true);

    // Far away (several km)
    const res2 = isWithinGeofence(16.3500, 80.5000, campusLat, campusLng, 200);
    expect(res2.within).toBe(false);
  });

  it("verifies IPv4 and IPv6 CIDR subnet matching", () => {
    const officeRanges = ["103.21.44.0/24", "192.168.1.0/24", "127.0.0.1/32"];

    // In subnet
    expect(isIpInRanges("103.21.44.15", officeRanges)).toBe(true);
    expect(isIpInRanges("192.168.1.50", officeRanges)).toBe(true);
    expect(isIpInRanges("127.0.0.1", officeRanges)).toBe(true);

    // Out of subnet
    expect(isIpInRanges("103.21.45.10", officeRanges)).toBe(false);
    expect(isIpInRanges("8.8.8.8", officeRanges)).toBe(false);
  });
});
