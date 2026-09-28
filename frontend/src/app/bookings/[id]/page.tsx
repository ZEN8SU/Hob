"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { io, Socket } from "socket.io-client";
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
  CreditCard,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { StatusStepper, BookingStatus } from "@/components/StatusStepper";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useAppStore } from "@/lib/store";
import { bookingApi, paymentApi, reviewApi, SOCKET_URL } from "@/lib/api";

export default function BookingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params?.id as string;
  // Strictly avoid binding component logic to global UI mode toggle
  const { user, token } = useAppStore();

  const [booking, setBooking] = useState<any>(null);
  const [status, setStatus] = useState<BookingStatus>("pending");
  const [loading, setLoading] = useState(true);
  const [isChatLocked, setIsChatLocked] = useState(true);
  const [otpInput, setOtpInput] = useState("");
  const [payingEscrow, setPayingEscrow] = useState(false);

  // Chat State
  const [messages, setMessages] = useState<
    Array<{ id?: string; senderId?: string; senderName?: string; text: string; time: string; isMe: boolean }>
  >([]);
  const [chatInput, setChatInput] = useState("");
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Review Modal State
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [rating, setRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  // Auto-scroll chat messages to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Fetch Booking Details from DB
  const fetchBooking = async () => {
    try {
      setLoading(true);
      const res = await bookingApi.getBookingById(bookingId);
      const b = res.data.booking;
      setBooking(b);
      setStatus(b.status as BookingStatus);
      setIsChatLocked(b.isChatLocked);

      // Load DB messages if available
      if (b.chat_messages && b.chat_messages.length > 0) {
        setMessages(
          b.chat_messages.map((m: any) => ({
            id: m.id,
            senderId: m.senderId,
            senderName: m.sender?.name || "User",
            text: m.message,
            time: new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            isMe: m.senderId === user?.id,
          }))
        );
      }
    } catch (err) {
      console.error("Error fetching booking:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (bookingId && token) {
      fetchBooking();
    }
  }, [bookingId, token]);

  // Socket.io Real-time Chat Connection - Stable and immune to global Navbar role toggles
  useEffect(() => {
    if (!token || !bookingId) return;

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ["websocket", "polling"],
    });

    socketRef.current = socket;

    const handleConnect = () => {
      socket.emit("join_booking", bookingId);
      socket.emit("join_room", bookingId);
    };

    const handleBookingJoined = (data: any) => {
      if (data && typeof data.isLocked === "boolean") {
        setIsChatLocked(data.isLocked);
      }
    };

    const handleNewMessage = (msg: any) => {
      setMessages((prev) => {
        if (msg.id && prev.some((m) => m.id === msg.id)) {
          return prev;
        }
        return [
          ...prev,
          {
            id: msg.id,
            senderId: msg.senderId,
            senderName: msg.sender?.name || "User",
            text: msg.message,
            time: new Date(msg.createdAt || Date.now()).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
            isMe: msg.senderId === user?.id,
          },
        ];
      });
    };

    socket.on("connect", handleConnect);
    socket.on("booking_joined", handleBookingJoined);
    socket.on("new_message", handleNewMessage);

    if (socket.connected) {
      handleConnect();
    }

    return () => {
      socket.off("connect", handleConnect);
      socket.off("booking_joined", handleBookingJoined);
      socket.off("new_message", handleNewMessage);
      socket.emit("leave_booking", bookingId);
      socket.emit("leave_room", bookingId);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [bookingId, token, user?.id]);

  // Send Chat Message via Socket.io
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isChatLocked) return;

    if (socketRef.current) {
      socketRef.current.emit("send_message", {
        bookingId,
        message: chatInput.trim(),
      });
      setChatInput("");
    }
  };

  // Poster Deposits Escrow via Razorpay
  const handlePayEscrow = async () => {
    try {
      setPayingEscrow(true);
      // 1. Create Razorpay Order
      const orderRes = await paymentApi.createRazorpayOrder({
        bookingId,
        amount: booking?.service_request?.budget || 400,
      });

      const order = orderRes.data.order;

      // 2. Mock / Real Razorpay Verification
      await paymentApi.verifyRazorpayPayment({
        bookingId,
        razorpayOrderId: order.id,
        razorpayPaymentId: `pay_${Date.now()}`,
        razorpaySignature: "mock_signature_approved",
        amount: orderRes.data.breakdown?.totalAmount || booking?.service_request?.budget || 400,
      });

      alert("Escrow Payment Secured! Funds locked in Escrow. Chat is now unlocked.");
      await fetchBooking();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to process escrow payment.");
    } finally {
      setPayingEscrow(false);
    }
  };

  // Tasker Starts Task
  const handleStartTask = async () => {
    try {
      await bookingApi.updateStatus(bookingId, { status: "in_progress" });
      setStatus("in_progress");
      await fetchBooking();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to start task.");
    }
  };

  // Tasker Completes Task with 4-Digit Handshake OTP
  const handleCompleteTask = async () => {
    if (!otpInput || otpInput.trim().length !== 4) {
      alert("Please enter the 4-digit Handshake OTP provided by the Customer.");
      return;
    }

    try {
      setLoading(true);
      await bookingApi.updateStatus(bookingId, {
        status: "completed",
        otpCode: otpInput.trim(),
      });

      setStatus("completed");
      setShowReviewModal(true);
      await fetchBooking();
    } catch (err: any) {
      alert(err.response?.data?.message || "Invalid Handshake OTP code.");
    } finally {
      setLoading(false);
    }
  };

  // Submit Mutual Review & Rating
  const handleSubmitReview = async () => {
    try {
      setSubmittingReview(true);
      await reviewApi.createReview({
        bookingId,
        rating,
        comment: reviewComment.trim() || undefined,
      });
      setShowReviewModal(false);
      alert("Thank you! Review saved and transaction settled.");
      router.push("/wallet");
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to submit review.");
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading && !booking) {
    return (
      <div className="py-24 text-center space-y-3">
        <Loader2 className="w-8 h-8 text-yellow-500 animate-spin mx-auto" />
        <p className="text-xs font-bold text-zinc-500">Loading booking workspace...</p>
      </div>
    );
  }

  // Determine user role strictly from booking object context (NOT global Navbar state)
  const customerUserId =
    booking?.service_request?.customer_profile?.userId ||
    booking?.service_request?.customerId ||
    booking?.customerId;

  const workerUserId =
    booking?.worker_profile?.userId ||
    booking?.workerId;

  const isCustomer = Boolean(user?.id && customerUserId === user.id);
  const isWorker = Boolean(user?.id && workerUserId === user.id);

  const taskTitle = booking?.service_request?.title || "Hyperlocal Task Booking";
  const budgetAmount = booking?.service_request?.budget || 400;
  const handshakeCode = booking?.handshakeOtp || booking?.otpCode || "4829";

  // Partner display name and avatar initial
  const partnerName = isWorker
    ? booking?.service_request?.customer_profile?.user?.name || "Customer"
    : booking?.worker_profile?.user?.name || "Tasker";

  const partnerInitial = partnerName.charAt(0).toUpperCase() || (isWorker ? "C" : "T");

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
            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-zinc-900 text-yellow-400">
              {isCustomer ? "Viewing as Customer" : isWorker ? "Viewing as Tasker" : "Job Room"}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-zinc-950">{taskTitle}</h1>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant={status === "confirmed" || status === "in_progress" ? "honey" : "dark"} size="md">
            ₹{budgetAmount} Escrow {status === "pending" ? "Pending" : "Locked"}
          </Badge>
        </div>
      </div>

      {/* 4-Step Lifecycle Status Stepper */}
      <StatusStepper currentStatus={status} />

      {/* Escrow Deposit Warning Banner (If Pending) */}
      {status === "pending" && (
        <div className="p-6 rounded-3xl bg-amber-50 border-2 border-amber-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-black text-amber-950">
                {isCustomer
                  ? "Action Required: Lock Escrow Payment to Unlock Task & Chat"
                  : "Awaiting Customer Escrow Payment Deposit"}
              </h4>
              <p className="text-xs text-amber-800 mt-0.5 max-w-xl">
                {isCustomer
                  ? "Hold funds safely in Escrow via Razorpay. Tasker will be dispatched and encrypted chat will unlock immediately."
                  : "The poster is completing payment into Escrow. Chat and start button will unlock once confirmed."}
              </p>
            </div>
          </div>

          {isCustomer && (
            <Button
              onClick={handlePayEscrow}
              isLoading={payingEscrow}
              className="font-black shadow-honeyGlow shrink-0"
              leftIcon={<CreditCard className="w-4 h-4" />}
            >
              Deposit ₹{budgetAmount} via Razorpay
            </Button>
          )}
        </div>
      )}

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
                  {isCustomer
                    ? "Share this secret OTP with your tasker only after they arrive and finish."
                    : "Enter the customer's 4-digit code to complete the task and release 85% payout."}
                </p>
              </div>

              {isCustomer ? (
                <div className="bg-yellow-400 text-zinc-950 font-black text-2xl tracking-widest px-5 py-2.5 rounded-2xl shadow-honeySmall">
                  {handshakeCode}
                </div>
              ) : status === "in_progress" ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="4-digit OTP"
                    maxLength={4}
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value)}
                    className="w-32 px-3 py-2 text-center text-zinc-900 font-black tracking-widest rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  />
                  <Button size="sm" onClick={handleCompleteTask}>
                    Verify & Complete
                  </Button>
                </div>
              ) : status === "completed" ? (
                <Badge variant="success" size="md">
                  Handshake Verified ✓
                </Badge>
              ) : (
                <Badge variant="honey" size="sm">
                  Ready upon arrival
                </Badge>
              )}
            </div>
          </div>

          {/* Task Info Bento Box */}
          <div className="rounded-3xl bg-white border border-zinc-200 p-6 space-y-4 shadow-sm">
            <h3 className="text-sm font-black text-zinc-900 uppercase tracking-wider">
              Task Specifications & Payout Breakdown
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200/80 space-y-1">
                <span className="text-zinc-500 font-bold">Location Address</span>
                <p className="font-extrabold text-zinc-900 flex items-center gap-1.5 truncate">
                  <MapPin className="w-4 h-4 text-yellow-600 shrink-0" />
                  <span>{booking?.service_request?.address || "Local Vicinity"}</span>
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200/80 space-y-1">
                <span className="text-zinc-500 font-bold">Time Window & Urgency</span>
                <p className="font-extrabold text-zinc-900 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-yellow-600 shrink-0" />
                  <span>
                    {booking?.service_request?.timeConstraint || "Within 3 hours"}
                  </span>
                </p>
              </div>
            </div>

            {/* Action Bar based on Status */}
            <div className="pt-4 border-t border-zinc-100 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-yellow-600" />
                <span className="text-xs font-bold text-zinc-700">
                  Tasker 85% Payout: ₹{(budgetAmount * 0.85).toFixed(2)} (15% Platform Escrow)
                </span>
              </div>

              {status === "confirmed" && isWorker && (
                <Button onClick={handleStartTask} variant="primary" size="md" className="font-black">
                  Start Working on Task
                </Button>
              )}

              {status === "completed" && (
                <Button onClick={() => setShowReviewModal(true)} variant="secondary" size="md" className="font-black">
                  Leave Rating & Review ⭐
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Right Col: Locked / Unlocked Secure Chat System */}
        <div className="rounded-3xl bg-white border border-zinc-200 shadow-sm flex flex-col h-[520px] overflow-hidden relative">
          {/* Chat Header */}
          <div className="p-4 bg-zinc-900 text-white border-b border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-yellow-400 text-zinc-950 font-black text-xs flex items-center justify-center">
                {partnerInitial}
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">
                  {partnerName}
                </h4>
                <div className="flex items-center gap-1 text-[10px] text-yellow-400">
                  <Star className="w-3 h-3 fill-yellow-400" />
                  <span>5.0 Verified Peer ({isCustomer ? "Tasker" : "Customer"})</span>
                </div>
              </div>
            </div>

            <Badge variant={isChatLocked ? "dark" : "honey"} size="sm">
              {isChatLocked ? "🔒 Locked" : "⚡ Live Encrypted"}
            </Badge>
          </div>

          {/* Locked Chat Overlay */}
          {isChatLocked ? (
            <div className="flex-1 p-6 flex flex-col items-center justify-center text-center space-y-3 bg-zinc-50/80">
              <div className="w-12 h-12 rounded-2xl bg-zinc-900 text-yellow-400 flex items-center justify-center">
                <Lock className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-black text-zinc-900">Secure Chat is Locked</h4>
              <p className="text-xs text-zinc-500 max-w-xs">
                {isCustomer
                  ? "Chat unlocks instantly as soon as you deposit the escrow payment."
                  : "Chat unlocks once the poster completes escrow payment on Razorpay."}
              </p>
              {isCustomer && (
                <Button size="sm" onClick={handlePayEscrow} isLoading={payingEscrow}>
                  Deposit Escrow to Unlock
                </Button>
              )}
            </div>
          ) : (
            <>
              {/* Messages Area */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-zinc-50/50 text-xs">
                {messages.length === 0 ? (
                  <div className="py-12 text-center text-zinc-400 text-xs">
                    <MessageSquare className="w-8 h-8 mx-auto mb-2 text-zinc-300" />
                    <span>Secure chat unlocked. Say hello to your task partner!</span>
                  </div>
                ) : (
                  messages.map((msg, idx) => (
                    <div
                      key={msg.id || idx}
                      className={`flex flex-col ${msg.isMe ? "items-end" : "items-start"}`}
                    >
                      <div
                        className={`max-w-[80%] p-3 rounded-2xl font-medium ${
                          msg.isMe
                            ? "bg-yellow-400 text-zinc-950 rounded-tr-none shadow-sm font-semibold"
                            : "bg-white text-zinc-900 border border-zinc-200 rounded-tl-none shadow-sm"
                        }`}
                      >
                        {msg.text}
                      </div>
                      <span className="text-[10px] text-zinc-400 mt-1 px-1">{msg.time}</span>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input */}
              <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-zinc-200 flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Type message in real-time..."
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
            </>
          )}
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
                  placeholder="Super fast service, polite and professional..."
                  className="w-full rounded-2xl border border-zinc-200 p-3 text-xs text-zinc-900 focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20"
                />
              </div>

              <div className="space-y-2">
                <Button
                  onClick={handleSubmitReview}
                  isLoading={submittingReview}
                  className="w-full font-black shadow-honeySmall"
                >
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
