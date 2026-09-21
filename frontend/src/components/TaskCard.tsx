"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  Clock,
  Star,
  Zap,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  X,
  IndianRupee,
  MessageSquare,
  AlertCircle,
  Users,
} from "lucide-react";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { useAppStore } from "@/lib/store";
import { bidApi } from "@/lib/api";

export interface TaskItem {
  id: string;
  title: string;
  category: string;
  location: string;
  budget: number;
  timeConstraint?: string;
  scheduledFor: string;
  posterName: string;
  posterRating: number;
  status: "pending" | "assigned" | "in_progress" | "completed" | "cancelled";
  bidsCount?: number;
  distanceKm?: number | null;
  customerId?: string;
}

interface TaskCardProps {
  task: TaskItem;
  onBidSubmitted?: () => void;
  onViewBids?: (taskId: string) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, onBidSubmitted, onViewBids }) => {
  const { mode, token, user } = useAppStore();
  const isWorker = mode === "worker";

  const [showBidModal, setShowBidModal] = useState(false);
  const [proposedPrice, setProposedPrice] = useState(String(task.budget));
  const [pitchMessage, setPitchMessage] = useState("");
  const [bidLoading, setBidLoading] = useState(false);
  const [bidSuccess, setBidSuccess] = useState(false);
  const [bidError, setBidError] = useState<string | null>(null);

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case "delivery":
        return "bg-sky-50 text-sky-700 border-sky-200";
      case "shifting":
        return "bg-amber-50 text-amber-800 border-amber-200";
      case "typing":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "plumbing":
        return "bg-blue-50 text-blue-800 border-blue-200";
      case "domestic help":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      default:
        return "bg-yellow-50 text-yellow-800 border-yellow-200";
    }
  };

  const handlePlaceBid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      alert("Please login as a Tasker to place bids.");
      return;
    }

    try {
      setBidLoading(true);
      setBidError(null);

      await bidApi.createBid(task.id, {
        proposedPrice: Number(proposedPrice),
        message: pitchMessage.trim() || undefined,
      });

      setBidSuccess(true);
      setTimeout(() => {
        setBidSuccess(false);
        setShowBidModal(false);
        if (onBidSubmitted) onBidSubmitted();
      }, 1500);
    } catch (err: any) {
      setBidError(err.response?.data?.message || "Failed to submit bid. Try again.");
    } finally {
      setBidLoading(false);
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -4, transition: { duration: 0.2 } }}
        className="group relative rounded-3xl bg-white border border-zinc-200/90 hover:border-yellow-400 p-5 sm:p-6 shadow-sm hover:shadow-honeyGlow transition-all duration-300 flex flex-col justify-between"
      >
        {/* Top Meta Bar */}
        <div>
          <div className="flex items-center justify-between gap-2 mb-3">
            <span
              className={`text-[11px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-xl border ${getCategoryColor(
                task.category
              )}`}
            >
              {task.category}
            </span>

            {/* Distance Badge in Tasker Mode */}
            {isWorker && task.distanceKm !== undefined && task.distanceKm !== null ? (
              <span className="text-[11px] font-extrabold text-zinc-900 bg-yellow-100 border border-yellow-300 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <MapPin className="w-3 h-3 text-yellow-700 fill-yellow-600" />
                <span>{task.distanceKm.toFixed(1)} km away</span>
              </span>
            ) : (
              <div className="flex items-center gap-1 text-[11px] font-bold text-zinc-600 bg-zinc-100 px-2.5 py-0.5 rounded-full">
                <ShieldCheck className="w-3.5 h-3.5 text-yellow-600" />
                <span>Escrow Verified</span>
              </div>
            )}
          </div>

          {/* Task Title */}
          <h3 className="text-base font-extrabold text-zinc-900 group-hover:text-yellow-600 transition-colors line-clamp-2 mb-2">
            {task.title}
          </h3>

          {/* Location & Time Info */}
          <div className="space-y-1.5 mb-4 text-xs text-zinc-600 font-medium">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-yellow-600 shrink-0" />
              <span className="truncate">{task.location}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              <span>
                {task.timeConstraint ? (
                  <strong className="text-yellow-700 bg-yellow-50 px-1.5 py-0.5 rounded border border-yellow-200 mr-1.5 font-bold">
                    {task.timeConstraint}
                  </strong>
                ) : null}
                {new Date(task.scheduledFor).toLocaleString("en-IN", {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Footer Info: Budget + Poster Profile + CTA */}
        <div className="pt-3 border-t border-zinc-100 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                Budget Offer
              </span>
              <div className="text-lg font-black text-zinc-950 flex items-baseline gap-0.5">
                <span className="text-yellow-500 font-extrabold">₹</span>
                <span>{task.budget}</span>
              </div>
            </div>

            {/* Poster Rating / Bids Count */}
            <div className="text-right">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                {isWorker ? "Task Poster" : "Offers Received"}
              </span>
              <div className="flex items-center justify-end gap-1 text-xs font-bold text-zinc-800">
                {isWorker ? (
                  <>
                    <span>{task.posterName}</span>
                    <div className="flex items-center text-yellow-500">
                      <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                      <span className="text-zinc-900 text-xs ml-0.5">{task.posterRating.toFixed(1)}</span>
                    </div>
                  </>
                ) : (
                  <span className="bg-zinc-100 px-2 py-0.5 rounded-lg text-zinc-900 font-black flex items-center gap-1">
                    <Users className="w-3 h-3 text-yellow-600" />
                    <span>{task.bidsCount || 0} Bids</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="w-full">
            {isWorker ? (
              <Button
                onClick={() => setShowBidModal(true)}
                variant="primary"
                size="sm"
                className="w-full font-black shadow-honeySmall"
                rightIcon={<Zap className="w-3.5 h-3.5 fill-current" />}
              >
                Quick Bid / Apply
              </Button>
            ) : (
              <Button
                onClick={() => onViewBids && onViewBids(task.id)}
                variant="outline"
                size="sm"
                className="w-full text-xs font-bold hover:bg-yellow-400 hover:text-zinc-950 hover:border-yellow-400"
                rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
              >
                Review Bids ({task.bidsCount || 0})
              </Button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Quick Bid Modal */}
      <AnimatePresence>
        {showBidModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 border border-zinc-200 shadow-2xl space-y-5 relative"
            >
              <button
                onClick={() => setShowBidModal(false)}
                className="absolute top-6 right-6 text-zinc-400 hover:text-zinc-900 transition"
              >
                <X className="w-5 h-5" />
              </button>

              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-yellow-700 bg-yellow-100 px-2.5 py-1 rounded-md">
                  {task.category}
                </span>
                <h3 className="text-lg font-black text-zinc-950 mt-2 line-clamp-1">
                  Bid on: {task.title}
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Poster budget: ₹{task.budget} • Location: {task.location}
                </p>
              </div>

              {bidError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{bidError}</span>
                </div>
              )}

              {bidSuccess ? (
                <div className="p-6 text-center space-y-2 bg-emerald-50 rounded-2xl border border-emerald-200">
                  <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                  <h4 className="text-sm font-black text-emerald-950">Bid Placed Successfully!</h4>
                  <p className="text-xs text-emerald-700">
                    The task poster will review your offer and lock escrow.
                  </p>
                </div>
              ) : (
                <form onSubmit={handlePlaceBid} className="space-y-4">
                  <Input
                    label="Your Proposed Price (₹ INR) *"
                    type="number"
                    value={proposedPrice}
                    onChange={(e) => setProposedPrice(e.target.value)}
                    leftIcon={<IndianRupee className="w-4 h-4" />}
                    required
                  />

                  <div>
                    <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                      Proposal Message / Pitch (Optional)
                    </label>
                    <textarea
                      rows={3}
                      placeholder="e.g. I am in Indiranagar 500m away, can finish this in 30 minutes with high accuracy..."
                      value={pitchMessage}
                      onChange={(e) => setPitchMessage(e.target.value)}
                      className="w-full rounded-2xl border border-zinc-200 p-3 text-xs text-zinc-900 focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20"
                    />
                  </div>

                  <div className="pt-2">
                    <Button
                      type="submit"
                      className="w-full font-black shadow-honeySmall"
                      isLoading={bidLoading}
                      rightIcon={<Zap className="w-4 h-4 fill-current" />}
                    >
                      Submit Bid to Poster
                    </Button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
