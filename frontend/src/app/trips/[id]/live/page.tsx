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
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [trafficLoading, setTrafficLoading] = useState(true);
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

  // Fetch traffic from our backend (which calls Google Maps Distance Matrix)
  const fetchTraffic = useCallback(async (origin: string, destination: string) => {
    if (!origin || !destination) return;
    setTrafficLoading(true);
    try {
      const res = await axios.get(`http://127.0.0.1:8000/api/traffic`, {
        params: { origin, destination },
      });
      setTraffic(res.data);
    } catch {}
    finally { setTrafficLoading(false); }
  }, []);

  useEffect(() => {
    if (!trip?.request?.destination) return;
    fetchWeather(trip.request.destination);
    fetchTraffic(trip.request.current_location || "", trip.request.destination);
    const interval = setInterval(() => {
      fetchWeather(trip.request.destination);
      fetchTraffic(trip.request.current_location || "", trip.request.destination);
    }, 5 * 60 * 1000); // refresh every 5 min
    return () => clearInterval(interval);
  }, [trip, fetchWeather, fetchTraffic]);

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
  const trafficCfg = CONGESTION_CONFIG[traffic?.congestion_level || "low"];

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
              onClick={() => { fetchWeather(destination); fetchTraffic(origin, destination); }}
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* WEATHER CARD */}
          <div className={`rounded-2xl border border-white/8 overflow-hidden bg-gradient-to-br ${getWeatherBg(weather?.weather?.[0]?.main)}`}>
            <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
              <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">🌤️ OpenWeatherMap · Live</span>
              <button onClick={() => fetchWeather(destination)} className="text-xs text-gray-500 hover:text-gray-300 transition-colors">↻</button>
            </div>
            <div className="p-5">
              {weatherLoading ? (
                <div className="space-y-3 animate-pulse">
                  <div className="h-20 bg-white/5 rounded-xl" />
                  <div className="grid grid-cols-3 gap-3">
                    {[1,2,3,4,5,6].map(i => <div key={i} className="h-16 bg-white/5 rounded-xl" />)}
                  </div>
                </div>
              ) : weather ? (
                <>
                  {/* Hero temp */}
                  <div className="flex items-center gap-4 mb-5">
                    <img src={OW_ICON(weather.weather[0].icon)} alt="" className="w-16 h-16 drop-shadow-lg" />
                    <div>
                      <p className="text-5xl font-black text-white">{Math.round(weather.main.temp)}°C</p>
                      <p className="text-gray-300 capitalize text-sm">{weather.weather[0].description}</p>
                      <p className="text-gray-500 text-xs">{weather.name}</p>
                    </div>
                    <div className="ml-auto text-right">
                      <p className="text-sm text-gray-400">Feels like <span className="text-white font-bold">{Math.round(weather.main.feels_like)}°C</span></p>
                      <p className="text-xs text-gray-500 mt-1">H:{Math.round(weather.main.temp_max)}° L:{Math.round(weather.main.temp_min)}°</p>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-2.5">
                    {[
                      { label: "Humidity", value: `${weather.main.humidity}%`, icon: "💧" },
                      { label: "Wind", value: `${Math.round(weather.wind.speed * 3.6)} km/h`, icon: "💨" },
                      { label: "Visibility", value: `${(weather.visibility / 1000).toFixed(1)} km`, icon: "👁️" },
                      { label: "Pressure", value: `${weather.main.pressure}`, icon: "🌡️" },
                      { label: "Clouds", value: `${weather.clouds.all}%`, icon: "☁️" },
                      { label: "Wind Dir", value: <WeatherWindRose deg={weather.wind.deg} />, icon: "🧭" },
                    ].map((s) => (
                      <div key={s.label} className="bg-black/25 rounded-xl p-3 border border-white/5">
                        <p className="text-base mb-1">{s.icon}</p>
                        <p className="text-white font-bold text-sm leading-none">{s.value}</p>
                        <p className="text-gray-500 text-[10px] mt-0.5 uppercase tracking-wide">{s.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Sunrise/Sunset */}
                  <div className="flex gap-3 mt-4">
                    {[
                      { label: "Sunrise", time: weather.sys.sunrise, icon: "🌅", color: "amber" },
                      { label: "Sunset",  time: weather.sys.sunset,  icon: "🌇", color: "orange" },
                    ].map((s) => (
                      <div key={s.label} className={`flex-1 flex items-center gap-2 bg-${s.color}-500/10 border border-${s.color}-500/20 rounded-xl p-3`}>
                        <span className="text-xl">{s.icon}</span>
                        <div>
                          <p className="text-[10px] text-gray-500 uppercase">{s.label}</p>
                          <p className={`text-${s.color}-400 font-bold text-sm`}>
                            {new Date(s.time * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-10 text-gray-500">
                  <p className="text-3xl mb-2">🌍</p>
                  <p className="text-sm">Weather data unavailable</p>
                  {destination && <p className="text-xs mt-1 text-gray-600">Fetching for {destination}…</p>}
                </div>
              )}
            </div>

            {/* Forecast strip */}
            {forecast.length > 0 && (
              <div className="border-t border-white/5 px-5 py-4">
                <p className="text-xs text-gray-600 uppercase tracking-wider mb-3">Next Forecast</p>
                <div className="flex gap-2.5 overflow-x-auto pb-1">
                  {forecast.map((f, i) => (
                    <div key={i} className="flex-shrink-0 text-center bg-black/20 rounded-xl px-3 py-2 min-w-[68px] border border-white/5">
                      <p className="text-[10px] text-gray-500">{new Date(f.dt * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                      <img src={OW_ICON(f.weather[0].icon)} alt="" className="w-8 h-8 mx-auto my-0.5" />
                      <p className="text-white font-bold text-sm">{Math.round(f.main.temp)}°</p>
                      {f.pop > 0 && <p className="text-blue-400 text-[10px]">{Math.round(f.pop * 100)}%</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* TRAFFIC CARD */}
          <div className="rounded-2xl border border-white/8 bg-white/[0.02] overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
              <span className="text-xs font-bold text-orange-400 uppercase tracking-wider">🚦 Live Traffic · Google Maps</span>
              <button onClick={() => fetchTraffic(origin, destination)} className="text-xs text-gray-500 hover:text-gray-300 transition-colors">↻</button>
            </div>

            <div className="p-5 flex-1 space-y-5">
              {trafficLoading ? (
                <div className="space-y-4 animate-pulse">
                  <div className="h-24 bg-white/5 rounded-2xl" />
                  <div className="h-16 bg-white/5 rounded-2xl" />
                  <div className="grid grid-cols-2 gap-3">
                    <div className="h-24 bg-white/5 rounded-2xl" />
                    <div className="h-24 bg-white/5 rounded-2xl" />
                  </div>
                </div>
              ) : traffic ? (
                <>
                  {/* Congestion hero */}
                  <div className={`rounded-2xl p-5 border ${
                    traffic.congestion_level === "very_high" ? "bg-red-500/10 border-red-500/30" :
                    traffic.congestion_level === "high" ? "bg-orange-500/10 border-orange-500/30" :
                    traffic.congestion_level === "moderate" ? "bg-yellow-500/10 border-yellow-500/30" :
                    "bg-green-500/10 border-green-500/30"
                  }`}>
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Current Congestion</p>
                        <p className={`text-3xl font-black ${trafficCfg.color}`}>
                          {trafficCfg.icon} {trafficCfg.label}
                        </p>
                      </div>
                      <div className="text-right">
                        {traffic.delay_minutes > 0 ? (
                          <>
                            <p className="text-xs text-gray-500">Extra delay</p>
                            <p className="text-2xl font-black text-orange-400">+{traffic.delay_minutes}m</p>
                          </>
                        ) : (
                          <p className="text-green-400 font-bold text-sm">No Delay</p>
                        )}
                      </div>
                    </div>
                    {/* Congestion bar */}
                    <div className="h-2 bg-black/30 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${trafficCfg.bar} rounded-full transition-all duration-700`}
                        style={{ width: `${Math.min(100, (traffic.ratio - 1) * 200)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-gray-600 mt-1">
                      <span>Free Flow</span><span>Standstill</span>
                    </div>
                  </div>

                  {/* Route + time cards */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-black/30 border border-white/8 rounded-2xl p-4">
                      <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Normal Time</p>
                      <p className="text-white font-black text-xl">{traffic.normal_duration}</p>
                      <p className="text-gray-600 text-xs mt-1">Without traffic</p>
                    </div>
                    <div className={`border rounded-2xl p-4 ${traffic.delay_minutes > 0 ? 'bg-orange-500/8 border-orange-500/20' : 'bg-green-500/8 border-green-500/20'}`}>
                      <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">With Traffic</p>
                      <p className={`font-black text-xl ${traffic.delay_minutes > 0 ? 'text-orange-300' : 'text-green-400'}`}>{traffic.traffic_duration}</p>
                      <p className="text-gray-600 text-xs mt-1">Current estimate</p>
                    </div>
                  </div>

                  {/* Distance + source */}
                  <div className="flex items-center justify-between bg-black/20 border border-white/5 rounded-2xl px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">📍</span>
                      <div>
                        <p className="text-xs text-gray-500">Route Distance</p>
                        <p className="text-white font-bold">{traffic.distance_km} km</p>
                      </div>
                    </div>
                    <a
                      href={`https://www.google.com/maps/dir/${encodeURIComponent(origin + ', India')}/${encodeURIComponent(destination + ', India')}`}
                      target="_blank" rel="noopener noreferrer"
                      className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-blue-500/20 bg-blue-500/10 transition-all"
                    >
                      🗺️ Maps ↗
                    </a>
                  </div>

                  {/* Route strip */}
                  <div className="flex items-center gap-2 bg-black/20 border border-white/5 rounded-2xl px-4 py-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 mb-0.5">From</p>
                      <p className="text-white font-semibold text-sm truncate">{origin || "—"}</p>
                    </div>
                    <div className="text-gray-600 flex-shrink-0 px-2">→</div>
                    <div className="flex-1 min-w-0 text-right">
                      <p className="text-xs text-gray-500 mb-0.5">To</p>
                      <p className="text-white font-semibold text-sm truncate">{destination || "—"}</p>
                    </div>
                  </div>

                  {/* Data source badge */}
                  <p className="text-center text-[10px] text-gray-600">
                    {traffic.source === "google_maps" ? "🟢 Real-time data via Google Maps Distance Matrix API" : "🟡 Estimated data (enable Google Maps API for live data)"}
                    {traffic.fetched_at && ` · Updated ${traffic.fetched_at}`}
                  </p>
                </>
              ) : (
                <div className="text-center py-10 text-gray-500">
                  <p className="text-3xl mb-2">🚦</p>
                  <p className="text-sm">Traffic data unavailable</p>
                  {origin && destination && <p className="text-xs mt-1 text-gray-600">Fetching {origin} → {destination}…</p>}
                </div>
              )}
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
