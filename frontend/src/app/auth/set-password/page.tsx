"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";

function SetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const otp = searchParams.get("otp") || "";

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    if (!email || !otp) {
      router.push("/auth/register");
    }
  }, [email, otp, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    
    setIsLoading(true);
    setError("");

    try {
      const response = await axios.post("http://127.0.0.1:8000/api/auth/register/complete", {
        email,
        otp,
        password
      });
      
      // Save token (in real app, use HTTP-only cookies or secure state)
      if (response.data.access_token) {
        localStorage.setItem("token", response.data.access_token);
      }
      
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to complete registration.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md glass-panel p-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold">Secure Account</h1>
        <p className="text-gray-400 mt-2">Create a strong password for your new account.</p>
      </div>

      {error && <div className="bg-red-500/10 text-red-500 p-3 rounded-lg mb-4 text-sm text-center">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">New Password</label>
          <input 
            type="password" 
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="••••••••"
            minLength={8}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Confirm Password</label>
          <input 
            type="password" 
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="••••••••"
            minLength={8}
          />
        </div>

        <button 
          type="submit" 
          disabled={isLoading}
          className="w-full bg-primary hover:bg-primary/90 text-background font-bold py-3 rounded-lg transition-transform hover:scale-[1.02] mt-4 disabled:opacity-50"
        >
          {isLoading ? "Saving..." : "Save & Go to Dashboard"}
        </button>
      </form>
    </div>
  );
}

export default function SetPassword() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Suspense fallback={<div className="text-white">Loading...</div>}>
        <SetPasswordForm />
      </Suspense>
    </div>
  );
}
