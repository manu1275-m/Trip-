"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

// Curated Unsplash photos of iconic Indian destinations
const PLACES = [
  {
    name: "Goa",
    tag: "Golden Beaches",
    img: "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1920&q=85",
  },
  {
    name: "Taj Mahal, Agra",
    tag: "Wonder of the World",
    img: "https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=1920&q=85",
  },
  {
    name: "Kerala",
    tag: "Serene Backwaters",
    img: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1920&q=85",
  },
  {
    name: "Ladakh",
    tag: "High Altitude Wonders",
    img: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1920&q=85",
  },
  {
    name: "Varanasi",
    tag: "Sacred Ghats of the Ganges",
    img: "https://images.unsplash.com/photo-1561361058-c24cecae35ca?auto=format&fit=crop&w=1920&q=85",
  },
  {
    name: "Jaipur",
    tag: "The Pink City",
    img: "https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&w=1920&q=85",
  },
  {
    name: "Himachal Pradesh",
    tag: "Snow-capped Peaks",
    img: "https://images.unsplash.com/photo-1501854140801-50d01698950b?auto=format&fit=crop&w=1920&q=85",
  },
  {
    name: "Andaman Islands",
    tag: "Crystal Clear Waters",
    img: "https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=1920&q=85",
  },
];

export default function LandingPage() {
  const [current, setCurrent] = useState(0);
  const [next, setNext] = useState(1);
  const [transitioning, setTransitioning] = useState(false);

  useEffect(() => {
    // Preload next image
    const preload = new window.Image();
    preload.src = PLACES[(current + 1) % PLACES.length].img;
  }, [current]);

  useEffect(() => {
    const timer = setInterval(() => {
      const nextIdx = (current + 1) % PLACES.length;
      setNext(nextIdx);
      setTransitioning(true);
      setTimeout(() => {
        setCurrent(nextIdx);
        setTransitioning(false);
      }, 1200);
    }, 7000);
    return () => clearInterval(timer);
  }, [current]);

  const place = PLACES[current];

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col items-center justify-center">

      {/* ── Background: current image ── */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-none"
        style={{ backgroundImage: `url(${PLACES[current].img})` }}
      />

      {/* ── Background: next image (crossfades in) ── */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(${PLACES[next].img})`,
          opacity: transitioning ? 1 : 0,
          transition: transitioning ? "opacity 1.2s ease-in-out" : "none",
        }}
      />

      {/* ── Dark overlay — gradient so bottom is darker for text ── */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/80" />
      {/* Extra vignette */}
      <div className="absolute inset-0"
        style={{ background: "radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.5) 100%)" }} />

      {/* ── Content ── */}
      <div className="relative z-10 flex flex-col items-center text-center px-4 w-full max-w-md">

        {/* App title */}
        <h1
          className="font-black tracking-tighter leading-none mb-2 drop-shadow-2xl"
          style={{ fontSize: "clamp(4.5rem, 16vw, 9rem)", textShadow: "0 4px 40px rgba(0,0,0,0.6)" }}
        >
          <span className="text-white">Yatra</span>
          <span className="bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent"> AI</span>
        </h1>

        <p className="text-white/70 text-sm sm:text-base font-medium mb-8 drop-shadow-lg">
          Your smartest companion to travel India
        </p>

        {/* ── Auth Buttons ── */}
        <div className="flex flex-col sm:flex-row gap-3 w-full mb-10">
          <Link
            href="/auth/register"
            className="flex-1 flex flex-col items-center gap-1 py-4 rounded-2xl transition-all hover:scale-[1.03] active:scale-[0.97] border-2"
            style={{ borderColor: "#f59e0b", background: "transparent" }}
          >
            <span className="text-xl">🚀</span>
            <span
              className="text-base font-black"
              style={{ color: "#fff", textShadow: "0 2px 8px rgba(0,0,0,0.9), 0 0 20px rgba(0,0,0,0.6)" }}
            >Create Account</span>
            <span
              className="text-xs font-bold"
              style={{ color: "#fbbf24", textShadow: "0 1px 6px rgba(0,0,0,0.8)" }}
            >Free · No credit card</span>
          </Link>

          <Link
            href="/auth/login"
            className="flex-1 flex flex-col items-center gap-1 py-4 rounded-2xl transition-all hover:scale-[1.03] active:scale-[0.97] border-2 border-white/60"
            style={{ background: "transparent" }}
          >
            <span className="text-xl">👤</span>
            <span
              className="text-base font-black"
              style={{ color: "#fff", textShadow: "0 2px 8px rgba(0,0,0,0.9), 0 0 20px rgba(0,0,0,0.6)" }}
            >Sign In</span>
            <span
              className="text-xs font-bold"
              style={{ color: "rgba(255,255,255,0.75)", textShadow: "0 1px 6px rgba(0,0,0,0.8)" }}
            >Continue your journey</span>
          </Link>
        </div>

        {/* Progress dots */}
        <div className="flex gap-1.5 mb-1">
          {PLACES.map((_, i) => (
            <button
              key={i}
              onClick={() => { setCurrent(i); setNext((i + 1) % PLACES.length); }}
              className="h-[3px] rounded-full transition-all duration-700"
              style={{
                width: i === current ? 24 : 6,
                background: i === current ? "#f59e0b" : "rgba(255,255,255,0.3)",
              }}
            />
          ))}
        </div>
      </div>

      {/* ── Location pill bottom-left ── */}
      <div
        className="absolute bottom-6 left-6 flex items-center gap-2 backdrop-blur-md bg-black/40 border border-white/15 px-3 py-2 rounded-xl transition-all duration-700"
        style={{ opacity: transitioning ? 0 : 1, transform: transitioning ? "translateY(6px)" : "translateY(0)" }}
      >
        <span className="text-white/50 text-xs">📍</span>
        <div>
          <p className="text-white text-xs font-bold leading-none">{place.name}</p>
          <p className="text-white/50 text-[10px] mt-0.5">{place.tag}</p>
        </div>
      </div>

      {/* ── "Plan · Book · Monitor" bottom-right ── */}
      <p className="absolute bottom-7 right-6 text-[10px] text-white/30 tracking-widest uppercase">
        Plan · Book · Monitor
      </p>
    </div>
  );
}
