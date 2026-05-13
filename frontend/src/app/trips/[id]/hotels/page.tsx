"use client";

import { useEffect, useState } from "react";
import Navigation from "@/components/Navigation";
import Link from "next/link";
import axios from "axios";
import { useRouter } from "next/navigation";
import CheckoutModal from "@/components/CheckoutModal";

export default function HotelsSelection({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [trip, setTrip] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const [checkoutStay, setCheckoutStay] = useState<string | null>(null);

  useEffect(() => {
    const fetchTrip = async () => {
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
    };

    fetchTrip();
  }, [params.id, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin text-4xl text-primary">⚙️</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-panel p-8 text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <Link href="/dashboard" className="text-primary hover:underline">Back to Dashboard</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navigation />

      <main className="flex-1 py-12 px-4 max-w-7xl mx-auto w-full">
        <header className="mb-12">
          <Link href={`/trips/${params.id}/plan`} className="text-gray-400 hover:text-white mb-4 inline-block">&larr; Back to Itinerary</Link>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-green-400 bg-green-400/10 px-3 py-1 rounded-full">Hotel Options</span>
            <span className="text-gray-400 text-sm">Trip ID: {params.id}</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Review Stays</h1>
          <p className="text-xl text-gray-400">
            {trip?.request?.current_location} &rarr; {trip?.request?.destination}
          </p>
        </header>

        {(() => {
          let allStays: string[] = [];
          try {
            if (trip?.raw_plan) {
              let parsedPlan = typeof trip.raw_plan === 'object' ? trip.raw_plan : null;
              if (!parsedPlan) {
                const match = trip.raw_plan.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
                parsedPlan = match ? JSON.parse(match[1]) : JSON.parse(trip.raw_plan);
              }
              const days = Object.keys(parsedPlan).filter(k => k.toLowerCase().startsWith('day'));
              const staysSet = new Set<string>();
              days.forEach(d => {
                if (parsedPlan[d]?.stay) staysSet.add(parsedPlan[d].stay);
              });
              allStays = Array.from(staysSet);
            }
          } catch (e) { }

          return (
            <div className="space-y-6 max-w-4xl mx-auto">
              {allStays.length > 0 ? (
                <>
                  <div className="glass-panel p-8 text-center border-b border-white/5 mb-8">
                    <h2 className="text-2xl font-bold text-white mb-2">Powered by Rapid API 🏨</h2>
                    <p className="text-gray-400">Click below to book the AI-recommended accommodations instantly using our Rapid API integration.</p>
                  </div>
                  {allStays.map((stay, idx) => (
                    <div key={idx} className="glass-panel p-6 flex flex-col md:flex-row justify-between items-center border-l-4 border-l-green-500 gap-4">
                      <div className="text-center md:text-left">
                        <h3 className="text-xl font-bold text-white">{stay}</h3>
                        <p className="text-sm text-green-400 mt-1">Recommended by Master Agent</p>
                      </div>
                      {(() => {
                        const normalizedStay = stay.trim().toLowerCase();
                        const booking = trip?.bookings && Object.keys(trip.bookings).find(
                          k => k.trim().toLowerCase() === normalizedStay
                        ) ? trip.bookings[Object.keys(trip.bookings).find(k => k.trim().toLowerCase() === normalizedStay)!] : null;

                        if (booking) {
                          return (
                            <div className="flex flex-col items-end gap-1">
                              <span className="bg-green-500/20 text-green-400 px-4 py-2 rounded-lg font-bold border border-green-500/30">
                                ✅ BOOKED
                              </span>
                              <span className="text-[10px] text-gray-500 uppercase tracking-widest font-mono">PNR: {booking.pnr}</span>
                            </div>
                          );
                        }

                        return (
                          <button
                            onClick={(e) => {
                              setCheckoutStay(stay);
                            }}
                            className="bg-green-600 hover:bg-green-500 text-white px-6 py-3 rounded-lg font-bold transition-colors shadow-lg shadow-green-500/20 whitespace-nowrap"
                          >
                            Book Hotel
                          </button>
                        );
                      })()}
                    </div>
                  ))}
                  
                  {checkoutStay && (
                    <CheckoutModal 
                      tripId={params.id}
                      bookingType="Hotel"
                      itemName={checkoutStay}
                      initialEmail={trip?.user_email}
                      initialTravelers={trip?.request?.travelers?.length ? trip.request.travelers : undefined}
                      onClose={() => setCheckoutStay(null)}
                      onSuccess={() => {
                         router.push(`/dashboard`);
                      }}
                    />
                  )}
                </>
              ) : (
                <div className="glass-panel p-12 text-center border-t-4 border-t-green-500">
                  <p className="text-gray-400">No hotels found in the AI plan.</p>
                </div>
              )}

              <div className="flex gap-4 justify-center mt-12">
                <Link href={`/trips/${params.id}/plan`} className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-lg font-medium transition-colors">
                  Return to Itinerary
                </Link>
                <Link href={`/trips/${params.id}/live`} className="bg-primary hover:bg-primary/90 text-background px-6 py-3 rounded-lg font-bold transition-colors">
                  Go to Live Assistant
                </Link>
              </div>
            </div>
          );
        })()}
      </main>
    </div>
  );
}
