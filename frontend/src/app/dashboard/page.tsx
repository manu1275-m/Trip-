"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Navigation from "@/components/Navigation";
import axios from "axios";
import { useRouter } from "next/navigation";

const AGENT_STATUSES = [
  { icon: "🌤️", name: "Weather Agent", status: "Monitoring", bgClass: "bg-blue-500/10 border-blue-500/20" },
  { icon: "🚦", name: "Traffic Agent", status: "Active",     bgClass: "bg-green-500/10 border-green-500/20" },
  { icon: "💰", name: "Budget Agent",  status: "Analyzing",  bgClass: "bg-amber-500/10 border-amber-500/20" },
  { icon: "🛡️", name: "Safety Agent",  status: "On guard",   bgClass: "bg-purple-500/10 border-purple-500/20" },
];

export default function Dashboard() {
  const router = useRouter();
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ongoing' | 'completed'>('ongoing');

  const isTripCompleted = (trip: any) => {
    if (!trip.request?.travel_date || !trip.request?.number_of_days) return false;
    try {
      const startDate = new Date(trip.request.travel_date);
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + parseInt(trip.request.number_of_days));
      if (isNaN(endDate.getTime())) return false;
      return new Date() > endDate;
    } catch {
      return false;
    }
  };

  useEffect(() => {
    const fetchTrips = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) { router.push("/auth/login"); return; }
        const res = await axios.get(`http://127.0.0.1:8000/api/trips/history?t=${Date.now()}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setTrips(res.data);
      } catch (err: any) {
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

  const getBookingCount = (trip: any) => Object.keys(trip.bookings || {}).length;

  const filteredTrips = trips.filter(t => activeTab === 'completed' ? isTripCompleted(t) : !isTripCompleted(t));

  return (
    <div className="flex flex-col min-h-screen bg-[#09090b]">
      <Navigation />

      {/* Hero banner */}
      <div className="relative overflow-hidden border-b border-white/5">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-600/10 via-transparent to-blue-900/10 pointer-events-none" />
        <div className="absolute top-0 right-0 w-[500px] h-[200px] bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div>
              <p className="text-amber-400 text-xs font-bold uppercase tracking-widest mb-2">🤖 Yatra AI · 13 Agents Active</p>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                Your Journeys
              </h1>
              <p className="text-gray-400 mt-2 text-sm">All your AI-planned trips in one place.</p>
            </div>
            <Link
              href="/trips/new"
              className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 active:scale-[0.97] text-black font-bold px-6 py-3.5 rounded-2xl transition-all shadow-xl shadow-amber-500/25 hover:shadow-amber-500/40 text-sm self-start sm:self-center"
            >
              <span className="text-lg">+</span> Plan New Trip
            </Link>
          </div>

          {/* Stats strip */}
          <div className="flex gap-6 mt-8 pt-6 border-t border-white/5">
            {[
              { label: "Total Trips", value: trips.length, icon: "🗺️" },
              { label: "Total Bookings", value: trips.reduce((a, t) => a + getBookingCount(t), 0), icon: "🎟️" },
              { label: "AI Agents Active", value: 13, icon: "🤖" },
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-3">
                <span className="text-2xl">{s.icon}</span>
                <div>
                  <p className="text-2xl font-extrabold text-white leading-none">{loading ? "—" : s.value}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 py-10 w-full">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* Trips list */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span className={`w-2 h-2 ${activeTab === 'ongoing' ? 'bg-green-400 animate-pulse' : 'bg-gray-500'} rounded-full`} />
                {activeTab === 'ongoing' ? 'Ongoing Trips' : 'Completed Trips'}
              </h2>
              {!loading && (
                <div className="flex bg-white/5 rounded-xl p-1 border border-white/5">
                  <button 
                    onClick={() => setActiveTab('ongoing')}
                    className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'ongoing' ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' : 'text-gray-400 hover:text-white'}`}
                  >
                    Ongoing
                  </button>
                  <button 
                    onClick={() => setActiveTab('completed')}
                    className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'completed' ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' : 'text-gray-400 hover:text-white'}`}
                  >
                    Completed
                  </button>
                </div>
              )}
            </div>

            {loading ? (
              <div className="space-y-4">
                {[1, 2].map((i) => (
                  <div key={i} className="rounded-2xl border border-white/5 bg-white/2 p-6 animate-pulse">
                    <div className="h-4 bg-white/10 rounded-full w-1/3 mb-3" />
                    <div className="h-7 bg-white/10 rounded-full w-2/3 mb-2" />
                    <div className="h-4 bg-white/5 rounded-full w-1/2" />
                  </div>
                ))}
              </div>
            ) : filteredTrips.length > 0 ? (
              <div className="space-y-4">
                {filteredTrips.map((trip: any, idx: number) => {
                  const tripId = trip.id || trip.trip_id;
                  const bookingCount = getBookingCount(trip);
                  return (
                    <div
                      key={idx}
                      className="group relative rounded-2xl border border-white/8 bg-white/[0.02] hover:bg-white/[0.04] hover:border-amber-500/20 transition-all duration-300 overflow-hidden"
                    >
                      {/* Left accent bar */}
                      <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-amber-400 to-orange-500 rounded-l-2xl" />

                      <div className="pl-5 pr-5 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">
                              Active
                            </span>
                            {bookingCount > 0 && (
                              <span className="text-[10px] font-bold uppercase tracking-widest text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full border border-green-400/20">
                                {bookingCount} Booked
                              </span>
                            )}
                            {trip.request?.travel_date && (
                              <span className="text-[10px] text-gray-500">
                                📅 {trip.request.travel_date}
                              </span>
                            )}
                          </div>
                          <h3 className="text-xl font-bold text-white truncate group-hover:text-amber-400 transition-colors">
                            {trip.request?.current_location || "Origin"} → {trip.request?.destination || "Destination"}
                          </h3>
                          <p className="text-sm text-gray-500 mt-1">
                            {trip.request?.number_of_days || "?"}d itinerary
                            {trip.request?.travelers?.length > 0 && ` · ${trip.request.travelers.length} traveler${trip.request.travelers.length > 1 ? 's' : ''}`}
                          </p>
                        </div>

                        <div className="flex gap-2 flex-shrink-0">
                          <Link
                            href={`/trips/${tripId}/plan`}
                            className="flex items-center gap-1.5 bg-white/8 hover:bg-white/15 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-all border border-white/8 hover:border-white/15"
                          >
                            🗺️ Itinerary
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-20 bg-white/[0.02] border border-white/5 rounded-3xl">
                <div className="text-4xl mb-4 opacity-50">🏕️</div>
                <h3 className="text-xl font-bold text-white mb-2">No {activeTab} trips found</h3>
                <p className="text-gray-400 text-sm">
                  {activeTab === 'ongoing' ? "You don't have any active travel plans." : "You haven't completed any trips yet."}
                </p>
                {activeTab === 'ongoing' && (
                  <Link href="/trips/new" className="inline-block mt-6 px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl transition-all">
                    Plan a New Trip
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="lg:w-72 flex-shrink-0 space-y-4">
            {/* Agent status */}
            <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-5">
              <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                Live Agents
              </h3>
              <div className="space-y-3">
                {AGENT_STATUSES.map((agent) => (
                  <div key={agent.name} className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm border flex-shrink-0 ${agent.bgClass}`}>
                      {agent.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white leading-none">{agent.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{agent.status}</p>
                    </div>
                    <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse flex-shrink-0" />
                  </div>
                ))}
              </div>
            </div>

            {/* Quick actions */}
            <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-5">
              <h3 className="text-sm font-bold text-white mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <Link href="/trips/new" className="flex items-center gap-3 w-full px-4 py-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 transition-all group">
                  <span className="text-lg">✈️</span>
                  <div className="text-left">
                    <p className="text-sm font-bold text-amber-400">Plan New Trip</p>
                    <p className="text-xs text-gray-500">AI-powered itinerary</p>
                  </div>
                  <span className="ml-auto text-amber-500 group-hover:translate-x-0.5 transition-transform">→</span>
                </Link>
              </div>
            </div>

            {/* AI tip */}
            <div className="rounded-2xl border border-blue-500/15 bg-blue-500/5 p-5">
              <p className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-2">💡 AI Tip</p>
              <p className="text-sm text-gray-400 leading-relaxed">
                Flight prices for popular Indian routes drop by up to 30% when booked 3-6 weeks in advance. Your Budget Agent is tracking this.
              </p>
            </div>
          </aside>
        </div>
      </main>

      {/* ── Why Yatra AI strip (shown only when no trips) ─────────────────── */}
      <div className="border-t border-white/5 bg-white/[0.01]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-600 mb-6 text-center">Why Yatra AI?</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { icon: "🧠", label: "13 AI Agents", sub: "Specialised crew" },
              { icon: "⚡", label: "90-sec Plans", sub: "Instant itinerary" },
              { icon: "📍", label: "Real Places", sub: "Verified gems" },
              { icon: "🚦", label: "Live Traffic", sub: "Day-of monitoring" },
              { icon: "🎟️", label: "In-app Booking", sub: "Flights & hotels" },
              { icon: "🔄", label: "Instant Replan", sub: "Auto-adjusts" },
            ].map((f) => (
              <div key={f.label} className="flex flex-col items-center text-center gap-2 p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-amber-500/15 transition-all">
                <span className="text-2xl">{f.icon}</span>
                <p className="text-xs font-bold text-white">{f.label}</p>
                <p className="text-[10px] text-gray-600">{f.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
