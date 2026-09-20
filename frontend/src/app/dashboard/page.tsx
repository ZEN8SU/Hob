"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Search,
  Filter,
  LayoutGrid,
  Map as MapIcon,
  PlusCircle,
  Zap,
  MapPin,
  TrendingUp,
  Sparkles,
  SlidersHorizontal,
} from "lucide-react";
import { TaskCard, TaskItem } from "@/components/TaskCard";
import { Button } from "@/components/ui/Button";
import { useAppStore } from "@/lib/store";
import { serviceApi } from "@/lib/api";

export default function DashboardPage() {
  const { mode } = useAppStore();
  const isPoster = mode === "poster";

  const [viewMode, setViewMode] = useState<"grid" | "map">("grid");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);

  const categories = [
    "All",
    "Delivery",
    "Domestic Help",
    "Shifting",
    "Typing",
    "Line Standing",
    "Errands",
  ];

  // Initial Seed & API Fetch
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoading(true);
        const res = await serviceApi.getFeed("pending");
        if (res.data?.requests && res.data.requests.length > 0) {
          const mapped: TaskItem[] = res.data.requests.map((r: any) => ({
            id: r.id,
            title: r.service?.title || "Hyperlocal Micro-Task Assistance",
            category: r.service?.category || "Errands",
            location: r.customer_profile?.address || "Hyperlocal Vicinity",
            budget: r.service?.baseRate || 350,
            scheduledFor: r.scheduledFor || new Date().toISOString(),
            posterName: r.customer_profile?.user?.name || "Local Resident",
            posterRating: r.customer_profile?.avgRating || 4.9,
            status: r.status || "pending",
          }));
          setTasks(mapped);
        } else {
          // Fallback realistic seed data for presentation
          setTasks([
            {
              id: "task-1",
              title: "Line standing for Tatkal passport token in Indiranagar",
              category: "Line Standing",
              location: "Indiranagar PSK, Bengaluru",
              budget: 450,
              scheduledFor: new Date(Date.now() + 3600000).toISOString(),
              posterName: "Vikram Mehta",
              posterRating: 4.8,
              status: "pending",
            },
            {
              id: "task-2",
              title: "Urgent 20-page Hindi to English typing & format review",
              category: "Typing",
              location: "Karol Bagh, New Delhi",
              budget: 600,
              scheduledFor: new Date(Date.now() + 7200000).toISOString(),
              posterName: "Pooja Verma",
              posterRating: 5.0,
              status: "pending",
            },
            {
              id: "task-3",
              title: "Help shifting 3 heavy luggage boxes to 3rd floor apartment",
              category: "Shifting",
              location: "Andheri West, Mumbai",
              budget: 800,
              scheduledFor: new Date(Date.now() + 10800000).toISOString(),
              posterName: "Karan Johar",
              posterRating: 4.7,
              status: "pending",
            },
            {
              id: "task-4",
              title: "Pick up medicine prescription from Apollo & drop at home",
              category: "Delivery",
              location: "Kothrud, Pune",
              budget: 250,
              scheduledFor: new Date(Date.now() + 1800000).toISOString(),
              posterName: "Aarti Deshmukh",
              posterRating: 4.9,
              status: "pending",
            },
            {
              id: "task-5",
              title: "Basic plant repotting & balcony garden cleanup",
              category: "Domestic Help",
              location: "HSR Layout Sector 2, Bengaluru",
              budget: 500,
              scheduledFor: new Date(Date.now() + 14400000).toISOString(),
              posterName: "Rahul Dravid",
              posterRating: 4.9,
              status: "pending",
            },
            {
              id: "task-6",
              title: "Urgent printout & spiral binding pickup from cyber cafe",
              category: "Errands",
              location: "Salt Lake Sector V, Kolkata",
              budget: 200,
              scheduledFor: new Date(Date.now() + 2400000).toISOString(),
              posterName: "Sourav Ganguly",
              posterRating: 4.8,
              status: "pending",
            },
          ]);
        }
      } catch (err) {
        console.error("Error fetching tasks feed:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, []);

  const filteredTasks = tasks.filter((t) => {
    const matchesCat =
      selectedCategory === "All" ||
      t.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchesSearch =
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.location.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner & Mode Welcome */}
      <div className="rounded-3xl bg-zinc-900 text-white p-6 sm:p-8 relative overflow-hidden shadow-xl">
        <div className="absolute right-0 bottom-0 w-80 h-80 bg-yellow-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-400 text-zinc-950 text-xs font-black uppercase tracking-wider">
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>{isPoster ? "Poster Control Room" : "Tasker Earner Feed"}</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-white">
              {isPoster
                ? "Manage Your Micro-Tasks"
                : "Hyperlocal High-Demand Gigs"}
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-xl">
              {isPoster
                ? "Post tasks, review worker bids, lock escrow, and get verified assistance instantly."
                : "Browse live tasks within 5km radius, place your bid, and get paid 85% directly to your UPI."}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {isPoster ? (
              <Link href="/create-task">
                <Button size="lg" className="font-black shadow-honeyGlow" rightIcon={<PlusCircle className="w-5 h-5" />}>
                  Post a Micro-Task
                </Button>
              </Link>
            ) : (
              <Link href="/wallet">
                <Button variant="secondary" size="lg" className="font-black" rightIcon={<TrendingUp className="w-5 h-5" />}>
                  Check My Earnings
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Search, Filter Bar & View Toggle */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search tasks by keyword, area, or locality (e.g. Indiranagar, Typing)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white border border-zinc-200 text-sm font-medium focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 shadow-sm transition"
          />
        </div>

        {/* View Switcher Toggle (Grid vs Map) */}
        <div className="flex items-center bg-zinc-100 p-1.5 rounded-2xl border border-zinc-200 shrink-0 self-start md:self-auto">
          <button
            onClick={() => setViewMode("grid")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              viewMode === "grid"
                ? "bg-white text-zinc-950 shadow-sm"
                : "text-zinc-600 hover:text-zinc-950"
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            <span>Grid View</span>
          </button>
          <button
            onClick={() => setViewMode("map")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              viewMode === "map"
                ? "bg-white text-zinc-950 shadow-sm"
                : "text-zinc-600 hover:text-zinc-950"
            }`}
          >
            <MapIcon className="w-4 h-4" />
            <span>Hyperlocal Map</span>
          </button>
        </div>
      </div>

      {/* Category Pills Filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                isSelected
                  ? "bg-yellow-400 text-zinc-950 border-yellow-500 shadow-honeySmall"
                  : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300 hover:text-zinc-900"
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Main Content Area: Grid vs Interactive Map */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTasks.length > 0 ? (
            filteredTasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))
          ) : (
            <div className="col-span-full py-16 text-center bg-white rounded-3xl border border-dashed border-zinc-300 p-8">
              <Search className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-zinc-900">No tasks found</h3>
              <p className="text-xs text-zinc-500 mt-1">
                Try searching for a different area or category keyword.
              </p>
            </div>
          )}
        </div>
      ) : (
        /* Hyperlocal Map Simulation */
        <div className="w-full h-[520px] rounded-3xl bg-zinc-900 border-2 border-yellow-400/30 relative overflow-hidden shadow-xl flex items-center justify-center p-6">
          {/* Simulated Map Grid Lines */}
          <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#facc15_1px,transparent_1px)] [background-size:24px_24px]" />

          {/* Interactive Pins on Map */}
          {filteredTasks.map((task, i) => {
            const positions = [
              { top: "25%", left: "30%" },
              { top: "45%", left: "65%" },
              { top: "60%", left: "35%" },
              { top: "35%", left: "75%" },
              { top: "70%", left: "55%" },
              { top: "20%", left: "50%" },
            ];
            const pos = positions[i % positions.length] || { top: "50%", left: "50%" };

            return (
              <motion.div
                key={task.id}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                whileHover={{ scale: 1.15, zIndex: 30 }}
                style={{ top: pos.top, left: pos.left }}
                className="absolute z-10 cursor-pointer"
              >
                <div className="relative group">
                  <div className="flex items-center gap-1.5 bg-yellow-400 text-zinc-950 px-3 py-1.5 rounded-full font-black text-xs shadow-honeyGlow border-2 border-zinc-950">
                    <MapPin className="w-3.5 h-3.5 fill-current" />
                    <span>?{task.budget}</span>
                  </div>

                  {/* Popover Preview on Hover */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 bg-zinc-950 text-white rounded-xl p-3 border border-yellow-400/40 shadow-2xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200">
                    <span className="text-[9px] font-black uppercase text-yellow-400">{task.category}</span>
                    <p className="text-xs font-bold mt-0.5 line-clamp-2">{task.title}</p>
                    <p className="text-[10px] text-zinc-400 mt-1">{task.location}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}

          <div className="absolute bottom-6 left-6 bg-zinc-950/90 backdrop-blur-md text-white px-4 py-2.5 rounded-2xl border border-yellow-400/30 text-xs font-bold flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
            <span>Live Radar: {filteredTasks.length} Active Gigs in Vicinity</span>
          </div>
        </div>
      )}
    </div>
  );
}
