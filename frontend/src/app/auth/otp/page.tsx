"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function OTPForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  
  const [isLoading, setIsLoading] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!email) {
      router.push("/auth/register");
    }
  }, [email, router]);

  const handleChange = (index: number, value: string) => {
    if (isNaN(Number(value))) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto focus next input
    if (value !== "" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && otp[index] === "" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const otpValue = otp.join("");
    if (otpValue.length < 6) return;

    setIsLoading(true);
    
    // Pass email and OTP to the set-password page
    router.push(`/auth/set-password?email=${encodeURIComponent(email)}&otp=${encodeURIComponent(otpValue)}`);
  };

  return (
    <div className="w-full max-w-md glass-panel p-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold">Verify Email</h1>
        <p className="text-gray-400 mt-2">We sent a 6-digit code to <span className="text-white">{email}</span></p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex justify-center gap-3">
          {otp.map((digit, index) => (
            <input 
              key={index}
              ref={(el) => { inputRefs.current[index] = el; }}
              type="text" 
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              className="w-12 h-14 text-center text-xl bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary font-bold"
              required
            />
          ))}
        </div>

        <button 
          type="submit" 
          disabled={isLoading || otp.join("").length < 6}
          className="w-full bg-primary hover:bg-primary/90 text-background font-bold py-3 rounded-lg transition-transform hover:scale-[1.02] disabled:opacity-50"
        >
          {isLoading ? "Proceeding..." : "Confirm OTP"}
        </button>
      </form>
    </div>
  );
}

export default function OTPVerification() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Suspense fallback={<div className="text-white">Loading...</div>}>
        <OTPForm />
      </Suspense>
    </div>
  );
}
