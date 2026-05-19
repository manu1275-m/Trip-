"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Navigation from "@/components/Navigation";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "axios";

const OW_KEY = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY!;
const OW_ICON = (code: string) => `https://openweathermap.org/img/wn/${code}@2x.png`;

function WeatherWindRose({ deg }: { deg: number }) {
  const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return <span className="text-amber-400 font-bold">{dirs[Math.round(deg / 45) % 8]}</span>;
}

const CONGESTION_CONFIG: Record<string, { label: string; color: string; bar: string; icon: string }> = {
  low:       { label: "Low",       color: "text-green-400",  bar: "bg-green-400",  icon: "🟢" },
  moderate:  { label: "Moderate",  color: "text-yellow-400", bar: "bg-yellow-400", icon: "🟡" },
  high:      { label: "Heavy",     color: "text-orange-400", bar: "bg-orange-400", icon: "🟠" },
  very_high: { label: "Severe",    color: "text-red-400",    bar: "bg-red-400",    icon: "🔴" },
};

export default function LiveAssistant({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [trip, setTrip] = useState<any>(null);
  const [snapshot, setSnapshot] = useState<any>(null);
  const [weather, setWeather] = useState<any>(null);
  const [forecast, setForecast] = useState<any[]>([]);
  const [traffic, setTraffic] = useState<any>(null);
  const [segments, setSegments] = useState<any[]>([]);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [segmentsLoading, setSegmentsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState("");
  const [status, setStatus] = useState("Connecting…");
  const eventSourceRef = useRef<EventSource | null>(null);

  // Load trip data
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/auth/login"); return; }
    axios.get(`http://127.0.0.1:8000/api/trips/${params.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then((r) => setTrip(r.data)).catch(() => {});
  }, [params.id, router]);

  // Fetch weather
  const fetchWeather = useCallback(async (destination: string) => {
    if (!destination || !OW_KEY) return;
    setWeatherLoading(true);
    try {
      const [curRes, foreRes] = await Promise.all([
        axios.get(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(destination)},IN&appid=${OW_KEY}&units=metric`),
        axios.get(`https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(destination)},IN&appid=${OW_KEY}&units=metric&cnt=5`),
      ]);
      setWeather(curRes.data);
      setForecast(foreRes.data.list);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch {}
    finally { setWeatherLoading(false); }
  }, []);

  // Fetch traffic for all segments in the itinerary
  const fetchItineraryTraffic = useCallback(async (tripData: any) => {
    if (!tripData?.raw_plan) return;
    
    let parsed: any = null;
    try {
      if (typeof tripData.raw_plan === "object") {
        parsed = tripData.raw_plan;
      } else {
        const match = tripData.raw_plan.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        parsed = JSON.parse(match ? match[1] : tripData.raw_plan);
      }
    } catch { return; }

    if (!parsed) return;

    const dayKeys = Object.keys(parsed)
      .filter((k) => /day/i.test(k))
      .sort((a, b) => (parseInt(a.replace(/\D/g, "")) || 0) - (parseInt(b.replace(/\D/g, "")) || 0));

    const places: string[] = [];
    dayKeys.forEach(d => {
      const dayPlaces = parsed[d]?.places || [];
      dayPlaces.forEach((p: any) => {
        if (p.name) places.push(p.name);
      });
    });

    const uniqueOrderedPlaces = places.filter((v, i, a) => a.indexOf(v) === i);
    if (uniqueOrderedPlaces.length < 2) {
      setSegmentsLoading(false);
      return;
    }

    setSegmentsLoading(true);
    const results: any[] = [];
    try {
      // We limit to first 6 segments to avoid hitting rate limits too hard
      const segmentsToFetch = uniqueOrderedPlaces.slice(0, 7); 
      for (let i = 0; i < segmentsToFetch.length - 1; i++) {
        const res = await axios.get(`http://127.0.0.1:8000/api/traffic`, {
          params: { origin: segmentsToFetch[i], destination: segmentsToFetch[i+1] },
        });
        results.push(res.data);
      }
      setSegments(results);
    } catch (err) {
      console.error("Failed to fetch segments traffic", err);
    } finally {
      setSegmentsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!trip?.request?.destination) return;
    fetchWeather(trip.request.destination);
    fetchItineraryTraffic(trip);
    const interval = setInterval(() => {
      fetchWeather(trip.request.destination);
      fetchItineraryTraffic(trip);
    }, 5 * 60 * 1000); // refresh every 5 min
    return () => clearInterval(interval);
  }, [trip, fetchWeather, fetchItineraryTraffic]);

  // SSE for AI agent snapshot
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    const connectSSE = () => {
      const es = new EventSource(`http://127.0.0.1:8000/api/trips/${params.id}/live?token=${token}`);
      eventSourceRef.current = es;
      es.onopen = () => setStatus("Live · AI Agents monitoring");
      es.addEventListener("connected", () => setStatus("Live · AI Agents monitoring"));
      es.addEventListener("monitoring", (event: any) => {
        try { setSnapshot(JSON.parse(event.data).snapshot); } catch {}
      });
      es.addEventListener("error", () => {
        setStatus("Reconnecting…");
        es.close();
        setTimeout(connectSSE, 5000);
      });
    };
    connectSSE();
    return () => { eventSourceRef.current?.close(); };
  }, [params.id]);

  const destination = trip?.request?.destination || "";
  const origin = trip?.request?.current_location || "";

  const getWeatherBg = (main?: string) => {
    switch (main?.toLowerCase()) {
      case "clear": return "from-blue-600/20 to-amber-500/10";
      case "clouds": return "from-gray-700/20 to-blue-900/10";
      case "rain": return "from-blue-900/30 to-gray-800/20";
      case "thunderstorm": return "from-purple-900/30 to-gray-900/20";
      default: return "from-blue-600/15 to-indigo-900/10";
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#09090b]">
      <Navigation />

      {/* Header */}
      <div className={`relative border-b border-white/5 overflow-hidden bg-gradient-to-br ${getWeatherBg(weather?.weather?.[0]?.main)} transition-all duration-1000`}>
        <div className="max-w-7xl mx-auto px-4 py-8 relative">
          <Link href={`/trips/${params.id}/plan`} className="inline-flex items-center gap-1.5 text-gray-500 hover:text-gray-300 text-sm mb-5 group transition-colors">
            <span className="group-hover:-translate-x-0.5 transition-transform">←</span> Back to Itinerary
          </Link>
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <div className="flex items-center gap-2 bg-red-500/15 border border-red-500/25 px-3 py-1.5 rounded-full">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
              </span>
              <span className="text-xs font-bold uppercase tracking-widest text-red-400">Live Monitor</span>
            </div>
            {lastUpdated && <span className="text-xs text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20">↻ {lastUpdated}</span>}
            <button
              onClick={() => { fetchWeather(destination); fetchItineraryTraffic(trip); }}
              className="text-xs text-gray-500 hover:text-gray-300 px-2 py-0.5 rounded-full border border-white/10 hover:border-white/20 transition-all"
            >
              Refresh All
            </button>
          </div>
          <h1 className="text-3xl font-extrabold text-white">Live Trip Assistant</h1>
          <p className="text-sm text-gray-400 mt-1">
            {origin && destination ? `${origin} → ${destination}` : destination || "Loading…"} · {status}
          </p>
        </div>
      </div>

      <main className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full space-y-6">

        {/* ── Row 1: Weather + Traffic side by side ────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Weather & AI Safety */}
          <div className="lg:col-span-1 space-y-6">
            {/* WEATHER CARD */}
            <div className={`rounded-3xl border border-white/8 overflow-hidden bg-gradient-to-br ${getWeatherBg(weather?.weather?.[0]?.main)}`}>
              <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
                <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em]">🌤️ Weather Monitor</span>
                <button onClick={() => fetchWeather(destination)} className="text-xs text-gray-500 hover:text-white transition-colors">↻</button>
              </div>
              <div className="p-6">
                {weatherLoading ? (
                  <div className="space-y-4 animate-pulse">
                    <div className="h-16 bg-white/5 rounded-2xl" />
                    <div className="grid grid-cols-2 gap-3">
                      {[1,2,3,4].map(i => <div key={i} className="h-12 bg-white/5 rounded-xl" />)}
                    </div>
                  </div>
                ) : weather ? (
                  <>
                    <div className="flex items-center gap-5 mb-6">
                      <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center border border-white/10">
                        <img src={OW_ICON(weather.weather[0].icon)} alt="" className="w-16 h-16 drop-shadow-2xl" />
                      </div>
                      <div>
                        <p className="text-5xl font-black text-white tracking-tighter">{Math.round(weather.main.temp)}°</p>
                        <p className="text-gray-300 font-bold capitalize">{weather.weather[0].description}</p>
                        <p className="text-gray-500 text-xs mt-0.5">{weather.name}, India</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { label: "Humidity", value: `${weather.main.humidity}%`, icon: "💧" },
                        { label: "Wind", value: `${Math.round(weather.wind.speed * 3.6)} km/h`, icon: "💨" },
                        { label: "Visibility", value: `${(weather.visibility / 1000).toFixed(1)} km`, icon: "👁️" },
                        { label: "Feels Like", value: `${Math.round(weather.main.feels_like)}°`, icon: "🌡️" },
                      ].map((s) => (
                        <div key={s.label} className="bg-white/[0.03] rounded-2xl p-3 border border-white/5 flex items-center gap-3">
                          <span className="text-lg">{s.icon}</span>
                          <div>
                            <p className="text-white font-bold text-xs leading-none">{s.value}</p>
                            <p className="text-[9px] text-gray-500 uppercase tracking-widest mt-1">{s.label}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : null}
              </div>
            </div>

            {/* AI AGENT SNAPSHOT CARD */}
            <div className="rounded-3xl border border-white/8 bg-white/[0.02] overflow-hidden">
              <div className="px-5 py-4 border-b border-white/5">
                <span className="text-[10px] font-black text-purple-400 uppercase tracking-[0.2em]">🛡️ AI Safety Monitor</span>
              </div>
              <div className="p-6">
                {snapshot ? (
                  <div className="space-y-4">
                    {snapshot.safety_alerts?.length > 0 ? (
                      snapshot.safety_alerts.map((alert: string, i: number) => (
                        <div key={i} className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex gap-3">
                          <span className="text-lg">⚠️</span>
                          <p className="text-xs text-red-300 leading-relaxed font-medium">{alert}</p>
                        </div>
                      ))
                    ) : (
                      <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-4 flex gap-3">
                        <span className="text-lg">✅</span>
                        <p className="text-xs text-green-300 leading-relaxed font-medium">No safety threats detected. Local authorities report normal conditions.</p>
                      </div>
                    )}
                    <div className="bg-white/5 rounded-2xl p-4">
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Recommended Action</p>
                      <p className="text-sm text-gray-300 font-medium italic">"{snapshot.recommended_action}"</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <div className="w-10 h-10 border-2 border-purple-500/20 border-t-purple-500 rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-xs text-gray-500">AI Agents are analyzing current environment...</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Unified Journey Timeline */}
          <div className="lg:col-span-2">
            <div className="rounded-3xl border border-white/8 bg-white/[0.02] overflow-hidden flex flex-col h-full">
              <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
                <div>
                  <h2 className="text-lg font-black text-white leading-none">Live Itinerary Timeline</h2>
                  <p className="text-[10px] text-gray-500 uppercase tracking-[0.2em] mt-2 font-bold">Real-time distance & traffic</p>
                </div>
                <button onClick={() => fetchItineraryTraffic(trip)} className="bg-white/5 hover:bg-white/10 px-4 py-2 rounded-xl text-xs font-bold text-white transition-all border border-white/10">Refresh ↻</button>
              </div>

              <div className="p-8 flex-1">
                {segmentsLoading ? (
                  <div className="space-y-8 animate-pulse">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="flex gap-6">
                        <div className="w-12 h-12 bg-white/5 rounded-full" />
                        <div className="flex-1 h-20 bg-white/5 rounded-2xl" />
                      </div>
                    ))}
                  </div>
                ) : segments.length > 0 ? (
                  <div className="space-y-0">
                    {/* First Place */}
                    <div className="relative flex gap-6 pb-4">
                      <div className="absolute left-6 top-10 bottom-0 w-[2px] bg-gradient-to-b from-amber-500/40 to-white/5" />
                      <div className="relative z-10 w-12 h-12 rounded-full bg-amber-500 flex items-center justify-center text-black font-black text-xl shadow-[0_0_20px_rgba(245,158,11,0.3)]">
                        1
                      </div>
                      <div className="flex-1 pt-1">
                        <h3 className="text-xl font-black text-white">{segments[0].origin}</h3>
                        <p className="text-xs text-amber-500/60 font-bold uppercase tracking-widest mt-1">Starting Point</p>
                      </div>
                    </div>

                    {/* Middle Segments */}
                    {segments.map((seg, i) => {
                      const cfg = CONGESTION_CONFIG[seg.congestion_level || "low"];
                      return (
                        <div key={i}>
                          {/* THE CONNECTION (TRAFFIC & DISTANCE) */}
                          <div className="relative flex gap-6 py-4">
                            <div className="absolute left-6 top-0 bottom-0 w-[2px] bg-white/5" />
                            <div className="w-12 flex justify-center py-2">
                              <div className={`w-1 h-12 rounded-full ${cfg.bar}`} />
                            </div>
                            <div className="flex-1 flex items-center py-2">
                              <div className="bg-white/[0.03] border border-white/5 rounded-2xl px-5 py-3 flex flex-wrap items-center gap-x-8 gap-y-2">
                                <div className="flex items-center gap-3">
                                  <span className="text-lg">🛣️</span>
                                  <div>
                                    <p className="text-[9px] text-gray-500 uppercase font-black tracking-widest">Distance</p>
                                    <p className="text-white font-black">{seg.distance_km} km</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className="text-lg">{cfg.icon}</span>
                                  <div>
                                    <p className="text-[9px] text-gray-500 uppercase font-black tracking-widest">Traffic Time</p>
                                    <p className={`font-black ${cfg.color}`}>{seg.traffic_duration}</p>
                                  </div>
                                </div>
                                {seg.delay_minutes > 0 && (
                                  <div className="flex items-center gap-3">
                                    <span className="text-lg">⌛</span>
                                    <div>
                                      <p className="text-[9px] text-orange-500 uppercase font-black tracking-widest">Congestion</p>
                                      <p className="text-orange-400 font-black">+{seg.delay_minutes}m delay</p>
                                    </div>
                                  </div>
                                )}
                                <a 
                                  href={`https://www.google.com/maps/dir/${encodeURIComponent(seg.origin + ', India')}/${encodeURIComponent(seg.destination + ', India')}`}
                                  target="_blank" rel="noopener noreferrer"
                                  className="ml-auto bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg text-[10px] font-black text-blue-400 uppercase border border-blue-400/20 transition-all"
                                >
                                  Open Map ↗
                                </a>
                              </div>
                            </div>
                          </div>

                          {/* Next Place */}
                          <div className="relative flex gap-6 py-4">
                            {i < segments.length - 1 && (
                              <div className="absolute left-6 top-0 bottom-0 w-[2px] bg-white/5" />
                            )}
                            <div className="relative z-10 w-12 h-12 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-white font-black text-xl">
                              {i + 2}
                            </div>
                            <div className="flex-1 pt-1">
                              <h3 className="text-xl font-black text-white">{seg.destination}</h3>
                              <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">Next Destination</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-20 bg-white/[0.01] border border-dashed border-white/5 rounded-3xl">
                    <div className="text-5xl mb-4 opacity-20">📍</div>
                    <h3 className="text-xl font-bold text-white mb-2">No timeline segments</h3>
                    <p className="text-gray-500 text-sm max-w-xs mx-auto">Once your AI itinerary is generated with real locations, we'll track the distance and traffic between every stop here.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
