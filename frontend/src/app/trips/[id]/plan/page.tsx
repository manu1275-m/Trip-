"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Navigation from "@/components/Navigation";
import Link from "next/link";
import axios from "axios";
import { useRouter } from "next/navigation";
import { hotelPricePerNight, flightPricePerPerson, trainPricePerPerson, formatINR } from "@/lib/pricing";

// ─── Types ──────────────────────────────────────────────────────────────────
interface Place { name: string; description?: string; restaurant_name?: string; restaurant_map_link?: string; }
interface DayData { places?: Place[]; stay?: string; [key: string]: any; }
interface ParsedPlan { [key: string]: DayData; }

// ─── Mock hotel details (used when tapping a stay name) ────────────────────────
const HOTEL_REVIEW_POOL = [
  "Excellent location right in the heart of the city. Rooms are spacious, clean, and the staff is incredibly attentive. Breakfast is outstanding!",
  "Fantastic property with world-class amenities. The pool area and spa are top notch. Would highly recommend for a luxury stay.",
  "Perfect base for exploring the city. Check-in was seamless and the room had a stunning view. Great value for money.",
  "Loved the heritage architecture combined with modern comforts. The restaurant serves amazing local cuisine. Will definitely return.",
  "Superb hospitality from start to finish. The rooftop lounge is a highlight. Ideal for both business and leisure travellers.",
  "Very well-maintained property. Quiet rooms despite being centrally located. The concierge helped plan our entire itinerary.",
];

function getHotelReviews(name: string): string[] {
  // Pick 3 deterministic reviews based on hotel name
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash << 5) - hash + name.charCodeAt(i);
  const idx = Math.abs(hash) % HOTEL_REVIEW_POOL.length;
  return [
    HOTEL_REVIEW_POOL[idx % HOTEL_REVIEW_POOL.length],
    HOTEL_REVIEW_POOL[(idx + 2) % HOTEL_REVIEW_POOL.length],
    HOTEL_REVIEW_POOL[(idx + 4) % HOTEL_REVIEW_POOL.length],
  ];
}

function getHotelRating(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash << 5) - hash + name.charCodeAt(i);
  return parseFloat((3.6 + (Math.abs(hash) % 14) / 10).toFixed(1));
}

function getHotelInfo(name: string, destination: string) {
  return {
    price: formatINR(hotelPricePerNight(name, destination)),
    rating: getHotelRating(name),
    reviews: getHotelReviews(name),
  };
}

// ─── PlaceCard ───────────────────────────────────────────────────────────────
function PlaceCard({ place, destination }: { place: Place; destination: string }) {
  const [imageUrl, setImageUrl] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  useEffect(() => {
    axios
      .get(`http://127.0.0.1:8000/api/images/search?query=${encodeURIComponent(`${place.name} ${destination}`)}`)
      .then((r) => setImageUrl(r.data.url))
      .catch(() => setImageUrl("https://images.pexels.com/photos/1371360/pexels-photo-1371360.jpeg?auto=compress&cs=tinysrgb&w=800"));
  }, [place.name, destination]);

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${place.name} ${destination}`)}`;

  return (
    <div className={`group rounded-2xl overflow-hidden transition-all duration-500 shadow-lg cursor-pointer ${expanded ? 'border border-amber-500/60 shadow-amber-500/20 shadow-xl scale-[1.015]' : 'border border-white/10 hover:border-amber-500/50 hover:shadow-amber-500/10 hover:shadow-xl hover:-translate-y-1'}`}>
      {/* Fixed-height image — always 200px */}
      <div
        className="relative overflow-hidden"
        style={{ height: "300px" }}
        onClick={() => setExpanded(!expanded)}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={place.name}
            onLoad={() => setImgLoaded(true)}
            className={`w-full h-full object-cover transition-all duration-[1200ms] group-hover:scale-[1.12] group-hover:brightness-110 ${imgLoaded ? "opacity-100" : "opacity-0"}`}
          />
        ) : (
          <div className="w-full h-full bg-zinc-800 animate-pulse" />
        )}
        {/* Gradient overlay — slightly lighter on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent group-hover:via-black/10 transition-all duration-500" />

        {/* Shimmer sweep on hover — a white diagonal glint that moves across */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none overflow-hidden">
          <div
            className="absolute top-0 left-[-75%] w-1/2 h-full bg-gradient-to-r from-transparent via-white/15 to-transparent skew-x-[-20deg]"
            style={{ animation: "shimmer 0.9s ease forwards" }}
          />
        </div>

        {/* Top amber shine bar — slides in on hover */}
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-amber-400 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />

        {/* Place name pinned to bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-5">
          <h4 className="text-white font-bold text-lg drop-shadow-lg leading-snug group-hover:text-amber-400 transition-colors duration-300">{place.name}</h4>
        </div>
      </div>

      {/* Expanded section */}
      <div
        className="overflow-hidden bg-white/[0.02]"
        style={{ maxHeight: expanded ? "800px" : "0px", transition: "max-height 0.6s cubic-bezier(0.4, 0, 0.2, 1)" }}
      >
        <div className="p-6 border-t border-white/5 space-y-4">
          {place.description ? (
            <p className="text-gray-300 text-sm leading-[1.8]">
              {place.description}
            </p>
          ) : (
            <p className="text-gray-500 text-sm italic">No description available for this place.</p>
          )}

          {/* Restaurant Suggestion */}
          {place.restaurant_name && place.restaurant_map_link && (
            <div className="mt-4 p-4 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-orange-400 mb-1">Nearby Restaurant</p>
                <p className="text-white font-semibold text-sm">{place.restaurant_name}</p>
                <p className="text-gray-400 text-xs mt-0.5">Within 1.5 km</p>
              </div>
              <a
                href={place.restaurant_map_link}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-xl bg-orange-500 hover:bg-orange-400 text-black shadow-lg transition-transform hover:scale-110 active:scale-95"
                title="View Restaurant on Maps"
              >
                <span className="text-lg">🍽️</span>
              </a>
            </div>
          )}

          {/* Map Link symbol — Location Arrow */}
          <div className="flex justify-end pt-2">
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="View Location"
              className="w-12 h-12 flex items-center justify-center rounded-2xl bg-amber-500 hover:bg-amber-400 text-black shadow-lg shadow-amber-500/20 transition-all hover:scale-110 active:scale-95 group/map"
            >
              <span className="text-2xl transform group-hover/map:translate-x-0.5 group-hover/map:-translate-y-0.5 transition-transform">➤</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── StayCard ───────────────────────────────────────────────────────────────
function StayCard({
  name, destination, isBooked, booking, tripId, isCompleted
}: {
  name: string; destination: string; isBooked: boolean;
  booking: any; tripId: string; isCompleted?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const info = getHotelInfo(name, destination);

  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 hover:border-green-500/40 transition-all duration-300 shadow-lg overflow-hidden">
      {/* Clickable name row — no image */}
      <div
        className="cursor-pointer flex items-center justify-between px-5 py-4 gap-4 hover:bg-white/5 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-green-400 text-xl flex-shrink-0">🏨</span>
          <span className="text-white font-semibold text-base truncate">{name}</span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {isBooked && (
            <span className="text-[10px] font-bold bg-green-500/20 text-green-400 px-2 py-1 rounded-full border border-green-500/30">✅ Booked</span>
          )}
          <span className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-gray-400 text-xs font-bold transition-transform" style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.3s ease" }}>
            ▼
          </span>
        </div>
      </div>

      {/* Expanded details */}
      <div
        className="overflow-hidden"
        style={{ maxHeight: expanded ? "500px" : "0px", transition: "max-height 0.4s ease" }}
      >
        <div className="p-5 space-y-4 border-t border-white/5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-white">{info.price}</p>
              <p className="text-xs text-gray-400">per night · taxes included</p>
            </div>
            <div className="flex items-center gap-1.5 bg-amber-500/20 px-3 py-2 rounded-xl border border-amber-500/30">
              <span className="text-amber-400 text-lg">★</span>
              <span className="font-bold text-amber-400 text-lg">{info.rating}</span>
              <span className="text-gray-400 text-xs">/5</span>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Guest Reviews</p>
            {info.reviews.map((r, i) => (
              <div key={i} className="flex gap-3 bg-white/5 rounded-xl p-3 border border-white/5">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                  {String.fromCharCode(65 + i)}
                </div>
                <p className="text-gray-300 text-sm leading-relaxed">{r}</p>
              </div>
            ))}
          </div>

          {isBooked ? (
            <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-3 text-center">
              <p className="text-green-400 font-bold text-sm">✅ Booked · PNR: {booking?.pnr}</p>
            </div>
          ) : isCompleted ? (
            <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
              <p className="text-gray-400 font-medium text-sm">Booking closed (Trip completed)</p>
            </div>
          ) : (
            <Link
              href={`/trips/${tripId}/hotels`}
              className="block w-full text-center bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-green-600/20 active:scale-[0.98] transition-all"
            >
              Book This Stay
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AITripPlan({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [trip, setTrip] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeDay, setActiveDay] = useState(0);
  const dayRefs = useRef<(HTMLDivElement | null)[]>([]);

  const fetchTrip = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/auth/login"); return; }
    try {
      const res = await axios.get(`http://127.0.0.1:8000/api/trips/${params.id}?t=${Date.now()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTrip(res.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to fetch trip details.");
    } finally {
      setLoading(false);
    }
  }, [params.id, router]);

  useEffect(() => {
    fetchTrip();
  }, [fetchTrip]);

  // Re-fetch whenever the user navigates back to this tab (e.g. after booking transport/hotels)
  useEffect(() => {
    const onFocus = () => fetchTrip();
    const onVisible = () => { if (document.visibilityState === "visible") fetchTrip(); };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [fetchTrip]);

  const getBooking = (name: string) => {
    if (!trip?.bookings) return null;
    const t = name.trim().toLowerCase();
    // 1. Match by key name
    const keyMatch = Object.keys(trip.bookings).find((k) => {
      const kk = k.trim().toLowerCase();
      return kk === t || kk.includes(t) || t.includes(kk);
    });
    if (keyMatch) return trip.bookings[keyMatch];
    // 2. Match by item_name field inside the booking value
    const valueMatch = Object.values(trip.bookings).find((b: any) => {
      const bName = (b?.item_name || "").trim().toLowerCase();
      return bName === t || bName.includes(t) || t.includes(bName);
    });
    return valueMatch || null;
  };

  // Check if ANY transport (flight/train) is booked for this trip
  const getTransportBooking = () => {
    if (!trip?.bookings) return null;
    return Object.values(trip.bookings).find((b: any) =>
      b?.type === 'Flight' || b?.type === 'Train' || b?.type === 'Transport'
    ) || null;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[#09090b]">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-amber-500/20 border-t-amber-500 animate-spin" />
          <div className="absolute inset-2 rounded-full border-4 border-blue-500/20 border-b-blue-500 animate-spin animation-delay-300" style={{ animationDirection: "reverse" }} />
        </div>
        <p className="text-gray-400 text-sm animate-pulse">AI Agents assembling your itinerary...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-panel p-8 text-center max-w-md">
          <div className="text-red-400 text-4xl mb-4">⚠️</div>
          <p className="text-red-400 mb-4">{error}</p>
          <Link href="/dashboard" className="text-amber-400 hover:underline font-medium">← Back to Dashboard</Link>
        </div>
      </div>
    );
  }

  // Parse plan
  let parsedPlan: ParsedPlan | null = null;
  try {
    if (typeof trip?.raw_plan === "object") {
      parsedPlan = trip.raw_plan;
    } else if (trip?.raw_plan) {
      const match = trip.raw_plan.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      parsedPlan = JSON.parse(match ? match[1] : trip.raw_plan);
    }
  } catch (_) {}

  const days = parsedPlan
    ? Object.keys(parsedPlan)
        .filter((k) => /day/i.test(k))
        .sort((a, b) => (parseInt(a.replace(/\D/g, "")) || 0) - (parseInt(b.replace(/\D/g, "")) || 0))
    : [];

  const allStays = days.map((d) => parsedPlan![d]?.stay).filter(Boolean) as string[];
  const uniqueStays = [...new Set(allStays)];

  // ── Smart stay logic ─────────────────────────────────────────────────────
  // Count how many nights each unique stay is used
  const stayNightsMap = new Map<string, number>();
  allStays.forEach((stay) => stayNightsMap.set(stay, (stayNightsMap.get(stay) || 0) + 1));

  // Collect all place names across all days
  const allPlaceWords = days.flatMap((d) =>
    (parsedPlan![d]?.places || []).map((p: Place) =>
      p.name.split(/[,\s]+/)[0].toLowerCase()
    )
  );
  const distinctPlaceWords = new Set(allPlaceWords);

  // Heuristic: if all days share same stay hotel OR place first-words are ≤3 distinct → single stay
  // Multi-stay: AI gave different hotel names per day-cluster OR places span 4+ distinct root words
  const isSingleStay = uniqueStays.length === 1 || (
    uniqueStays.length <= 2 && distinctPlaceWords.size <= 4
  );
  const isMultiStay = !isSingleStay && uniqueStays.length > 1;

  const transportBooked = getTransportBooking();
  const hasTransportBooking = !!transportBooked;

  const isTripCompleted = (t: any) => {
    if (!t?.request?.travel_date || !t?.request?.number_of_days) return false;
    try {
      const startDate = new Date(t.request.travel_date);
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + parseInt(t.request.number_of_days));
      if (isNaN(endDate.getTime())) return false;
      return new Date() > endDate;
    } catch {
      return false;
    }
  };
  const isCompleted = isTripCompleted(trip);

  const scrollToDay = (idx: number) => {
    setActiveDay(idx);
    dayRefs.current[idx]?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // ── Per-day real date helpers ─────────────────────────────────────────────
  const getTripStartDate = (): Date | null => {
    if (!trip?.request?.travel_date) return null;
    const d = new Date(trip.request.travel_date);
    return isNaN(d.getTime()) ? null : d;
  };

  const getDayDate = (dayIndex: number): Date | null => {
    const start = getTripStartDate();
    if (!start) return null;
    const d = new Date(start);
    d.setDate(start.getDate() + dayIndex);
    return d;
  };

  const isDayCompleted = (dayIndex: number): boolean => {
    const dayDate = getDayDate(dayIndex);
    if (!dayDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    dayDate.setHours(0, 0, 0, 0);
    return today > dayDate;
  };

  const isDayToday = (dayIndex: number): boolean => {
    const dayDate = getDayDate(dayIndex);
    if (!dayDate) return false;
    const today = new Date();
    return (
      today.getDate() === dayDate.getDate() &&
      today.getMonth() === dayDate.getMonth() &&
      today.getFullYear() === dayDate.getFullYear()
    );
  };

  const formatDayDate = (dayIndex: number): string => {
    const d = getDayDate(dayIndex);
    if (!d) return "";
    return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
  };

  // Return booking check
  const returnBooked = Object.values(trip?.bookings || {}).find((b: any) =>
    b.type === 'Flight-Return' || b.type === 'Train-Return'
  );

  return (
    <div className="flex flex-col min-h-screen bg-[#09090b]">
      <Navigation />

      {/* Hero header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-600/20 via-transparent to-blue-900/20 pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 pt-10 pb-8 relative">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="text-xs font-bold uppercase tracking-widest text-amber-400 bg-amber-500/10 px-3 py-1.5 rounded-full border border-amber-500/20">
              🤖 AI Generated
            </span>
            {isCompleted ? (
              <span className="text-xs font-bold bg-gray-500/20 text-gray-400 px-3 py-1.5 rounded-full border border-gray-500/30">
                🏁 Trip Completed
              </span>
            ) : transportBooked ? (
              <span className="text-xs font-bold bg-blue-500/20 text-blue-400 px-3 py-1.5 rounded-full border border-blue-500/30">
                ✈️ Transport Booked · {transportBooked.pnr}
              </span>
            ) : (
              <Link href={`/trips/${params.id}/transport`} className="text-xs font-bold bg-orange-500/20 text-orange-400 px-3 py-1.5 rounded-full border border-orange-500/30 hover:bg-orange-500/30 transition-colors">
                🚀 Book Transport
              </Link>
            )}
            {!isCompleted && (
              <Link href={`/trips/${params.id}/live`} className="text-xs font-bold bg-green-500/15 hover:bg-green-500/25 text-green-400 px-3 py-1.5 rounded-full border border-green-500/20 transition-colors flex items-center gap-1.5">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" /> Live Updates (Weather & Traffic)
              </Link>
            )}
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-2 tracking-tight">
            Your Journey
          </h1>
          <p className="text-2xl font-semibold bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
            {trip?.request?.current_location} → {trip?.request?.destination}
          </p>
          <p className="text-gray-400 mt-2 text-sm">
            {trip?.request?.travel_date && `Departing ${trip.request.travel_date} · `}
            {days.length} days · {allStays.length} nights
          </p>
        </div>
      </div>

      {/* ── Sticky Day Tab Bar ─────────────────────────────────────────────── */}
      {days.length > 1 && (
        <div className="sticky top-16 z-40 bg-[#09090b]/95 backdrop-blur-xl border-b border-white/5 shadow-lg shadow-black/20">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex gap-1 overflow-x-auto py-2.5 scrollbar-hide">
              {days.map((d, i) => {
                const dayNum = d.replace(/\D/g, "");
                const firstPlace = parsedPlan?.[d]?.places?.[0]?.name;
                return (
                  <button
                    key={d}
                    onClick={() => scrollToDay(i)}
                    className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                      activeDay === i
                        ? "bg-amber-500 text-black shadow-lg shadow-amber-500/30"
                        : "text-gray-400 hover:text-white hover:bg-white/8"
                    }`}
                  >
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-extrabold flex-shrink-0 ${
                      activeDay === i ? "bg-black/20 text-black" : "bg-white/10 text-gray-300"
                    }`}>{dayNum}</span>
                    <span className="hidden sm:block">
                      {firstPlace ? firstPlace.split(" ").slice(0, 2).join(" ") : `Day ${dayNum}`}
                    </span>
                    <span className="sm:hidden">D{dayNum}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 max-w-7xl mx-auto px-4 pb-16 w-full">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* ── Sidebar ─────────────────────────────────────────────────────── */}
          <aside className="lg:w-64 flex-shrink-0">
            <div className="sticky top-24 space-y-3">
              {/* Day navigator */}
              {days.length > 0 && (
                <div className="glass-panel p-4">
                  <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">Jump to Day</p>
                  <div className="space-y-1">
                    {days.map((d, i) => (
                      <button
                        key={d}
                        onClick={() => scrollToDay(i)}
                        className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                          activeDay === i
                            ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                            : "text-gray-400 hover:text-white hover:bg-white/5"
                        }`}
                      >
                        Day {d.replace(/\D/g, "")}
                        {parsedPlan?.[d]?.places?.[0] && (
                          <span className="block text-[10px] text-gray-500 mt-0.5 truncate">
                            {parsedPlan[d].places![0].name}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick actions */}
              <Link
                href={`/trips/${params.id}/live`}
                className="block w-full text-center bg-amber-500 hover:bg-amber-400 text-black font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-amber-500/20 hover:scale-[1.02] active:scale-[0.98]"
              >
                🚀 Live Journey
              </Link>
              <Link
                href={`/trips/${params.id}/transport`}
                className="block w-full text-center bg-white/5 hover:bg-white/10 text-white font-medium py-3 rounded-xl border border-white/10 transition-all text-sm"
              >
                ✈️ Transport
              </Link>
              <Link
                href={`/trips/${params.id}/hotels`}
                className="block w-full text-center bg-white/5 hover:bg-white/10 text-white font-medium py-3 rounded-xl border border-white/10 transition-all text-sm"
              >
                🏨 Book Hotels
              </Link>

              {/* AI explanation */}
              {trip?.ai_explanation && (
                <div className="glass-panel p-4">
                  <p className="text-xs font-bold uppercase tracking-widest text-green-400 mb-2">AI Insight</p>
                  <p className="text-gray-400 text-xs leading-relaxed">{trip.ai_explanation}</p>
                </div>
              )}
            </div>
          </aside>

          {/* ── Main content ─────────────────────────────────────────────────── */}
          <div className="flex-1 min-w-0 space-y-6 pt-2">
            {days.length === 0 && !parsedPlan && (
              <div className="glass-panel p-12 text-center">
                <div className="text-5xl mb-4">🗺️</div>
                <p className="text-gray-400">Your itinerary is still being assembled by the AI agents.</p>
              </div>
            )}

            {days.map((dayKey, idx) => {
              const dayData = parsedPlan![dayKey];
              const dayNum = dayKey.replace(/\D/g, "");
              const previousStay = idx > 0 ? parsedPlan![days[idx - 1]]?.stay : null;
              const showStay = dayData.stay && !isSingleStay && dayData.stay !== previousStay;
              const extras = Object.keys(dayData).filter((k) => k !== "places" && k !== "stay");
              const dayCompleted = isDayCompleted(idx);
              const dayIsToday = isDayToday(idx);
              const dayDateStr = formatDayDate(idx);

              return (
                <div
                  key={dayKey}
                  ref={(el) => { dayRefs.current[idx] = el; }}
                  className="relative"
                >
                  {/* Day pill */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-full border ${
                      dayCompleted
                        ? 'bg-green-500/10 border-green-500/30'
                        : dayIsToday
                        ? 'bg-amber-500/20 border-amber-500/30'
                        : 'bg-gradient-to-r from-amber-500/20 to-orange-500/10 border-amber-500/20'
                    }`}>
                      <span className={`w-7 h-7 rounded-full flex items-center justify-center font-extrabold text-sm ${
                        dayCompleted ? 'bg-green-500 text-white' : dayIsToday ? 'bg-amber-500 text-black' : 'bg-amber-500 text-black'
                      }`}>
                        {dayCompleted ? '✓' : dayNum}
                      </span>
                      <span className="text-white font-bold">Day {dayNum}</span>
                      {dayDateStr && <span className="text-xs text-gray-400 hidden sm:block">· {dayDateStr}</span>}
                      {dayCompleted && <span className="text-xs font-bold text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full">Completed</span>}
                      {dayIsToday && <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full animate-pulse">Today</span>}
                    </div>
                    <div className="flex-1 h-px bg-gradient-to-r from-amber-500/20 to-transparent" />
                  </div>

                  {/* Completed overlay for past days */}
                  <div className={`space-y-4 relative ${ dayCompleted ? 'opacity-70' : '' }`}>
                    {/* Places */}
                    {dayData.places && dayData.places.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-blue-400 text-lg">📍</span>
                          <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Places to Visit</span>
                        </div>
                        <div className="space-y-4">
                          {dayData.places.map((place: Place, pi: number) => (
                            <PlaceCard key={pi} place={place} destination={trip?.request?.destination || ""} />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Stay */}
                    {showStay && dayData.stay && (
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-green-400 text-lg">🏨</span>
                          <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Tonight's Stay</span>
                        </div>
                        <StayCard
                          name={dayData.stay}
                          destination={trip?.request?.destination || ""}
                          isBooked={!!getBooking(dayData.stay)}
                          booking={getBooking(dayData.stay)}
                          tripId={params.id}
                        />
                      </div>
                    )}

                    {/* Extras */}
                    {extras.map((k) => (
                      <div key={k} className="glass-panel p-4">
                        <p className="text-xs font-bold uppercase tracking-widest text-purple-400 mb-2 flex items-center gap-2">
                          <span>✨</span>{k.replace(/_/g, " ")}
                        </p>
                        <p className="text-gray-300 text-sm leading-relaxed">
                          {typeof dayData[k] === "object"
                            ? JSON.stringify(dayData[k], null, 2)
                            : String(dayData[k])}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {/* ── Stay section: single stay OR multi-stay ── */}
            {isSingleStay && uniqueStays[0] && (
              <div className="mt-2">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 px-4 py-2 rounded-full">
                    <span className="text-green-400 text-lg">🏨</span>
                    <span className="text-white font-bold">Trip Accommodation</span>
                  </div>
                  <div className="flex-1 h-px bg-gradient-to-r from-green-500/20 to-transparent" />
                </div>
                <StayCard
                  name={uniqueStays[0]}
                  destination={trip?.request?.destination || ""}
                  isBooked={!!getBooking(uniqueStays[0])}
                  booking={getBooking(uniqueStays[0])}
                  tripId={params.id}
                  isCompleted={isCompleted}
                />
                <p className="text-center text-xs text-gray-500 mt-2">Same hotel throughout your trip</p>
              </div>
            )}

            {isMultiStay && (
              <div className="mt-4 space-y-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 px-4 py-2 rounded-full">
                    <span className="text-blue-400 text-lg">🏨</span>
                    <span className="text-white font-bold">Multi-City Stays</span>
                  </div>
                  <div className="flex-1 h-px bg-gradient-to-r from-blue-500/20 to-transparent" />
                </div>
                <p className="text-xs text-gray-500 -mt-2 mb-3">
                  Your itinerary spans multiple areas — different hotels recommended per location.
                </p>
                {uniqueStays.map((stay, si) => {
                  const nights = stayNightsMap.get(stay) || 1;
                  // Find which days use this stay to show day range label
                  const stayDayIdxs = days
                    .map((d, i) => (parsedPlan![d]?.stay === stay ? i + 1 : null))
                    .filter(Boolean) as number[];
                  const label = stayDayIdxs.length > 1
                    ? `Days ${stayDayIdxs[0]}–${stayDayIdxs[stayDayIdxs.length - 1]}`
                    : `Day ${stayDayIdxs[0]}`;
                  return (
                    <div key={stay} className="rounded-2xl border border-white/8 bg-white/[0.02] overflow-hidden">
                      <div className="flex items-center justify-between px-4 py-2 bg-blue-500/8 border-b border-blue-500/10">
                        <span className="text-xs font-bold text-blue-400">{label}</span>
                        <span className="text-xs text-gray-500">{nights} night{nights > 1 ? "s" : ""}</span>
                      </div>
                      <div className="p-3">
                        <StayCard
                          name={stay}
                          destination={trip?.request?.destination || ""}
                          isBooked={!!getBooking(stay)}
                          booking={getBooking(stay)}
                          tripId={params.id}
                          isCompleted={isCompleted}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── Return Journey ─────────────────────────────────────────────── */}
            {!isCompleted && (
              <div className="mt-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 px-4 py-2 rounded-full">
                    <span className="text-purple-400 text-lg">🔄</span>
                    <span className="text-white font-bold">Return Journey</span>
                  </div>
                  <div className="flex-1 h-px bg-gradient-to-r from-purple-500/20 to-transparent" />
                </div>
                <div className={`relative rounded-2xl border overflow-hidden transition-all ${returnBooked ? 'border-purple-500/40 bg-purple-500/5' : 'border-white/10 bg-white/[0.02] hover:border-purple-500/30'}`}>
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-purple-400 to-purple-600 rounded-l-2xl" />
                  <div className="pl-6 pr-6 py-6 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 rounded-2xl bg-purple-500/15 border border-purple-500/20 flex items-center justify-center text-2xl flex-shrink-0">🏠</div>
                      <div>
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                          Return Home
                          {returnBooked && <span className="text-xs font-bold bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full border border-purple-500/30">BOOKED</span>}
                        </h3>
                        <p className="text-sm text-gray-500 mt-0.5">{trip?.request?.destination} → {trip?.request?.current_location}</p>
                        {trip?.request?.travel_date && trip?.request?.number_of_days && (
                          <p className="text-xs text-purple-400 mt-1">
                            Return: {new Date(new Date(trip.request.travel_date).getTime() + parseInt(trip.request.number_of_days) * 86400000).toLocaleDateString("en-IN", {weekday:"short", day:"numeric", month:"long", year:"numeric"})}
                          </p>
                        )}
                        {returnBooked && <p className="text-xs text-gray-500 font-mono mt-1">PNR: {(returnBooked as any).pnr}</p>}
                      </div>
                    </div>
                    {returnBooked ? (
                      <div className="flex items-center gap-2 bg-green-500/15 border border-green-500/30 text-green-400 px-5 py-3 rounded-xl font-bold text-sm flex-shrink-0">✅ Confirmed</div>
                    ) : (
                      <Link href={`/trips/${params.id}/return-transport`} className="bg-purple-600 hover:bg-purple-500 active:scale-[0.97] text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-purple-600/20 transition-all text-sm flex-shrink-0">
                        Book Return →
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Bottom CTA strip */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
              <Link
                href={`/trips/${params.id}/transport`}
                className="flex flex-col items-center justify-center gap-1 glass-panel p-5 hover:border-blue-500/40 transition-all group"
              >
                <span className="text-3xl group-hover:scale-110 transition-transform">✈️</span>
                <span className="text-white font-bold text-sm">Transport</span>
                <span className="text-gray-400 text-xs">Book flights or trains</span>
              </Link>
              <Link
                href={`/trips/${params.id}/hotels`}
                className="flex flex-col items-center justify-center gap-1 glass-panel p-5 hover:border-green-500/40 transition-all group"
              >
                <span className="text-3xl group-hover:scale-110 transition-transform">🏨</span>
                <span className="text-white font-bold text-sm">Hotels</span>
                <span className="text-gray-400 text-xs">View & book stays</span>
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* ── Estimated Budget Section ────────────────────────────────────────── */}
      {(() => {
        const origin      = trip?.request?.current_location || "";
        const destination = trip?.request?.destination || "";
        const numDays     = days.length || parseInt(trip?.request?.number_of_days) || 1;
        const numNights   = Math.max(numDays - 1, 1);
        const travelers   = Math.max((trip?.request?.travelers?.length) || 1, 1);

        // Transport range
        const flightBase  = flightPricePerPerson(origin, destination);
        const trainBase   = trainPricePerPerson(origin, destination);
        const transportMin = trainBase * travelers;
        const transportMax = flightBase * travelers;

        // Hotel range — per unique stay × actual nights spent at that stay
        let hotelMin = 0, hotelMax = 0;
        if (uniqueStays.length > 0) {
          uniqueStays.forEach((stay) => {
            const nightsHere = stayNightsMap.get(stay) || 1;
            const price = hotelPricePerNight(stay, destination);
            hotelMin += Math.round(price * 0.8) * nightsHere;
            hotelMax += price * nightsHere;
          });
        } else {
          hotelMin = 1500 * numNights;
          hotelMax = 5000 * numNights;
        }

        // Meals: ₹400–800 per person per day
        const mealsMin = 400 * travelers * numDays;
        const mealsMax = 800 * travelers * numDays;

        // Activities: ₹500–1500 per person per day
        const actMin = 500 * travelers * numDays;
        const actMax = 1500 * travelers * numDays;

        // Miscellaneous (10% buffer)
        const miscMin = Math.round((transportMin + hotelMin + mealsMin + actMin) * 0.08);
        const miscMax = Math.round((transportMax + hotelMax + mealsMax + actMax) * 0.1);

        const totalMin = transportMin + hotelMin + mealsMin + actMin + miscMin;
        const totalMax = transportMax + hotelMax + mealsMax + actMax + miscMax;

        const categories = [
          { icon: "✈️", label: "Transport",   min: transportMin, max: transportMax, color: "blue" },
          { icon: "🏨", label: "Stay",        min: hotelMin,     max: hotelMax,     color: "green" },
          { icon: "🍽️", label: "Meals",       min: mealsMin,     max: mealsMax,     color: "orange" },
          { icon: "🎟️", label: "Activities",  min: actMin,       max: actMax,       color: "purple" },
          { icon: "🎒", label: "Misc & Tips", min: miscMin,      max: miscMax,      color: "gray" },
        ];

        const catColors: Record<string, string> = {
          blue:   "bg-blue-500/10 border-blue-500/20 text-blue-400",
          green:  "bg-green-500/10 border-green-500/20 text-green-400",
          orange: "bg-orange-500/10 border-orange-500/20 text-orange-400",
          purple: "bg-purple-500/10 border-purple-500/20 text-purple-400",
          gray:   "bg-white/5 border-white/10 text-gray-400",
        };

        return (
          <section className="max-w-7xl mx-auto px-4 pb-16 w-full mt-2">
            <div className="rounded-3xl border border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-orange-500/5 overflow-hidden">
              {/* Header */}
              <div className="px-6 pt-6 pb-4 border-b border-white/5 flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 bg-amber-500/15 border border-amber-500/25 px-3 py-1.5 rounded-full">
                  <span className="text-amber-400 text-sm">💰</span>
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Estimated Budget</span>
                </div>
                <p className="text-xs text-gray-500">
                  {travelers} traveler{travelers > 1 ? "s" : ""} · {numDays} day{numDays > 1 ? "s" : ""} · {numNights} night{numNights > 1 ? "s" : ""}
                </p>
                <span className="ml-auto text-xs text-gray-600 italic">AI-estimated range</span>
              </div>

              <div className="p-6">
                {/* Big total range */}
                <div className="text-center mb-6">
                  <p className="text-gray-400 text-xs uppercase tracking-widest mb-1">Total Trip Cost</p>
                  <p className="text-4xl sm:text-5xl font-black text-white">
                    {formatINR(totalMin)}
                    <span className="text-gray-500 mx-2 text-2xl font-light">–</span>
                    {formatINR(totalMax)}
                  </p>
                  {travelers > 1 && (
                    <p className="text-gray-500 text-sm mt-1">
                      ≈ {formatINR(Math.round(totalMin / travelers))} – {formatINR(Math.round(totalMax / travelers))} per person
                    </p>
                  )}
                  {/* Visual bar */}
                  <div className="mt-4 h-2 bg-white/5 rounded-full overflow-hidden max-w-sm mx-auto">
                    <div className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full w-full animate-pulse" style={{ animationDuration: "3s" }} />
                  </div>
                </div>

                {/* Category breakdown */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  {categories.map((cat) => (
                    <div key={cat.label}
                      className={`rounded-2xl border p-4 text-center ${catColors[cat.color]}`}>
                      <div className="text-2xl mb-2">{cat.icon}</div>
                      <p className="text-[10px] font-bold uppercase tracking-wider mb-1 opacity-70">{cat.label}</p>
                      <p className="text-xs font-black text-white">{formatINR(cat.min)}</p>
                      <p className="text-[10px] opacity-50">to {formatINR(cat.max)}</p>
                    </div>
                  ))}
                </div>

                {/* Disclaimer */}
                <p className="text-center text-[10px] text-gray-600 mt-4">
                  ⚠️ Estimates based on current market rates. Actual prices may vary with season, availability, and your preferences.
                  {trainBase < flightBase && ` Train saves ≈ ${formatINR(flightBase - trainBase)} per person vs. flight.`}
                </p>
              </div>
            </div>
          </section>
        );
      })()}

      {/* Floating Transport CTA */}
      {!hasTransportBooking && !isCompleted && (
        <>
          <div className="fixed bottom-10 right-10 z-50 hidden md:block">
            <Link
              href={`/trips/${params.id}/transport`}
              className="flex items-center gap-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold px-6 py-4 rounded-2xl shadow-[0_0_40px_rgba(37,99,235,0.4)] transition-all hover:scale-105 hover:-translate-y-1 active:scale-95 border border-white/10"
            >
              <span className="text-2xl animate-bounce">✈️</span>
              <span className="text-lg">Book Transport</span>
            </Link>
          </div>
          {/* Mobile smaller CTA */}
          <div className="fixed bottom-6 right-4 z-50 md:hidden">
            <Link
              href={`/trips/${params.id}/transport`}
              className="flex items-center justify-center w-14 h-14 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-full shadow-[0_0_30px_rgba(37,99,235,0.5)] transition-all hover:scale-105 active:scale-95 border border-white/10"
            >
              <span className="text-2xl">✈️</span>
            </Link>
          </div>
        </>
      )}

      {isCompleted && (
        <div className="max-w-7xl mx-auto px-4 mt-12 mb-12">
          <div className="bg-white/[0.02] border border-amber-500/20 rounded-3xl p-8 text-center relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
            <h3 className="text-3xl font-bold text-white mb-3 relative z-10">How was your trip?</h3>
            <p className="text-gray-400 mb-8 relative z-10 text-lg">Rate your AI-planned itinerary experience.</p>
            <div className="flex justify-center gap-4 relative z-10">
              {[1, 2, 3, 4, 5].map((star) => (
                <button 
                  key={star} 
                  className="text-5xl text-gray-600 hover:text-amber-400 hover:scale-125 transition-all focus:text-amber-500 active:scale-95"
                  onClick={() => alert('Thank you for your feedback!')}
                >
                  ★
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
