"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap,
  MapPin,
  Clock,
  IndianRupee,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Navigation,
  Loader2,
  Calendar,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { serviceApi } from "@/lib/api";
import { useAppStore } from "@/lib/store";

export default function CreateTaskPage() {
  const router = useRouter();
  const { token, setLocation } = useAppStore();

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    category: "Delivery",
    title: "",
    description: "",
    address: "",
    landmark: "",
    latitude: null as number | null,
    longitude: null as number | null,
    timeConstraint: "Must complete within 3 hours",
    budget: "400",
    scheduledDate: new Date(Date.now() + 3600000).toISOString().slice(0, 16),
  });

  const categories = [
    { name: "Delivery", icon: "📦", desc: "Medicine, groceries, parcels" },
    { name: "Domestic Help", icon: "🧹", desc: "Cleaning, plant care, errands" },
    { name: "Shifting", icon: "📦", desc: "Luggage, boxes, furniture help" },
    { name: "Typing", icon: "⌨️", desc: "Data entry, document formatting" },
    { name: "Line Standing", icon: "🚶", desc: "Token queues, government offices" },
    { name: "Plumbing", icon: "🔧", desc: "Leak fixes, tap installations" },
    { name: "Errands", icon: "⚡", desc: "Custom hyperlocal immediate help" },
  ];

  const timeConstraintPresets = [
    "Must complete within 1 hour",
    "Must complete within 3 hours",
    "Today by evening (6 PM)",
    "Tomorrow morning",
    "Flexible within 24 hours",
  ];

  // Geolocation & Auto Reverse-Geocoding
  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }

    setLocating(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;

        setFormData((prev) => ({
          ...prev,
          latitude: lat,
          longitude: lon,
        }));

        setLocation({ latitude: lat, longitude: lon });

        try {
          // Reverse geocode via OpenStreetMap Nominatim API
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`
          );
          const data = await response.json();

          if (data && data.display_name) {
            const formatted = data.display_name;
            setFormData((prev) => ({
              ...prev,
              address: formatted,
              latitude: lat,
              longitude: lon,
            }));
          } else {
            setFormData((prev) => ({
              ...prev,
              address: `GPS Location (${lat.toFixed(4)}, ${lon.toFixed(4)})`,
            }));
          }
        } catch (geoErr) {
          console.error("Reverse geocoding error:", geoErr);
          setFormData((prev) => ({
            ...prev,
            address: `GPS: ${lat.toFixed(4)}, ${lon.toFixed(4)}`,
          }));
        } finally {
          setLocating(false);
        }
      },
      (err) => {
        console.error("Geolocation error:", err);
        setLocating(false);
        setError("Unable to retrieve your current location. Please type your address manually.");
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleNext = () => {
    setError(null);
    if (currentStep === 1) {
      if (!formData.title.trim()) {
        setError("Please enter a title for your task.");
        return;
      }
    } else if (currentStep === 2) {
      if (!formData.address.trim()) {
        setError("Please provide a pickup / task address.");
        return;
      }
    } else if (currentStep === 3) {
      if (!formData.budget || Number(formData.budget) <= 0) {
        setError("Please enter a valid budget amount (₹).");
        return;
      }
    }
    setCurrentStep((prev) => Math.min(prev + 1, 4));
  };

  const handleBack = () => {
    setError(null);
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    setError(null);
    if (!token) {
      setError("Please login or signup to post a task.");
      router.push("/login");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        title: formData.title.trim(),
        category: formData.category,
        budget: Number(formData.budget),
        description: formData.description.trim(),
        address: formData.landmark
          ? `${formData.address} (Landmark: ${formData.landmark})`
          : formData.address,
        latitude: formData.latitude ?? undefined,
        longitude: formData.longitude ?? undefined,
        timeConstraint: formData.timeConstraint,
        scheduledFor: new Date(formData.scheduledDate).toISOString(),
      };

      await serviceApi.createServiceRequest(payload);
      router.push("/dashboard");
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Failed to post task. Please check your details and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const numericBudget = Number(formData.budget) || 0;
  const platformFee = Math.round(numericBudget * 0.15);
  const totalEscrow = numericBudget + platformFee;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      {/* Progress Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-black uppercase text-yellow-600 tracking-wider">
            Step {currentStep} of 4
          </span>
          <span className="text-xs font-bold text-zinc-500">
            {currentStep === 1
              ? "Task Details & Category"
              : currentStep === 2
              ? "GPS & Address Location"
              : currentStep === 3
              ? "Budget & Time Constraint"
              : "Review & Post"}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2 rounded-full bg-zinc-200 overflow-hidden">
          <motion.div
            className="h-full bg-yellow-400"
            initial={{ width: "25%" }}
            animate={{ width: `${(currentStep / 4) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Multi-Step Form Card */}
      <div className="bg-white rounded-3xl border border-zinc-200/90 p-6 sm:p-10 shadow-xl relative overflow-hidden">
        <AnimatePresence mode="wait">
          {/* Step 1: Category & Details */}
          {currentStep === 1 && (
            <motion.div
              key="step-1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-2xl font-black text-zinc-950">Select Task Category</h2>
                <p className="text-xs text-zinc-500 mt-1">
                  Local taskers with matching skills in your vicinity will be notified instantly.
                </p>
              </div>

              {/* Category Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {categories.map((cat) => {
                  const isSelected = formData.category === cat.name;
                  return (
                    <button
                      key={cat.name}
                      type="button"
                      onClick={() => setFormData({ ...formData, category: cat.name })}
                      className={`p-3.5 rounded-2xl border text-left transition-all ${
                        isSelected
                          ? "bg-yellow-50 border-yellow-400 ring-2 ring-yellow-400 shadow-honeySmall"
                          : "border-zinc-200 hover:border-zinc-300 bg-white"
                      }`}
                    >
                      <span className="text-2xl mb-1 block">{cat.icon}</span>
                      <h4 className="text-xs font-bold text-zinc-900">{cat.name}</h4>
                      <p className="text-[10px] text-zinc-500 mt-0.5">{cat.desc}</p>
                    </button>
                  );
                })}
              </div>

              <Input
                label="Task Title / Summary *"
                placeholder="e.g., Urgent 20-page Hindi to English typing & format review"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />

              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                  Detailed Instructions (Optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Describe items, file formats, floor number, or any specific requirements..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full rounded-2xl border border-zinc-200 p-3.5 text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20"
                />
              </div>
            </motion.div>
          )}

          {/* Step 2: GPS Location & Address */}
          {currentStep === 2 && (
            <motion.div
              key="step-2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-2xl font-black text-zinc-950">Where is the Task Located?</h2>
                <p className="text-xs text-zinc-500 mt-1">
                  GPS coordinates enable taskers within your 5km radius to discover this gig.
                </p>
              </div>

              {/* GPS Auto-Fill Button */}
              <div className="p-4 rounded-2xl bg-zinc-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-yellow-400 text-zinc-950 flex items-center justify-center font-bold">
                    <Navigation className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">GPS Auto-Location</h4>
                    <p className="text-[11px] text-zinc-400">
                      Use browser Geolocation to fetch exact address automatically
                    </p>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={handleGetCurrentLocation}
                  disabled={locating}
                  className="font-black shrink-0"
                  leftIcon={locating ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
                >
                  {locating ? "Locating..." : "Use My Current Location"}
                </Button>
              </div>

              <Input
                label="Street Address / Building *"
                placeholder="e.g. 100 Feet Road, Indiranagar, Bengaluru"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                leftIcon={<MapPin className="w-4 h-4" />}
                required
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Landmark (Optional)"
                  placeholder="e.g. Near Metro Station / Sony Signal"
                  value={formData.landmark}
                  onChange={(e) => setFormData({ ...formData, landmark: e.target.value })}
                />
                <Input
                  label="Geo Coordinates (Auto-filled)"
                  value={
                    formData.latitude && formData.longitude
                      ? `${formData.latitude.toFixed(4)}, ${formData.longitude.toFixed(4)}`
                      : "Click 'Use My Current Location' above"
                  }
                  readOnly
                  className="bg-zinc-50 text-zinc-600 font-mono text-xs"
                />
              </div>
            </motion.div>
          )}

          {/* Step 3: Budget & Time Constraints / Deadlines */}
          {currentStep === 3 && (
            <motion.div
              key="step-3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-2xl font-black text-zinc-950">Budget & Time Constraints</h2>
                <p className="text-xs text-zinc-500 mt-1">
                  Specify how urgently you need this task completed.
                </p>
              </div>

              <Input
                label="Your Budget Offer (₹ INR) *"
                type="number"
                placeholder="400"
                value={formData.budget}
                onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                leftIcon={<IndianRupee className="w-4 h-4" />}
                required
              />

              {/* Time Constraints / Deadlines Presets */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">
                  Time Constraint / Urgency
                </label>
                <div className="flex flex-wrap gap-2">
                  {timeConstraintPresets.map((preset) => {
                    const isSelected = formData.timeConstraint === preset;
                    return (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setFormData({ ...formData, timeConstraint: preset })}
                        className={`px-3 py-2 rounded-xl text-xs font-bold transition border ${
                          isSelected
                            ? "bg-yellow-400 text-zinc-950 border-yellow-500 shadow-honeySmall"
                            : "bg-white text-zinc-700 border-zinc-200 hover:border-zinc-300"
                        }`}
                      >
                        {preset}
                      </button>
                    );
                  })}
                </div>
              </div>

              <Input
                label="Target Date & Start Time *"
                type="datetime-local"
                value={formData.scheduledDate}
                onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                leftIcon={<Calendar className="w-4 h-4" />}
                required
              />
            </motion.div>
          )}

          {/* Step 4: Review & Post to Hive */}
          {currentStep === 4 && (
            <motion.div
              key="step-4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-2xl font-black text-zinc-950">Review & Publish Task</h2>
                <p className="text-xs text-zinc-500 mt-1">
                  Once published, local taskers within your area will place competitive bids.
                </p>
              </div>

              <div className="rounded-2xl bg-zinc-50 border border-zinc-200 p-5 space-y-3 text-xs">
                <div className="flex justify-between border-b border-zinc-200 pb-2">
                  <span className="text-zinc-500 font-bold">Category:</span>
                  <span className="font-extrabold text-zinc-900">{formData.category}</span>
                </div>
                <div className="flex justify-between border-b border-zinc-200 pb-2">
                  <span className="text-zinc-500 font-bold">Title:</span>
                  <span className="font-extrabold text-zinc-900">{formData.title}</span>
                </div>
                <div className="flex justify-between border-b border-zinc-200 pb-2">
                  <span className="text-zinc-500 font-bold">Location:</span>
                  <span className="font-extrabold text-zinc-900 truncate max-w-[260px]">
                    {formData.address}
                  </span>
                </div>
                <div className="flex justify-between border-b border-zinc-200 pb-2">
                  <span className="text-zinc-500 font-bold">Time Constraint:</span>
                  <span className="font-extrabold text-yellow-700 bg-yellow-100 px-2 py-0.5 rounded-md">
                    {formData.timeConstraint}
                  </span>
                </div>
                <div className="flex justify-between border-b border-zinc-200 pb-2">
                  <span className="text-zinc-500 font-bold">Target Date:</span>
                  <span className="font-extrabold text-zinc-900">
                    {new Date(formData.scheduledDate).toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex justify-between pt-1">
                  <span className="text-zinc-700 font-bold">Target Budget:</span>
                  <span className="font-black text-base text-zinc-950">₹{numericBudget}</span>
                </div>
              </div>

              {/* Escrow Guarantee Box */}
              <div className="rounded-2xl bg-yellow-50 border border-yellow-300 p-4 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-yellow-700 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <h4 className="font-bold text-yellow-950">100% Escrow Guarantee</h4>
                  <p className="text-yellow-800 mt-0.5">
                    Your money stays locked safely in Escrow. Payment is only released to the Tasker after you verify completion via OTP.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form Nav Buttons */}
        <div className="pt-8 mt-8 border-t border-zinc-100 flex items-center justify-between">
          {currentStep > 1 ? (
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              leftIcon={<ArrowLeft className="w-4 h-4" />}
            >
              Back
            </Button>
          ) : (
            <div />
          )}

          {currentStep < 4 ? (
            <Button
              type="button"
              onClick={handleNext}
              className="font-black"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Continue
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleSubmit}
              isLoading={loading}
              className="font-black shadow-honeyGlow"
              rightIcon={<CheckCircle2 className="w-4 h-4" />}
            >
              Publish Micro-Task
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
