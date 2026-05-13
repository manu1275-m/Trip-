"use client";

import { useEffect, useState, useRef } from "react";
import Navigation from "@/components/Navigation";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LiveAssistant({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [snapshot, setSnapshot] = useState<any>(null);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("Connecting to Agents...");
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/auth/login");
      return;
    }

    const connectSSE = () => {
      const url = `http://127.0.0.1:8000/api/trips/${params.id}/live?token=${token}`;
      const es = new EventSource(url);
      eventSourceRef.current = es;

      es.onopen = () => setStatus("Connected. Monitoring Live Conditions...");
      
      es.addEventListener("connected", (event: any) => {
        setStatus("Live Assistant Active");
      });

      es.addEventListener("monitoring", (event: any) => {
        try {
          const data = JSON.parse(event.data);
          setSnapshot(data.snapshot);
          setStatus(`Last updated: ${new Date().toLocaleTimeString()}`);
        } catch (e) {
          console.error("Failed to parse monitoring data", e);
        }
      });

      es.addEventListener("error", (event: any) => {
        console.error("SSE Error", event);
        if (event.data) {
          try {
            const data = JSON.parse(event.data);
            if (data.detail) setError(data.detail);
          } catch (e) {}
        }
        setStatus("Connection lost. Retrying in 5s...");
        es.close();
        setTimeout(connectSSE, 5000); // Reconnect
      });
    };

    connectSSE();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [params.id, router]);

  return (
    <div className="flex flex-col min-h-screen">
      <Navigation />
      
      <main className="flex-1 py-12 px-4 max-w-7xl mx-auto w-full">
        <header className="mb-12 flex justify-between items-end">
          <div>
            <Link href={`/trips/${params.id}/plan`} className="text-gray-400 hover:text-white mb-4 inline-block">&larr; Back to Itinerary</Link>
            <div className="flex items-center gap-3 mb-2">
              <span className="relative flex h-3 w-3 mr-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-red-400 bg-red-400/10 px-3 py-1 rounded-full">Live Monitor</span>
              <span className="text-gray-400 text-sm">Trip ID: {params.id}</span>
            </div>
            <h1 className="text-4xl font-bold text-white mb-2">Live Trip Assistant</h1>
            <p className="text-sm text-gray-400">{status}</p>
          </div>
        </header>

        {error ? (
          <div className="glass-panel p-8 text-center text-red-400 mb-8">{error}</div>
        ) : !snapshot ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin text-4xl text-primary mb-4">⚙️</div>
            <p className="text-gray-400 animate-pulse">Agents are analyzing live data...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            <div className="glass-panel p-6 border-t-4 border-t-blue-400">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-white">
                <span>🌤️</span> Weather
              </h3>
              <div className="bg-black/30 p-4 rounded-lg">
                <p className="text-gray-300 font-medium">{snapshot.weather?.condition || "Clear"}</p>
                <p className="text-sm text-gray-400 mt-2">Temp: {snapshot.weather?.temperature_c ? `${snapshot.weather.temperature_c}°C` : "28°C"}</p>
              </div>
            </div>

            <div className="glass-panel p-6 border-t-4 border-t-orange-400">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-white">
                <span>🚦</span> Traffic
              </h3>
              <div className="bg-black/30 p-4 rounded-lg">
                <p className="text-gray-300 font-medium capitalize">{(snapshot.traffic?.congestion_level || "normal")} Traffic</p>
                <p className="text-sm text-gray-400 mt-2">Delay: {snapshot.traffic?.delay_minutes || 0} mins</p>
              </div>
            </div>

            <div className="glass-panel p-6 border-t-4 border-t-red-500">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-white">
                <span>⚠️</span> Safety Alerts
              </h3>
              <div className="bg-black/30 p-4 rounded-lg">
                {snapshot.safety_alerts && snapshot.safety_alerts.length > 0 ? (
                  <ul className="list-disc pl-4 space-y-1 text-gray-300 text-sm">
                    {snapshot.safety_alerts.map((alert: string, i: number) => (
                      <li key={i}>{alert}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-green-400 text-sm font-medium">All clear! No current alerts.</p>
                )}
              </div>
            </div>

            <div className={`glass-panel p-6 md:col-span-2 lg:col-span-3 border border-white/5 ${snapshot.replan_required ? 'bg-red-900/20 border-red-500/50' : ''}`}>
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-white">
                <span>🤖</span> Master Agent Recommendation
              </h3>
              <p className={`text-lg ${snapshot.replan_required ? 'text-red-400' : 'text-green-400'}`}>
                {snapshot.recommended_action || "Everything looks good, proceed as planned!"}
              </p>
              {snapshot.replan_required && (
                <button 
                  onClick={async () => {
                    const btn = document.getElementById('replan-btn');
                    if (btn) btn.innerText = "Agents Re-planning...";
                    try {
                      const token = localStorage.getItem("token");
                      const axios = (await import('axios')).default;
                      await axios.post(`http://127.0.0.1:8000/api/trips/${params.id}/replan`, {}, {
                        headers: { Authorization: `Bearer ${token}` }
                      });
                      router.push(`/trips/${params.id}/plan`);
                    } catch (err) {
                      alert("Replan failed. Please try again.");
                      if (btn) btn.innerText = "Trigger Replan";
                    }
                  }}
                  id="replan-btn"
                  className="mt-4 bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg font-bold transition-colors"
                >
                  Trigger Replan
                </button>
              )}
            </div>

          </div>
        )}
      </main>
    </div>
  );
}
