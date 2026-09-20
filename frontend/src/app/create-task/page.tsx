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
  FileText,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { serviceApi } from "@/lib/api";
import { useAppStore } from "@/lib/store";

export default function CreateTaskPage() {
  const router = useRouter();
  const { token } = useAppStore();

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    category: "Delivery",
    title: "",
    description: "",
    address: "",
    landmark: "",
    pincode: "",
    budget: "400",
    scheduledDate: new Date(Date.now() + 3600000).toISOString().slice(0, 16),
  });

  const categories = [
    { name: "Delivery", icon: "??", desc: "Medicine, groceries, parcels" },
    { name: "Domestic Help", icon: "??", desc: "Cleaning, plant care, errands" },
    { name: "Shifting", icon: "??", desc: "Luggage, boxes, furniture help" },
    { name: "Typing", icon: "??", desc: "Data entry, document formatting" },
    { name: "Line Standing", icon: "??", desc: "Token queues, government offices" },
    { name: "Other Micro-Task", icon: "?", desc: "Custom hyperlocal help" },
  ];

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
        setError("Please enter a valid budget amount (?).");
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
    try {
      setLoading(true);

      const payload = {
        scheduledFor: new Date(formData.scheduledDate).toISOString(),
        address: `${formData.address}, Landmark: ${formData.landmark || "N/A"}, Pincode: ${formData.pincode || "560034"}`,
      };

      await serviceApi.createServiceRequest(payload);
      router.push("/dashboard");
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Failed to post task. Please login first."
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
              ? "Task Details"
              : currentStep === 2
              ? "Location"
              : currentStep === 3
              ? "Budget & Schedule"
              : "Review & Escrow"}
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
        <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-700">
          {error}
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
                  Choose the category that best describes your requirement.
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
                label="Task Title / Summary"
                placeholder="e.g., Deliver home-cooked lunchbox from Indiranagar to Koramangala"
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
                  placeholder="Describe specific items, floor number, safety instructions, etc."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full rounded-2xl border border-zinc-200 p-3.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20"
                />
              </div>
            </motion.div>
          )}

          {/* Step 2: Location & Address */}
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
                  Taskers within your 5-8km radius will see this request.
                </p>
              </div>

              <Input
                label="Street Address / Flat / Building"
                placeholder="e.g. Flat 402, Honey Comb Apts, 12th Main Road"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                leftIcon={<MapPin className="w-4 h-4" />}
                required
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Landmark (Optional)"
                  placeholder="e.g. Near Sony Signal / Apollo Pharmacy"
                  value={formData.landmark}
                  onChange={(e) => setFormData({ ...formData, landmark: e.target.value })}
                />
                <Input
                  label="Pincode"
                  placeholder="e.g. 560034"
                  value={formData.pincode}
                  onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                />
              </div>
            </motion.div>
          )}

          {/* Step 3: Budget & Time Schedule */}
          {currentStep === 3 && (
            <motion.div
              key="step-3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-2xl font-black text-zinc-950">Set Budget & Timeline</h2>
                <p className="text-xs text-zinc-500 mt-1">
                  Fair pricing attracts top-rated verified taskers in under 5 minutes.
                </p>
              </div>

              <Input
                label="Your Budget Offer (? INR)"
                type="number"
                placeholder="400"
                value={formData.budget}
                onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                leftIcon={<IndianRupee className="w-4 h-4" />}
                required
              />

              <Input
                label="When should this task begin?"
                type="datetime-local"
                value={formData.scheduledDate}
                onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                leftIcon={<Calendar className="w-4 h-4" />}
                required
              />
            </motion.div>
          )}

          {/* Step 4: Review & Escrow Confirmation */}
          {currentStep === 4 && (
            <motion.div
              key="step-4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-2xl font-black text-zinc-950">Review & Post to Hive</h2>
                <p className="text-xs text-zinc-500 mt-1">
                  Check your task details before publishing to local taskers.
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
                  <span className="font-extrabold text-zinc-900 truncate max-w-[200px]">
                    {formData.address}
                  </span>
                </div>
                <div className="flex justify-between border-b border-zinc-200 pb-2">
                  <span className="text-zinc-500 font-bold">Scheduled Time:</span>
                  <span className="font-extrabold text-zinc-900">
                    {new Date(formData.scheduledDate).toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex justify-between pt-1">
                  <span className="text-zinc-700 font-bold">Tasker Payout Offer:</span>
                  <span className="font-black text-sm text-zinc-950">?{numericBudget}</span>
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
              Confirm & Post Micro-Task
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
