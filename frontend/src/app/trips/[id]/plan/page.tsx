"use client";

import { useEffect, useState } from "react";
import Navigation from "@/components/Navigation";
import Link from "next/link";
import axios from "axios";
import { useRouter } from "next/navigation";

export default function AITripPlan({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [trip, setTrip] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  // Helper to find booking by name robustly
  const getBooking = (name: string) => {
    if (!trip?.bookings) return null;
    const normalizedTarget = name.trim().toLowerCase();
    const matchKey = Object.keys(trip.bookings).find(
      key => key.trim().toLowerCase() === normalizedTarget
    );
    return matchKey ? trip.bookings[matchKey] : null;
  };

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
          <div className="flex items-center gap-3 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 px-3 py-1 rounded-full">AI Generated</span>
            <span className="text-gray-400 text-sm">Trip ID: {params.id}</span>
            {(() => {
              const transportName = `${trip?.request?.current_location || "Origin"} to ${trip?.request?.destination || "Destination"}`;
              const booking = getBooking(transportName);
              if (booking) {
                return (
                  <span className="text-[10px] font-bold bg-blue-500/20 text-blue-400 px-2 py-1 rounded-md border border-blue-500/30 flex items-center gap-1">
                    ✈️ TRANSPORT BOOKED ({booking.pnr})
                  </span>
                );
              }
              return (
                <Link href={`/trips/${params.id}/transport`} className="text-[10px] font-bold bg-amber-500/20 text-amber-400 px-2 py-1 rounded-md border border-amber-500/30 hover:bg-amber-500/30 transition-colors">
                  🚀 TRANSPORT PENDING
                </Link>
              );
            })()}
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Your Agentic Itinerary</h1>
          <p className="text-xl text-primary">
            {trip?.request?.current_location} &rarr; {trip?.request?.destination}
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="glass-panel p-8">
              <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
                <span>🗓️</span> Generated Plan
              </h2>
              
              <div className="prose prose-invert max-w-none">
                {trip?.raw_plan ? (
                  (() => {
                    let parsedPlan = null;
                    try {
                      if (typeof trip.raw_plan === 'object') {
                        parsedPlan = trip.raw_plan;
                      } else {
                        const match = trip.raw_plan.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
                        if (match) {
                          parsedPlan = JSON.parse(match[1]);
                        } else {
                          parsedPlan = JSON.parse(trip.raw_plan);
                        }
                      }
                    } catch (e) {}

                    if (!parsedPlan) {
                      return (
                        <pre className="whitespace-pre-wrap font-sans text-gray-300 leading-relaxed bg-[#18181b] p-6 rounded-lg border border-white/5">
                          {trip.raw_plan}
                        </pre>
                      );
                    }

                    const days = Object.keys(parsedPlan).filter(k => k.toLowerCase().startsWith('day_') || k.toLowerCase().startsWith('day'));
                    
                    if (days.length === 0) {
                      return (
                        <pre className="whitespace-pre-wrap font-sans text-gray-300 leading-relaxed bg-[#18181b] p-6 rounded-lg border border-white/5">
                          {JSON.stringify(parsedPlan, null, 2)}
                        </pre>
                      );
                    }

                    days.sort((a, b) => {
                      const numA = parseInt(a.replace(/[^0-9]/g, '')) || 0;
                      const numB = parseInt(b.replace(/[^0-9]/g, '')) || 0;
                      return numA - numB;
                    });

                    const allStays = days.map(d => parsedPlan[d]?.stay).filter(Boolean);
                    const isSingleStay = allStays.length > 0 && allStays.every(s => s === allStays[0]);

                    return (
                      <div className="space-y-6">
                        {days.map((dayKey, index) => {
                          const dayData = parsedPlan[dayKey];
                          const dayNum = dayKey.replace(/[^0-9]/g, '');
                          
                          const previousStay = index > 0 ? parsedPlan[days[index - 1]]?.stay : null;
                          const showStay = dayData.stay && !isSingleStay && dayData.stay !== previousStay;

                          return (
                            <div key={dayKey} className="bg-[#18181b] border border-white/10 rounded-xl p-6 hover:border-primary/50 transition-colors">
                              <h3 className="text-xl font-bold text-primary mb-4 border-b border-white/10 pb-3 flex items-center gap-2">
                                <span className="bg-primary/20 text-primary w-8 h-8 rounded-full flex items-center justify-center text-sm">{dayNum}</span>
                                Day {dayNum}
                              </h3>
                              
                              {dayData.places && dayData.places.length > 0 && (
                                <div className="mb-5">
                                  <h4 className="font-semibold text-white mb-3 flex items-center gap-2 text-sm uppercase tracking-wider">
                                    <span className="text-blue-400 text-lg">📍</span> Places to Visit
                                  </h4>
                                  <div className="grid gap-4">
                                    {dayData.places.map((place: any, idx: number) => (
                                      <PlaceCard key={idx} place={place} destination={trip?.request?.destination} />
                                    ))}
                                  </div>
                                </div>
                              )}
                              
                              {showStay && (
                                <div className="mt-4">
                                  <div className="flex justify-between items-center mb-2">
                                    <h4 className="font-semibold text-white flex items-center gap-2 text-sm uppercase tracking-wider">
                                      <span className="text-green-400 text-lg">🏨</span> Accommodation
                                    </h4>
                                    {(() => {
                                      const booking = getBooking(dayData.stay);
                                      return booking ? (
                                        <span className="text-[10px] font-bold bg-green-500/20 text-green-400 px-2 py-1 rounded-md border border-green-500/30 flex items-center gap-1">
                                          ✅ BOOKED ({booking.pnr})
                                        </span>
                                      ) : (
                                        <Link href={`/trips/${params.id}/hotels`} className="text-[10px] font-bold bg-amber-500/20 text-amber-400 px-2 py-1 rounded-md border border-amber-500/30 hover:bg-amber-500/30 transition-colors">
                                          ⏳ NEEDS BOOKING
                                        </Link>
                                      );
                                    })()}
                                  </div>
                                  <div className={`bg-black/30 p-4 rounded-lg border-l-2 ${getBooking(dayData.stay) ? 'border-green-500 border-white/5' : 'border-amber-500 border-white/5'} text-gray-300 font-medium`}>
                                    {dayData.stay}
                                  </div>
                                </div>
                              )}
                              
                              {Object.keys(dayData).map(k => {
                                if (k === 'places' || k === 'stay') return null;
                                return (
                                  <div key={k} className="mt-5">
                                    <h4 className="font-semibold text-white mb-2 capitalize text-sm tracking-wider flex items-center gap-2">
                                      <span className="text-purple-400 text-lg">✨</span> {k.replace(/_/g, ' ')}
                                    </h4>
                                    <div className="bg-black/30 p-4 rounded-lg border border-white/5 text-gray-300 text-sm">
                                      {typeof dayData[k] === 'object' ? JSON.stringify(dayData[k], null, 2) : String(dayData[k])}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })}

                        {isSingleStay && (
                          <div className="bg-[#18181b] border border-white/10 rounded-xl p-6 hover:border-primary/50 transition-colors mt-8">
                            <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-3">
                              <h3 className="text-xl font-bold text-primary flex items-center gap-2">
                                <span className="text-green-400 text-2xl">🏨</span> Trip Accommodation
                              </h3>
                              {(() => {
                                const booking = getBooking(allStays[0]);
                                return booking ? (
                                  <span className="text-xs font-bold bg-green-500/20 text-green-400 px-3 py-1.5 rounded-full border border-green-500/30">
                                    ✅ BOOKED ({booking.pnr})
                                  </span>
                                ) : (
                                  <Link href={`/trips/${params.id}/hotels`} className="text-xs font-bold bg-amber-500/20 text-amber-400 px-3 py-1.5 rounded-full border border-amber-500/30 hover:bg-amber-500/30 transition-colors">
                                    ⏳ NEEDS BOOKING
                                  </Link>
                                );
                              })()}
                            </div>
                            <div className={`bg-black/30 p-4 rounded-lg border-l-2 ${getBooking(allStays[0]) ? 'border-green-500 border-white/5' : 'border-amber-500 border-white/5'} text-gray-300 font-medium flex justify-between items-center`}>
                              <span>{allStays[0]}</span>
                              <span className="text-[10px] text-gray-400 bg-white/5 px-3 py-1.5 rounded-full uppercase tracking-wider border border-white/5">For all days</span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()
                ) : (
                  <p className="text-gray-400">Waiting for agent outputs...</p>
                )}
              </div>
            </div>

            <div className="glass-panel p-8">
              <h2 className="text-2xl font-semibold mb-4 text-green-400">AI Explainability Report</h2>
              <p className="text-gray-300 leading-relaxed italic border-l-4 border-green-500/50 pl-4 py-2">
                {trip?.ai_explanation || "The Master Agent is finalizing its explanation..."}
              </p>
            </div>
          </div>
          
          <div className="space-y-6">
            <div className="glass-panel p-6">
              <h3 className="font-bold text-lg mb-4">Active Agents</h3>
              <ul className="space-y-3 text-sm">
                <li className="flex justify-between items-center"><span className="text-gray-400">Weather Agent</span> <span className="text-green-400">Monitoring</span></li>
                <li className="flex justify-between items-center"><span className="text-gray-400">Safety Agent</span> <span className="text-green-400">Monitoring</span></li>
              </ul>
            </div>
            
            <Link href={`/trips/${params.id}/live`} className="block w-full bg-primary hover:bg-primary/90 text-background text-center py-4 rounded-xl font-bold transition-all shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98]">
              🚀 Enter Live Journey Assistant
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

function PlaceCard({ place, destination }: { place: any, destination: string }) {
  const [imageUrl, setImageUrl] = useState("https://images.pexels.com/photos/255379/pexels-photo-255379.jpeg?auto=compress&cs=tinysrgb&w=800"); // Neutral pattern

  useEffect(() => {
    const fetchImage = async () => {
      try {
        const query = `${place.name} ${destination}`;
        const res = await axios.get(`http://127.0.0.1:8000/api/images/search?query=${encodeURIComponent(query)}`);
        setImageUrl(res.data.url);
      } catch (e) {
        console.error("Image fetch failed", e);
      }
    };
    fetchImage();
  }, [place.name, destination]);

  return (
    <div className="bg-black/30 rounded-lg border border-white/5 overflow-hidden flex flex-col md:flex-row gap-4 group">
      <div className="w-full md:w-48 h-32 md:h-auto overflow-hidden">
        <img 
          src={imageUrl} 
          alt={place.name} 
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
        />
      </div>
      <div className="p-4 flex-1">
        <div className="font-semibold text-white text-lg">{place.name}</div>
        {place.description && <div className="text-sm text-gray-400 mt-1.5 leading-relaxed">{place.description}</div>}
      </div>
    </div>
  );
}
