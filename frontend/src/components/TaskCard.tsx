"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  MapPin,
  Clock,
  Star,
  Zap,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";
import { useAppStore } from "@/lib/store";

export interface TaskItem {
  id: string;
  title: string;
  category: string;
  location: string;
  budget: number;
  scheduledFor: string;
  posterName: string;
  posterRating: number;
  status: "pending" | "assigned" | "in_progress" | "completed";
  bidsCount?: number;
}

interface TaskCardProps {
  task: TaskItem;
  onApply?: (taskId: string) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, onApply }) => {
  const { mode } = useAppStore();
  const isWorker = mode === "worker";

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case "delivery":
        return "bg-sky-50 text-sky-700 border-sky-200";
      case "shifting":
        return "bg-amber-50 text-amber-800 border-amber-200";
      case "typing":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "domestic help":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      default:
        return "bg-yellow-50 text-yellow-800 border-yellow-200";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="group relative rounded-2xl bg-white border border-zinc-200/90 hover:border-yellow-400 p-5 shadow-sm hover:shadow-honeyGlow transition-all duration-300 flex flex-col justify-between"
    >
      {/* Top Meta Bar */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <span
            className={`text-[11px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-lg border ${getCategoryColor(
              task.category
            )}`}
          >
            {task.category}
          </span>

          {/* Escrow Protected Pill */}
          <div className="flex items-center gap-1 text-[11px] font-bold text-zinc-600 bg-zinc-100 px-2.5 py-0.5 rounded-full">
            <ShieldCheck className="w-3.5 h-3.5 text-yellow-600" />
            <span>Escrow Verified</span>
          </div>
        </div>

        {/* Task Title */}
        <h3 className="text-base font-bold text-zinc-900 group-hover:text-yellow-600 transition-colors line-clamp-2 mb-2">
          {task.title}
        </h3>

        {/* Location & Time Info */}
        <div className="space-y-1.5 mb-4 text-xs text-zinc-600">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-yellow-600 shrink-0" />
            <span className="truncate">{task.location}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            <span>{new Date(task.scheduledFor).toLocaleString("en-IN", {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}</span>
          </div>
        </div>
      </div>

      {/* Footer Info: Budget + Poster Profile + CTA */}
      <div className="pt-3 border-t border-zinc-100 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
              Budget Offer
            </span>
            <div className="text-lg font-black text-zinc-950 flex items-baseline gap-0.5">
              <span className="text-yellow-500 font-extrabold">?</span>
              <span>{task.budget}</span>
            </div>
          </div>

          {/* Poster Rating */}
          <div className="text-right">
            <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
              Task Poster
            </span>
            <div className="flex items-center justify-end gap-1 text-xs font-bold text-zinc-800">
              <span>{task.posterName}</span>
              <div className="flex items-center text-yellow-500">
                <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                <span className="text-zinc-900 text-xs ml-0.5">{task.posterRating.toFixed(1)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="w-full">
          {isWorker ? (
            <Button
              onClick={() => onApply && onApply(task.id)}
              variant="primary"
              size="sm"
              className="w-full font-bold shadow-none"
              rightIcon={<Zap className="w-3.5 h-3.5 fill-current" />}
            >
              Quick Bid / Apply
            </Button>
          ) : (
            <Link href={`/bookings/${task.id}`}>
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs font-bold hover:bg-yellow-400 hover:text-zinc-950 hover:border-yellow-400"
                rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
              >
                Manage & Assign
              </Button>
            </Link>
          )}
        </div>
      </div>
    </motion.div>
  );
};

