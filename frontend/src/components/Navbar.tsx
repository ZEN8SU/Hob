"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap,
  PlusCircle,
  Search,
  Wallet,
  Bell,
  User as UserIcon,
  LogOut,
  ArrowRightLeft,
  CheckCircle2,
  Menu,
  X,
  Sparkles,
  LucideIcon,
  Check,
  Lock,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import { userApi } from "@/lib/api";
import { Button } from "./ui/Button";

interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
  highlight?: boolean;
}

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, token, mode, toggleMode, logout, walletBalance, unreadNotifications, setUnreadNotifications } =
    useAppStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationsList, setNotificationsList] = useState<any[]>([]);

  const isPoster = mode === "poster";
  const isBookingOrChatRoom = Boolean(
    pathname && (/^\/bookings\/.+/.test(pathname) || pathname.startsWith("/chat"))
  );

  const posterNavLinks: NavItem[] = [
    { name: "Browse Feed", href: "/dashboard", icon: Search },
    { name: "Post Micro-Task", href: "/create-task", icon: PlusCircle, highlight: true },
    { name: "Escrow Wallet", href: "/wallet", icon: Wallet },
    { name: "My Profile", href: "/profile", icon: UserIcon },
  ];

  const workerNavLinks: NavItem[] = [
    { name: "Find Gigs Feed", href: "/dashboard", icon: Search },
    { name: "My Earnings", href: "/wallet", icon: Wallet },
    { name: "My Profile", href: "/profile", icon: UserIcon },
  ];

  const currentLinks = isPoster ? posterNavLinks : workerNavLinks;

  const fetchNotifications = async () => {
    if (!token) return;
    try {
      const res = await userApi.getNotifications();
      setNotificationsList(res.data.notifications || []);
      setUnreadNotifications(res.data.unreadCount || 0);
    } catch (err) {
      console.error("Error fetching notifications:", err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, [token]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await userApi.markNotificationRead(id);
      setNotificationsList((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadNotifications(Math.max(0, unreadNotifications - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-50 w-full honey-glass border-b border-yellow-400/20 bg-white/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <motion.div
              whileHover={{ rotate: [0, -10, 10, 0], scale: 1.05 }}
              className="w-10 h-10 rounded-2xl bg-zinc-900 border-2 border-yellow-400 flex items-center justify-center shadow-honeySmall"
            >
              <Zap className="w-5 h-5 text-yellow-400 fill-yellow-400" />
            </motion.div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-black tracking-tight text-zinc-900">
                  HOB<span className="text-yellow-500">.</span>
                </span>
                <span className="bg-yellow-400 text-zinc-950 text-[10px] font-extrabold px-1.5 py-0.5 rounded-md uppercase tracking-wider">
                  PROD v2
                </span>
              </div>
              <span className="text-[10px] font-medium text-zinc-500 -mt-1 tracking-tight">
                Hyperlocal P2P Gigs
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1.5">
            {currentLinks.map((link) => {
              const isActive = pathname === link.href;
              const Icon = link.icon;

              if (link.highlight) {
                return (
                  <Link key={link.name} href={link.href}>
                    <motion.div
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      className="flex items-center gap-1.5 bg-yellow-400 hover:bg-yellow-500 text-zinc-950 px-4 py-2 rounded-xl font-bold text-sm shadow-honeySmall transition-all ml-1"
                    >
                      <Icon className="w-4 h-4" />
                      <span>{link.name}</span>
                    </motion.div>
                  </Link>
                );
              }

              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all ${
                    isActive
                      ? "bg-zinc-900 text-yellow-400 font-bold"
                      : "text-zinc-700 hover:text-zinc-950 hover:bg-zinc-100"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{link.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Action Bar: Dual-Mode Switcher, Wallet, Notifications & User Profile */}
          <div className="hidden lg:flex items-center gap-3">
            {/* Dual Mode Switcher or Persistent Role-Locked Session Badge */}
            {isBookingOrChatRoom ? (
              <div
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-800 border border-amber-400/40 shadow-sm select-none"
                title="Role switching is locked inside an active booking session"
              >
                <Lock className="w-3.5 h-3.5 text-amber-600" />
                <span>Active Job Session (Role Locked)</span>
              </div>
            ) : (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={toggleMode}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-black border transition-all shadow-sm ${
                  isPoster
                    ? "bg-zinc-900 text-yellow-400 border-yellow-400/40 hover:bg-zinc-800"
                    : "bg-yellow-400 text-zinc-950 border-yellow-500 hover:bg-yellow-500"
                }`}
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
                <span>{isPoster ? "Poster Mode (Need Help)" : "Tasker Mode (Earn ₹)"}</span>
              </motion.button>
            )}

            {/* Wallet Balance Pill */}
            <Link href="/wallet">
              <div className="flex items-center gap-1.5 bg-zinc-100 hover:bg-yellow-100/70 border border-zinc-200 hover:border-yellow-400 px-3 py-1.5 rounded-xl transition-all cursor-pointer">
                <Wallet className="w-4 h-4 text-yellow-600" />
                <span className="text-xs font-extrabold text-zinc-900">
                  ₹{walletBalance.toFixed(0)}
                </span>
              </div>
            </Link>

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 rounded-xl text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition relative"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadNotifications > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-yellow-500 ring-2 ring-white"></span>
                )}
              </button>

              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-zinc-200 p-4 z-50 max-h-96 overflow-y-auto"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-zinc-100 mb-2">
                      <span className="text-xs font-black text-zinc-900">Live Skill & Task Alerts</span>
                      <span className="text-[10px] text-yellow-800 bg-yellow-100 px-2 py-0.5 rounded-full font-bold">
                        {unreadNotifications} New
                      </span>
                    </div>

                    <div className="space-y-2 text-xs">
                      {notificationsList.length > 0 ? (
                        notificationsList.map((notif) => (
                          <div
                            key={notif.id}
                            onClick={() => handleMarkAsRead(notif.id)}
                            className={`p-2.5 rounded-xl border transition cursor-pointer ${
                              notif.isRead
                                ? "bg-zinc-50 border-zinc-100 text-zinc-600"
                                : "bg-yellow-50/80 border-yellow-200 text-zinc-900 font-medium"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <p className="font-extrabold text-xs">{notif.title}</p>
                              {!notif.isRead && (
                                <span className="w-1.5 h-1.5 rounded-full bg-yellow-500"></span>
                              )}
                            </div>
                            <p className="text-[11px] mt-0.5">{notif.message}</p>
                            <span className="text-[9px] text-zinc-400 mt-1 block">
                              {new Date(notif.createdAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                        ))
                      ) : (
                        <p className="text-center text-[11px] text-zinc-400 py-4">
                          No notifications yet.
                        </p>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* User Profile / Auth Button */}
            {token ? (
              <div className="flex items-center gap-2 pl-2 border-l border-zinc-200">
                <Link href="/profile">
                  <div className="w-8 h-8 rounded-full bg-zinc-900 text-yellow-400 font-bold text-xs flex items-center justify-center border border-yellow-400 hover:scale-105 transition cursor-pointer">
                    {user?.name ? user.name[0]?.toUpperCase() : "U"}
                  </div>
                </Link>
                <button
                  onClick={handleLogout}
                  title="Logout"
                  className="p-1.5 text-zinc-500 hover:text-rose-600 transition"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login">
                  <Button size="sm" variant="outline" className="text-xs font-bold">
                    Login
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button size="sm" variant="primary" className="text-xs font-bold shadow-honeySmall">
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex lg:hidden items-center gap-2">
            {isBookingOrChatRoom ? (
              <div
                className="p-2 rounded-xl text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300"
                title="Active Job Session (Role Locked)"
              >
                <Lock className="w-4 h-4 text-amber-700" />
              </div>
            ) : (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={toggleMode}
                className={`p-2 rounded-xl text-xs font-bold ${
                  isPoster ? "bg-zinc-900 text-yellow-400" : "bg-yellow-400 text-zinc-950"
                }`}
              >
                <ArrowRightLeft className="w-4 h-4" />
              </motion.button>
            )}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-xl text-zinc-700 hover:bg-zinc-100"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden border-t border-zinc-200 bg-white px-4 pt-3 pb-6 space-y-3"
          >
            <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-100">
              <span className="text-xs font-bold text-zinc-700">Current Role:</span>
              {isBookingOrChatRoom ? (
                <span className="text-xs font-black text-amber-700 flex items-center gap-1 uppercase">
                  <Lock className="w-3.5 h-3.5" /> Session Locked
                </span>
              ) : (
                <span className="text-xs font-black text-zinc-900 uppercase">
                  {isPoster ? "Task Poster (Customer)" : "Tasker (Worker)"}
                </span>
              )}
            </div>

            {currentLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-zinc-800 hover:bg-yellow-50"
              >
                <link.icon className="w-5 h-5 text-yellow-600" />
                <span>{link.name}</span>
              </Link>
            ))}

            <div className="pt-3 border-t border-zinc-200 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-yellow-600" />
                <span className="text-sm font-black">₹{walletBalance.toFixed(0)}</span>
              </div>
              {token ? (
                <button
                  onClick={() => {
                    handleLogout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="text-xs font-bold text-rose-600 hover:underline"
                >
                  Logout
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button size="sm" variant="outline" className="text-xs">
                      Login
                    </Button>
                  </Link>
                  <Link href="/signup" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button size="sm" variant="primary" className="text-xs font-bold shadow-honeySmall">
                      Sign Up
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};