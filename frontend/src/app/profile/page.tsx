"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Mail,
  Calendar,
  MapPin,
  Star,
  Wallet,
  ShieldCheck,
  CheckCircle2,
  Tag,
  ArrowRightLeft,
  Lock,
  TrendingUp,
  Save,
  Loader2,
  AlertCircle,
  Briefcase,
  Phone,
  Plus,
  X,
  Image as ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { useAppStore } from "@/lib/store";
import { userApi, paymentApi } from "@/lib/api";

const PREDEFINED_SKILLS = [
  "Typing",
  "Shifting",
  "Cleaning",
  "Delivery",
  "Plumbing",
  "Errands",
  "Line Standing",
  "Plant Care",
  "Electrical",
  "Carpentry",
  "Cooking",
  "Pet Care",
];

export default function ProfilePage() {
  const router = useRouter();
  const { user, token, mode, toggleMode, updateUser } = useAppStore();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [age, setAge] = useState("22");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [address, setAddress] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [customSkillInput, setCustomSkillInput] = useState("");
  const [hourlyRate, setHourlyRate] = useState("250");
  const [isAvailable, setIsAvailable] = useState(true);

  // Wallet Stats
  const [walletStats, setWalletStats] = useState({
    availableBalance: 2450.0,
    escrowHold: 450.0,
    totalLifetimeEarnings: 8940.0,
  });

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await userApi.getProfile();
      const p = res.data.profile;

      setName(p.name || "");
      setEmail(p.email || "");
      setPhone(p.phone || "");
      setAge(String(p.age || 21));
      setAvatarUrl(p.avatarUrl || "");
      setAddress(p.customerProfile?.address || p.workerProfile?.address || "Indiranagar, Bengaluru");
      setSkills(p.skills || p.workerProfile?.skillsList || ["Delivery", "Errands"]);
      setHourlyRate(String(p.workerProfile?.hourlyRate || 250));
      setIsAvailable(p.workerProfile?.isAvailable !== undefined ? p.workerProfile.isAvailable : true);

      if (p.wallet) {
        setWalletStats(p.wallet);
      }

      updateUser({
        name: p.name,
        email: p.email,
        phone: p.phone,
        age: p.age,
        skills: p.skills,
        avgRating: p.avgRating,
      });
    } catch (err: any) {
      console.error("Error loading profile:", err);
      if (err.response?.status === 401) {
        router.push("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      router.push("/login");
      return;
    }
    fetchProfile();
  }, [token]);

  const toggleSkill = (skill: string) => {
    setSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const handleAddCustomSkill = (e?: React.FormEvent | React.KeyboardEvent) => {
    if (e) e.preventDefault();
    const clean = customSkillInput.trim();
    if (!clean) return;

    if (!skills.some((s) => s.toLowerCase() === clean.toLowerCase())) {
      setSkills((prev) => [...prev, clean]);
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
    setSkills((prev) => prev.filter((s) => s !== skillToRemove));
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      setSaving(true);
      await userApi.updateProfile({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        age: parseInt(age, 10),
        skills,
        address: address.trim(),
        avatarUrl: avatarUrl.trim() || undefined,
        hourlyRate: Number(hourlyRate),
        isAvailable,
      });

      setSuccessMessage("Profile updated successfully!");
      updateUser({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim() || null,
        age: parseInt(age, 10),
        skills,
      });

      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center space-y-3">
        <Loader2 className="w-8 h-8 text-yellow-500 animate-spin mx-auto" />
        <p className="text-xs font-bold text-zinc-500">Loading user profile...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Header Banner */}
      <div className="rounded-3xl bg-zinc-900 text-white p-6 sm:p-8 relative overflow-hidden shadow-xl">
        <div className="absolute right-0 bottom-0 w-80 h-80 bg-yellow-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-3xl bg-yellow-400 text-zinc-950 font-black text-2xl flex items-center justify-center shadow-honeyGlow border-2 border-zinc-950 overflow-hidden">
              {avatarUrl ? (
                <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
              ) : (
                <span>{name ? name[0]?.toUpperCase() : "U"}</span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-white">{name || "User Profile"}</h1>
                <Badge variant="honey" size="sm">
                  {mode === "poster" ? "Task Poster" : "Active Tasker"}
                </Badge>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                {email} • Age: {age} yrs {phone ? `• ${phone}` : ""}
              </p>
              <div className="flex items-center gap-1 text-yellow-400 text-xs font-bold mt-1">
                <Star className="w-3.5 h-3.5 fill-current" />
                <span>5.0 Peer Rating</span>
              </div>
            </div>
          </div>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={toggleMode}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-yellow-400 text-zinc-950 font-black text-xs shadow-honeySmall hover:bg-yellow-500 transition self-start md:self-auto"
          >
            <ArrowRightLeft className="w-4 h-4" />
            <span>Switch to {mode === "poster" ? "Tasker Mode (Earn ₹)" : "Poster Mode (Need Help)"}</span>
          </motion.button>
        </div>
      </div>

      {/* 3-Pillar Financial Ledger Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="rounded-3xl bg-zinc-900 text-white p-6 border-2 border-yellow-400/40 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
              Available Balance
            </span>
            <div className="w-8 h-8 rounded-xl bg-yellow-400 text-zinc-950 flex items-center justify-center font-bold">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-yellow-400">
            ₹{walletStats.availableBalance.toFixed(2)}
          </div>
        </div>

        <div className="rounded-3xl bg-white border border-zinc-200 p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
              Locked in Escrow
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
              <Lock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-zinc-900">
            ₹{walletStats.escrowHold.toFixed(2)}
          </div>
        </div>

        <div className="rounded-3xl bg-white border border-zinc-200 p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
              Total Lifetime Earnings
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-600">
            ₹{walletStats.totalLifetimeEarnings.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Profile Edit Form */}
      <div className="bg-white rounded-3xl border border-zinc-200/90 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
          <div>
            <h3 className="text-lg font-black text-zinc-950">Edit Profile & Skills</h3>
            <p className="text-xs text-zinc-500">Update your personal details, home address, and task specialties.</p>
          </div>
        </div>

        {successMessage && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSaveProfile} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Full Name *"
              value={name}
              onChange={(e) => setName(e.target.value)}
              leftIcon={<User className="w-4 h-4" />}
              required
            />

            <Input
              label="Email Address *"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail className="w-4 h-4" />}
              required
            />

            <Input
              label="Age (Mandatory, 18+) *"
              type="number"
              min="18"
              max="100"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              leftIcon={<Calendar className="w-4 h-4" />}
              required
            />

            <Input
              label="Phone Number"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              leftIcon={<Phone className="w-4 h-4" />}
            />

            <Input
              label="Avatar Image URL (Optional)"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://images.unsplash.com/..."
              leftIcon={<ImageIcon className="w-4 h-4" />}
            />

            <Input
              label="Hourly Base Rate (₹ INR)"
              type="number"
              value={hourlyRate}
              onChange={(e) => setHourlyRate(e.target.value)}
              leftIcon={<Briefcase className="w-4 h-4" />}
            />
          </div>

          <Input
            label="Default Address / Locality *"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            leftIcon={<MapPin className="w-4 h-4" />}
            required
          />

          {/* Manage Skill Tags with Predefined + Custom Typing */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider">
                Manage Skills & Tags (For Tasker Matching)
              </label>
              <span className="text-[11px] text-zinc-500 font-medium">
                {skills.length} active tags
              </span>
            </div>

            {/* Active Selected Skill Badges */}
            {skills.length > 0 && (
              <div className="flex flex-wrap gap-1.5 p-3 rounded-2xl bg-zinc-50 border border-zinc-200">
                {skills.map((skill) => (
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
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Type a custom skill (e.g. Video Editing, Painting) and press Enter..."
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

            {/* Predefined Tag Selector */}
            <div className="flex flex-wrap gap-1.5">
              {PREDEFINED_SKILLS.map((skill) => {
                const isSelected = skills.includes(skill);
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

          <div className="pt-4 border-t border-zinc-100 flex justify-end">
            <Button
              type="submit"
              size="lg"
              className="font-black shadow-honeyGlow"
              isLoading={saving}
              leftIcon={<Save className="w-4 h-4" />}
            >
              Save Profile Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
