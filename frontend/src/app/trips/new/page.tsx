"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

// Agent steps shown during generation
const AGENT_STEPS = [
  { id: "planner",   icon: "🧠", label: "Planner Agent",     desc: "Understanding your travel preferences…" },
  { id: "weather",   icon: "🌤️", label: "Weather Agent",     desc: "Checking climate & forecasts for your dates…" },
  { id: "places",    icon: "📍", label: "Discovery Agent",   desc: "Finding top attractions & hidden gems…" },
  { id: "budget",    icon: "💰", label: "Budget Agent",      desc: "Calculating costs & finding best value…" },
  { id: "transport", icon: "✈️", label: "Transport Agent",   desc: "Analyzing flights, trains & local options…" },
  { id: "hotel",     icon: "🏨", label: "Hotel Agent",       desc: "Selecting best-rated stays for your trip…" },
  { id: "safety",    icon: "🛡️", label: "Safety Agent",      desc: "Checking travel advisories & alerts…" },
  { id: "itinerary", icon: "📅", label: "Itinerary Agent",   desc: "Assembling your perfect day-by-day plan…" },
  { id: "review",    icon: "✅", label: "Review Agent",      desc: "Optimising and finalising your itinerary…" },
];

const POPULAR_ROUTES = [
  { from: "Mumbai",    to: "Goa" },
  { from: "Delhi",     to: "Jaipur" },
  { from: "Bangalore", to: "Kerala" },
  { from: "Chennai",   to: "Pondicherry" },
];

const INTERESTS = ["Culture", "Food", "Nature", "Adventure", "History", "Beaches", "Mountains", "Wildlife"];

export default function CreateTrip() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentLocation, setCurrentLocation] = useState("");
  const [destination, setDestination] = useState("");
  const [travelDate, setTravelDate] = useState("");
  const [days, setDays] = useState("3");
  const [selectedInterests, setSelectedInterests] = useState<string[]>(["Culture", "Food"]);
  const [emergencyName, setEmergencyName] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");
  const [emergencyRelation, setEmergencyRelation] = useState("");

  // Agent progress state
  const [currentStep, setCurrentStep] = useState(-1);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);

  const toggleInterest = (i: string) =>
    setSelectedInterests((prev) =>
      prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]
    );

  // Simulate agent steps progressing during real API call
  const simulateProgress = () => {
    const totalSteps = AGENT_STEPS.length;
    const totalMs = 75_000; // 75s total spread across steps
    const msPerStep = totalMs / totalSteps;

    AGENT_STEPS.forEach((step, idx) => {
      setTimeout(() => {
        setCurrentStep(idx);
      }, idx * msPerStep);

      setTimeout(() => {
        setCompletedSteps((prev) => [...prev, step.id]);
      }, idx * msPerStep + msPerStep * 0.8);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setCurrentStep(-1);
    setCompletedSteps([]);

    // Start progress animation immediately
    simulateProgress();

    try {
      const token = localStorage.getItem("token");
      if (!token) { router.push("/auth/login"); return; }
      const response = await axios.post(
        "http://127.0.0.1:8000/api/trips/plan",
        {
          current_location: currentLocation,
          destination,
          travel_date: travelDate,
          number_of_days: parseInt(days, 10),
          travelers: [],
          saved_traveler_ids: [],
          preferences: {
            budget: "standard",
            pace: "balanced",
            interests: selectedInterests.map((i) => i.toLowerCase()),
            accessibility_needs: [],
          },
          emergency_contact: emergencyName ? {
            name: emergencyName,
            phone: emergencyPhone,
            relation: emergencyRelation,
          } : null,
        },
        { headers: { Authorization: `Bearer ${token}` }, timeout: 600_000 }
      );
      router.push(`/trips/${response.data.trip_id}/plan`);
    } catch (err: any) {
      setIsLoading(false);
      setCurrentStep(-1);
      setCompletedSteps([]);
      setError(err.response?.data?.detail || "Failed to generate plan. Please try again.");
    }
  };

  // ── Agent progress overlay ─────────────────────────────────────────────────
  if (isLoading) {
    const doneCount = completedSteps.length;
    const progressPct = Math.round((doneCount / AGENT_STEPS.length) * 100);

    return (
      <div className="fixed inset-0 bg-[#09090b] z-50 flex flex-col items-center justify-center px-4">
        {/* Background glows */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-lg relative">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="relative w-20 h-20 mx-auto mb-5">
              <div className="absolute inset-0 rounded-full border-4 border-amber-500/20 border-t-amber-500 animate-spin" />
              <div className="absolute inset-2.5 rounded-full border-4 border-blue-500/20 border-b-blue-400 animate-spin" style={{ animationDirection: "reverse", animationDuration: "0.7s" }} />
              <div className="absolute inset-0 flex items-center justify-center text-2xl">🤖</div>
            </div>
            <h2 className="text-2xl font-extrabold text-white">Deploying AI Agents</h2>
            <p className="text-gray-400 text-sm mt-1.5">
              {currentLocation} → {destination} · {days} days
            </p>
          </div>

          {/* Progress bar */}
          <div className="mb-6">
            <div className="flex justify-between text-xs text-gray-500 mb-2">
              <span>{doneCount} of {AGENT_STEPS.length} agents done</span>
              <span>{progressPct}%</span>
            </div>
            <div className="h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-orange-400 rounded-full transition-all duration-700"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          {/* Agent steps list */}
          <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
            {AGENT_STEPS.map((step, idx) => {
              const isDone = completedSteps.includes(step.id);
              const isActive = currentStep === idx && !isDone;
              const isPending = currentStep < idx;

              return (
                <div
                  key={step.id}
                  className={`flex items-center gap-4 px-4 py-3 rounded-2xl border transition-all duration-500 ${
                    isDone
                      ? "bg-green-500/8 border-green-500/20"
                      : isActive
                      ? "bg-amber-500/10 border-amber-500/30 shadow-lg shadow-amber-500/10"
                      : "bg-white/[0.02] border-white/5 opacity-50"
                  }`}
                >
                  {/* Status icon */}
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-lg transition-all ${
                    isDone ? "bg-green-500/20" : isActive ? "bg-amber-500/20 animate-pulse" : "bg-white/5"
                  }`}>
                    {isDone ? "✅" : step.icon}
                  </div>

                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-bold leading-none ${isDone ? "text-green-400" : isActive ? "text-amber-400" : "text-gray-500"}`}>
                      {step.label}
                    </p>
                    <p className={`text-xs mt-0.5 truncate ${isActive ? "text-gray-300" : "text-gray-600"}`}>
                      {isDone ? "Complete" : step.desc}
                    </p>
                  </div>

                  {/* Right indicator */}
                  {isActive && (
                    <div className="w-4 h-4 rounded-full border-2 border-amber-500/40 border-t-amber-400 animate-spin flex-shrink-0" />
                  )}
                  {isDone && (
                    <div className="w-4 h-4 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center text-[10px] flex-shrink-0">✓</div>
                  )}
                </div>
              );
            })}
          </div>

          <p className="text-center text-xs text-gray-600 mt-6">
            This takes 30–90 seconds. Please don't close this tab.
          </p>
        </div>
      </div>
    );
  }

  // ── Trip creation form ─────────────────────────────────────────────────────
  return (
    <div className="flex flex-col min-h-screen bg-[#09090b]">
      {/* Inline mini-nav for non-auth pages */}
      <nav className="sticky top-0 z-50 bg-[#09090b]/95 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <a href="/dashboard" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center font-black text-black text-sm group-hover:scale-110 transition-transform">A</div>
            <span className="font-bold text-white text-base hidden sm:block">Agentic<span className="text-amber-400">Travel</span></span>
          </a>
          <a href="/dashboard" className="text-xs text-gray-500 hover:text-gray-300 transition-colors flex items-center gap-1">← Dashboard</a>
        </div>
      </nav>

      <main className="flex-1 max-w-6xl mx-auto px-4 py-10 w-full">
        <div className="flex flex-col lg:flex-row gap-10">
          {/* Form */}
          <div className="flex-1">
            <div className="mb-8">
              <p className="text-amber-400 text-xs font-bold uppercase tracking-widest mb-2">🤖 Agentic Planning</p>
              <h1 className="text-4xl font-extrabold text-white tracking-tight">Plan Your Trip</h1>
              <p className="text-gray-400 mt-2 text-sm">13 AI agents will build a personalised itinerary in under 2 minutes.</p>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-2xl mb-6 flex items-center gap-2 text-sm">
                <span>⚠️</span> {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Route */}
              <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-6 space-y-4">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2"><span>🗺️</span> Route</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">From</label>
                    <input type="text" value={currentLocation} onChange={(e) => setCurrentLocation(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/10 transition-all placeholder-gray-600"
                      placeholder="e.g., Mumbai" required />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">To</label>
                    <input type="text" value={destination} onChange={(e) => setDestination(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/10 transition-all placeholder-gray-600"
                      placeholder="e.g., Kerala" required />
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-2">Popular routes:</p>
                  <div className="flex flex-wrap gap-2">
                    {POPULAR_ROUTES.map((r) => (
                      <button key={r.to} type="button" onClick={() => { setCurrentLocation(r.from); setDestination(r.to); }}
                        className="text-xs bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white px-3 py-1.5 rounded-lg border border-white/8 transition-all">
                        {r.from} → {r.to}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Dates & Duration */}
              <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-6 space-y-4">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2"><span>📅</span> When</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">Travel Date</label>
                    <input type="date" value={travelDate} onChange={(e) => setTravelDate(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/10 transition-all [color-scheme:dark]" required />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">
                      Duration: <span className="text-amber-400">{days} day{parseInt(days) > 1 ? "s" : ""}</span>
                    </label>
                    <input type="range" min="1" max="14" value={days} onChange={(e) => setDays(e.target.value)}
                      className="w-full accent-amber-500 cursor-pointer mt-3" />
                    <div className="flex justify-between text-xs text-gray-600 mt-1"><span>1 day</span><span>14 days</span></div>
                  </div>
                </div>
              </div>
              
              {/* Emergency Contact */}
              <div className="rounded-2xl border border-red-500/15 bg-red-500/5 p-6 space-y-4">
                <h3 className="text-xs font-bold text-red-400 uppercase tracking-wider flex items-center gap-2"><span>🚨</span> Emergency Contact</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">Name</label>
                    <input type="text" value={emergencyName} onChange={(e) => setEmergencyName(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-red-500/50 focus:ring-2 focus:ring-red-500/10 transition-all placeholder-gray-600"
                      placeholder="Full Name" required />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">Phone</label>
                    <input type="tel" value={emergencyPhone} onChange={(e) => setEmergencyPhone(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-red-500/50 focus:ring-2 focus:ring-red-500/10 transition-all placeholder-gray-600"
                      placeholder="Phone Number" required />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">Relation</label>
                    <input type="text" value={emergencyRelation} onChange={(e) => setEmergencyRelation(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-red-500/50 focus:ring-2 focus:ring-red-500/10 transition-all placeholder-gray-600"
                      placeholder="e.g., Parent" required />
                  </div>
                </div>
              </div>

              {/* Interests */}
              <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-6 space-y-4">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2"><span>❤️</span> Interests</h3>
                <div className="flex flex-wrap gap-2">
                  {INTERESTS.map((interest) => (
                    <button key={interest} type="button" onClick={() => toggleInterest(interest)}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
                        selectedInterests.includes(interest)
                          ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                          : "bg-white/5 text-gray-400 border-white/8 hover:border-white/15 hover:text-white"
                      }`}>
                      {interest}
                    </button>
                  ))}
                </div>
              </div>

              <button type="submit"
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-extrabold py-4 rounded-2xl text-base transition-all hover:scale-[1.01] active:scale-[0.98] shadow-xl shadow-amber-500/25 flex items-center justify-center gap-3">
                <span className="text-xl">🚀</span> Generate {days}-Day AI Itinerary
              </button>
              <p className="text-center text-xs text-gray-600">Takes 30–90 seconds · 9 agents work simultaneously</p>
            </form>
          </div>

          {/* Sidebar */}
          <aside className="lg:w-72 flex-shrink-0 space-y-4 lg:pt-20">
            <div className="rounded-2xl border border-amber-500/15 bg-amber-500/5 p-5">
              <p className="text-amber-400 font-bold text-sm mb-3">🤖 What the AI does</p>
              <ul className="space-y-2 text-sm text-gray-400">
                {["Researches real places & routes", "Checks live weather forecasts", "Finds best-value hotels", "Optimises day-by-day itinerary", "Monitors safety alerts", "Tracks transport options"].map((item) => (
                  <li key={item} className="flex items-start gap-2"><span className="text-green-400 mt-0.5">✓</span><span>{item}</span></li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-5">
              <p className="text-sm font-bold text-white mb-3">📊 Average Results</p>
              <div className="space-y-3">
                {[{ label: "Planning time saved", value: "8 hours" }, { label: "Cost optimisation", value: "Up to 25%" }, { label: "Places per day", value: "2-3 gems" }].map((stat) => (
                  <div key={stat.label} className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">{stat.label}</span>
                    <span className="text-sm font-bold text-white">{stat.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
