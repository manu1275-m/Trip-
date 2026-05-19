"use client";

import { useEffect, useState, useCallback } from "react";
import Navigation from "@/components/Navigation";
import Link from "next/link";
import axios from "axios";
import { useRouter } from "next/navigation";
import CheckoutModal from "@/components/CheckoutModal";
import { flightPricePerPerson, trainPricePerPerson, formatINR } from "@/lib/pricing";

export default function ReturnTransportSelection({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [trip, setTrip] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutTransport, setCheckoutTransport] = useState<string | null>(null);

  const fetchTrip = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) { router.push("/auth/login"); return; }
      const res = await axios.get(`http://127.0.0.1:8000/api/trips/${params.id}?t=${Date.now()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTrip(res.data);
    } catch {
      // silently handled
    } finally {
      setLoading(false);
    }
  }, [params.id, router]);

  useEffect(() => { fetchTrip(); }, [fetchTrip]);

  // Re-fetch when tab gets focus
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

  // Return bookings use types "Flight-Return" and "Train-Return"
  const getReturnBooking = (type: string) => {
    if (!trip?.bookings) return null;
    return Object.values(trip.bookings).find((b: any) => b?.type === type) || null;
  };

  const flightReturnBooking = getReturnBooking("Flight-Return");
  const trainReturnBooking = getReturnBooking("Train-Return");
  const isAnyReturnBooked = !!(flightReturnBooking || trainReturnBooking);

  // Return route: destination → origin (reversed)
  const origin = trip?.request?.destination || "";        // now the starting point
  const dest = trip?.request?.current_location || "";    // now the home destination
  const flightPrice = flightPricePerPerson(origin, dest);
  const trainPrice = trainPricePerPerson(origin, dest);
  const routeName = `${origin || "Destination"} to ${dest || "Home"}`;

  // Calculate return date
  const returnDateStr = (() => {
    if (!trip?.request?.travel_date || !trip?.request?.number_of_days) return "";
    try {
      const d = new Date(
        new Date(trip.request.travel_date).getTime() +
        parseInt(trip.request.number_of_days) * 86400000
      );
      return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "long", year: "numeric" });
    } catch { return ""; }
  })();

  if (loading) return (
    <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full border-4 border-purple-500/20 border-t-purple-500 animate-spin" />
        </div>
        <p className="text-gray-400 text-sm animate-pulse">Loading return transport options…</p>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-[#09090b]">
      <Navigation />

      {/* Hero */}
      <div className="relative border-b border-white/5 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 via-transparent to-pink-900/10 pointer-events-none" />
        <div className="max-w-4xl mx-auto px-4 py-10">
          <Link href={`/trips/${params.id}/plan`} className="inline-flex items-center gap-1.5 text-gray-500 hover:text-gray-300 text-sm mb-5 transition-colors group">
            <span className="group-hover:-translate-x-0.5 transition-transform">←</span> Back to Plan
          </Link>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-purple-400 text-xs font-bold uppercase tracking-widest">🔄 Return Journey</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white">Book Your Return Trip</h1>
          <p className="text-gray-400 mt-2">{routeName}</p>
          {returnDateStr && (
            <p className="text-purple-400 text-sm mt-1">📅 Return date: {returnDateStr}</p>
          )}
          {isAnyReturnBooked && (
            <div className="mt-4 inline-flex items-center gap-2 bg-green-500/10 border border-green-500/20 text-green-400 text-sm px-4 py-2 rounded-full font-medium">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full" /> Return transport booked
            </div>
          )}
        </div>
      </div>

      <main className="flex-1 max-w-4xl mx-auto px-4 py-10 w-full">
        <div className="space-y-4">

          {/* Return Flight Card */}
          <div className={`group relative rounded-2xl border overflow-hidden transition-all duration-300 ${
            flightReturnBooking
              ? 'border-purple-500/40 bg-purple-500/5 shadow-lg shadow-purple-500/10'
              : !isAnyReturnBooked
              ? 'border-white/10 bg-white/[0.02] hover:border-purple-500/30 hover:bg-purple-500/5 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-purple-500/10'
              : 'border-white/5 bg-white/[0.01] opacity-40 grayscale'
          }`}>
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-purple-400 to-purple-600 rounded-l-2xl" />
            <div className="pl-6 pr-6 py-6 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-2xl bg-purple-500/15 border border-purple-500/20 flex items-center justify-center text-2xl flex-shrink-0">✈️</div>
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    Return Flight
                    {flightReturnBooking && <span className="text-xs font-bold bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full border border-purple-500/30">BOOKED</span>}
                  </h3>
                  <p className="text-sm text-gray-500 mt-0.5">Fastest return option · ~1-2 hours</p>
                  <p className="text-amber-400 font-bold mt-1.5">{formatINR(flightPrice)} <span className="text-gray-500 font-normal text-xs">per person</span></p>
                  {flightReturnBooking && <p className="text-xs text-gray-500 font-mono mt-1">PNR: {(flightReturnBooking as any).pnr}</p>}
                </div>
              </div>
              {flightReturnBooking ? (
                <div className="flex items-center gap-2 bg-green-500/15 border border-green-500/30 text-green-400 px-5 py-3 rounded-xl font-bold text-sm flex-shrink-0">✅ Confirmed</div>
              ) : isAnyReturnBooked ? (
                <div className="text-gray-600 text-sm px-5 py-3 rounded-xl border border-white/5 flex-shrink-0">Unavailable</div>
              ) : (
                <button
                  onClick={() => setCheckoutTransport("Flight-Return")}
                  className="bg-purple-600 hover:bg-purple-500 active:scale-[0.97] text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-purple-600/20 transition-all text-sm flex-shrink-0"
                >
                  Book Return Flight →
                </button>
              )}
            </div>
          </div>

          {/* Return Train Card */}
          <div className={`group relative rounded-2xl border overflow-hidden transition-all duration-300 ${
            trainReturnBooking
              ? 'border-pink-500/40 bg-pink-500/5 shadow-lg shadow-pink-500/10'
              : !isAnyReturnBooked
              ? 'border-white/10 bg-white/[0.02] hover:border-pink-500/30 hover:bg-pink-500/5 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-pink-500/10'
              : 'border-white/5 bg-white/[0.01] opacity-40 grayscale'
          }`}>
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-pink-400 to-pink-600 rounded-l-2xl" />
            <div className="pl-6 pr-6 py-6 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-2xl bg-pink-500/15 border border-pink-500/20 flex items-center justify-center text-2xl flex-shrink-0">🚆</div>
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    Return Train
                    {trainReturnBooking && <span className="text-xs font-bold bg-pink-500/20 text-pink-400 px-2 py-0.5 rounded-full border border-pink-500/30">BOOKED</span>}
                  </h3>
                  <p className="text-sm text-gray-500 mt-0.5">Scenic &amp; comfortable · Budget-friendly</p>
                  <p className="text-amber-400 font-bold mt-1.5">{formatINR(trainPrice)} <span className="text-gray-500 font-normal text-xs">per person</span></p>
                  {trainReturnBooking && <p className="text-xs text-gray-500 font-mono mt-1">PNR: {(trainReturnBooking as any).pnr}</p>}
                </div>
              </div>
              {trainReturnBooking ? (
                <div className="flex items-center gap-2 bg-green-500/15 border border-green-500/30 text-green-400 px-5 py-3 rounded-xl font-bold text-sm flex-shrink-0">✅ Confirmed</div>
              ) : isAnyReturnBooked ? (
                <div className="text-gray-600 text-sm px-5 py-3 rounded-xl border border-white/5 flex-shrink-0">Unavailable</div>
              ) : (
                <button
                  onClick={() => setCheckoutTransport("Train-Return")}
                  className="bg-pink-600 hover:bg-pink-500 active:scale-[0.97] text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-pink-600/20 transition-all text-sm flex-shrink-0"
                >
                  Book Return Train →
                </button>
              )}
            </div>
          </div>

        </div>

        {checkoutTransport && (
          <CheckoutModal
            tripId={params.id}
            bookingType={checkoutTransport}
            itemName={`${routeName} (Return)`}
            initialEmail={trip?.request?.booking_email || trip?.user_email}
            initialTravelers={trip?.request?.travelers?.length ? trip.request.travelers : undefined}
            basePrice={checkoutTransport === "Flight-Return" ? flightPrice : trainPrice}
            onSuccess={async () => {
              await fetchTrip();
            }}
            onClose={async () => {
              setCheckoutTransport(null);
              await fetchTrip();
            }}
          />
        )}

        {/* Footer nav */}
        <div className="flex gap-3 justify-between mt-12 pt-8 border-t border-white/5">
          <Link href={`/trips/${params.id}/plan`} className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-gray-300 px-5 py-3 rounded-xl text-sm font-medium border border-white/8 transition-all">
            ← Back to Plan
          </Link>
        </div>
      </main>
    </div>
  );
}
