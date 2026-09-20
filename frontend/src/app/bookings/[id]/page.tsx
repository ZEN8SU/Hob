"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap,
  MapPin,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Send,
  User,
  Star,
  Lock,
  Phone,
  MessageSquare,
  Award,
} from "lucide-react";
import { StatusStepper, BookingStatus } from "@/components/StatusStepper";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useAppStore } from "@/lib/store";
import { bookingApi, paymentApi, reviewApi } from "@/lib/api";

export default function BookingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params?.id as string;
  const { user, mode } = useAppStore();
  const isWorker = mode === "worker";

  const [booking, setBooking] = useState<any>(null);
  const [status, setStatus] = useState<BookingStatus>("confirmed");
  const [loading, setLoading] = useState(false);
  const [otpInput, setOtpInput] = useState("");
  const [otpVerified, setOtpVerified] = useState(false);

  // Chat State
  const [messages, setMessages] = useState<Array<{ sender: "me" | "them"; text: string; time: string }>>([
    { sender: "them", text: "Namaste! I have accepted your task. I am on my way.", time: "10:02 AM" },
    { sender: "me", text: "Great! Please let me know when you reach near the landmark.", time: "10:04 AM" },
  ]);
  const [chatInput, setChatInput] = useState("");

  // Review Modal State
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [rating, setRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");

  const mockOtp = "4829"; // 4-digit verification handshake

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    setMessages((prev) => [
      ...prev,
      {
        sender: "me",
        text: chatInput.trim(),
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
    setChatInput("");
  };

  const handleStartTask = async () => {
    if (otpInput !== mockOtp) {
      alert("Invalid Handshake OTP. Please ask customer for the 4-digit code.");
      return;
    }
    setOtpVerified(true);
    setStatus("in_progress");
  };

  const handleCompleteTask = async () => {
    setStatus("completed");
    setShowReviewModal(true);
  };

  const handleSubmitReview = async () => {
    try {
      setShowReviewModal(false);
      alert("Thank you! Review submitted and Escrow funds released to Worker.");
      router.push("/wallet");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-black uppercase text-yellow-600 tracking-wider">
              Booking Tracking Room
            </span>
            <Badge variant="honey" size="sm">
              ID: {bookingId ? bookingId.slice(0, 8) : "BK-7890"}
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-zinc-950">
            Medicine & Grocery Urgent Delivery
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant="dark" size="md">
            ?450 Escrow Locked
          </Badge>
        </div>
      </div>

      {/* 4-Step Lifecycle Status Stepper */}
      <StatusStepper currentStatus={status} />

      {/* Main Grid: Details + OTP Handshake + Live Chat */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Details & OTP Handshake */}
        <div className="lg:col-span-2 space-y-6">
          {/* Handshake OTP Card */}
          <div className="rounded-3xl bg-zinc-900 text-white p-6 border-2 border-yellow-400/40 relative overflow-hidden shadow-xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Lock className="w-5 h-5 text-yellow-400" />
                  <h3 className="text-base font-bold text-white">
                    4-Digit Security Handshake OTP
                  </h3>
                </div>
                <p className="text-xs text-zinc-400 mt-1 max-w-sm">
                  {isWorker
                    ? "Ask the task poster for their 4-digit code to start this job."
                    : "Share this secret OTP with your tasker only after they arrive."}
                </p>
              </div>

              {!isWorker ? (
                <div className="bg-yellow-400 text-zinc-950 font-black text-2xl tracking-widest px-5 py-2.5 rounded-2xl shadow-honeySmall">
                  {mockOtp}
                </div>
              ) : status === "confirmed" ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Enter 4-digit OTP"
                    maxLength={4}
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value)}
                    className="w-36 px-3 py-2 text-center text-zinc-900 font-black tracking-widest rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  />
                  <Button size="sm" onClick={handleStartTask}>
                    Verify
                  </Button>
                </div>
              ) : (
                <Badge variant="success" size="md">
                  Handshake Verified ?
                </Badge>
              )}
            </div>
          </div>

          {/* Task Info Bento Box */}
          <div className="rounded-3xl bg-white border border-zinc-200 p-6 space-y-4 shadow-sm">
            <h3 className="text-sm font-black text-zinc-900 uppercase tracking-wider">
              Task Specifications
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200/80 space-y-1">
                <span className="text-zinc-500 font-bold">Location Address</span>
                <p className="font-extrabold text-zinc-900 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-yellow-600 shrink-0" />
                  <span>12th Main Road, Indiranagar, Bengaluru</span>
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200/80 space-y-1">
                <span className="text-zinc-500 font-bold">Scheduled Window</span>
                <p className="font-extrabold text-zinc-900 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-yellow-600 shrink-0" />
                  <span>Today, 10:30 AM - 11:30 AM</span>
                </p>
              </div>
            </div>

            {/* Action Bar based on Status */}
            <div className="pt-4 border-t border-zinc-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-yellow-600" />
                <span className="text-xs font-bold text-zinc-700">
                  Escrow Payout: ?382.50 (85%)
                </span>
              </div>

              {status === "in_progress" && (
                <Button onClick={handleCompleteTask} variant="primary" size="md" className="font-black">
                  Mark Task Completed
                </Button>
              )}

              {status === "completed" && (
                <Button onClick={() => setShowReviewModal(true)} variant="secondary" size="md" className="font-black">
                  Leave Rating & Review ?
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Right Col: Live In-App Chat */}
        <div className="rounded-3xl bg-white border border-zinc-200 shadow-sm flex flex-col h-[520px] overflow-hidden">
          {/* Chat Header */}
          <div className="p-4 bg-zinc-900 text-white border-b border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-yellow-400 text-zinc-950 font-black text-xs flex items-center justify-center">
                {isWorker ? "C" : "W"}
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">
                  {isWorker ? "Customer (Pooja V.)" : "Tasker (Ramesh K.)"}
                </h4>
                <div className="flex items-center gap-1 text-[10px] text-yellow-400">
                  <Star className="w-3 h-3 fill-yellow-400" />
                  <span>4.9 (42 tasks)</span>
                </div>
              </div>
            </div>

            <a
              href="tel:9876543210"
              className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-yellow-400 transition"
              title="Call Tasker"
            >
              <Phone className="w-4 h-4" />
            </a>
          </div>

          {/* Messages Area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-zinc-50/50 text-xs">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${
                  msg.sender === "me" ? "items-end" : "items-start"
                }`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-2xl font-medium ${
                    msg.sender === "me"
                      ? "bg-yellow-400 text-zinc-950 rounded-tr-none shadow-sm"
                      : "bg-white text-zinc-900 border border-zinc-200 rounded-tl-none shadow-sm"
                  }`}
                >
                  {msg.text}
                </div>
                <span className="text-[10px] text-zinc-400 mt-1 px-1">{msg.time}</span>
              </div>
            ))}
          </div>

          {/* Chat Input */}
          <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-zinc-200 flex items-center gap-2">
            <input
              type="text"
              placeholder="Type message to tasker..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              className="flex-1 px-4 py-2.5 rounded-xl bg-zinc-100 text-xs font-medium text-zinc-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-yellow-400/30 transition"
            />
            <button
              type="submit"
              className="p-2.5 rounded-xl bg-yellow-400 hover:bg-yellow-500 text-zinc-950 font-bold transition shadow-sm"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      {/* Review & Rating Modal */}
      <AnimatePresence>
        {showReviewModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 border border-zinc-200 shadow-2xl space-y-6"
            >
              <div className="text-center">
                <div className="w-12 h-12 rounded-2xl bg-yellow-100 text-yellow-700 flex items-center justify-center mx-auto mb-3">
                  <Award className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-black text-zinc-950">Rate Your Experience</h3>
                <p className="text-xs text-zinc-500 mt-1">
                  Mutual ratings keep the HOB platform trusted and high quality.
                </p>
              </div>

              {/* Star Selector */}
              <div className="flex items-center justify-center gap-2">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setRating(s)}
                    className="p-1 text-2xl transition hover:scale-125"
                  >
                    <Star
                      className={`w-8 h-8 ${
                        s <= rating
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-zinc-300"
                      }`}
                    />
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                  Feedback / Comment
                </label>
                <textarea
                  rows={3}
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Super fast delivery, polite and on time..."
                  className="w-full rounded-2xl border border-zinc-200 p-3 text-xs text-zinc-900 focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20"
                />
              </div>

              <div className="space-y-2">
                <Button onClick={handleSubmitReview} className="w-full font-black shadow-honeySmall">
                  Submit Review & Settle Ledger
                </Button>
                <button
                  onClick={() => setShowReviewModal(false)}
                  className="w-full text-center text-xs font-bold text-zinc-500 hover:text-zinc-900 py-1"
                >
                  Skip for Now
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
