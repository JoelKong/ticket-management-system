import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      // Use a custom event to notify components about auth failure
      window.dispatchEvent(new CustomEvent("auth-logout"));
    }
    return Promise.reject(error);
  }
);

export interface Concert {
  id: string;
  title: string;
  description: string;
  artist: string;
  date: string;
  venue: string;
  location: string;
  basePrice: number;
  totalSeats: number;
  availableSeats: number;
  status: string;
  imageUrl?: string;
}

export interface Seat {
  id: string;
  seatNumber: string;
  row: string;
  section: string;
  price: number;
  status: "available" | "reserved" | "sold";
  redisStatus?: string;
  reservedUntil?: string;
}

export interface Booking {
  id: string;
  userId: string;
  seatId: string;
  stripePaymentIntentId: string;
  amount: number;
  status: "pending" | "confirmed" | "failed" | "refunded";
  confirmedAt?: string;
  createdAt: string;
  seat: Seat & {
    concert?: {
      title: string;
      artist: string;
      date: string;
      venue: string;
      location: string;
    };
  };
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
}

export const authApi = {
  login: async (email: string, password: string) => {
    const response = await api.post("/auth/login", { email, password });
    return response.data;
  },

  register: async (userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
  }) => {
    const response = await api.post("/auth/register", userData);
    return response.data;
  },

  getProfile: async (token: string) => {
    const response = await api.get("/auth/profile", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },
};

export const concertsApi = {
  getAll: async (): Promise<Concert[]> => {
    const response = await api.get("/concerts");
    return response.data;
  },

  getById: async (id: string): Promise<Concert> => {
    const response = await api.get(`/concerts/${id}`);
    return response.data;
  },

  getSeatAvailability: async (id: string): Promise<Seat[]> => {
    const response = await api.get(`/concerts/${id}/seats`);
    return response.data;
  },

  reserveSeat: async (concertId: string, seatId: string) => {
    const response = await api.post("/concerts/reserve", {
      concertId,
      seatId,
    });
    return response.data;
  },

  confirmBooking: async (paymentIntentId: string) => {
    const response = await api.post("/concerts/confirm", {
      paymentIntentId,
    });
    return response.data;
  },

  cancelBooking: async (bookingId: string) => {
    const response = await api.post("/concerts/cancel", {
      bookingId,
    });
    return response.data;
  },

  getUserBookings: async (): Promise<Booking[]> => {
    const response = await api.get("/concerts/my/bookings");
    return response.data;
  },
};
