"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

export default function Settings() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [email, setEmail] = useState("");
  const [profile, setProfile] = useState({
    name: "",
    phone: "",
    gender: "other",
    age: "",
    government_id: {
      id_type: "aadhaar",
      id_number: "",
      issuing_country: "India",
    },
  });

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/auth/login");
        return;
      }
      try {
        const res = await axios.get("http://127.0.0.1:8000/api/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        setEmail(res.data.email);
        
        if (res.data.name) {
          setProfile({
            name: res.data.name || "",
            phone: res.data.phone || "",
            gender: res.data.gender || "other",
            age: res.data.age ? String(res.data.age) : "",
            government_id: {
              id_type: res.data.government_id?.id_type || "aadhaar",
              id_number: res.data.government_id?.id_number || "",
              issuing_country: res.data.government_id?.issuing_country || "India",
            },
          });
        }
      } catch (err: any) {
        if (err.response?.status === 401) {
          localStorage.removeItem("token");
          router.push("/auth/login");
        } else {
          setError("Failed to load profile.");
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError("");
    setSuccess("");

    const token = localStorage.getItem("token");
    try {
      await axios.put(
        "http://127.0.0.1:8000/api/profile",
        {
          name: profile.name,
          phone: profile.phone,
          gender: profile.gender,
          age: parseInt(profile.age, 10),
          government_id: profile.government_id,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess("Profile updated successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to update profile.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <div className="w-8 h-8 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin mb-4" />
        <p className="text-gray-400">Loading your profile...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="mb-8">
        <p className="text-amber-400 text-xs font-bold uppercase tracking-widest mb-2">⚙️ Account</p>
        <h1 className="text-4xl font-extrabold text-white tracking-tight">Settings</h1>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-2xl mb-6 flex items-center gap-2 text-sm">
          <span>⚠️</span> {error}
        </div>
      )}

      {success && (
        <div className="bg-green-500/10 border border-green-500/20 text-green-400 px-4 py-3 rounded-2xl mb-6 flex items-center gap-2 text-sm">
          <span>✅</span> {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-6 space-y-4">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <span>👤</span> Personal Information
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">Full Name</label>
              <input type="text" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-amber-500/50 transition-all placeholder-gray-600"
                placeholder="Your full name" required minLength={2} />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">Email</label>
              <input type="email" value={email} disabled
                className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-gray-400 text-sm outline-none cursor-not-allowed" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">Phone</label>
              <input type="tel" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-amber-500/50 transition-all placeholder-gray-600"
                placeholder="Phone number" required minLength={8} />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">Age</label>
              <input type="number" value={profile.age} onChange={(e) => setProfile({ ...profile, age: e.target.value })}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-amber-500/50 transition-all placeholder-gray-600"
                placeholder="Age" required min={1} max={120} />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">Gender</label>
              <select value={profile.gender} onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-amber-500/50 transition-all appearance-none">
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
        </div>

        {/* Identity */}
        <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-6 space-y-4">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <span>🛂</span> Travel Identity
          </h3>
          <p className="text-xs text-gray-500 mb-4 leading-relaxed">
            This ID will be used for automated hotel check-ins and travel bookings by your AI agents. It is stored securely using industry-standard encryption.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">ID Type</label>
              <select value={profile.government_id.id_type} onChange={(e) => setProfile({ ...profile, government_id: { ...profile.government_id, id_type: e.target.value } })}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-amber-500/50 transition-all appearance-none">
                <option value="aadhaar">Aadhaar</option>
                <option value="passport">Passport</option>
                <option value="voter_id">Voter ID</option>
                <option value="pan">PAN Card</option>
                <option value="driving_license">Driving License</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">ID Number</label>
              <input type="text" value={profile.government_id.id_number} onChange={(e) => setProfile({ ...profile, government_id: { ...profile.government_id, id_number: e.target.value } })}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-amber-500/50 transition-all placeholder-gray-600"
                placeholder="ID Document Number" required minLength={3} />
            </div>
          </div>
        </div>

        <button type="submit" disabled={isSaving}
          className="w-full sm:w-auto px-8 bg-amber-500 hover:bg-amber-400 text-black font-bold py-3.5 rounded-xl text-sm transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50 flex items-center justify-center gap-2">
          {isSaving ? (
            <><span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" /> Saving changes…</>
          ) : "Save Profile"}
        </button>
      </form>
    </div>
  );
}
