"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "axios";

export default function Register() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    
    try {
      await axios.post("http://127.0.0.1:8000/api/auth/register/request-otp", {
        email: email
      });
      // Pass email to OTP page
      router.push(`/auth/otp?email=${encodeURIComponent(email)}`);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to send OTP. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Link href="/" className="absolute top-8 left-8 flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
        <span>&larr;</span> Back to Home
      </Link>
      
      <div className="w-full max-w-md glass-panel p-8">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-primary rounded-xl mx-auto flex items-center justify-center font-bold text-background text-2xl mb-4">
            A
          </div>
          <h1 className="text-3xl font-bold">Join AgenticTravel</h1>
          <p className="text-gray-400 mt-2">Unlock your personal AI travel companion.</p>
        </div>

        {error && <div className="bg-red-500/10 text-red-500 p-3 rounded-lg mb-4 text-sm text-center">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Email Address</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="you@example.com"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Full Name</label>
            <input 
              type="text" 
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="John Doe"
            />
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-primary hover:bg-primary/90 text-background font-bold py-3 rounded-lg transition-transform hover:scale-[1.02] mt-4 disabled:opacity-50"
          >
            {isLoading ? "Sending Code..." : "Continue with Email"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-400 mt-6">
          Already have an account?{" "}
          <Link href="/auth/login" className="text-primary hover:underline font-medium">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
