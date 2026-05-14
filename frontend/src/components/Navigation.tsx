"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import EmergencySOS from "./EmergencySOS";

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const isAuth = pathname.includes("/auth");
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/auth/login");
  };

  if (isAuth) return null;

  const navLinks = [
    { href: "/dashboard", label: "Dashboard", icon: "⚡" },
    { href: "/trips/new", label: "Plan Trip", icon: "✈️" },
    { href: "/settings", label: "Settings", icon: "⚙️" },
  ];

  return (
    <nav className={`sticky top-0 z-50 transition-all duration-300 ${scrolled ? 'bg-[#09090b]/95 backdrop-blur-xl border-b border-white/5 shadow-lg shadow-black/20' : 'bg-transparent'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center font-black text-black text-base shadow-lg shadow-amber-500/30 group-hover:scale-110 transition-transform">
            Y
          </div>
          <span className="font-black text-white text-lg tracking-tight hidden sm:block">
            Yatra<span className="text-amber-400">AI</span>
          </span>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                pathname === link.href || pathname.startsWith(link.href)
                  ? "bg-white/10 text-white"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <span className="text-xs">{link.icon}</span>
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          <Link
            href="/trips/new"
            className="hidden sm:flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black font-bold px-4 py-2 rounded-xl text-sm transition-all hover:scale-[1.03] active:scale-[0.97] shadow-lg shadow-amber-500/20"
          >
            <span>+</span> New Trip
          </Link>
          <button
            onClick={handleLogout}
            className="text-gray-500 hover:text-gray-300 text-xs px-3 py-2 rounded-lg hover:bg-white/5 transition-all"
          >
            Sign out
          </button>
          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden w-9 h-9 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-gray-400"
          >
            {mobileOpen ? "✕" : "☰"}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-[#09090b]/98 backdrop-blur-xl border-t border-white/5 px-4 py-4 space-y-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-all"
            >
              <span>{link.icon}</span>
              {link.label}
            </Link>
          ))}
          <div className="pt-2 border-t border-white/5 mt-2">
            <button
              onClick={handleLogout}
              className="w-full text-left flex items-center gap-2 px-4 py-3 rounded-xl text-sm text-red-400 hover:bg-red-500/10 transition-all"
            >
              ↩ Sign Out
            </button>
          </div>
        </div>
      )}
      <EmergencySOS />
    </nav>
  );
}
