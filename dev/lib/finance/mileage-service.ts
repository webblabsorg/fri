import { prisma } from '@/lib/db'

// ============================================================================
// MILEAGE SERVICE
// IRS standard mileage rates and GPS capture support
// ============================================================================

// IRS standard mileage rates by year (dollars per mile)
// Source: https://www.irs.gov/tax-professionals/standard-mileage-rates
// 2025 rate announced December 2024: 70 cents per mile for business
const IRS_MILEAGE_RATES: Record<number, {
  business: number
  medical: number
  charity: number
}> = {
  2025: { business: 0.70, medical: 0.21, charity: 0.14 }, // IRS Notice 2024-XX (announced Dec 2024)
  2024: { business: 0.67, medical: 0.21, charity: 0.14 },
  2023: { business: 0.655, medical: 0.22, charity: 0.14 },
  2022: { business: 0.625, medical: 0.22, charity: 0.14 },
  2021: { business: 0.56, medical: 0.16, charity: 0.14 },
  2020: { business: 0.575, medical: 0.17, charity: 0.14 },
}

export type MileageType = 'business' | 'medical' | 'charity'

export interface MileageRate {
  year: number
  type: MileageType
  ratePerMile: number
  source: 'irs' | 'custom'
}

export interface GpsCoordinate {
  latitude: number
  longitude: number
  timestamp: Date
  accuracy?: number
}

export interface MileageTrip {
  startLocation: GpsCoordinate
  endLocation: GpsCoordinate
  waypoints?: GpsCoordinate[]
  distanceMiles: number
  durationMinutes?: number
  purpose?: string
}

/**
 * Get the current IRS mileage rate for a given year and type
 */
export function getIrsMileageRate(
  year?: number,
  type: MileageType = 'business'
): MileageRate {
  const targetYear = year || new Date().getFullYear()
  
  // Find the rate for the requested year, or fall back to most recent
  const availableYears = Object.keys(IRS_MILEAGE_RATES)
    .map(Number)
    .sort((a, b) => b - a)
  
  let rateYear = targetYear
  if (!IRS_MILEAGE_RATES[targetYear]) {
    // Use most recent available rate
    rateYear = availableYears[0]
  }
  
  const rates = IRS_MILEAGE_RATES[rateYear]
  
  return {
    year: rateYear,
    type,
    ratePerMile: rates[type],
    source: 'irs',
  }
}

/**
 * Get organization-specific mileage rate (custom or IRS default)
 */
export async function getOrganizationMileageRate(
  organizationId: string,
  year?: number,
  type: MileageType = 'business'
): Promise<MileageRate> {
  // Check for custom organization rate
  const customRate = await prisma.systemSetting.findFirst({
    where: {
      key: `mileageRate:${organizationId}:${type}`,
    },
  })
  
  if (customRate?.value) {
    try {
      const parsed = JSON.parse(customRate.value)
      return {
        year: parsed.year || new Date().getFullYear(),
        type,
        ratePerMile: parsed.rate,
        source: 'custom',
      }
    } catch {
      // Fall through to IRS rate
    }
  }
  
  return getIrsMileageRate(year, type)
}

/**
 * Set a custom mileage rate for an organization
 */
export async function setOrganizationMileageRate(
  organizationId: string,
  rate: number,
  type: MileageType = 'business'
): Promise<void> {
  const key = `mileageRate:${organizationId}:${type}`
  const value = JSON.stringify({
    rate,
    year: new Date().getFullYear(),
    updatedAt: new Date().toISOString(),
  })
  
  await prisma.systemSetting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  })
}

/**
 * Calculate mileage expense amount
 */
export function calculateMileageAmount(
  distanceMiles: number,
  ratePerMile: number
): number {
  return Math.round(distanceMiles * ratePerMile * 100) / 100
}

/**
 * Calculate distance between two GPS coordinates using Haversine formula
 */
export function calculateDistanceMiles(
  start: GpsCoordinate,
  end: GpsCoordinate
): number {
  const R = 3959 // Earth's radius in miles
  
  const lat1 = start.latitude * Math.PI / 180
  const lat2 = end.latitude * Math.PI / 180
  const deltaLat = (end.latitude - start.latitude) * Math.PI / 180
  const deltaLon = (end.longitude - start.longitude) * Math.PI / 180
  
  const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
            Math.cos(lat1) * Math.cos(lat2) *
            Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2)
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  
  return R * c
}

/**
 * Calculate total trip distance from waypoints
 */
export function calculateTripDistance(trip: MileageTrip): number {
  if (trip.distanceMiles > 0) {
    return trip.distanceMiles
  }
  
  const points = [
    trip.startLocation,
    ...(trip.waypoints || []),
    trip.endLocation,
  ]
  
  let totalDistance = 0
  for (let i = 0; i < points.length - 1; i++) {
    totalDistance += calculateDistanceMiles(points[i], points[i + 1])
  }
  
  return Math.round(totalDistance * 100) / 100
}

/**
 * Get all available IRS rates
 */
export function getAllIrsRates(): Record<number, typeof IRS_MILEAGE_RATES[number]> {
  return { ...IRS_MILEAGE_RATES }
}

/**
 * Validate GPS coordinates
 */
export function isValidGpsCoordinate(coord: GpsCoordinate): boolean {
  return (
    typeof coord.latitude === 'number' &&
    typeof coord.longitude === 'number' &&
    coord.latitude >= -90 &&
    coord.latitude <= 90 &&
    coord.longitude >= -180 &&
    coord.longitude <= 180
  )
}
