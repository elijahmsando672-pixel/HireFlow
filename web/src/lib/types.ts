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
  headline?: string;
  bio?: string;
  skills: string[];
  github?: string;
  linkedin?: string;
  twitter?: string;
  portfolio?: string;
  rating: number | null;
  reviewCount: number;
}
