"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Phone,
  ShieldCheck,
  Zap,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Lock,
  User,
  Mail,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { authApi } from "@/lib/api";
import { useAppStore } from "@/lib/store";

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAppStore();

  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanPhone = phone.trim().replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      setError("Please enter a valid 10-digit phone number.");
      return;
    }

    try {
      setLoading(true);
      await authApi.sendOtp(cleanPhone);
      setStep("otp");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to send OTP. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (otp.trim() !== "123456") {
      setError("Invalid OTP. For v1 development, please use '123456'.");
      return;
    }

    try {
      setLoading(true);
      const cleanPhone = phone.trim().replace(/\D/g, "");
      const res = await authApi.verifyOtp({
        phone: cleanPhone,
        otp: otp.trim(),
        name: name.trim() || undefined,
        email: email.trim() || undefined,
      });

      const { token, user } = res.data;
      setAuth(token, user);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.message || "Verification failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleAutoFillDevOtp = () => {
    setOtp("123456");
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-yellow-400/20 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md rounded-3xl bg-white/90 backdrop-blur-xl border border-zinc-200/90 p-8 shadow-xl relative z-10"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-zinc-900 border-2 border-yellow-400 flex items-center justify-center mx-auto mb-4 shadow-honeySmall">
            <Zap className="w-6 h-6 text-yellow-400 fill-yellow-400" />
          </div>
          <h2 className="text-2xl font-black text-zinc-950">
            {step === "phone" ? "Enter the Hive" : "Verify Your Phone"}
          </h2>
          <p className="text-xs text-zinc-500 mt-1 font-medium">
            {step === "phone"
              ? "One account for both posting tasks and earning micro-income."
              : `6-digit verification code sent to +91 ${phone}`}
          </p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-700 text-center"
          >
            {error}
          </motion.div>
        )}

        {/* Step 1: Phone Input */}
        <AnimatePresence mode="wait">
          {step === "phone" ? (
            <motion.form
              key="phone-step"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              onSubmit={handleSendOtp}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                  Mobile Number
                </label>
                <div className="flex items-center rounded-xl bg-white border border-zinc-200 focus-within:border-yellow-400 focus-within:ring-2 focus-within:ring-yellow-400/20 overflow-hidden transition">
                  <span className="px-3.5 py-3 text-xs font-extrabold text-zinc-500 bg-zinc-50 border-r border-zinc-200">
                    +91
                  </span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="98765 43210"
                    maxLength={10}
                    required
                    className="w-full px-3.5 py-3 text-sm font-semibold text-zinc-900 focus:outline-none placeholder:text-zinc-400"
                  />
                </div>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  size="lg"
                  className="w-full font-black shadow-honeySmall"
                  isLoading={loading}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Send OTP
                </Button>
              </div>

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-zinc-500 pt-2">
                <ShieldCheck className="w-3.5 h-3.5 text-yellow-600" />
                <span>Protected by 256-bit encryption & SMS verification</span>
              </div>
            </motion.form>
          ) : (
            /* Step 2: OTP Verification & User Details */
            <motion.form
              key="otp-step"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              onSubmit={handleVerifyOtp}
              className="space-y-4"
            >
              <Input
                label="Full Name (Optional for first-time)"
                placeholder="e.g., Rohit Sharma"
                value={name}
                onChange={(e) => setName(e.target.value)}
                leftIcon={<User className="w-4 h-4" />}
              />

              <Input
                label="Email Address (Optional)"
                placeholder="rohit@example.com"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leftIcon={<Mail className="w-4 h-4" />}
              />

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider">
                    Enter 6-digit OTP
                  </label>
                  <button
                    type="button"
                    onClick={handleAutoFillDevOtp}
                    className="text-[11px] font-bold text-yellow-700 hover:text-yellow-800 bg-yellow-100 hover:bg-yellow-200 px-2 py-0.5 rounded-md transition"
                  >
                    Auto-Fill (123456)
                  </button>
                </div>
                <Input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="123456"
                  maxLength={6}
                  required
                  leftIcon={<Lock className="w-4 h-4" />}
                  className="tracking-widest text-center text-lg font-black"
                />
              </div>

              <div className="pt-2 space-y-2">
                <Button
                  type="submit"
                  size="lg"
                  className="w-full font-black shadow-honeySmall"
                  isLoading={loading}
                  rightIcon={<CheckCircle2 className="w-4 h-4" />}
                >
                  Verify & Enter Platform
                </Button>

                <button
                  type="button"
                  onClick={() => setStep("phone")}
                  className="w-full text-center text-xs font-bold text-zinc-500 hover:text-zinc-900 py-1"
                >
                  Change Mobile Number
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
