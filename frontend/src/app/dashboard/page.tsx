"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Navigation from "@/components/Navigation";
import axios from "axios";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const router = useRouter();
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrips = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          router.push("/auth/login");
          return;
        }

        console.log("Fetching trips for token...");
        const res = await axios.get(`http://127.0.0.1:8000/api/trips/history`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setTrips(res.data);
      } catch (err: any) {
        console.error("Dashboard Fetch Error:", err);
        if (err.response?.status === 401) {
          localStorage.removeItem("token");
          router.push("/auth/login");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchTrips();
  }, [router]);

  return (
    <div className="flex flex-col min-h-screen">
      <Navigation />
      
      <main className="flex-1 py-12 px-4 max-w-7xl mx-auto w-full">
        <header className="mb-12 flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-bold mb-2">Welcome back, Traveler</h1>
            <p className="text-gray-400">Your AI agents are monitoring conditions for your upcoming trips.</p>
          </div>
          <Link 
            href="/trips/new" 
            className="bg-primary hover:bg-primary/90 text-background font-bold px-6 py-3 rounded-xl transition-transform hover:scale-105"
          >
            + Create New Trip
          </Link>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <h2 className="text-2xl font-semibold flex items-center gap-2">
              <span className="text-blue-400">●</span> Ongoing Trips
            </h2>
            
            {loading ? (
              <div className="glass-panel p-8 text-center border-dashed border-2 border-primary/30">
                <div className="animate-spin text-4xl text-primary mx-auto mb-4 w-8 h-8">⚙️</div>
                <p className="text-gray-400">Loading your itineraries...</p>
              </div>
            ) : trips.length > 0 ? (
              <div className="space-y-4">
                {trips.map((trip: any, idx: number) => (
                  <div key={idx} className="glass-panel p-6 flex flex-col md:flex-row justify-between items-center border-l-4 border-l-primary gap-4">
                    <div className="text-center md:text-left">
                      <div className="flex items-center gap-2 justify-center md:justify-start mb-1">
                        <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded font-bold uppercase tracking-wide">
                          Booked / Active
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-white mb-1">
                        {trip.request?.current_location || "Origin"} &rarr; {trip.request?.destination || "Destination"}
                      </h3>
                      <p className="text-gray-400 text-sm">
                        Departure: {trip.request?.travel_date || "TBD"} &bull; Travelers: {trip.request?.travelers?.length || 1}
                      </p>
                    </div>
                    <div className="flex gap-3 w-full md:w-auto">
                      <Link href={`/trips/${trip.id || trip.trip_id}/plan`} className="flex-1 md:flex-none text-center bg-white/10 hover:bg-white/20 text-white px-4 py-3 rounded-lg font-medium transition-colors border border-white/10">
                        Itinerary
                      </Link>
                      <Link href={`/trips/${trip.id || trip.trip_id}/live`} className="flex-1 md:flex-none text-center bg-green-500/20 hover:bg-green-500/30 text-green-400 px-4 py-3 rounded-lg font-bold transition-colors border border-green-500/20 shadow-lg shadow-green-500/10">
                        Live Tracking
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="glass-panel p-8 text-center border-dashed border-2 border-primary/30">
                <div className="text-primary text-4xl mb-4">🌍</div>
                <h3 className="text-xl font-medium mb-2">No upcoming trips yet</h3>
                <p className="text-gray-400 mb-6">Let the Agentic AI craft the perfect itinerary for your next adventure.</p>
                <Link href="/trips/new" className="text-primary hover:underline font-medium">
                  Start your first journey &rarr;
                </Link>
              </div>
            )}
          </div>
          
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold">Live AI Insights</h2>
            <div className="glass-panel p-6 space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 mt-1">🌤</div>
                <div>
                  <h4 className="font-medium text-sm">Weather Agent</h4>
                  <p className="text-xs text-gray-400">Clear skies expected in your upcoming destinations for the next 5 days.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400 mt-1">🚗</div>
                <div>
                  <h4 className="font-medium text-sm">Traffic Agent</h4>
                  <p className="text-xs text-gray-400">Monitoring national highway conditions for your live tracking links.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 mt-1">💰</div>
                <div>
                  <h4 className="font-medium text-sm">Budget Agent</h4>
                  <p className="text-xs text-gray-400">Flight prices are fluctuating. AI is ready to suggest alternatives.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
