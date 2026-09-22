import axios from "axios";

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
export const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5000";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request Interceptor: Attach JWT token automatically
api.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle 401s gracefully
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== "undefined") {
        const isAuthRoute =
          window.location.pathname === "/login" || window.location.pathname === "/signup";
        if (!isAuthRoute) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
        }
      }
    }
    return Promise.reject(error);
  }
);

// Auth Service Endpoints
export const authApi = {
  signup: (payload: {
    email: string;
    password: string;
    name: string;
    age: number;
    phone?: string;
    skills?: string[];
    role?: "poster" | "worker";
    address?: string;
  }) => api.post("/auth/signup", payload),
  login: (payload: { email: string; password: string }) => api.post("/auth/login", payload),
  sendOtp: (payload: { email?: string; phone?: string }) => api.post("/auth/send-otp", payload),
  verifyOtp: (payload: {
    email?: string;
    phone?: string;
    otp: string;
    name?: string;
    age?: number;
    skills?: string[];
    role?: "poster" | "worker";
    address?: string;
  }) => api.post("/auth/verify-otp", payload),
  getMe: () => api.get("/auth/me"),
};

// User & Profile Service Endpoints
export const userApi = {
  getProfile: () => api.get("/users/profile"),
  updateProfile: (payload: {
    name?: string;
    email?: string;
    age?: number;
    skills?: string[];
    role?: "poster" | "worker";
    avatarUrl?: string;
    address?: string;
    latitude?: number;
    longitude?: number;
    hourlyRate?: number;
    isAvailable?: boolean;
  }) => api.put("/users/profile", payload),
  getNotifications: () => api.get("/users/notifications"),
  markNotificationRead: (id: string) => api.patch(`/users/notifications/${id}/read`),
  upsertCustomerProfile: (address: string, latitude?: number, longitude?: number) =>
    api.post("/users/customer-profile", { address, latitude, longitude }),
  createWorkerProfile: (payload: {
    skills: string;
    hourlyRate: number;
    isAvailable?: boolean;
    address?: string;
    latitude?: number;
    longitude?: number;
  }) => api.post("/users/worker-profile", payload),
  updateWorkerProfile: (id: string, payload: any) =>
    api.put(`/users/worker-profile/${id}`, payload),
  getMyProfiles: () => api.get("/users/my-profiles"),
  getAllWorkers: (params?: { skill?: string; availableOnly?: boolean }) =>
    api.get("/users/workers", { params }),
  getWorkerById: (id: string) => api.get(`/users/workers/${id}`),
};

// Service Requests & Tasks Endpoints
export const serviceApi = {
  createServiceRequest: (payload: {
    title: string;
    category: string;
    budget: number;
    description?: string;
    address: string;
    latitude?: number;
    longitude?: number;
    timeConstraint?: string;
    scheduledFor: string;
    serviceId?: string;
  }) => api.post("/services/requests", payload),
  getFeed: (params?: {
    status?: string;
    category?: string;
    search?: string;
    mode?: "poster" | "tasker";
    latitude?: number;
    longitude?: number;
    radius?: number | string;
  }) => api.get("/services/requests/feed", { params }),
  getMyRequests: () => api.get("/services/requests/my"),
  getRequestById: (id: string) => api.get(`/services/requests/${id}`),
  createService: (payload: { title: string; category: string; baseRate: number; workerId?: string }) =>
    api.post("/services", payload),
  getAllServices: (params?: { category?: string; search?: string }) =>
    api.get("/services", { params }),
  getServiceById: (id: string) => api.get(`/services/${id}`),
};

// Bid Management Endpoints
export const bidApi = {
  createBid: (taskId: string, payload: { proposedPrice: number; message?: string }) =>
    api.post(`/services/requests/${taskId}/bids`, payload),
  getBidsForTask: (taskId: string) => api.get(`/services/requests/${taskId}/bids`),
  acceptBid: (bidId: string) => api.post(`/services/bids/${bidId}/accept`),
  rejectBid: (bidId: string) => api.post(`/services/bids/${bidId}/reject`),
};

// Booking Service Endpoints
export const bookingApi = {
  createBooking: (payload: { requestId: string; workerId: string }) =>
    api.post("/bookings", payload),
  getActiveBookings: () => api.get("/bookings/active"),
  getUserBookings: (role?: "customer" | "worker" | "all") =>
    api.get("/bookings", { params: { role } }),
  getBookingById: (id: string) => api.get(`/bookings/${id}`),
  updateStatus: (
    id: string,
    payload: { status: string; otpCode?: string; durationMinutes?: number; customLaborAmount?: number }
  ) => api.patch(`/bookings/${id}/status`, payload),
};

// Payments & Escrow Endpoints
export const paymentApi = {
  createRazorpayOrder: (payload: { bookingId: string; amount?: number }) =>
    api.post("/payments/create-order", payload),
  verifyRazorpayPayment: (payload: {
    bookingId: string;
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature?: string;
    amount?: number;
    method?: string;
  }) => api.post("/payments/verify", payload),
  releaseEscrow: (paymentId: string) => api.post(`/payments/release/${paymentId}`),
  refundEscrow: (paymentId: string) => api.post(`/payments/refund/${paymentId}`),
  getWalletLedger: () => api.get("/payments/wallet"),
  getMyTransactions: () => api.get("/payments/transactions"),
  getPaymentByBooking: (bookingId: string) => api.get(`/payments/booking/${bookingId}`),
};

// Reviews Endpoints
export const reviewApi = {
  createReview: (payload: { bookingId: string; rating: number; comment?: string }) =>
    api.post("/reviews", payload),
  getReviewsForUser: (userId: string) => api.get(`/reviews/user/${userId}`),
  getReviewsForBooking: (bookingId: string) => api.get(`/reviews/booking/${bookingId}`),
};

export default api;
