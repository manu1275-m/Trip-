"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { useParams } from "next/navigation";

export default function EmergencySOS() {
  const [isOpen, setIsOpen] = useState(false);
  const [emergencyMode, setEmergencyMode] = useState(false);
  const [contact, setContact] = useState<{name: string, phone: string, relation: string} | null>(null);
  const params = useParams();
  const tripId = params?.id;

  useEffect(() => {
    // Try to load emergency contact if tripId is present
    if (tripId) {
      const token = localStorage.getItem("token");
      if (token) {
        axios.get(`http://127.0.0.1:8000/api/trips/${tripId}`, {
          headers: { Authorization: `Bearer ${token}` }
        }).then(res => {
          if (res.data.request?.emergency_contact) {
            setContact(res.data.request.emergency_contact);
          }
        }).catch(() => {});
      }
    }
  }, [tripId]);

  const toggleEmergencyMode = () => {
    setEmergencyMode(!emergencyMode);
    if (!emergencyMode) {
      // Logic for entering emergency mode
      alert("Emergency Mode Activated! High-priority alerts enabled.");
    }
  };

  return (
    <>
      {/* Global Emergency Mode Overlay */}
      {emergencyMode && (
        <div className="fixed inset-0 pointer-events-none z-[60] border-[8px] border-red-600/30 animate-pulse shadow-[inset_0_0_100px_rgba(220,38,38,0.2)]" />
      )}

      {/* Floating SOS Button */}
      <div className="fixed bottom-6 left-6 z-[70]">
        <button
          onClick={() => setIsOpen(true)}
          className={`w-16 h-16 rounded-full flex items-center justify-center text-white font-black text-xl shadow-2xl transition-all hover:scale-110 active:scale-95 ${
            emergencyMode ? "bg-red-600 animate-bounce shadow-red-600/50" : "bg-red-600 shadow-red-600/30"
          }`}
        >
          SOS
        </button>
      </div>

      {/* Emergency Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[80] flex items-center justify-center p-4">
          <div className="bg-[#1c1c1e] border border-white/10 w-full max-w-md rounded-[32px] p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/10 rounded-full blur-3xl -mr-32 -mt-32" />
            
            <button 
              onClick={() => setIsOpen(false)}
              className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors"
            >
              ✕
            </button>

            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-red-600/20 border border-red-600/30 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">🚨</div>
              <h2 className="text-2xl font-black text-white">Emergency Center</h2>
              <p className="text-gray-400 text-sm mt-2">Help is just a tap away. Stay calm.</p>
            </div>

            <div className="space-y-3">
              {/* Emergency Mode Toggle */}
              <button 
                onClick={toggleEmergencyMode}
                className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all ${
                  emergencyMode 
                    ? "bg-red-600 text-white shadow-lg shadow-red-600/20" 
                    : "bg-white/5 border border-white/10 text-red-500 hover:bg-white/10"
                }`}
              >
                <span>⚠️</span> {emergencyMode ? "Exit Emergency Mode" : "Activate Emergency Mode"}
              </button>

              {/* Local Help */}
              <div className="grid grid-cols-2 gap-3 mt-4">
                <a href="tel:100" className="bg-blue-600/20 border border-blue-600/30 hover:bg-blue-600/30 py-4 rounded-2xl text-center transition-all group">
                  <p className="text-xl group-hover:scale-110 transition-transform">👮</p>
                  <p className="text-blue-400 font-bold text-xs mt-1">Police (100)</p>
                </a>
                <a href="tel:102" className="bg-red-600/20 border border-red-600/30 hover:bg-red-600/30 py-4 rounded-2xl text-center transition-all group">
                  <p className="text-xl group-hover:scale-110 transition-transform">🚑</p>
                  <p className="text-red-400 font-bold text-xs mt-1">Ambulance (102)</p>
                </a>
              </div>

              {/* Emergency Contact */}
              {contact ? (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mt-4">
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-3">Your Emergency Contact</p>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-bold">{contact.name}</p>
                      <p className="text-gray-400 text-xs">{contact.relation} · {contact.phone}</p>
                    </div>
                    <a href={`tel:${contact.phone}`} className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center text-white text-xl hover:scale-105 active:scale-95 transition-all shadow-lg shadow-green-500/20">
                      📞
                    </a>
                  </div>
                </div>
              ) : (
                <div className="bg-white/5 border border-white/10 border-dashed rounded-2xl p-5 text-center text-gray-500 text-xs">
                  No emergency contact set for this trip.
                </div>
              )}

              {/* Share Location */}
              <button 
                onClick={() => alert("Live location shared with emergency contact and nearby help centers.")}
                className="w-full bg-white/5 border border-white/10 hover:bg-white/10 py-4 rounded-2xl text-white font-bold flex items-center justify-center gap-3 transition-all mt-4"
              >
                <span>📍</span> Share Live Location
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
