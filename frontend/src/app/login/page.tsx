"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
  ShieldCheck,
  Zap,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Lock,
  User,
  Calendar,
  Tag,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { authApi } from "@/lib/api";
import { useAppStore } from "@/lib/store";

const AVAILABLE_SKILLS = [
  "Typing",
  "Shifting",
  "Cleaning",
  "Delivery",
  "Plumbing",
  "Errands",
  "Line Standing",
  "Plant Care",
];

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAppStore();

  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [age, setAge] = useState("22");
  const [selectedSkills, setSelectedSkills] = useState<string[]>(["Delivery", "Errands"]);
  const [role, setRole] = useState<"poster" | "worker">("poster");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleSkill = (skill: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

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
      setStep("otp");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to send OTP code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!otp.trim()) {
      setError("Please enter the 6-digit OTP.");
      return;
    }

    try {
      setLoading(true);
      const cleanEmail = email.trim().toLowerCase();
      const res = await authApi.verifyOtp({
        email: cleanEmail,
        otp: otp.trim(),
        name: name.trim() || undefined,
        age: age ? parseInt(age, 10) : 21,
        skills: selectedSkills,
        role,
      });

      const { token, user } = res.data;
      setAuth(token, user);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.message || "Verification failed. Check your OTP and try again.");
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
        className="w-full max-w-lg rounded-3xl bg-white/95 backdrop-blur-xl border border-zinc-200/90 p-6 sm:p-8 shadow-2xl relative z-10"
      >
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-zinc-900 border-2 border-yellow-400 flex items-center justify-center mx-auto mb-3 shadow-honeySmall">
            <Zap className="w-6 h-6 text-yellow-400 fill-yellow-400" />
          </div>
          <h2 className="text-2xl font-black text-zinc-950">
            {step === "email" ? "Enter the Hive" : "Complete Verification & Onboarding"}
          </h2>
          <p className="text-xs text-zinc-500 mt-1 font-medium">
            {step === "email"
              ? "Hyperlocal Peer-to-Peer Micro-Tasking Platform"
              : `6-digit verification code sent to ${email}`}
          </p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-700 text-center"
          >
            {error}
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {/* Step 1: Email Input */}
          {step === "email" ? (
            <motion.form
              key="email-step"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              onSubmit={handleSendOtp}
              className="space-y-4"
            >
              <Input
                label="Email Address (Mandatory for Auth)"
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
                  Send 6-Digit OTP
                </Button>
              </div>

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-zinc-500 pt-2">
                <ShieldCheck className="w-3.5 h-3.5 text-yellow-600" />
                <span>Protected by 256-bit encryption & Email OTP verification</span>
              </div>
            </motion.form>
          ) : (
            /* Step 2: OTP Verification & Mandatory Onboarding (Name, Age, Skills) */
            <motion.form
              key="otp-step"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              onSubmit={handleVerifyOtp}
              className="space-y-4 text-xs"
            >
              {/* OTP Field */}
              <div className="p-4 rounded-2xl bg-yellow-50/70 border border-yellow-200">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-extrabold text-zinc-900 uppercase tracking-wider">
                    Enter 6-Digit OTP Code
                  </label>
                  <button
                    type="button"
                    onClick={handleAutoFillDevOtp}
                    className="text-[11px] font-bold text-yellow-800 hover:text-yellow-950 bg-yellow-200/80 hover:bg-yellow-300 px-2.5 py-0.5 rounded-lg transition"
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
                  className="tracking-widest text-center text-lg font-black bg-white"
                />
              </div>

              {/* Onboarding: Name & Age */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Full Name *"
                  placeholder="e.g. Vikram Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  leftIcon={<User className="w-4 h-4" />}
                  required
                />

                <Input
                  label="Age (Mandatory, 18+) *"
                  type="number"
                  placeholder="22"
                  min="18"
                  max="100"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  leftIcon={<Calendar className="w-4 h-4" />}
                  required
                />
              </div>

              {/* Default Primary Mode */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                  Primary Mode Preference
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole("poster")}
                    className={`py-2.5 px-3 rounded-xl font-bold border transition text-center ${
                      role === "poster"
                        ? "bg-zinc-900 text-yellow-400 border-zinc-900 shadow-sm"
                        : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300"
                    }`}
                  >
                    Task Poster (Need Help)
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole("worker")}
                    className={`py-2.5 px-3 rounded-xl font-bold border transition text-center ${
                      role === "worker"
                        ? "bg-yellow-400 text-zinc-950 border-yellow-500 shadow-sm font-extrabold"
                        : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300"
                    }`}
                  >
                    Tasker (Earn ₹)
                  </button>
                </div>
              </div>

              {/* Mandatory Skills Selection (Especially for Taskers) */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                  Skill Tags (Select your service specialties)
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {AVAILABLE_SKILLS.map((skill) => {
                    const isSelected = selectedSkills.includes(skill);
                    return (
                      <button
                        key={skill}
                        type="button"
                        onClick={() => toggleSkill(skill)}
                        className={`px-3 py-1.5 rounded-xl font-bold text-xs transition border ${
                          isSelected
                            ? "bg-yellow-400 text-zinc-950 border-yellow-500 shadow-honeySmall"
                            : "bg-zinc-50 text-zinc-600 border-zinc-200 hover:bg-zinc-100"
                        }`}
                      >
                        {skill} {isSelected && "✓"}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 space-y-2">
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
                  onClick={() => setStep("email")}
                  className="w-full text-center text-xs font-bold text-zinc-500 hover:text-zinc-900 py-1 flex items-center justify-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Change Email Address</span>
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
