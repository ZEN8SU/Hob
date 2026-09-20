"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Zap,
  ShieldCheck,
  MapPin,
  Clock,
  ArrowRight,
  Sparkles,
  TrendingUp,
  CheckCircle2,
  Users,
  Smartphone,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useAppStore } from "@/lib/store";

export default function LandingPage() {
  const { setMode } = useAppStore();

  const sampleTasks = [
    {
      title: "Line standing for Tatkal passport token",
      locality: "Indiranagar, Bengaluru",
      reward: "?450",
      time: "In 45 mins",
      category: "Errands",
      tag: "Urgent",
    },
    {
      title: "Urgent 20-page Hindi to English typing",
      locality: "Karol Bagh, New Delhi",
      reward: "?600",
      time: "Today by 6 PM",
      category: "Typing",
      tag: "Remote",
    },
    {
      title: "Help shifting 3 boxes & table to 2nd floor",
      locality: "Andheri West, Mumbai",
      reward: "?800",
      time: "In 2 hours",
      category: "Shifting",
      tag: "Physical",
    },
    {
      title: "Emergency medicine pickup from Apollo",
      locality: "Kothrud, Pune",
      reward: "?250",
      time: "Immediate",
      category: "Delivery",
      tag: "Priority",
    },
  ];

  return (
    <div className="flex flex-col items-center justify-center overflow-hidden">
      {/* Hero Section */}
      <section className="relative w-full pt-16 pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        {/* Glowing Honey Accent Background */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-yellow-400/20 rounded-full blur-3xl -z-10 pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-yellow-100 border border-yellow-300 text-yellow-900 text-xs font-black uppercase tracking-wider mb-6 shadow-sm"
        >
          <Sparkles className="w-4 h-4 text-yellow-600" />
          <span>India First Escrow-Secured P2P Gig Network</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-4xl sm:text-6xl lg:text-7xl font-black text-zinc-950 tracking-tight max-w-4xl mx-auto leading-tight"
        >
          Get Any Micro-Task Done in Minutes<span className="text-yellow-500">.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-6 text-lg sm:text-xl text-zinc-600 max-w-2xl mx-auto font-medium"
        >
          Shifting, line standing, typing, deliveries, or quick local help. Seamlessly switch between posting a task or earning micro-income as a verified Tasker.
        </motion.p>

        {/* Dual Primary CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto"
        >
          <Link href="/create-task" className="w-full sm:w-auto" onClick={() => setMode("poster")}>
            <Button size="lg" className="w-full font-black text-base shadow-honeyGlow" rightIcon={<ArrowRight className="w-5 h-5" />}>
              Post a Task (Need Help)
            </Button>
          </Link>

          <Link href="/dashboard" className="w-full sm:w-auto" onClick={() => setMode("worker")}>
            <Button size="lg" variant="secondary" className="w-full font-black text-base" rightIcon={<Zap className="w-5 h-5 fill-current" />}>
              Earn as a Tasker (Browse)
            </Button>
          </Link>
        </motion.div>

        {/* Value Prop Badges */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs font-bold text-zinc-600">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-yellow-600" />
            <span>100% Escrow Protection</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-yellow-600" />
            <span>Avg Response: 4.2 Mins</span>
          </div>
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-yellow-600" />
            <span>Instant UPI Handshake</span>
          </div>
        </div>
      </section>

      {/* Live Hyperlocal Task Feed Preview */}
      <section className="w-full bg-zinc-900 text-white py-20 px-4 sm:px-6 lg:px-8 border-y border-zinc-800">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-12 gap-4">
            <div>
              <span className="text-yellow-400 text-xs font-black uppercase tracking-widest">
                Live Hyperlocal Activity
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-white mt-1">
                Real Tasks Happening Right Now
              </h2>
            </div>
            <Link href="/dashboard">
              <Button variant="secondary" size="sm" rightIcon={<ArrowRight className="w-4 h-4" />}>
                View All Live Gigs
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {sampleTasks.map((task, idx) => (
              <motion.div
                key={task.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.1 }}
                className="rounded-2xl bg-zinc-800/80 border border-zinc-700/80 p-5 hover:border-yellow-400 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider bg-zinc-900 text-yellow-400 px-2.5 py-1 rounded-md border border-yellow-400/20">
                      {task.category}
                    </span>
                    <span className="text-xs font-black text-yellow-400">{task.reward}</span>
                  </div>
                  <h3 className="font-bold text-sm text-zinc-100 mb-3">{task.title}</h3>
                </div>

                <div className="pt-3 border-t border-zinc-700/60 flex items-center justify-between text-xs text-zinc-400">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-yellow-500 shrink-0" />
                    <span className="truncate max-w-[130px]">{task.locality}</span>
                  </div>
                  <span className="text-[11px] text-zinc-500">{task.time}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works (Double-Sided Escrow) */}
      <section className="w-full py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-yellow-600 text-xs font-black uppercase tracking-widest">
            The Trust Engine
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-zinc-950 mt-1">
            Zero Churn. Zero Fraud. Escrow Secured.
          </h2>
          <p className="text-zinc-600 text-sm mt-3">
            Traditional job boards fail because workers don&apos;t get paid on time and customers worry about quality. HOB fixes this with an automated 3-step escrow loop.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="rounded-3xl bg-white border border-zinc-200/90 p-8 shadow-sm relative overflow-hidden">
            <span className="text-5xl font-black text-yellow-400/30 absolute top-4 right-6">01</span>
            <div className="w-12 h-12 rounded-2xl bg-yellow-100 flex items-center justify-center text-yellow-700 font-bold mb-6">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-zinc-900 mb-2">Post in 30 Seconds</h3>
            <p className="text-xs text-zinc-600 leading-relaxed">
              Describe what you need, specify the address, and name your budget. Nearby Taskers get pinged instantly.
            </p>
          </div>

          <div className="rounded-3xl bg-white border border-zinc-200/90 p-8 shadow-sm relative overflow-hidden">
            <span className="text-5xl font-black text-yellow-400/30 absolute top-4 right-6">02</span>
            <div className="w-12 h-12 rounded-2xl bg-zinc-900 flex items-center justify-center text-yellow-400 font-bold mb-6">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-zinc-900 mb-2">Escrow Funds Lock</h3>
            <p className="text-xs text-zinc-600 leading-relaxed">
              Upon assigning a Tasker, customer deposits funds into the secure Escrow vault. The Tasker knows payment is 100% guaranteed.
            </p>
          </div>

          <div className="rounded-3xl bg-white border border-zinc-200/90 p-8 shadow-sm relative overflow-hidden">
            <span className="text-5xl font-black text-yellow-400/30 absolute top-4 right-6">03</span>
            <div className="w-12 h-12 rounded-2xl bg-yellow-400 flex items-center justify-center text-zinc-950 font-bold mb-6">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-zinc-900 mb-2">OTP Handshake & Payout</h3>
            <p className="text-xs text-zinc-600 leading-relaxed">
              Task is executed, OTP confirmed, and funds (85% Tasker payout, 15% platform commission) are released instantly to UPI/Wallet.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
