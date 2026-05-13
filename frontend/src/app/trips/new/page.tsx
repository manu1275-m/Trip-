"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Navigation from "@/components/Navigation";
import axios from "axios";

export default function CreateTrip() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [currentLocation, setCurrentLocation] = useState("");
  const [destination, setDestination] = useState("");
  const [travelDate, setTravelDate] = useState("");
  const [days, setDays] = useState("3");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/auth/login");
        return;
      }

      const response = await axios.post("http://127.0.0.1:8000/api/trips/plan", {
        current_location: currentLocation,
        destination: destination,
        travel_date: travelDate,
        number_of_days: parseInt(days, 10),
        travelers: [],
        saved_traveler_ids: [],
        preferences: {
          budget: "standard",
          pace: "balanced",
          interests: ["culture", "food", "nature"],
          accessibility_needs: []
        }
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      router.push(`/trips/${response.data.trip_id}/plan`);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || "Failed to generate plan. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navigation />
      
      <main className="flex-1 py-12 px-4 max-w-3xl mx-auto w-full">
        <div className="glass-panel p-8">
          <h1 className="text-3xl font-bold mb-2">Create New Journey</h1>
          <p className="text-gray-400 mb-8">Deploy 13 AI Agents to craft your perfect Indian adventure.</p>

          {error && <div className="bg-red-500/10 text-red-500 p-4 rounded-lg mb-6">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Starting Location</label>
                <input 
                  type="text" 
                  value={currentLocation}
                  onChange={(e) => setCurrentLocation(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="e.g., Mumbai"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Destination (India Only)</label>
                <input 
                  type="text" 
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="e.g., Kerala"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Travel Date</label>
                <input 
                  type="date" 
                  value={travelDate}
                  onChange={(e) => setTravelDate(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary color-scheme-dark"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Duration (Days)</label>
                <input 
                  type="number" 
                  min="1" max="21"
                  value={days}
                  onChange={(e) => setDays(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Travelers</label>
                <input 
                  type="number" 
                  min="1" max="10"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
                  defaultValue="1"
                  required
                />
              </div>
            </div>

            <div className="pt-6">
              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full bg-primary hover:bg-primary/90 text-background font-bold px-8 py-4 rounded-xl text-lg transition-transform hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100 flex justify-center items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <span className="animate-spin text-xl">⚙️</span>
                    Deploying Agents...
                  </>
                ) : (
                  "Generate Agentic Plan"
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
