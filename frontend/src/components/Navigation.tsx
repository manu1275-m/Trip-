"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navigation() {
  const pathname = usePathname();
  const isAuth = pathname.includes("/auth");

  if (isAuth) return null;

  return (
    <nav className="flex items-center justify-between p-4 glass-panel sticky top-4 z-50 mx-4 mt-4">
      <Link href="/" className="flex items-center gap-2">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center font-bold text-background">
          A
        </div>
        <span className="font-bold text-lg tracking-wide hidden sm:block">AgenticTravel</span>
      </Link>
      
      <div className="flex items-center gap-6 text-sm font-medium">
        <Link href="/dashboard" className="text-gray-300 hover:text-white transition-colors">
          Dashboard
        </Link>
        <Link href="/trips/new" className="text-gray-300 hover:text-white transition-colors">
          Plan Trip
        </Link>
        <Link href="/auth/login" className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition-colors">
          Login
        </Link>
      </div>
    </nav>
  );
}
