"use client";

import { useEffect, useState } from "react";
import Navigation from "@/components/Navigation";
import Link from "next/link";
import axios from "axios";
import { useRouter } from "next/navigation";
import CheckoutModal from "@/components/CheckoutModal";

export default function TransportSelection({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [trip, setTrip] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [checkoutTransport, setCheckoutTransport] = useState<string | null>(null);

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
            <span className="text-xs font-bold uppercase tracking-wider text-blue-400 bg-blue-400/10 px-3 py-1 rounded-full">Transport Options</span>
            <span className="text-gray-400 text-sm">Trip ID: {params.id}</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Intercity & Local Transport</h1>
          <p className="text-xl text-gray-400">
            {trip?.request?.current_location} &rarr; {trip?.request?.destination}
          </p>
        </header>

        <div className="space-y-6 max-w-4xl mx-auto">
          <div className="glass-panel p-8 text-center border-b border-white/5 mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">Powered by Rapid API 🚀</h2>
            <p className="text-gray-400">Instantly book your intercity travel using our live Rapid API integration.</p>
          </div>

          <div className="glass-panel p-6 flex flex-col md:flex-row justify-between items-center border-l-4 border-l-blue-500 gap-4">
              <div className="text-center md:text-left">
                <h3 className="text-xl font-bold text-white flex items-center gap-2"><span className="text-2xl">✈️</span> Flight: {trip?.request?.current_location || "Origin"} &rarr; {trip?.request?.destination || "Destination"}</h3>
                <p className="text-sm text-gray-400 mt-1">Fastest option &middot; Recommended</p>
              </div>
              {(() => {
                const transportName = `${trip?.request?.current_location || "Origin"} to ${trip?.request?.destination || "Destination"}`;
                const normalized = transportName.trim().toLowerCase();
                const booking = trip?.bookings && Object.keys(trip.bookings).find(
                  k => k.trim().toLowerCase() === normalized
                ) ? trip.bookings[Object.keys(trip.bookings).find(k => k.trim().toLowerCase() === normalized)!] : null;

                if (booking && booking.type === "Flight") {
                  return (
                    <div className="flex flex-col items-end gap-1">
                      <span className="bg-blue-500/20 text-blue-400 px-4 py-2 rounded-lg font-bold border border-blue-500/30">
                        ✅ BOOKED
                      </span>
                      <span className="text-[10px] text-gray-500 uppercase tracking-widest font-mono">PNR: {booking.pnr}</span>
                    </div>
                  );
                }

                return (
                  <button 
                    onClick={() => setCheckoutTransport("Flight")} 
                    className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-lg font-bold transition-colors shadow-lg shadow-blue-500/20 whitespace-nowrap"
                  >
                    Book Flight
                  </button>
                );
              })()}
            </div>
           
            <div className="glass-panel p-6 flex flex-col md:flex-row justify-between items-center border-l-4 border-l-blue-400 gap-4">
              <div className="text-center md:text-left">
                <h3 className="text-xl font-bold text-white flex items-center gap-2"><span className="text-2xl">🚆</span> Train: {trip?.request?.current_location || "Origin"} &rarr; {trip?.request?.destination || "Destination"}</h3>
                <p className="text-sm text-gray-400 mt-1">Most scenic option &middot; Budget Friendly</p>
              </div>
              {(() => {
                const transportName = `${trip?.request?.current_location || "Origin"} to ${trip?.request?.destination || "Destination"}`;
                const normalized = transportName.trim().toLowerCase();
                const booking = trip?.bookings && Object.keys(trip.bookings).find(
                  k => k.trim().toLowerCase() === normalized
                ) ? trip.bookings[Object.keys(trip.bookings).find(k => k.trim().toLowerCase() === normalized)!] : null;

                if (booking && booking.type === "Train") {
                  return (
                    <div className="flex flex-col items-end gap-1">
                      <span className="bg-blue-500/20 text-blue-400 px-4 py-2 rounded-lg font-bold border border-blue-500/30">
                        ✅ BOOKED
                      </span>
                      <span className="text-[10px] text-gray-500 uppercase tracking-widest font-mono">PNR: {booking.pnr}</span>
                    </div>
                  );
                }

                return (
                  <button 
                    onClick={() => setCheckoutTransport("Train")} 
                    className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-lg font-bold transition-colors shadow-lg shadow-blue-500/20 whitespace-nowrap"
                  >
                    Book Train
                  </button>
                );
              })()}
            </div>

          {checkoutTransport && (
            <CheckoutModal 
              tripId={params.id}
              bookingType={checkoutTransport}
              itemName={`${trip?.request?.current_location || "Origin"} to ${trip?.request?.destination || "Destination"}`}
              initialEmail={trip?.user_email}
              initialTravelers={trip?.request?.travelers?.length ? trip.request.travelers : undefined}
              onClose={() => setCheckoutTransport(null)}
              onSuccess={() => {
                router.push(`/trips/${params.id}/hotels`);
              }}
            />
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
      </main>
    </div>
  );
}
