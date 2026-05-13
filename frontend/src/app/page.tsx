import Link from "next/link";
import Navigation from "@/components/Navigation";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navigation />
      
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 mt-20">
        <div className="max-w-4xl space-y-8 glass-panel p-12 relative overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/20 rounded-full blur-3xl -z-10"></div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight">
            The Future of Travel is <span className="premium-gradient">Agentic</span>
          </h1>
          
          <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Experience India like never before. 13 specialized AI agents collaborate in real-time to plan, optimize, monitor, and guide every second of your journey.
          </p>
          
          <div className="text-sm font-medium text-primary/80 bg-primary/10 px-4 py-2 rounded-full inline-block">
            Currently supporting destinations exclusively within India 🇮🇳
          </div>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
            <Link 
              href="/auth/register" 
              className="bg-primary hover:bg-primary/90 text-background font-bold px-8 py-4 rounded-xl text-lg transition-transform hover:scale-105"
            >
              Start Planning
            </Link>
            <Link 
              href="/features" 
              className="bg-secondary hover:bg-secondary/80 text-foreground font-medium px-8 py-4 rounded-xl text-lg transition-colors border border-white/5"
            >
              Explore Features
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
