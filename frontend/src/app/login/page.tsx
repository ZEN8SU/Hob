"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
  Lock,
  Zap,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  KeyRound,
  Sparkles,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { authApi } from "@/lib/api";
import { useAppStore } from "@/lib/store";

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAppStore();

  // Mode: "password" vs "otp"
  const [loginMethod, setLoginMethod] = useState<"password" | "otp">("password");

  // Form State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // OTP State
  const [otpStep, setOtpStep] = useState<"send" | "verify">("send");
  const [otpCode, setOtpCode] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Email + Password Login
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!password) {
      setError("Please enter your password.");
      return;
    }

    try {
      setLoading(true);
      const res = await authApi.login({
        email: cleanEmail,
        password,
      });

      const { token, user } = res.data;
      setAuth(token, user);
      router.push("/dashboard");
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Invalid email or password. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // OTP: Send OTP
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    try {
      setLoading(true);
      await authApi.sendOtp({ email: cleanEmail });
      setOtpStep("verify");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to send OTP code.");
    } finally {
      setLoading(false);
    }
  };

  // OTP: Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!otpCode.trim()) {
      setError("Please enter the 6-digit OTP code.");
      return;
    }

    try {
      setLoading(true);
      const cleanEmail = email.trim().toLowerCase();
      const res = await authApi.verifyOtp({
        email: cleanEmail,
        otp: otpCode.trim(),
      });

      const { token, user } = res.data;
      setAuth(token, user);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.message || "OTP verification failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 relative overflow-hidden py-12">
      {/* Background Decor */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-yellow-400/20 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md rounded-3xl bg-white/95 backdrop-blur-xl border border-zinc-200/90 p-6 sm:p-8 shadow-2xl relative z-10"
      >
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-zinc-900 border-2 border-yellow-400 flex items-center justify-center mx-auto mb-3 shadow-honeySmall">
            <Zap className="w-7 h-7 text-yellow-400 fill-yellow-400" />
          </div>
          <h2 className="text-2xl font-black text-zinc-950">Welcome Back</h2>
          <p className="text-xs text-zinc-500 mt-1 font-medium">
            Sign in to access your dashboard, gigs, and escrow wallet
          </p>
        </div>

        {/* Login Method Tab Selector */}
        <div className="flex bg-zinc-100 p-1 rounded-2xl mb-5 border border-zinc-200">
          <button
            type="button"
            onClick={() => {
              setLoginMethod("password");
              setError(null);
            }}
            className={`flex-1 py-2 text-xs font-extrabold rounded-xl transition-all ${
              loginMethod === "password"
                ? "bg-white text-zinc-950 shadow-sm"
                : "text-zinc-600 hover:text-zinc-950"
            }`}
          >
            Email + Password
          </button>
          <button
            type="button"
            onClick={() => {
              setLoginMethod("otp");
              setError(null);
            }}
            className={`flex-1 py-2 text-xs font-extrabold rounded-xl transition-all ${
              loginMethod === "otp"
                ? "bg-white text-zinc-950 shadow-sm"
                : "text-zinc-600 hover:text-zinc-950"
            }`}
          >
            Email OTP Login
          </button>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-700 flex items-center gap-2"
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {/* Option 1: Password Login */}
          {loginMethod === "password" && (
            <motion.form
              key="password-form"
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 15 }}
              onSubmit={handlePasswordLogin}
              className="space-y-4"
            >
              <Input
                label="Email Address"
                placeholder="you@example.com"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leftIcon={<Mail className="w-4 h-4" />}
                required
              />

              <Input
                label="Password"
                placeholder="••••••••"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                leftIcon={<Lock className="w-4 h-4" />}
                required
              />

              <div className="pt-2">
                <Button
                  type="submit"
                  size="lg"
                  className="w-full font-black shadow-honeySmall"
                  isLoading={loading}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Sign In with Password
                </Button>
              </div>
            </motion.form>
          )}

          {/* Option 2: Email OTP Login */}
          {loginMethod === "otp" && (
            <motion.div
              key="otp-form"
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -15 }}
              className="space-y-4"
            >
              {otpStep === "send" ? (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <Input
                    label="Email Address"
                    placeholder="you@example.com"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    leftIcon={<Mail className="w-4 h-4" />}
                    required
                  />

                  <div className="pt-2">
                    <Button
                      type="submit"
                      size="lg"
                      className="w-full font-black shadow-honeySmall"
                      isLoading={loading}
                      rightIcon={<ArrowRight className="w-4 h-4" />}
                    >
                      Send 6-Digit OTP Code
                    </Button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div className="p-4 rounded-2xl bg-yellow-50 border border-yellow-200">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-extrabold text-zinc-900 uppercase">
                        6-Digit OTP Code
                      </label>
                      <button
                        type="button"
                        onClick={() => setOtpCode("123456")}
                        className="text-[11px] font-black text-yellow-900 bg-yellow-200 hover:bg-yellow-300 px-2 py-0.5 rounded-md"
                      >
                        Auto-Fill (123456)
                      </button>
                    </div>

                    <Input
                      type="text"
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      placeholder="123456"
                      className="text-center font-black tracking-widest text-lg bg-white"
                      required
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
                      Verify OTP & Sign In
                    </Button>

                    <button
                      type="button"
                      onClick={() => setOtpStep("send")}
                      className="w-full text-center text-xs font-bold text-zinc-500 hover:text-zinc-900 py-1 flex items-center justify-center gap-1"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Change Email Address</span>
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Link to Signup */}
        <div className="pt-6 mt-6 border-t border-zinc-100 text-center space-y-3">
          <p className="text-xs text-zinc-500 font-medium">
            Don&apos;t have an account yet?{" "}
            <Link href="/signup" className="font-extrabold text-zinc-950 hover:text-yellow-600 underline">
              Sign up in 30 seconds
            </Link>
          </p>

          <div className="flex items-center justify-center gap-1.5 text-[11px] text-zinc-400">
            <ShieldCheck className="w-3.5 h-3.5 text-yellow-600" />
            <span>256-bit encrypted authentication & instant escrow access</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
