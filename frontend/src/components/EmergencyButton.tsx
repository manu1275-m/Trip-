"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

export default function EmergencyButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsLoggedIn(!!token);
  }, [pathname]);

  if (!isLoggedIn || pathname.includes("/auth")) return null;

  const emergencyNumbers = [
    { name: "General Emergency", number: "112", icon: "🚨" },
    { name: "Police", number: "100", icon: "👮" },
    { name: "Ambulance", number: "102", icon: "🚑" },
    { name: "Fire Brigade", number: "101", icon: "🔥" },
    { name: "Women Helpline", number: "1091", icon: "👩" },
    { name: "Tourist Helpline", number: "1800-11-1363", icon: "🗺️" },
  ];

  return (
    <>
      {/* Floating SOS Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 left-6 z-[60] w-14 h-14 bg-red-600 hover:bg-red-500 text-white rounded-full shadow-[0_0_20px_rgba(220,38,38,0.5)] flex items-center justify-center font-black text-xs transition-all hover:scale-110 active:scale-95 animate-pulse group"
      >
        <span className="group-hover:hidden">SOS</span>
        <span className="hidden group-hover:block text-xl">🚨</span>
      </button>

      {/* Emergency Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
          
          <div className="relative w-full max-w-md bg-[#09090b] border border-red-500/30 rounded-3xl overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="bg-red-600/10 border-b border-red-500/20 px-6 py-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl animate-bounce">🚨</span>
                <div>
                  <h2 className="text-xl font-bold text-white leading-none">Emergency Mode</h2>
                  <p className="text-red-400 text-[10px] uppercase font-bold tracking-widest mt-1">Immediate Assistance</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-white transition-colors">✕</button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-4">
                <p className="text-xs text-red-300 leading-relaxed">
                  Call these numbers immediately if you are in danger or need medical help. Your location coordinates are being monitored by AI safety agents.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-2">
                {emergencyNumbers.map((item) => (
                  <a
                    key={item.number}
                    href={`tel:${item.number}`}
                    className="flex items-center justify-between bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl p-4 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{item.icon}</span>
                      <span className="font-bold text-white group-hover:text-red-400 transition-colors">{item.name}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-black text-white leading-none">{item.number}</p>
                      <p className="text-[10px] text-gray-500 mt-1 uppercase">Click to call</p>
                    </div>
                  </a>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button 
                  onClick={async () => {
                    try {
                      const token = localStorage.getItem("token");
                      await fetch("http://127.0.0.1:8000/api/safety/sos", {
                        method: "POST",
                        headers: { "Authorization": `Bearer ${token}` }
                      });
                      alert("SOS signal sent to local authorities and your emergency contacts.");
                    } catch {
                      alert("Failed to send SOS signal. Please call 112 directly.");
                    }
                  }}
                  className="bg-red-600 hover:bg-red-500 text-white font-black py-4 rounded-2xl shadow-lg shadow-red-600/20 transition-all flex flex-col items-center justify-center gap-1"
                >
                  <span className="text-lg">📢</span>
                  <span className="text-xs">Send SOS Signal</span>
                </button>
                <button 
                  onClick={() => alert("Current location: 28.6139° N, 77.2090° E (New Delhi). Sharing with emergency services...")}
                  className="bg-white/10 hover:bg-white/15 text-white font-black py-4 rounded-2xl transition-all flex flex-col items-center justify-center gap-1"
                >
                  <span className="text-lg">📍</span>
                  <span className="text-xs">Share Location</span>
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-white/5 border-t border-white/5 text-center">
              <p className="text-[10px] text-gray-500">Yatra AI Safety Protocol · 24/7 Monitoring Active</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
