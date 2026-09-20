import axios from "axios";

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

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
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    }
    return Promise.reject(error);
  }
);

// Specific Backend Integration Service Calls
export const authApi = {
  sendOtp: (phone: string) => api.post("/auth/send-otp", { phone }),
  verifyOtp: (payload: { phone: string; otp: string; name?: string; email?: string }) =>
    api.post("/auth/verify-otp", payload),
  getMe: () => api.get("/auth/me"),
};

export const userApi = {
  upsertCustomerProfile: (address: string) =>
    api.post("/users/customer-profile", { address }),
  createWorkerProfile: (payload: { skills: string; hourlyRate: number; isAvailable?: boolean }) =>
    api.post("/users/worker-profile", payload),
  updateWorkerProfile: (id: string, payload: Partial<{ skills: string; hourlyRate: number; isAvailable: boolean }>) =>
    api.put(`/users/worker-profile/${id}`, payload),
  getMyProfiles: () => api.get("/users/my-profiles"),
  getAllWorkers: (params?: { skill?: string; availableOnly?: boolean; minRating?: number }) =>
    api.get("/users/workers", { params }),
  getWorkerById: (id: string) => api.get(`/users/workers/${id}`),
};

export const serviceApi = {
  createService: (payload: { title: string; category: string; baseRate: number; workerId?: string }) =>
    api.post("/services", payload),
  getAllServices: (params?: { category?: string; search?: string }) =>
    api.get("/services", { params }),
  getServiceById: (id: string) => api.get(`/services/${id}`),
  createServiceRequest: (payload: { scheduledFor: string; serviceId?: string; address?: string }) =>
    api.post("/services/requests", payload),
  getFeed: (status = "pending") => api.get("/services/requests/feed", { params: { status } }),
  getMyRequests: () => api.get("/services/requests/my"),
};

export const bookingApi = {
  createBooking: (payload: { requestId: string; workerId: string }) =>
    api.post("/bookings", payload),
  getUserBookings: (role?: "customer" | "worker" | "all") =>
    api.get("/bookings", { params: { role } }),
  getBookingById: (id: string) => api.get(`/bookings/${id}`),
  updateStatus: (id: string, payload: { status: string; durationMinutes?: number; customLaborAmount?: number }) =>
    api.patch(`/bookings/${id}/status`, payload),
};

export const paymentApi = {
  createEscrow: (payload: { bookingId: string; amount: number; method?: string }) =>
    api.post("/payments/escrow", payload),
  releaseEscrow: (paymentId: string) => api.post(`/payments/release/${paymentId}`),
  refundEscrow: (paymentId: string) => api.post(`/payments/refund/${paymentId}`),
  getPaymentByBooking: (bookingId: string) => api.get(`/payments/booking/${bookingId}`),
  getMyTransactions: () => api.get("/payments/transactions"),
};

export const reviewApi = {
  createReview: (payload: { bookingId: string; rating: number; comment?: string }) =>
    api.post("/reviews", payload),
  getReviewsForUser: (userId: string) => api.get(`/reviews/user/${userId}`),
  getReviewsForBooking: (bookingId: string) => api.get(`/reviews/booking/${bookingId}`),
};

export default api;

