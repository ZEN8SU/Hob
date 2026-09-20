"use client";

import React from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Clock, PlayCircle, Award, XCircle } from "lucide-react";

export type BookingStatus = "pending" | "confirmed" | "in_progress" | "completed" | "cancelled";

interface StatusStepperProps {
  currentStatus: BookingStatus;
  startedAt?: string | null;
  completedAt?: string | null;
}

export const StatusStepper: React.FC<StatusStepperProps> = ({
  currentStatus,
  startedAt,
  completedAt,
}) => {
  const steps = [
    { id: "pending", label: "Request Posted", icon: Clock, desc: "Worker match in progress" },
    { id: "confirmed", label: "Escrow Locked", icon: CheckCircle2, desc: "Funds held securely" },
    { id: "in_progress", label: "Task Active", icon: PlayCircle, desc: startedAt ? "Started" : "In execution" },
    { id: "completed", label: "Completed", icon: Award, desc: completedAt ? "Settled & Released" : "Ready for review" },
  ];

  const getStepIndex = (status: BookingStatus) => {
    switch (status.toLowerCase()) {
      case "pending":
        return 0;
      case "confirmed":
        return 1;
      case "in_progress":
        return 2;
      case "completed":
        return 3;
      case "cancelled":
        return -1;
      default:
        return 0;
    }
  };

  const currentIndex = getStepIndex(currentStatus);
  const isCancelled = currentStatus.toLowerCase() === "cancelled";

  if (isCancelled) {
    return (
      <div className="rounded-2xl bg-rose-50 border border-rose-200 p-4 flex items-center gap-3">
        <XCircle className="w-6 h-6 text-rose-600 shrink-0" />
        <div>
          <h4 className="text-sm font-bold text-rose-900">Booking Cancelled</h4>
          <p className="text-xs text-rose-700">
            This micro-task was cancelled. Any held escrow funds have been refunded back to customer.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-white rounded-2xl border border-zinc-200/90 p-5 shadow-sm">
      <div className="flex items-center justify-between relative">
        {/* Background Connecting Bar */}
        <div className="absolute top-5 left-8 right-8 h-1 bg-zinc-200 -z-0" />

        {/* Animated Active Progress Fill Bar */}
        <motion.div
          className="absolute top-5 left-8 h-1 bg-yellow-400 -z-0"
          initial={{ width: "0%" }}
          animate={{
            width: `${(Math.max(0, currentIndex) / (steps.length - 1)) * 92}%`,
          }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        />

        {steps.map((step, idx) => {
          const isFinished = idx < currentIndex;
          const isActive = idx === currentIndex;
          const Icon = step.icon;

          return (
            <div key={step.id} className="flex flex-col items-center relative z-10">
              <motion.div
                whileHover={{ scale: 1.1 }}
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                  isFinished
                    ? "bg-zinc-900 border-zinc-900 text-yellow-400"
                    : isActive
                    ? "bg-yellow-400 border-yellow-500 text-zinc-950 shadow-honeySmall ring-4 ring-yellow-200"
                    : "bg-white border-zinc-300 text-zinc-400"
                }`}
              >
                <Icon className="w-5 h-5" />
              </motion.div>

              <span
                className={`mt-2 text-xs font-bold text-center ${
                  isActive ? "text-zinc-950" : isFinished ? "text-zinc-800" : "text-zinc-400"
                }`}
              >
                {step.label}
              </span>

              <span className="text-[10px] text-zinc-500 hidden sm:block text-center max-w-[90px]">
                {step.desc}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

