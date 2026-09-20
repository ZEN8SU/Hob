import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/Navbar";

export const metadata: Metadata = {
  title: "HOB - Hyperlocal P2P Micro-Tasking Platform",
  description:
    "India premier double-sided hyperlocal micro-tasking marketplace. Connect instantly with trusted local taskers for errands, shifting, typing, and deliveries with escrow-secured payouts.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-zinc-50 text-zinc-900 antialiased selection:bg-yellow-300 selection:text-zinc-950">
        <Navbar />
        <main className="flex-1 w-full">{children}</main>
        <footer className="border-t border-zinc-200 bg-white py-8 text-center text-xs text-zinc-500">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 font-bold text-zinc-800">
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-400"></span>
              <span>HOB Micro-Tasking India</span>
            </div>
            <p>(c) 2026 HOB Network Inc. Escrow protected by Indian Banking Rails.</p>
            <div className="flex gap-4">
              <a href="#" className="hover:text-yellow-600">Privacy</a>
              <a href="#" className="hover:text-yellow-600">Terms</a>
              <a href="#" className="hover:text-yellow-600">Escrow Guarantee</a>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}