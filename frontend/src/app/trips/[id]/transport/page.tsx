"use client";

import { useEffect, useState, useCallback } from "react";
import Navigation from "@/components/Navigation";
import Link from "next/link";
import axios from "axios";
import { useRouter } from "next/navigation";
import CheckoutModal from "@/components/CheckoutModal";
import { flightPricePerPerson, trainPricePerPerson, formatINR } from "@/lib/pricing";

export default function TransportSelection({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [trip, setTrip] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [checkoutTransport, setCheckoutTransport] = useState<string | null>(null);
  const [bookingJustCompleted, setBookingJustCompleted] = useState(false);

  const fetchTrip = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/auth/login");
        return;
      }
      const res = await axios.get(`http://127.0.0.1:8000/api/trips/${params.id}`, {
        headers: { Authorization: `Bearer ${token}` }
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

  const getTransportBooking = (type: string) => {
    if (!trip?.bookings) return null;
    const route = `${trip?.request?.current_location} to ${trip?.request?.destination}`.toLowerCase().trim();
    
    // Search all bookings for a match on both type and item_name/key
    return Object.values(trip.bookings).find((b: any) => {
      const isTypeMatch = b.type === type;
      const itemNameMatch = b.item_name?.toLowerCase().trim() === route || 
                           (typeof b === 'object' && Object.keys(trip.bookings).find(k => k.toLowerCase().trim() === route && trip.bookings[k] === b));
      return isTypeMatch && itemNameMatch;
    });
  };

  const flightBooking = getTransportBooking("Flight");
  const trainBooking = getTransportBooking("Train");
  const isAnyBooked = !!(flightBooking || trainBooking);

  const origin = trip?.request?.current_location || "";
  const dest = trip?.request?.destination || "";
  const flightPrice = flightPricePerPerson(origin, dest);
  const trainPrice = trainPricePerPerson(origin, dest);

  if (loading) return (
    <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full border-4 border-amber-500/20 border-t-amber-500 animate-spin" />
        </div>
        <p className="text-gray-400 text-sm animate-pulse">Loading transport options…</p>
      </div>
    </div>
  );

  const routeName = `${trip?.request?.current_location || "Origin"} to ${trip?.request?.destination || "Destination"}`;

  return (
    <div className="flex flex-col min-h-screen bg-[#09090b]">
      <Navigation />

      {/* Hero */}
      <div className="relative border-b border-white/5 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-transparent to-indigo-900/10 pointer-events-none" />
        <div className="max-w-4xl mx-auto px-4 py-10">
          <Link href={`/trips/${params.id}/plan`} className="inline-flex items-center gap-1.5 text-gray-500 hover:text-gray-300 text-sm mb-5 transition-colors group">
            <span className="group-hover:-translate-x-0.5 transition-transform">←</span> Back to Plan
          </Link>
          <p className="text-blue-400 text-xs font-bold uppercase tracking-widest mb-2">✈️ Transport</p>
          <h1 className="text-3xl font-extrabold text-white">Choose How You Travel</h1>
          <p className="text-gray-400 mt-2">{routeName}</p>
          {isAnyBooked && (
            <div className="mt-4 inline-flex items-center gap-2 bg-green-500/10 border border-green-500/20 text-green-400 text-sm px-4 py-2 rounded-full font-medium">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full" /> Transport booked — only one allowed per trip
            </div>
          )}
        </div>
      </div>

      <main className="flex-1 max-w-4xl mx-auto px-4 py-10 w-full">
        <div className="space-y-4">

          {/* Flight Card */}
          <div className={`group relative rounded-2xl border overflow-hidden transition-all duration-300 ${
            flightBooking
              ? 'border-blue-500/40 bg-blue-500/5 shadow-lg shadow-blue-500/10'
              : !isAnyBooked
              ? 'border-white/10 bg-white/[0.02] hover:border-blue-500/30 hover:bg-blue-500/5 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-500/10'
              : 'border-white/5 bg-white/[0.01] opacity-40 grayscale'
          }`}>
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-400 to-blue-600 rounded-l-2xl" />
            <div className="pl-6 pr-6 py-6 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-2xl bg-blue-500/15 border border-blue-500/20 flex items-center justify-center text-2xl flex-shrink-0">
                  ✈️
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    Flight
                    {flightBooking && <span className="text-xs font-bold bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/30">BOOKED</span>}
                  </h3>
                  <p className="text-sm text-gray-500 mt-0.5">Fastest option · ~1-2 hours</p>
                  <p className="text-amber-400 font-bold mt-1.5">{formatINR(flightPrice)} <span className="text-gray-500 font-normal text-xs">per person</span></p>
                  {flightBooking && <p className="text-xs text-gray-500 font-mono mt-1">PNR: {(flightBooking as any).pnr}</p>}
                </div>
              </div>
              {flightBooking ? (
                <div className="flex items-center gap-2 bg-green-500/15 border border-green-500/30 text-green-400 px-5 py-3 rounded-xl font-bold text-sm flex-shrink-0">
                  ✅ Confirmed
                </div>
              ) : isAnyBooked ? (
                <div className="text-gray-600 text-sm px-5 py-3 rounded-xl border border-white/5 flex-shrink-0">Unavailable</div>
              ) : (
                <button
                  onClick={() => setCheckoutTransport("Flight")}
                  className="bg-blue-600 hover:bg-blue-500 active:scale-[0.97] text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-blue-600/20 transition-all text-sm flex-shrink-0"
                >
                  Book Flight →
                </button>
              )}
            </div>
          </div>

          {/* Train Card */}
          <div className={`group relative rounded-2xl border overflow-hidden transition-all duration-300 ${
            trainBooking
              ? 'border-indigo-500/40 bg-indigo-500/5 shadow-lg shadow-indigo-500/10'
              : !isAnyBooked
              ? 'border-white/10 bg-white/[0.02] hover:border-indigo-500/30 hover:bg-indigo-500/5 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-indigo-500/10'
              : 'border-white/5 bg-white/[0.01] opacity-40 grayscale'
          }`}>
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-400 to-indigo-600 rounded-l-2xl" />
            <div className="pl-6 pr-6 py-6 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-2xl bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center text-2xl flex-shrink-0">
                  🚆
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    Train
                    {trainBooking && <span className="text-xs font-bold bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-full border border-indigo-500/30">BOOKED</span>}
                  </h3>
                  <p className="text-sm text-gray-500 mt-0.5">Scenic & comfortable · Budget-friendly</p>
                  <p className="text-amber-400 font-bold mt-1.5">{formatINR(trainPrice)} <span className="text-gray-500 font-normal text-xs">per person</span></p>
                  {trainBooking && <p className="text-xs text-gray-500 font-mono mt-1">PNR: {(trainBooking as any).pnr}</p>}
                </div>
              </div>
              {trainBooking ? (
                <div className="flex items-center gap-2 bg-green-500/15 border border-green-500/30 text-green-400 px-5 py-3 rounded-xl font-bold text-sm flex-shrink-0">
                  ✅ Confirmed
                </div>
              ) : isAnyBooked ? (
                <div className="text-gray-600 text-sm px-5 py-3 rounded-xl border border-white/5 flex-shrink-0">Unavailable</div>
              ) : (
                <button
                  onClick={() => setCheckoutTransport("Train")}
                  className="bg-indigo-600 hover:bg-indigo-500 active:scale-[0.97] text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-indigo-600/20 transition-all text-sm flex-shrink-0"
                >
                  Book Train →
                </button>
              )}
            </div>
          </div>

        </div>

        {checkoutTransport && (
          <CheckoutModal
            tripId={params.id}
            bookingType={checkoutTransport}
            itemName={routeName}
            initialEmail={trip?.request?.booking_email || trip?.user_email}
            initialTravelers={trip?.request?.travelers?.length ? trip.request.travelers : undefined}
            basePrice={checkoutTransport === "Flight" ? flightPrice : trainPrice}
            onSuccess={() => setBookingJustCompleted(true)}
            onClose={async () => {
              if (bookingJustCompleted) {
                setBookingJustCompleted(false);
                await fetchTrip();
              }
              setCheckoutTransport(null);
            }}
          />
        )}

        {/* Footer nav */}
        <div className="flex gap-3 justify-between mt-12 pt-8 border-t border-white/5">
          <Link href={`/trips/${params.id}/plan`} className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-gray-300 px-5 py-3 rounded-xl text-sm font-medium border border-white/8 transition-all">
            ← Itinerary
          </Link>
          <Link href={`/trips/${params.id}/hotels`} className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 active:scale-[0.97] text-black px-6 py-3 rounded-xl text-sm font-bold shadow-lg shadow-amber-500/20 transition-all">
            Book Hotels →
          </Link>
        </div>
      </main>
    </div>
  );
}
