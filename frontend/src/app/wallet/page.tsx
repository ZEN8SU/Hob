"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wallet,
  ShieldCheck,
  ArrowUpRight,
  ArrowDownLeft,
  Lock,
  TrendingUp,
  History,
  PlusCircle,
  Smartphone,
  CheckCircle2,
  X,
  Loader2,
  AlertCircle,
  Building2,
  CreditCard,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { useAppStore } from "@/lib/store";
import { paymentApi } from "@/lib/api";

declare global {
  interface Window {
    Razorpay: any;
  }
}

export interface TransactionItem {
  id: string;
  paymentId?: string;
  type: "CREDIT" | "DEBIT" | "ESCROW_HOLD" | "ESCROW_RELEASE";
  amount: number;
  rawAmount?: number;
  status: string;
  description: string;
  method?: string;
  settledAt: string;
  taskTitle?: string;
  role?: "poster" | "tasker";
  payer?: { id?: string; name?: string };
  payee?: { id?: string; name?: string };
  payment?: any;
}

const PRESET_AMOUNTS = [500, 1000, 2000, 5000];

export default function WalletPage() {
  const router = useRouter();
  const { token, updateWallet, user } = useAppStore();

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [walletStats, setWalletStats] = useState({
    availableBalance: 5000.0,
    escrowHold: 0.0,
    totalLifetimeEarnings: 0.0,
    totalCredits: 0.0,
    totalDebits: 0.0,
  });

  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [filterType, setFilterType] = useState<"ALL" | "CREDIT" | "DEBIT" | "ESCROW_HOLD">("ALL");

  // Modals
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [depositAmount, setDepositAmount] = useState("1000");
  const [withdrawAmount, setWithdrawAmount] = useState("500");
  const [withdrawMode, setWithdrawMode] = useState<"UPI" | "BANK">("UPI");
  const [upiId, setUpiId] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [ifscCode, setIfscCode] = useState("");

  // Load Razorpay Checkout Script
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  const fetchWallet = async () => {
    try {
      setLoading(true);
      const res = await paymentApi.getWalletLedger();
      if (res.data?.wallet) {
        setWalletStats(res.data.wallet);
        updateWallet(
          res.data.wallet.availableBalance,
          res.data.wallet.escrowHold,
          res.data.wallet.totalLifetimeEarnings
        );
      }
      if (res.data?.transactions) {
        setTransactions(res.data.transactions);
      }
    } catch (err: any) {
      console.error("Error loading wallet ledger:", err);
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
    fetchWallet();
  }, [token]);

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    if (filterType === "ALL") return transactions;
    return transactions.filter((tx) => tx.type === filterType);
  }, [transactions, filterType]);

  // Handle Razorpay Deposit (Add Funds)
  const handleDeposit = async () => {
    const amt = Number(depositAmount);
    if (!amt || amt < 10) {
      setFeedbackMessage({ type: "error", text: "Minimum top-up amount is ₹10." });
      return;
    }

    try {
      setActionLoading(true);
      setFeedbackMessage(null);

      // 1. Create order on backend
      const res = await paymentApi.createWalletTopUpOrder({ amount: amt });
      const { order } = res.data;

      // In mock/test mode or if Razorpay script is not loaded
      if (order.isMock || typeof window.Razorpay === "undefined") {
        // Direct verify for testing
        await paymentApi.verifyWalletTopUp({
          razorpayOrderId: order.id,
          razorpayPaymentId: `pay_mock_${Date.now()}`,
          razorpaySignature: "mock_signature_approved",
          amount: amt,
          method: "UPI (Simulated)",
        });

        setFeedbackMessage({
          type: "success",
          text: `₹${amt.toFixed(2)} added to your Escrow Wallet successfully!`,
        });
        setShowDepositModal(false);
        await fetchWallet();
        return;
      }

      // Real Razorpay Checkout modal
      const options = {
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: "HOB Hyperlocal Platform",
        description: `Wallet Escrow Top-Up - ₹${amt}`,
        order_id: order.id,
        prefill: {
          name: user?.name || "Task User",
          email: user?.email || "",
          contact: user?.phone || "",
        },
        theme: {
          color: "#facc15",
        },
        handler: async (response: any) => {
          try {
            await paymentApi.verifyWalletTopUp({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              amount: amt,
              method: "Razorpay Standard Checkout",
            });

            setFeedbackMessage({
              type: "success",
              text: `₹${amt.toFixed(2)} deposited into your Escrow Wallet!`,
            });
            setShowDepositModal(false);
            await fetchWallet();
          } catch (err: any) {
            setFeedbackMessage({
              type: "error",
              text: err.response?.data?.message || "Payment verification failed.",
            });
          }
        },
        modal: {
          ondismiss: () => {
            setActionLoading(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err: any) {
      console.error("Top-up error:", err);
      setFeedbackMessage({
        type: "error",
        text: err.response?.data?.message || "Failed to initiate wallet top-up.",
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Bank/UPI Withdrawal
  const handleWithdraw = async () => {
    const amt = Number(withdrawAmount);
    if (!amt || amt < 50) {
      setFeedbackMessage({ type: "error", text: "Minimum withdrawal amount is ₹50." });
      return;
    }

    if (amt > walletStats.availableBalance) {
      setFeedbackMessage({
        type: "error",
        text: `Insufficient balance. You have ₹${walletStats.availableBalance.toFixed(2)} available.`,
      });
      return;
    }

    if (withdrawMode === "UPI" && !upiId.trim()) {
      setFeedbackMessage({ type: "error", text: "Please enter your UPI ID (VPA)." });
      return;
    }

    if (withdrawMode === "BANK" && (!bankAccountNumber.trim() || !ifscCode.trim())) {
      setFeedbackMessage({
        type: "error",
        text: "Please enter Bank Account Number and IFSC Code.",
      });
      return;
    }

    try {
      setActionLoading(true);
      setFeedbackMessage(null);

      const res = await paymentApi.requestWalletWithdrawal({
        amount: amt,
        upiId: withdrawMode === "UPI" ? upiId.trim() : undefined,
        bankAccountNumber: withdrawMode === "BANK" ? bankAccountNumber.trim() : undefined,
        ifscCode: withdrawMode === "BANK" ? ifscCode.trim() : undefined,
      });

      setFeedbackMessage({
        type: "success",
        text: res.data?.message || `₹${amt.toFixed(2)} payout initiated successfully!`,
      });
      setShowWithdrawModal(false);
      await fetchWallet();
    } catch (err: any) {
      console.error("Withdrawal error:", err);
      setFeedbackMessage({
        type: "error",
        text: err.response?.data?.message || "Failed to process withdrawal.",
      });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Alert / Feedback Notification */}
      {feedbackMessage && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-2xl flex items-center justify-between gap-3 border shadow-sm ${
            feedbackMessage.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-900"
              : "bg-rose-50 border-rose-200 text-rose-900"
          }`}
        >
          <div className="flex items-center gap-2.5 text-xs sm:text-sm font-bold">
            {feedbackMessage.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span>{feedbackMessage.text}</span>
          </div>
          <button
            onClick={() => setFeedbackMessage(null)}
            className="text-zinc-500 hover:text-zinc-900"
          >
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-black uppercase text-yellow-600 tracking-wider">
              Escrow Financial Ledger
            </span>
            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-zinc-900 text-yellow-400">
              Double-Entry Accounting
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-zinc-950">
            Wallet & Escrow Holdings
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={() => {
              setFeedbackMessage(null);
              setShowDepositModal(true);
            }}
            variant="primary"
            size="sm"
            className="font-bold shadow-honeySmall"
            leftIcon={<PlusCircle className="w-4 h-4" />}
          >
            Add Funds (UPI / Razorpay)
          </Button>

          <Button
            onClick={() => {
              setFeedbackMessage(null);
              setShowWithdrawModal(true);
            }}
            variant="secondary"
            size="sm"
            className="font-bold"
            leftIcon={<ArrowUpRight className="w-4 h-4" />}
          >
            Withdraw to Bank
          </Button>
        </div>
      </div>

      {/* 3-Pillar Financial Bento Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {/* 1. Available Balance Card */}
        <div className="rounded-3xl bg-zinc-900 text-white p-6 border-2 border-yellow-400/40 shadow-xl relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
              Available Balance
            </span>
            <div className="w-9 h-9 rounded-xl bg-yellow-400 text-zinc-950 flex items-center justify-center font-bold">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-black text-yellow-400 tracking-tight flex items-baseline gap-1">
              <span>₹</span>
              <span>{walletStats.availableBalance.toFixed(2)}</span>
            </div>
            <p className="text-[11px] text-zinc-400 mt-1">
              Net verified balance available for instant task booking or bank withdrawal.
            </p>
          </div>
        </div>

        {/* 2. Escrow Locked Card */}
        <div className="rounded-3xl bg-white border border-zinc-200 p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
              Locked in Escrow
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
              <Lock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-black text-zinc-900 tracking-tight flex items-baseline gap-1">
              <span className="text-amber-500">₹</span>
              <span>{walletStats.escrowHold.toFixed(2)}</span>
            </div>
            <p className="text-[11px] text-zinc-500 mt-1">
              Securely held for active tasks. Released automatically upon OTP completion.
            </p>
          </div>
        </div>

        {/* 3. Lifetime Earnings Card */}
        <div className="rounded-3xl bg-white border border-zinc-200 p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
              Lifetime Tasker Payouts
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-black text-zinc-900 tracking-tight flex items-baseline gap-1">
              <span className="text-emerald-600">₹</span>
              <span>{walletStats.totalLifetimeEarnings.toFixed(2)}</span>
            </div>
            <p className="text-[11px] text-zinc-500 mt-1">
              Cumulative 85% payouts credited across completed micro-tasks.
            </p>
          </div>
        </div>
      </div>

      {/* Escrow Guarantee Banner */}
      <div className="rounded-3xl bg-yellow-50 border border-yellow-300/80 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-8 h-8 text-yellow-700 shrink-0" />
          <div className="text-xs">
            <h4 className="font-bold text-yellow-950">
              Double-Sided Escrow Guarantee
            </h4>
            <p className="text-yellow-800 mt-0.5 max-w-2xl">
              When a booking is confirmed, poster funds are locked in Escrow. When the worker finishes and poster verifies OTP, 85% is instantly credited to Worker Wallet and 15% platform commission is reconciled.
            </p>
          </div>
        </div>
        <Badge variant="honey" size="md" className="shrink-0 font-black">
          15% Commission
        </Badge>
      </div>

      {/* Transaction History Ledger */}
      <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 pb-4">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-yellow-600" />
            <h3 className="text-sm font-black text-zinc-900 uppercase tracking-wider">
              Ledger Transactions
            </h3>
            <span className="text-xs text-zinc-400 ml-2">
              ({filteredTransactions.length} of {transactions.length} Records)
            </span>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 bg-zinc-100 p-1 rounded-2xl">
            {(
              [
                { label: "All", value: "ALL" },
                { label: "Credits (+)", value: "CREDIT" },
                { label: "Debits (-)", value: "DEBIT" },
                { label: "Escrow (🔒)", value: "ESCROW_HOLD" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.value}
                onClick={() => setFilterType(tab.value)}
                className={`px-3 py-1 text-xs font-bold rounded-xl transition ${
                  filterType === tab.value
                    ? "bg-zinc-900 text-yellow-400 shadow-sm"
                    : "text-zinc-600 hover:text-zinc-950"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center">
            <Loader2 className="w-6 h-6 text-yellow-500 animate-spin mx-auto mb-2" />
            <p className="text-xs text-zinc-500">Loading ledger transactions...</p>
          </div>
        ) : filteredTransactions.length > 0 ? (
          <div className="divide-y divide-zinc-100">
            {filteredTransactions.map((tx) => {
              const isCredit = tx.type === "CREDIT";
              const isDebit = tx.type === "DEBIT";
              const isEscrowHold = tx.type === "ESCROW_HOLD";

              const title =
                tx.taskTitle ||
                tx.description ||
                tx.payment?.booking?.service_request?.title ||
                "Escrow Settlement";

              return (
                <div key={tx.id} className="py-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    {/* Icon Indicator */}
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold shrink-0 border ${
                        isCredit
                          ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                          : isDebit
                          ? "bg-rose-100 text-rose-800 border-rose-200"
                          : isEscrowHold
                          ? "bg-amber-100 text-amber-800 border-amber-300"
                          : "bg-blue-100 text-blue-800 border-blue-200"
                      }`}
                    >
                      {isCredit ? (
                        <ArrowDownLeft className="w-5 h-5" />
                      ) : isDebit ? (
                        <ArrowUpRight className="w-5 h-5" />
                      ) : (
                        <Lock className="w-5 h-5" />
                      )}
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-zinc-900">{title}</h4>
                      <p className="text-[11px] text-zinc-500 mt-0.5">
                        {tx.description || tx.method || "Payment Gateway"}
                      </p>
                      <span className="text-[10px] text-zinc-400 block mt-0.5">
                        {new Date(tx.settledAt).toLocaleString("en-IN", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Amount & Status Badge */}
                  <div className="text-right flex flex-col items-end">
                    <div
                      className={`text-sm font-black ${
                        isCredit
                          ? "text-emerald-600"
                          : isDebit
                          ? "text-rose-600"
                          : "text-amber-600"
                      }`}
                    >
                      {isCredit
                        ? `+₹${tx.amount.toFixed(2)}`
                        : isDebit
                        ? `-₹${tx.amount.toFixed(2)}`
                        : `🔒 -₹${tx.amount.toFixed(2)}`}
                    </div>

                    <span
                      className={`mt-1 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md ${
                        isCredit
                          ? "bg-emerald-100 text-emerald-800"
                          : isDebit
                          ? "bg-rose-100 text-rose-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {isCredit
                        ? "CREDIT"
                        : isDebit
                        ? "DEBIT"
                        : "ESCROW LOCKED"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-12 text-center text-xs text-zinc-400">
            No transactions match the selected filter.
          </div>
        )}
      </div>

      {/* Deposit Modal */}
      <AnimatePresence>
        {showDepositModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 border border-zinc-200 shadow-2xl space-y-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-zinc-950">Add Funds to Escrow Wallet</h3>
                  <p className="text-xs text-zinc-500">Fast UPI / Cards via Razorpay Gateway</p>
                </div>
                <button
                  onClick={() => setShowDepositModal(false)}
                  className="text-zinc-400 hover:text-zinc-900"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Amount Quick Presets */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase mb-2">
                  Select Quick Amount
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {PRESET_AMOUNTS.map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setDepositAmount(String(amt))}
                      className={`py-2 rounded-xl text-xs font-black transition border ${
                        depositAmount === String(amt)
                          ? "bg-zinc-900 text-yellow-400 border-zinc-900 shadow-sm"
                          : "bg-zinc-50 text-zinc-700 border-zinc-200 hover:border-zinc-300"
                      }`}
                    >
                      ₹{amt}
                    </button>
                  ))}
                </div>
              </div>

              <Input
                label="Custom Deposit Amount (₹ INR)"
                type="number"
                min="10"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                leftIcon={<CreditCard className="w-4 h-4" />}
                required
              />

              <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-600 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-yellow-600 shrink-0" />
                <span>Funds are protected in 256-bit encrypted Razorpay Escrow Account.</span>
              </div>

              <Button
                onClick={handleDeposit}
                isLoading={actionLoading}
                className="w-full font-black shadow-honeySmall"
              >
                Proceed with Razorpay (₹{depositAmount})
              </Button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Withdraw Modal */}
      <AnimatePresence>
        {showWithdrawModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 border border-zinc-200 shadow-2xl space-y-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-zinc-950">Withdraw Earnings</h3>
                  <p className="text-xs text-zinc-500">Available: ₹{walletStats.availableBalance.toFixed(2)}</p>
                </div>
                <button
                  onClick={() => setShowWithdrawModal(false)}
                  className="text-zinc-400 hover:text-zinc-900"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Mode Selector */}
              <div className="flex bg-zinc-100 p-1 rounded-2xl border border-zinc-200">
                <button
                  type="button"
                  onClick={() => setWithdrawMode("UPI")}
                  className={`flex-1 py-2 text-xs font-black rounded-xl transition ${
                    withdrawMode === "UPI"
                      ? "bg-white text-zinc-950 shadow-sm"
                      : "text-zinc-600 hover:text-zinc-950"
                  }`}
                >
                  UPI Payout
                </button>
                <button
                  type="button"
                  onClick={() => setWithdrawMode("BANK")}
                  className={`flex-1 py-2 text-xs font-black rounded-xl transition ${
                    withdrawMode === "BANK"
                      ? "bg-white text-zinc-950 shadow-sm"
                      : "text-zinc-600 hover:text-zinc-950"
                  }`}
                >
                  Bank Account (IMPS)
                </button>
              </div>

              <Input
                label="Withdrawal Amount (₹ INR)"
                type="number"
                min="50"
                max={walletStats.availableBalance}
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
              />

              {withdrawMode === "UPI" ? (
                <Input
                  label="Beneficiary UPI ID (VPA)"
                  placeholder="name@okhdfcbank"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  leftIcon={<Smartphone className="w-4 h-4" />}
                  required
                />
              ) : (
                <div className="space-y-4">
                  <Input
                    label="Bank Account Number"
                    placeholder="9876543210123"
                    value={bankAccountNumber}
                    onChange={(e) => setBankAccountNumber(e.target.value)}
                    leftIcon={<Building2 className="w-4 h-4" />}
                    required
                  />
                  <Input
                    label="IFSC Code"
                    placeholder="HDFC0001234"
                    value={ifscCode}
                    onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                    required
                  />
                </div>
              )}

              <Button
                onClick={handleWithdraw}
                variant="secondary"
                isLoading={actionLoading}
                className="w-full font-black"
              >
                Confirm Instant Transfer (₹{withdrawAmount})
              </Button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
