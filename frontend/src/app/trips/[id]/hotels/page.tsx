"use client";

import { useEffect, useState, useCallback } from "react";
import Navigation from "@/components/Navigation";
import Link from "next/link";
import axios from "axios";
import { useRouter } from "next/navigation";
import CheckoutModal from "@/components/CheckoutModal";
import { hotelPricePerNight } from "@/lib/pricing";

export default function HotelsSelection({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [trip, setTrip] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [checkoutStay, setCheckoutStay] = useState<string | null>(null);

  const fetchTrip = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/auth/login");
        return;
      }
      const res = await axios.get(`http://127.0.0.1:8000/api/trips/${params.id}?t=${Date.now()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTrip(res.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to fetch trip.");
    } finally {
      setLoading(false);
    }
  }, [params.id, router]);

  useEffect(() => {
    fetchTrip();
  }, [fetchTrip]);

  // Re-fetch whenever user returns to this tab
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

  const getHotelBooking = (stayName: string) => {
    if (!trip?.bookings) return null;
    const target = stayName.trim().toLowerCase();

    // 1. Try matching by key name
    const keyMatch = Object.keys(trip.bookings).find(k => {
      const key = k.trim().toLowerCase();
      return key === target || key.includes(target) || target.includes(key);
    });
    if (keyMatch) return trip.bookings[keyMatch];

    // 2. Try matching by item_name inside booking value
    return Object.values(trip.bookings).find((b: any) => {
      const bName = (b?.item_name || "").trim().toLowerCase();
      return bName === target || bName.includes(target) || target.includes(bName);
    }) || null;
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin text-4xl text-primary">⚙️</div></div>;

  return (
    <div className="flex flex-col min-h-screen">
      <Navigation />
      <main className="flex-1 py-12 px-4 max-w-7xl mx-auto w-full">
        <header className="mb-12">
          <Link href={`/trips/${params.id}/plan`} className="text-gray-400 hover:text-white mb-4 inline-block">&larr; Back to Plan</Link>
          <h1 className="text-4xl font-bold text-white mb-2">Review Stays</h1>
          <p className="text-xl text-gray-400">{trip?.request?.current_location} &rarr; {trip?.request?.destination}</p>
        </header>

        {(() => {
          let allStays: string[] = [];
          try {
            if (trip?.raw_plan) {
              let plan = trip.raw_plan;
              if (typeof plan === 'string') {
                const match = plan.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
                plan = JSON.parse(match ? match[1] : plan);
              }
              const staysSet = new Set<string>();
              Object.values(plan).forEach((day: any) => { if (day.stay) staysSet.add(day.stay); });
              allStays = Array.from(staysSet);
            }
          } catch (e) {}

          return (
            <div className="space-y-6 max-w-4xl mx-auto">
              {allStays.map((stay, idx) => (
                <div key={idx} className="glass-panel p-6 flex flex-col md:flex-row justify-between items-center border-l-4 border-l-green-500 gap-4">
                  <div>
                    <h3 className="text-xl font-bold text-white">{stay}</h3>
                    <p className="text-sm text-green-400">AI Recommended</p>
                  </div>
                  {(() => {
                    const booking = getHotelBooking(stay);
                    if (booking) return (
                      <div className="text-right">
                        <div className="bg-green-500/20 text-green-400 px-4 py-2 rounded-lg font-bold border border-green-500/30">✅ BOOKED</div>
                        <p className="text-[10px] text-gray-500 mt-1 font-mono uppercase">PNR: {booking.pnr}</p>
                      </div>
                    );
                    return <button onClick={() => setCheckoutStay(stay)} className="bg-green-600 hover:bg-green-500 text-white px-6 py-3 rounded-lg font-bold shadow-lg shadow-green-500/20">Book Hotel</button>;
                  })()}
                </div>
              ))}
              
              {checkoutStay && (
                <CheckoutModal 
                  tripId={params.id}
                  bookingType="Hotel"
                  itemName={checkoutStay}
                  initialEmail={trip?.request?.booking_email || trip?.user_email}
                  initialTravelers={trip?.request?.travelers}
                  basePrice={hotelPricePerNight(checkoutStay, trip?.request?.destination || "")}
                  onSuccess={async () => {
                    await fetchTrip();
                  }}
                  onClose={async () => {
                    setCheckoutStay(null);
                    await fetchTrip(); // re-fetch to show latest booking status
                  }}
                />
              )}
            </div>
          );
        })()}
      </main>
    </div>
  );
}
