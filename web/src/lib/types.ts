export type Role = "client" | "freelancer" | "both";

export interface User {
  id: number;
  firstName: string;
  lastName: string;
  username?: string;
  email: string;
  phone?: string;
  role: Role;
  headline?: string;
  bio?: string;
  education?: string;
  skills: string[];
  interests: string[];
  linkedin?: string;
  github?: string;
  twitter?: string;
  portfolio?: string;
  companyName?: string;
  companyWebsite?: string;
  companyEmail?: string;
  companyPhone?: string;
  companyCountry?: string;
  companyDescription?: string;
  isVerified: boolean;
  verifiedAt?: string;
  suspended: boolean;
  createdAt?: string;
}

export interface Job {
  id: number;
  title: string;
  company: string;
  location: string;
  type: string;
  category: string;
  salary: number;
  description?: string;
  requirements?: string[];
  posted: string;
  postedBy?: number | null;
  posterVerified?: boolean;
  proposalCount?: number;
}

export interface Proposal {
  id: number;
  jobId: number;
  title: string;
  company: string;
  location: string;
  salary: number;
  coverLetter: string;
  rate: number;
  timelineDays: number;
  status: "Pending" | "Accepted" | "Rejected";
  createdAt: string;
}

export interface ProposalWithCandidate {
  id: number;
  userId: number;
  firstName: string;
  lastName: string;
  headline?: string;
  skills: string[];
  coverLetter: string;
  rate: number;
  timelineDays: number;
  status: "Pending" | "Accepted" | "Rejected";
  createdAt: string;
}

export interface GigPackage {
  name: string;
  price: number;
  description: string;
  deliveryDays: number;
}

export interface Seller {
  id: number;
  firstName: string;
  lastName?: string;
  headline?: string;
}

export interface Gig {
  id: number;
  userId?: number;
  title: string;
  description: string;
  category: string;
  packages: GigPackage[];
  createdAt?: string;
  seller: Seller;
  rating: number | null;
  reviewCount: number;
  orderCount?: number;
}

export interface Review {
  id: number;
  firstName: string;
  lastName?: string;
  rating: number;
  comment?: string;
  createdAt: string;
}

export interface Order {
  id: number;
  gigId: number;
  gigTitle: string;
  packageName: string;
  price: number;
  status: "In Progress" | "Completed" | "Cancelled";
  orderedAt: string;
  completedAt?: string;
  buyer: { id: number; firstName: string; lastName?: string };
  seller: { id: number; firstName: string; lastName?: string };
  reviewed: boolean;
  contractId?: number | null;
}

export type ContractStatus = "Active" | "Paid" | "Delivered" | "Completed" | "Cancelled";

export interface Payment {
  id: number;
  amount: number;
  method: string;
  reference?: string;
  status: string;
  paidAt?: string;
}

export interface Contract {
  id: number;
  type: "job" | "gig";
  clientId: number;
  freelancerId: number;
  client: { id: number; firstName: string; lastName?: string; headline?: string };
  freelancer: { id: number; firstName: string; lastName?: string; headline?: string };
  title: string;
  amount: number;
  proposalId?: number | null;
  orderId?: number | null;
  status: ContractStatus;
  terms?: string;
  deliveryNote?: string;
  createdAt: string;
  startedAt?: string;
  deliveredAt?: string;
  completedAt?: string;
  payment: Payment | null;
}

export interface Conversation {
  userId: number;
  firstName: string;
  lastName?: string;
  lastMessage?: string;
  lastAt?: string;
  unread: number;
}

export interface Message {
  id: number;
  senderId: number;
  recipientId: number;
  firstName: string;
  lastName?: string;
  body: string;
  createdAt: string;
}

export interface PublicUser {
  id: number;
  firstName: string;
  lastName?: string;
  role?: string;
  headline?: string;
  bio?: string;
  skills: string[];
  github?: string;
  linkedin?: string;
  twitter?: string;
  portfolio?: string;
  companyName?: string;
  companyCountry?: string;
  isVerified: boolean;
  rating: number | null;
  reviewCount: number;
}

export type SubscriptionStatus = "ACTIVE" | "PENDING" | "EXPIRED" | "CANCELLED" | "FAILED" | "NONE";

export interface Subscription {
  id: number;
  plan: "FREE" | "PRO";
  status: Exclude<SubscriptionStatus, "NONE">;
  provider: string;
  providerSubscriptionId?: string;
  providerTransactionId?: string;
  amount: number;
  currency: string;
  startedAt?: string;
  expiresAt?: string;
  cancelledAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface SubscriptionStatusResponse {
  plan: string;
  status: SubscriptionStatus;
  isActive: boolean;
  expiresAt?: string;
}

export interface Verification {
  id: number;
  userId: number;
  companyName: string;
  companyWebsite?: string;
  companyEmail: string;
  companyPhone?: string;
  companyCountry: string;
  companyDescription: string;
  businessInfo?: string;
  status: "pending" | "approved" | "rejected";
  adminNotes?: string;
  reviewedBy?: number;
  submittedAt: string;
  reviewedAt?: string;
}

export interface AdminVerification extends Verification {
  firstName?: string;
  lastName?: string;
  userEmail?: string;
}

export interface AdminStats {
  totalUsers: number;
  totalJobs: number;
  totalApplications: number;
  totalContracts: number;
  totalGigs: number;
  verifiedEmployers: number;
  pendingVerifications: number;
  suspendedUsers: number;
  usersByRole: Record<string, number>;
}
