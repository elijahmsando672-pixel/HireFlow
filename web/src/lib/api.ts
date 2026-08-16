import type {
  Contract,
  Conversation,
  Gig,
  Job,
  Message,
  Order,
  Proposal,
  ProposalWithCandidate,
  PublicUser,
  Review,
  User
} from "./types";

const API_BASE = import.meta.env.VITE_API_URL || "/api";
const TOKEN_KEY = "hireflow_token";
const USER_KEY = "hireflow_user";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export function isLoggedIn(): boolean {
  return !!getToken();
}

export function logoutUser(): void {
  clearToken();
  localStorage.removeItem(USER_KEY);
  window.location.href = "/login";
}

export function cacheUser(user: User): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getCachedUser(): User | null {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) || "null");
  } catch {
    return null;
  }
}

interface RequestOptions extends RequestInit {
  token?: boolean;
}

async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json"
  };

  const token = getToken();
  if (token) headers.Authorization = "Bearer " + token;

  let response: Response;
  try {
    response = await fetch(API_BASE + path, { ...options, headers });
  } catch {
    throw new ApiError("Network error — is the server running?", 0);
  }

  if (response.status === 401) {
    clearToken();
    localStorage.removeItem(USER_KEY);
    throw new ApiError("Your session has expired. Please log in again.", 401);
  }

  let data: any = {};
  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    throw new ApiError(data.error || "Request failed.", response.status);
  }

  return data as T;
}

export const api = {
  login: (email: string, password: string) =>
    apiRequest<{ token: string; user: User }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password })
    }),

  register: (user: Record<string, string>) =>
    apiRequest<{ token: string; user: User }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(user)
    }),

  me: () => apiRequest<{ user: User }>("/auth/me"),

  updateProfile: (profile: Record<string, unknown>) =>
    apiRequest<{ user: User }>("/auth/profile", {
      method: "PUT",
      body: JSON.stringify(profile)
    }),

  getUser: (userId: number) => apiRequest<{ user: PublicUser }>("/users/" + userId),

  getJobs: (filters: Record<string, string> = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
    const qs = params.toString();
    return apiRequest<{ jobs: Job[] }>("/jobs" + (qs ? "?" + qs : ""));
  },

  getJob: (id: number) => apiRequest<{ job: Job }>("/jobs/" + id),

  postJob: (job: Record<string, unknown>) =>
    apiRequest<{ job: Job }>("/jobs", {
      method: "POST",
      body: JSON.stringify(job)
    }),

  myJobs: () => apiRequest<{ jobs: Job[] }>("/jobs/mine"),

  getJobProposals: (jobId: number) =>
    apiRequest<{ proposals: ProposalWithCandidate[] }>("/jobs/" + jobId + "/proposals"),

  createProposal: (data: { jobId: number; coverLetter: string; rate: number; timelineDays: number }) =>
    apiRequest<{ success: boolean }>("/proposals", {
      method: "POST",
      body: JSON.stringify(data)
    }),

  myProposals: () => apiRequest<{ proposals: Proposal[] }>("/proposals/mine"),

  updateProposal: (id: number, status: string) =>
    apiRequest<{ success: boolean }>("/proposals/" + id, {
      method: "PUT",
      body: JSON.stringify({ status })
    }),

  getGigs: (filters: Record<string, string> = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
    const qs = params.toString();
    return apiRequest<{ gigs: Gig[] }>("/gigs" + (qs ? "?" + qs : ""));
  },

  getGig: (id: number) => apiRequest<{ gig: Gig; reviews: Review[] }>("/gigs/" + id),

  createGig: (gig: Record<string, unknown>) =>
    apiRequest<{ gig: Gig }>("/gigs", {
      method: "POST",
      body: JSON.stringify(gig)
    }),

  myGigs: () => apiRequest<{ gigs: Gig[] }>("/gigs/mine"),

  createOrder: (data: { gigId: number; packageName: string }) =>
    apiRequest<{ order: Order }>("/orders", {
      method: "POST",
      body: JSON.stringify(data)
    }),

  myOrders: () =>
    apiRequest<{ buyer: Order[]; seller: Order[] }>("/orders/mine"),

  createContract: (proposalId: number) =>
    apiRequest<{ contract: Contract }>("/contracts", {
      method: "POST",
      body: JSON.stringify({ proposalId })
    }),

  getContracts: () => apiRequest<{ contracts: Contract[] }>("/contracts"),

  getContract: (id: number) => apiRequest<{ contract: Contract }>("/contracts/" + id),

  payContract: (id: number, method: string, reference?: string) =>
    apiRequest<{ contract: Contract; paymentId: number }>("/contracts/" + id + "/pay", {
      method: "POST",
      body: JSON.stringify({ method, reference })
    }),

  deliverContract: (id: number, deliveryNote: string) =>
    apiRequest<{ contract: Contract }>("/contracts/" + id + "/deliver", {
      method: "POST",
      body: JSON.stringify({ deliveryNote })
    }),

  completeContract: (id: number) =>
    apiRequest<{ contract: Contract }>("/contracts/" + id + "/complete", {
      method: "POST"
    }),

  cancelContract: (id: number) =>
    apiRequest<{ contract: Contract }>("/contracts/" + id + "/cancel", {
      method: "POST"
    }),

  createReview: (data: { orderId: number; rating: number; comment: string }) =>
    apiRequest<{ success: boolean }>("/reviews", {
      method: "POST",
      body: JSON.stringify(data)
    }),

  conversations: () => apiRequest<{ conversations: Conversation[] }>("/messages/conversations"),

  thread: (userId: number) => apiRequest<{ messages: Message[] }>("/messages/" + userId),

  sendMessage: (data: { recipientId: number; body: string }) =>
    apiRequest<{ success: boolean }>("/messages", {
      method: "POST",
      body: JSON.stringify(data)
    }),

  savedJobs: () => apiRequest<{ jobs: Job[] }>("/saved/jobs"),
  saveJob: (jobId: number) =>
    apiRequest<{ saved: boolean }>("/saved/jobs", {
      method: "POST",
      body: JSON.stringify({ jobId })
    }),
  unsaveJob: (jobId: number) =>
    apiRequest<{ saved: boolean }>("/saved/jobs/" + jobId, { method: "DELETE" }),

  savedGigs: () => apiRequest<{ gigs: Gig[] }>("/saved/gigs"),
  saveGig: (gigId: number) =>
    apiRequest<{ saved: boolean }>("/saved/gigs", {
      method: "POST",
      body: JSON.stringify({ gigId })
    }),
  unsaveGig: (gigId: number) =>
    apiRequest<{ saved: boolean }>("/saved/gigs/" + gigId, { method: "DELETE" })
};
