"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Mail,
  Lock,
  User,
  Calendar,
  Phone,
  Zap,
  CheckCircle2,
  ArrowRight,
  Plus,
  X,
  ShieldCheck,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { authApi } from "@/lib/api";
import { useAppStore } from "@/lib/store";

const PREDEFINED_SKILLS = [
  "Typing",
  "Shifting",
  "Delivery",
  "Cleaning",
  "Plumbing",
  "Errands",
  "Line Standing",
  "Plant Care",
  "Electrical",
  "Carpentry",
  "Cooking",
  "Pet Care",
];

export default function SignupPage() {
  const router = useRouter();
  const { setAuth } = useAppStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [age, setAge] = useState("22");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<"poster" | "worker">("poster");
  const [address, setAddress] = useState("Indiranagar, Bengaluru");

  // Skills Tag State
  const [selectedSkills, setSelectedSkills] = useState<string[]>(["Delivery", "Errands"]);
  const [customSkillInput, setCustomSkillInput] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Predefined Skill Toggle
  const toggleSkill = (skill: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  // Add Custom Typed Skill Tag
  const handleAddCustomSkill = (e?: React.FormEvent | React.KeyboardEvent) => {
    if (e) e.preventDefault();
    const cleanTag = customSkillInput.trim();
    if (!cleanTag) return;

    if (!selectedSkills.some((s) => s.toLowerCase() === cleanTag.toLowerCase())) {
      setSelectedSkills((prev) => [...prev, cleanTag]);
    }
    setCustomSkillInput("");
  };

  const handleCustomSkillKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      handleAddCustomSkill();
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setSelectedSkills((prev) => prev.filter((s) => s !== skillToRemove));
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();
    const parsedAge = parseInt(age, 10);

    if (!cleanEmail || !cleanEmail.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!password || password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (!cleanName) {
      setError("Full Name is mandatory.");
      return;
    }

    if (isNaN(parsedAge) || parsedAge < 18) {
      setError("Age is mandatory and you must be 18 years or older.");
      return;
    }

    try {
      setLoading(true);
      const res = await authApi.signup({
        email: cleanEmail,
        password,
        name: cleanName,
        age: parsedAge,
        phone: phone.trim() || undefined,
        role,
        skills: selectedSkills,
        address: address.trim(),
      });

      const { token, user } = res.data;
      setAuth(token, user);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.message || "Registration failed. Please check your details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 relative overflow-hidden py-12">
      {/* Background Honey Glow Decor */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[32rem] h-[32rem] bg-yellow-400/20 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-xl rounded-3xl bg-white/95 backdrop-blur-xl border border-zinc-200/90 p-6 sm:p-10 shadow-2xl relative z-10"
      >
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-zinc-900 border-2 border-yellow-400 flex items-center justify-center mx-auto mb-3 shadow-honeySmall">
            <Zap className="w-7 h-7 text-yellow-400 fill-yellow-400" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-zinc-950">Join the Hive</h2>
          <p className="text-xs text-zinc-500 mt-1 font-medium">
            Create your HOB account to post tasks or earn as a verified Tasker
          </p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-700 flex items-center gap-2"
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}

        <form onSubmit={handleSignup} className="space-y-5">
          {/* User Role Selection */}
          <div>
            <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">
              Select Your Primary Role
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole("poster")}
                className={`py-3 px-4 rounded-2xl font-black text-xs border transition-all flex items-center justify-center gap-2 ${
                  role === "poster"
                    ? "bg-zinc-900 text-yellow-400 border-zinc-900 shadow-md"
                    : "bg-zinc-50 text-zinc-600 border-zinc-200 hover:border-zinc-300"
                }`}
              >
                <span>Task Poster (Need Help)</span>
              </button>

              <button
                type="button"
                onClick={() => setRole("worker")}
                className={`py-3 px-4 rounded-2xl font-black text-xs border transition-all flex items-center justify-center gap-2 ${
                  role === "worker"
                    ? "bg-yellow-400 text-zinc-950 border-yellow-500 shadow-honeySmall"
                    : "bg-zinc-50 text-zinc-600 border-zinc-200 hover:border-zinc-300"
                }`}
              >
                <span>Tasker (Earn ₹)</span>
              </button>
            </div>
          </div>

          {/* Email & Password */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Email Address *"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail className="w-4 h-4" />}
              required
            />

            <Input
              label="Password (6+ chars) *"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock className="w-4 h-4" />}
              required
            />
          </div>

          {/* Full Name & Age */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              min="18"
              max="100"
              placeholder="22"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              leftIcon={<Calendar className="w-4 h-4" />}
              required
            />
          </div>

          {/* Phone Number (Saved without OTP in v1) */}
          <Input
            label="Phone Number (Optional - v1 Direct Save)"
            type="tel"
            placeholder="+91 98765 43210"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            leftIcon={<Phone className="w-4 h-4" />}
          />

          {/* Flexible Skill Selection: Predefined + Custom Typed Input */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider">
                Skill Tags & Specialties {role === "worker" && "(Crucial for Tasker Matches)"}
              </label>
              <span className="text-[11px] text-zinc-500 font-medium">
                {selectedSkills.length} active tags
              </span>
            </div>

            {/* Selected Skill Badges */}
            {selectedSkills.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3 p-3 rounded-2xl bg-zinc-50 border border-zinc-200">
                {selectedSkills.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-yellow-400 text-zinc-950 text-xs font-extrabold border border-yellow-500 shadow-sm"
                  >
                    <span>{skill}</span>
                    <button
                      type="button"
                      onClick={() => removeSkill(skill)}
                      className="text-zinc-900 hover:text-rose-700 ml-0.5"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Custom Skill Input Box */}
            <div className="flex items-center gap-2 mb-3">
              <input
                type="text"
                placeholder="Type a custom skill (e.g., Video Editing, Gardening) and press Enter..."
                value={customSkillInput}
                onChange={(e) => setCustomSkillInput(e.target.value)}
                onKeyDown={handleCustomSkillKeyDown}
                className="flex-1 px-4 py-2.5 rounded-2xl bg-white border border-zinc-200 text-xs font-medium focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20"
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => handleAddCustomSkill()}
                className="text-xs font-bold shrink-0"
                leftIcon={<Plus className="w-3.5 h-3.5" />}
              >
                Add Tag
              </Button>
            </div>

            {/* Predefined Tag Picker List */}
            <div className="flex flex-wrap gap-1.5">
              {PREDEFINED_SKILLS.map((skill) => {
                const isSelected = selectedSkills.includes(skill);
                return (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => toggleSkill(skill)}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs transition border ${
                      isSelected
                        ? "bg-zinc-900 text-yellow-400 border-zinc-900"
                        : "bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-100 hover:text-zinc-900"
                    }`}
                  >
                    {skill} {isSelected ? "✓" : "+"}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-3 space-y-3">
            <Button
              type="submit"
              size="lg"
              className="w-full font-black text-sm shadow-honeySmall"
              isLoading={loading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Create Account & Start
            </Button>

            <div className="flex items-center justify-center gap-1.5 text-xs text-zinc-500 pt-1">
              <span>Already have an account?</span>
              <Link href="/login" className="font-extrabold text-zinc-900 hover:text-yellow-600 underline">
                Sign In
              </Link>
            </div>
          </div>

          <div className="flex items-center justify-center gap-1.5 text-[11px] text-zinc-400 pt-2 border-t border-zinc-100">
            <ShieldCheck className="w-3.5 h-3.5 text-yellow-600" />
            <span>Escrow protected and encrypted by Indian banking rails</span>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
