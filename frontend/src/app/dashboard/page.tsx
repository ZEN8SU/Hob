"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  LayoutGrid,
  Map as MapIcon,
  PlusCircle,
  Zap,
  MapPin,
  TrendingUp,
  Sparkles,
  SlidersHorizontal,
  Navigation,
  Loader2,
  Users,
  ShieldCheck,
  CheckCircle2,
  X,
  CreditCard,
  Lock,
} from "lucide-react";
import { TaskCard, TaskItem } from "@/components/TaskCard";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useAppStore } from "@/lib/store";
import { serviceApi, bidApi, paymentApi } from "@/lib/api";

export default function DashboardPage() {
  const router = useRouter();
  const { mode, user, token, userLocation, setLocation } = useAppStore();
  const isPoster = mode === "poster";

  const [viewMode, setViewMode] = useState<"grid" | "map">("grid");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [radiusKm, setRadiusKm] = useState<number>(5);
  const [locating, setLocating] = useState(false);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Poster Bids Modal State
  const [selectedTaskForBids, setSelectedTaskForBids] = useState<any | null>(null);
  const [taskBids, setTaskBids] = useState<any[]>([]);
  const [loadingBids, setLoadingBids] = useState(false);
  const [acceptingBidId, setAcceptingBidId] = useState<string | null>(null);

  const categories = [
    "All",
    "Delivery",
    "Domestic Help",
    "Shifting",
    "Typing",
    "Line Standing",
    "Plumbing",
    "Errands",
  ];

  // Browser Geolocation
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setLocating(false);
      },
      (err) => {
        console.error("GPS error:", err);
        setLocating(false);
      },
      { timeout: 8000 }
    );
  };

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await serviceApi.getFeed({
        category: selectedCategory !== "All" ? selectedCategory : undefined,
        search: searchQuery.trim() || undefined,
        mode: isPoster ? "poster" : "tasker",
        latitude: userLocation?.latitude,
        longitude: userLocation?.longitude,
        radius: isPoster ? undefined : radiusKm,
      });

      if (res.data?.requests) {
        const mapped: TaskItem[] = res.data.requests.map((r: any) => ({
          id: r.id,
          title: r.title || r.service?.title || "Hyperlocal Micro-Task",
          category: r.category || r.service?.category || "Errands",
          location: r.address || r.customer_profile?.address || "Local Area",
          budget: r.budget || r.service?.baseRate || 350,
          timeConstraint: r.timeConstraint,
          scheduledFor: r.scheduledFor || new Date().toISOString(),
          posterName: r.customer_profile?.user?.name || "Local Resident",
          posterRating: r.customer_profile?.avgRating || 5.0,
          status: r.status || "pending",
          bidsCount: r.bidsCount || r.bids?.length || 0,
          distanceKm: r.distanceKm,
          customerId: r.customerId,
        }));
        setTasks(mapped);
      }
    } catch (err) {
      console.error("Error fetching tasks feed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [mode, selectedCategory, radiusKm, userLocation]);

  // Open Bids Review for Poster
  const handleOpenBids = async (taskId: string) => {
    try {
      setLoadingBids(true);
      const res = await serviceApi.getRequestById(taskId);
      setSelectedTaskForBids(res.data.request);
      setTaskBids(res.data.request.bids || []);
    } catch (err) {
      console.error("Error fetching task bids:", err);
    } finally {
      setLoadingBids(false);
    }
  };

  // Poster Accepts Bid -> Proceeds to Booking & Escrow Deposit
  const handleAcceptBid = async (bidId: string) => {
    try {
      setAcceptingBidId(bidId);
      const res = await bidApi.acceptBid(bidId);
      const booking = res.data.booking;
      // Navigate to Booking tracking & Escrow payment page
      router.push(`/bookings/${booking.id}`);
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to accept bid.");
      setAcceptingBidId(null);
    }
  };

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
              <span>{isPoster ? "Poster Control Room" : "Tasker Radar Feed"}</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-white">
              {isPoster
                ? "Your Posted Micro-Tasks"
                : "Hyperlocal High-Demand Gigs"}
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-xl">
              {isPoster
                ? "Manage your posted tasks, review incoming bids, accept the best offer, and lock escrow."
                : "Discover open tasks around you within 5km radius, place your bid, and get paid 85% directly to your wallet."}
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

      {/* Tasker Mode Only: Dynamic 5km Radius Filter & GPS Detector */}
      {!isPoster && (
        <div className="p-4 sm:p-5 rounded-3xl bg-white border border-zinc-200/90 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="w-10 h-10 rounded-2xl bg-yellow-400 text-zinc-950 flex items-center justify-center font-bold shrink-0">
              <MapPin className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h4 className="text-xs font-black text-zinc-900">Dynamic Distance Radius</h4>
              <p className="text-[11px] text-zinc-500">
                Filtering tasks within <strong>{radiusKm} km</strong> of your coordinates
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="1"
                max="50"
                value={radiusKm}
                onChange={(e) => setRadiusKm(Number(e.target.value))}
                className="w-32 sm:w-48 accent-yellow-400 cursor-pointer"
              />
              <span className="text-xs font-black text-zinc-950 bg-zinc-100 px-2.5 py-1 rounded-lg">
                {radiusKm} km
              </span>
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={handleGetLocation}
              disabled={locating}
              className="text-xs font-bold"
              leftIcon={locating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Navigation className="w-3.5 h-3.5" />}
            >
              {locating ? "Locating..." : userLocation ? "GPS Active" : "Detect GPS"}
            </Button>
          </div>
        </div>
      )}

      {/* Search, Filter Bar & View Toggle */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            placeholder={
              isPoster
                ? "Search your posted tasks..."
                : "Search tasks by keyword, area, or locality (e.g. Indiranagar, Typing)..."
            }
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
            <span>Radar Map</span>
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

      {/* Main Content Area */}
      {loading ? (
        <div className="py-20 text-center space-y-3">
          <Loader2 className="w-8 h-8 text-yellow-500 animate-spin mx-auto" />
          <p className="text-xs font-bold text-zinc-500">Querying live hyperlocal database...</p>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTasks.length > 0 ? (
            filteredTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onBidSubmitted={fetchTasks}
                onViewBids={handleOpenBids}
              />
            ))
          ) : (
            <div className="col-span-full py-16 text-center bg-white rounded-3xl border border-dashed border-zinc-300 p-8">
              <Search className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-zinc-900">
                {isPoster ? "You haven't posted any tasks yet" : "No open tasks found nearby"}
              </h3>
              <p className="text-xs text-zinc-500 mt-1">
                {isPoster
                  ? "Click 'Post a Micro-Task' above to get instant help from verified taskers."
                  : "Try widening the distance radius slider or choosing another category."}
              </p>
              {isPoster && (
                <div className="mt-4">
                  <Link href="/create-task">
                    <Button size="sm" variant="primary">
                      Post Your First Task
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* Hyperlocal Map Simulation */
        <div className="w-full h-[520px] rounded-3xl bg-zinc-900 border-2 border-yellow-400/30 relative overflow-hidden shadow-xl flex items-center justify-center p-6">
          <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#facc15_1px,transparent_1px)] [background-size:24px_24px]" />

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
                    <span>₹{task.budget}</span>
                  </div>

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

      {/* Poster Bids Drawer / Modal */}
      <AnimatePresence>
        {selectedTaskForBids && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl bg-white rounded-3xl p-6 sm:p-8 border border-zinc-200 shadow-2xl space-y-6 max-h-[85vh] overflow-y-auto relative"
            >
              <button
                onClick={() => setSelectedTaskForBids(null)}
                className="absolute top-6 right-6 text-zinc-400 hover:text-zinc-900 transition"
              >
                <X className="w-5 h-5" />
              </button>

              <div>
                <span className="text-[10px] font-black uppercase text-yellow-700 bg-yellow-100 px-2.5 py-1 rounded-md">
                  {selectedTaskForBids.category}
                </span>
                <h3 className="text-xl font-black text-zinc-950 mt-2">
                  Review Bids for: {selectedTaskForBids.title}
                </h3>
                <p className="text-xs text-zinc-500 mt-1">
                  Budget: ₹{selectedTaskForBids.budget} • Location: {selectedTaskForBids.address}
                </p>
              </div>

              {/* Bids List */}
              <div className="space-y-3">
                {taskBids.length > 0 ? (
                  taskBids.map((bid) => (
                    <div
                      key={bid.id}
                      className="p-4 rounded-2xl border border-zinc-200 bg-zinc-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-sm text-zinc-900">
                            {bid.worker_profile?.user?.name || "Verified Tasker"}
                          </span>
                          <span className="text-xs font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                            ₹{bid.proposedPrice}
                          </span>
                        </div>
                        {bid.message && (
                          <p className="text-xs text-zinc-600 italic">
                            &quot;{bid.message}&quot;
                          </p>
                        )}
                        <p className="text-[10px] text-zinc-400">
                          Applied on {new Date(bid.createdAt).toLocaleDateString()}
                        </p>
                      </div>

                      <Button
                        size="sm"
                        onClick={() => handleAcceptBid(bid.id)}
                        isLoading={acceptingBidId === bid.id}
                        className="font-black shadow-honeySmall shrink-0"
                        rightIcon={<CheckCircle2 className="w-4 h-4" />}
                      >
                        Accept & Lock Escrow
                      </Button>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center bg-zinc-50 rounded-2xl border border-dashed border-zinc-200 p-4">
                    <p className="text-xs font-bold text-zinc-500">
                      No bids received yet. Matching taskers in your area have been alerted!
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
