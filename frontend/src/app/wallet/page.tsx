"use client";

import React, { useState, useEffect } from "react";
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
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { useAppStore } from "@/lib/store";
import { paymentApi } from "@/lib/api";

export default function WalletPage() {
  const router = useRouter();
  const { token, updateWallet } = useAppStore();

  const [loading, setLoading] = useState(true);
  const [walletStats, setWalletStats] = useState({
    availableBalance: 2450.0,
    escrowHold: 450.0,
    totalLifetimeEarnings: 8940.0,
  });

  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [depositAmount, setDepositAmount] = useState("1000");
  const [withdrawAmount, setWithdrawAmount] = useState("500");
  const [upiId, setUpiId] = useState("user@okaxis");
  const [transactions, setTransactions] = useState<any[]>([]);

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

  const handleDeposit = () => {
    const amt = Number(depositAmount);
    if (amt > 0) {
      setWalletStats((prev) => ({
        ...prev,
        availableBalance: prev.availableBalance + amt,
      }));
      setTransactions((prev) => [
        {
          id: `tx-${Date.now()}`,
          amount: amt,
          settledAt: new Date().toISOString(),
          payment: {
            method: "UPI (GooglePay)",
            status: "released",
            booking: { service_request: { title: `Instant UPI Top-up (${upiId})` } },
          },
        },
        ...prev,
      ]);
      setShowDepositModal(false);
    }
  };

  const handleWithdraw = () => {
    const amt = Number(withdrawAmount);
    if (amt > 0 && amt <= walletStats.availableBalance) {
      setWalletStats((prev) => ({
        ...prev,
        availableBalance: prev.availableBalance - amt,
      }));
      setTransactions((prev) => [
        {
          id: `tx-${Date.now()}`,
          amount: amt,
          settledAt: new Date().toISOString(),
          payment: {
            method: "IMPS Payout",
            status: "withdrawn",
            booking: { service_request: { title: `Direct UPI Withdrawal (${upiId})` } },
          },
        },
        ...prev,
      ]);
      setShowWithdrawModal(false);
    } else {
      alert("Insufficient available balance.");
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-black uppercase text-yellow-600 tracking-wider">
            Escrow Financial Ledger
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-zinc-950">
            Wallet & Escrow Holdings
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={() => setShowDepositModal(true)}
            variant="primary"
            size="sm"
            className="font-bold shadow-honeySmall"
            leftIcon={<PlusCircle className="w-4 h-4" />}
          >
            Add Funds (UPI)
          </Button>

          <Button
            onClick={() => setShowWithdrawModal(true)}
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
        {/* Available Balance */}
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
              Ready for instant UPI withdrawal or new task posting.
            </p>
          </div>
        </div>

        {/* Escrow Locked */}
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
              <span className="text-yellow-500">₹</span>
              <span>{walletStats.escrowHold.toFixed(2)}</span>
            </div>
            <p className="text-[11px] text-zinc-500 mt-1">
              Held safely for in-progress bookings. Releases upon completion OTP.
            </p>
          </div>
        </div>

        {/* Lifetime Earnings */}
        <div className="rounded-3xl bg-white border border-zinc-200 p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
              Lifetime Payouts
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
              Total 85% payouts settled across completed micro-tasks.
            </p>
          </div>
        </div>
      </div>

      {/* Escrow Mechanism Info Banner */}
      <div className="rounded-3xl bg-yellow-50 border border-yellow-300/80 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-8 h-8 text-yellow-700 shrink-0" />
          <div className="text-xs">
            <h4 className="font-bold text-yellow-950">
              Double-Sided Escrow Guarantee
            </h4>
            <p className="text-yellow-800 mt-0.5 max-w-2xl">
              When a booking is confirmed, customer funds are locked in Escrow. When the worker finishes and customer verifies OTP, 85% is instantly credited to Worker Wallet and 15% platform fee is deducted.
            </p>
          </div>
        </div>
        <Badge variant="honey" size="md" className="shrink-0 font-black">
          15% Commission
        </Badge>
      </div>

      {/* Transaction History Ledger */}
      <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-yellow-600" />
            <h3 className="text-sm font-black text-zinc-900 uppercase tracking-wider">
              Ledger Transactions
            </h3>
          </div>
          <span className="text-xs text-zinc-400">
            {transactions.length} Recorded Ledger Events
          </span>
        </div>

        {loading ? (
          <div className="py-12 text-center">
            <Loader2 className="w-6 h-6 text-yellow-500 animate-spin mx-auto mb-2" />
            <p className="text-xs text-zinc-500">Loading ledger transactions...</p>
          </div>
        ) : transactions.length > 0 ? (
          <div className="divide-y divide-zinc-100">
            {transactions.map((tx) => {
              const title = tx.payment?.booking?.service_request?.title || "Escrow Settlement";
              const isHold = tx.payment?.status === "hold";
              const isWithdrawn = tx.payment?.status === "withdrawn";

              return (
                <div key={tx.id} className="py-3.5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold shrink-0 ${
                        isHold
                          ? "bg-yellow-100 text-yellow-800"
                          : isWithdrawn
                          ? "bg-rose-100 text-rose-800"
                          : "bg-emerald-100 text-emerald-800"
                      }`}
                    >
                      {isHold ? (
                        <Lock className="w-5 h-5" />
                      ) : isWithdrawn ? (
                        <ArrowUpRight className="w-5 h-5" />
                      ) : (
                        <ArrowDownLeft className="w-5 h-5" />
                      )}
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-zinc-900">{title}</h4>
                      <p className="text-[11px] text-zinc-500">
                        {tx.payment?.method || "UPI Ledger"}
                      </p>
                      <span className="text-[10px] text-zinc-400">
                        {new Date(tx.settledAt).toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div
                      className={`text-sm font-black ${
                        isHold
                          ? "text-amber-600"
                          : isWithdrawn
                          ? "text-rose-600"
                          : "text-emerald-600"
                      }`}
                    >
                      {isWithdrawn ? "-" : "+"}₹{(tx.amount || 0).toFixed(2)}
                    </div>
                    <Badge
                      variant={isHold ? "warning" : "success"}
                      size="sm"
                      className="mt-0.5"
                    >
                      {tx.payment?.status || "settled"}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-12 text-center text-xs text-zinc-400">
            No transactions yet. Complete tasks to build your financial ledger.
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
                <h3 className="text-lg font-black text-zinc-950">Add Funds to Escrow Wallet</h3>
                <button onClick={() => setShowDepositModal(false)} className="text-zinc-400 hover:text-zinc-900">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <Input
                label="Deposit Amount (₹ INR)"
                type="number"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
              />

              <Input
                label="Your UPI VPA / ID"
                placeholder="user@okhdfcbank"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                leftIcon={<Smartphone className="w-4 h-4" />}
              />

              <Button onClick={handleDeposit} className="w-full font-black shadow-honeySmall">
                Proceed to UPI Gateway
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
                <h3 className="text-lg font-black text-zinc-950">Withdraw Earnings</h3>
                <button onClick={() => setShowWithdrawModal(false)} className="text-zinc-400 hover:text-zinc-900">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <Input
                label="Withdrawal Amount (₹ INR)"
                type="number"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
              />

              <Input
                label="Beneficiary UPI ID"
                placeholder="yourname@oksbi"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                leftIcon={<Smartphone className="w-4 h-4" />}
              />

              <Button onClick={handleWithdraw} variant="secondary" className="w-full font-black">
                Confirm Instant Bank Transfer
              </Button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
