"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
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
  Navigation,
  Loader2,
  Users,
  ShieldCheck,
  CheckCircle2,
  X,
  CreditCard,
  Lock,
  Clock,
  ArrowRight,
  AlertCircle,
  XCircle,
  Briefcase,
} from "lucide-react";
import { TaskCard, TaskItem } from "@/components/TaskCard";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useAppStore } from "@/lib/store";
import { serviceApi, bidApi, bookingApi } from "@/lib/api";

// Dynamic Import for Mapbox GL JS (Prevents SSR / Window crashes in Next.js)
const TaskerRadarMap = dynamic(() => import("@/components/TaskerRadarMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[500px] rounded-2xl overflow-hidden border-2 border-yellow-400/30 bg-zinc-950 flex flex-col items-center justify-center p-6 text-center text-yellow-400">
      <Loader2 className="w-8 h-8 animate-spin mb-2" />
      <span className="text-xs font-bold">Initializing Mapbox Radar Engine...</span>
    </div>
  ),
});

export default function DashboardPage() {
  const router = useRouter();
  const { mode, user, token, userLocation, setLocation } = useAppStore();
  const isPoster = mode === "poster";

  // Dashboard Sub-View Tab: "tasks" vs "active_bookings"
  const [activeTab, setActiveTab] = useState<"tasks" | "active_bookings">("tasks");

  // View Mode for Tasker (Grid vs Radar Map) - STRICT RULE: Only available in Tasker mode
  const [viewMode, setViewMode] = useState<"grid" | "map">("grid");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [radiusKm, setRadiusKm] = useState<number>(5);
  const [locating, setLocating] = useState(false);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [activeBookings, setActiveBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingActiveBookings, setLoadingActiveBookings] = useState(false);

  // Poster Bids Modal State
  const [selectedTaskForBids, setSelectedTaskForBids] = useState<any | null>(null);
  const [taskBids, setTaskBids] = useState<any[]>([]);
  const [loadingBids, setLoadingBids] = useState(false);
  const [acceptingBidId, setAcceptingBidId] = useState<string | null>(null);
  const [rejectingBidId, setRejectingBidId] = useState<string | null>(null);
  const [bidActionMessage, setBidActionMessage] = useState<string | null>(null);

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

  // Fetch Active Bookings (Post-Deal Persistence across reloads)
  const fetchActiveBookings = async () => {
    if (!token) return;
    try {
      setLoadingActiveBookings(true);
      const res = await bookingApi.getActiveBookings();
      if (res.data?.bookings) {
        setActiveBookings(res.data.bookings);
      }
    } catch (err) {
      console.error("Error fetching active bookings:", err);
    } finally {
      setLoadingActiveBookings(false);
    }
  };

  useEffect(() => {
    fetchTasks();
    if (token) {
      fetchActiveBookings();
    }
  }, [mode, selectedCategory, radiusKm, userLocation, token]);

  // Open Bids Review for Poster
  const handleOpenBids = async (taskId: string) => {
    try {
      setLoadingBids(true);
      setBidActionMessage(null);
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
      router.push(`/bookings/${booking.id}`);
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to accept bid.");
      setAcceptingBidId(null);
    }
  };

  // Poster Rejects Bid
  const handleRejectBid = async (bidId: string) => {
    try {
      setRejectingBidId(bidId);
      await bidApi.rejectBid(bidId);
      setBidActionMessage("Bid rejected. Worker has been notified.");

      if (selectedTaskForBids?.id) {
        const res = await serviceApi.getRequestById(selectedTaskForBids.id);
        setTaskBids(res.data.request.bids || []);
      }
      fetchTasks();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to reject bid.");
    } finally {
      setRejectingBidId(null);
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

          <div className="flex flex-wrap items-center gap-3">
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

      {/* Persistent Active Deals / Bookings Bar */}
      {token && activeBookings.length > 0 && (
        <div className="p-4 sm:p-5 rounded-3xl bg-amber-50 border-2 border-yellow-300 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-yellow-400 text-zinc-950 flex items-center justify-center font-bold shrink-0 shadow-sm">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-black text-zinc-950 uppercase tracking-wider">
                  Ongoing Active Bookings ({activeBookings.length})
                </h4>
                <span className="bg-yellow-400 text-zinc-950 text-[10px] font-extrabold px-2 py-0.5 rounded-full animate-pulse">
                  Active Deals
                </span>
              </div>
              <p className="text-xs text-zinc-600 mt-0.5">
                You have ongoing sessions requiring escrow payment, OTP verification, or messaging.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <button
              onClick={() => setActiveTab(activeTab === "active_bookings" ? "tasks" : "active_bookings")}
              className="px-4 py-2 rounded-xl bg-zinc-900 text-yellow-400 text-xs font-black hover:bg-zinc-800 transition shadow-sm w-full md:w-auto text-center"
            >
              {activeTab === "active_bookings" ? "Show Task Feed" : `View Active Bookings (${activeBookings.length})`}
            </button>
          </div>
        </div>
      )}

      {/* Main Tabs (Task Feed vs Active Bookings) */}
      {activeTab === "active_bookings" ? (
        /* Active Deals View */
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black text-zinc-950">Active Bookings & Deals</h2>
              <p className="text-xs text-zinc-500">
                Persistent sessions saved in PostgreSQL with chat history and escrow tracking.
              </p>
            </div>
            <button
              onClick={() => setActiveTab("tasks")}
              className="text-xs font-bold text-zinc-600 hover:text-zinc-950 underline"
            >
              Back to Open Tasks
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeBookings.map((b) => {
              const isCust = b.roleInBooking === "customer";
              const counterpartName = isCust
                ? b.worker_profile?.user?.name || "Tasker"
                : b.service_request?.customer_profile?.user?.name || "Customer";
              const taskTitle = b.service_request?.title || "Hyperlocal Task";
              const budget = b.service_request?.budget || 400;

              return (
                <div
                  key={b.id}
                  className="p-6 rounded-3xl bg-white border border-zinc-200/90 shadow-sm space-y-4 hover:border-yellow-400 transition"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-black uppercase text-yellow-700 bg-yellow-100 px-2 py-0.5 rounded-md">
                        {b.service_request?.category || "Errands"}
                      </span>
                      <h3 className="text-base font-extrabold text-zinc-950 mt-1 line-clamp-1">
                        {taskTitle}
                      </h3>
                      <p className="text-xs text-zinc-500">
                        {isCust ? "Tasker" : "Poster"}: <strong>{counterpartName}</strong>
                      </p>
                    </div>

                    <Badge
                      variant={
                        b.status === "confirmed" || b.status === "in_progress"
                          ? "honey"
                          : "warning"
                      }
                      size="sm"
                    >
                      {b.status === "pending"
                        ? "Awaiting Escrow"
                        : b.status === "confirmed"
                        ? "Escrow Held"
                        : "In Progress"}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between text-xs text-zinc-600 pt-2 border-t border-zinc-100">
                    <div className="flex items-center gap-1 font-bold text-zinc-900">
                      <span>Agreed Budget:</span>
                      <span className="text-yellow-600 font-black">₹{budget}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <Lock className="w-3.5 h-3.5 text-yellow-600" />
                      <span>{b.isChatLocked ? "Chat Locked" : "Chat Unlocked"}</span>
                    </div>
                  </div>

                  <Link href={`/bookings/${b.id}`} className="block w-full">
                    <Button
                      size="sm"
                      className="w-full font-black shadow-honeySmall"
                      rightIcon={<ArrowRight className="w-4 h-4" />}
                    >
                      Resume Booking Room & Chat
                    </Button>
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Regular Task Feed View */
        <>
          {/* STRICT ROLE RULE: Dynamic Distance Radius ONLY in Tasker Mode */}
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
                  leftIcon={
                    locating ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Navigation className="w-3.5 h-3.5" />
                    )
                  }
                >
                  {locating ? "Locating..." : userLocation ? "GPS Active" : "Detect GPS"}
                </Button>
              </div>
            </div>
          )}

          {/* Search Bar & View Toggle (Mapbox Toggle strictly available ONLY in Tasker Mode) */}
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

            {/* STRICT RULE: Radar Map Switcher ONLY rendered in Tasker Mode */}
            {!isPoster && (
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
            )}
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

          {/* Poster Not Logged In Notice */}
          {isPoster && !token && (
            <div className="p-6 rounded-3xl bg-yellow-50 border border-yellow-300 text-center space-y-3">
              <Zap className="w-8 h-8 text-yellow-600 mx-auto" />
              <h3 className="text-base font-black text-zinc-950">
                Log In to View and Manage Your Posted Tasks
              </h3>
              <p className="text-xs text-zinc-600 max-w-md mx-auto">
                Poster Mode strictly shows tasks posted from your account. Sign in to review offers from local taskers.
              </p>
              <div className="flex justify-center gap-3 pt-2">
                <Link href="/login">
                  <Button size="sm" variant="primary">
                    Sign In
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button size="sm" variant="outline">
                    Sign Up
                  </Button>
                </Link>
              </div>
            </div>
          )}

          {/* Main Content: Mapbox Radar Map (Tasker Mode Only) vs Task Grid */}
          {loading ? (
            <div className="py-20 text-center space-y-3">
              <Loader2 className="w-8 h-8 text-yellow-500 animate-spin mx-auto" />
              <p className="text-xs font-bold text-zinc-500">Querying live hyperlocal database...</p>
            </div>
          ) : !isPoster && viewMode === "map" ? (
            /* Production Mapbox GL JS Radar Map */
            <TaskerRadarMap
              tasks={filteredTasks}
              userLocation={userLocation}
              radiusKm={radiusKm}
              onSelectTask={(task) => handleOpenBids(task.id)}
            />
          ) : (
            /* Grid View */
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
          )}
        </>
      )}

      {/* Poster Bids Drawer / Modal with Accept AND Reject Flow */}
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

              {bidActionMessage && (
                <div className="p-3.5 rounded-2xl bg-amber-50 border border-yellow-300 text-xs font-bold text-amber-900 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>{bidActionMessage}</span>
                </div>
              )}

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
                          <Badge
                            variant={
                              bid.status === "accepted"
                                ? "success"
                                : bid.status === "rejected"
                                ? "danger"
                                : "warning"
                            }
                            size="sm"
                          >
                            {bid.status}
                          </Badge>
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

                      {bid.status === "pending" && (
                        <div className="flex items-center gap-2 shrink-0">
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => handleRejectBid(bid.id)}
                            isLoading={rejectingBidId === bid.id}
                            className="text-xs font-bold"
                            leftIcon={<XCircle className="w-3.5 h-3.5" />}
                          >
                            Reject
                          </Button>

                          <Button
                            size="sm"
                            onClick={() => handleAcceptBid(bid.id)}
                            isLoading={acceptingBidId === bid.id}
                            className="font-black shadow-honeySmall"
                            rightIcon={<CheckCircle2 className="w-4 h-4" />}
                          >
                            Accept & Lock Escrow
                          </Button>
                        </div>
                      )}
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
