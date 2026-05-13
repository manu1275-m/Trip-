import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Agentic AI Travel Planner",
  description: "Your intelligent real-time travel assistant for destinations across India.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background text-foreground antialiased selection:bg-primary/30">
        <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </body>
    </html>
  );
}
