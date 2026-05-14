/**
 * Deterministic price calculator — same route/hotel always gives the same price,
 * but different inputs give meaningfully different realistic prices.
 */

/** Simple hash from a string → number 0–1 (deterministic) */
function seededRandom(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash % 10000) / 10000;
}

/** Known city tiers for realistic pricing */
const METRO_CITIES = ["mumbai", "delhi", "bangalore", "bengaluru", "chennai", "kolkata", "hyderabad", "pune"];
const TIER2_CITIES = ["jaipur", "ahmedabad", "surat", "lucknow", "kanpur", "nagpur", "indore", "bhopal", "patna", "ludhiana", "agra", "varanasi", "kochi", "cochin", "coimbatore", "chandigarh", "vizag", "visakhapatnam"];

function getCityTier(city: string): "metro" | "tier2" | "tier3" {
  const c = city.toLowerCase();
  if (METRO_CITIES.some((m) => c.includes(m))) return "metro";
  if (TIER2_CITIES.some((t) => c.includes(t))) return "tier2";
  return "tier3";
}

/**
 * Calculate a realistic one-way flight price per person (INR).
 * Varies by route. Range: ₹3,000 – ₹18,000.
 */
export function flightPricePerPerson(origin: string, destination: string): number {
  const seed = `flight:${origin.toLowerCase().trim()}:${destination.toLowerCase().trim()}`;
  const r = seededRandom(seed);

  const originTier = getCityTier(origin);
  const destTier = getCityTier(destination);

  // Metro↔Metro routes are competitive (cheaper); remote routes are expensive
  let base: number;
  if (originTier === "metro" && destTier === "metro") {
    base = 4500 + r * 5500; // ₹4,500 – ₹10,000
  } else if (originTier === "metro" || destTier === "metro") {
    base = 5500 + r * 6500; // ₹5,500 – ₹12,000
  } else {
    base = 7000 + r * 8000; // ₹7,000 – ₹15,000
  }

  // Round to nearest ₹50
  return Math.round(base / 50) * 50;
}

/**
 * Calculate a realistic one-way train price per person (INR).
 * Range: ₹500 – ₹3,500.
 */
export function trainPricePerPerson(origin: string, destination: string): number {
  const seed = `train:${origin.toLowerCase().trim()}:${destination.toLowerCase().trim()}`;
  const r = seededRandom(seed);

  const originTier = getCityTier(origin);
  const destTier = getCityTier(destination);

  let base: number;
  if (originTier === "metro" && destTier === "metro") {
    base = 800 + r * 1200; // ₹800 – ₹2,000
  } else if (originTier === "metro" || destTier === "metro") {
    base = 600 + r * 1600; // ₹600 – ₹2,200
  } else {
    base = 500 + r * 2500; // ₹500 – ₹3,000
  }

  return Math.round(base / 50) * 50;
}

/**
 * Calculate a realistic hotel price per night (INR).
 * Varies by destination tier and hotel name. Range: ₹1,200 – ₹12,000.
 */
export function hotelPricePerNight(hotelName: string, destination: string): number {
  const seed = `hotel:${hotelName.toLowerCase().trim()}:${destination.toLowerCase().trim()}`;
  const r = seededRandom(seed);
  const tier = getCityTier(destination);

  let base: number;
  if (tier === "metro") {
    base = 3500 + r * 8000; // ₹3,500 – ₹11,500
  } else if (tier === "tier2") {
    base = 2000 + r * 5000; // ₹2,000 – ₹7,000
  } else {
    base = 1200 + r * 3500; // ₹1,200 – ₹4,700
  }

  // If it's a luxury brand, push price up
  const luxuryKeywords = ["taj", "oberoi", "itc", "leela", "marriott", "hilton", "hyatt", "four seasons", "ritz", "radisson", "sheraton"];
  if (luxuryKeywords.some((k) => hotelName.toLowerCase().includes(k))) {
    base = base * 1.6;
  }

  return Math.round(base / 100) * 100;
}

/** Format price with commas for display */
export function formatINR(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}`;
}
