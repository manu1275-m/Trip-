"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "axios";

type Step = "email" | "otp" | "password";

export default function Register() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  const startCooldown = () => {
    setResendCooldown(60);
    const iv = setInterval(() => {
      setResendCooldown((n) => {
        if (n <= 1) { clearInterval(iv); return 0; }
        return n - 1;
      });
    }, 1000);
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      await axios.post("http://127.0.0.1:8000/api/auth/send-otp", { email });
      setStep("otp"); startCooldown();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to send OTP. Please try again.");
    } finally { setLoading(false); }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) { setError("Enter the 6-digit OTP sent to your email."); return; }
    setLoading(true); setError("");
    try {
      await axios.post("http://127.0.0.1:8000/api/auth/verify-otp", { email, otp });
      setStep("password");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Invalid or expired OTP.");
    } finally { setLoading(false); }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (password !== confirmPw) { setError("Passwords do not match."); return; }
    setLoading(true); setError("");
    try {
      const res = await axios.post("http://127.0.0.1:8000/api/auth/register/complete", { email, otp, password });
      if (res.data.access_token) localStorage.setItem("token", res.data.access_token);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Registration failed. Please try again.");
    } finally { setLoading(false); }
  };

  const STEPS = [
    { key: "email", label: "Email" },
    { key: "otp", label: "Verify" },
    { key: "password", label: "Password" },
  ] as const;
  const stepIndex = STEPS.findIndex((s) => s.key === step);

  return (
    <div className="min-h-screen bg-[#09090b] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-amber-500/6 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-blue-600/6 rounded-full blur-3xl pointer-events-none" />

      <Link href="/auth/login" className="absolute top-6 left-6 flex items-center gap-2 text-gray-500 hover:text-gray-300 text-sm transition-colors group">
        <span className="group-hover:-translate-x-0.5 transition-transform">←</span> Sign In
      </Link>

      <div className="w-full max-w-md">
        <div className="bg-zinc-900/80 backdrop-blur-xl border border-white/8 rounded-3xl p-8 shadow-2xl shadow-black/40">
          {/* Logo */}
          <div className="text-center mb-7">
            <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl mx-auto flex items-center justify-center font-black text-black text-2xl mb-5 shadow-xl shadow-amber-500/30">Y</div>
            <h1 className="text-2xl font-bold text-white">Create your account</h1>
            <p className="text-gray-500 text-sm mt-1.5">Start planning AI-powered trips in minutes</p>
          </div>

          {/* Step progress */}
          <div className="flex items-center mb-7">
            {STEPS.map((s, i) => (
              <div key={s.key} className="flex items-center flex-1">
                <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold flex-shrink-0 transition-all ${
                  i < stepIndex ? "bg-green-500 text-white" :
                  i === stepIndex ? "bg-amber-500 text-black ring-4 ring-amber-500/20" :
                  "bg-white/10 text-gray-500"
                }`}>{i < stepIndex ? "✓" : i + 1}</div>
                <span className={`text-xs font-medium ml-1.5 transition-colors ${
                  i === stepIndex ? "text-amber-400" : i < stepIndex ? "text-green-400" : "text-gray-600"
                }`}>{s.label}</span>
                {i < STEPS.length - 1 && <div className={`flex-1 h-px mx-2 transition-all ${i < stepIndex ? "bg-green-500/40" : "bg-white/8"}`} />}
              </div>
            ))}
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl mb-5 text-sm flex items-center gap-2">
              <span>⚠️</span> {error}
            </div>
          )}

          {/* Step 1 — Email */}
          {step === "email" && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">Email Address</label>
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/10 transition-all placeholder-gray-600"
                  placeholder="you@example.com" autoFocus />
              </div>
              <p className="text-xs text-gray-500">We'll send a 6-digit verification code to this email.</p>
              <button type="submit" disabled={loading}
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-bold py-3.5 rounded-xl text-sm transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2">
                {loading ? <><span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" /> Sending OTP…</> : "Send Verification Code →"}
              </button>
            </form>
          )}

          {/* Step 2 — OTP */}
          {step === "otp" && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-sm text-amber-300 flex items-start gap-2">
                <span className="text-lg flex-shrink-0">📧</span>
                <span>Code sent to <strong className="text-amber-400">{email}</strong>. Check your inbox and spam folder.</span>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">6-Digit Code</label>
                <input type="text" inputMode="numeric" pattern="[0-9]{6}" maxLength={6}
                  value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white text-2xl font-mono tracking-[0.5em] text-center outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/10 transition-all"
                  placeholder="••••••" autoFocus />
              </div>
              <button type="submit" disabled={loading || otp.length !== 6}
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-bold py-3.5 rounded-xl text-sm transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2">
                {loading ? <><span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" /> Verifying…</> : "Verify Code →"}
              </button>
              <div className="text-center">
                {resendCooldown > 0 ? (
                  <p className="text-xs text-gray-600">Resend available in {resendCooldown}s</p>
                ) : (
                  <button type="button" onClick={async () => {
                    setError("");
                    try { await axios.post("http://127.0.0.1:8000/api/auth/send-otp", { email }); startCooldown(); }
                    catch (err: any) { setError(err.response?.data?.detail || "Failed to resend."); }
                  }} className="text-xs text-amber-400 hover:text-amber-300 transition-colors underline underline-offset-2">
                    Resend code
                  </button>
                )}
              </div>
            </form>
          )}

          {/* Step 3 — Password */}
          {step === "password" && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3 text-sm text-green-400 flex items-center gap-2">
                <span>✅</span> Email verified — set your password to finish
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">Password</label>
                <div className="relative">
                  <input type={showPw ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-12 text-white text-sm outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/10 transition-all placeholder-gray-600"
                    placeholder="At least 8 characters" autoFocus />
                  <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                    {showPw ? "🙈" : "👁️"}
                  </button>
                </div>
                {/* Strength bar */}
                <div className="flex gap-1 items-center mt-2">
                  {[8, 12, 16].map((t, i) => (
                    <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${password.length >= t ? ["bg-red-400","bg-yellow-400","bg-green-400"][i] : "bg-white/10"}`} />
                  ))}
                  <span className="text-[10px] text-gray-600 ml-1 w-10">
                    {password.length === 0 ? "" : password.length < 8 ? "Weak" : password.length < 12 ? "Fair" : password.length < 16 ? "Good" : "Strong"}
                  </span>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">Confirm Password</label>
                <input type={showPw ? "text" : "password"} required value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)}
                  className={`w-full bg-white/5 border rounded-xl px-4 py-3 text-white text-sm outline-none focus:ring-2 transition-all placeholder-gray-600 ${
                    confirmPw && confirmPw !== password ? "border-red-500/50 focus:ring-red-500/10" : "border-white/10 focus:border-amber-500/50 focus:ring-amber-500/10"
                  }`}
                  placeholder="Repeat your password" />
                {confirmPw && confirmPw !== password && <p className="text-xs text-red-400 mt-1">Passwords don't match</p>}
              </div>
              <button type="submit" disabled={loading || password !== confirmPw || password.length < 8}
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-bold py-3.5 rounded-xl text-sm transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 mt-2">
                {loading ? <><span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" /> Creating account…</> : "🚀 Create Account"}
              </button>
            </form>
          )}

          <div className="mt-6 pt-6 border-t border-white/5 text-center">
            <p className="text-sm text-gray-500">
              Already have an account?{" "}
              <Link href="/auth/login" className="text-amber-400 hover:text-amber-300 font-semibold transition-colors">Sign in</Link>
            </p>
          </div>
        </div>

        <div className="flex items-center justify-center gap-4 mt-6 text-gray-600 text-[11px]">
          <span>🔒 OTP Verified</span><span>·</span><span>🤖 Smart Companion</span><span>·</span><span>✈️ India Travel</span>
        </div>
      </div>
    </div>
  );
}
