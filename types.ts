
export enum UserRole {
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER'
}

export type Language = 'en' | 'fr' | 'rw';

export enum Tab {
  HOME = 'HOME',
  CONTRIBUTIONS = 'CONTRIBUTIONS',
  MEMBERS = 'MEMBERS',
  SETTINGS = 'SETTINGS',
  UPDATES = 'UPDATES',
  ACTION_PLAN = 'ACTION_PLAN',
  CONTRIBUTION_HUB = 'CONTRIBUTION_HUB',
  DATES = 'DATES'
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  FAILED = 'FAILED',
  MISMATCH = 'MISMATCH',
  REJECTED = 'REJECTED'
}

export interface User {
  id: string;
  name: string;
  phone: string;
  role: UserRole;
  payoutRank?: number; // Order in the rotation
  payoutDate?: string; // Legacy field
  payoutDates?: string[]; // 3 selected dates for the season
  datesLocked?: boolean;
}

export interface Contribution {
  id: string;
  userId: string;
  amount: number;
  date: string;
  status: PaymentStatus;
  cycleNumber: number;
}

export type PaymentGateway = 'MOMO' | 'PAYPAL' | 'MANUAL' | 'NONE';

export interface HubPayment {
  id: string;
  userId: string;
  userName: string;
  selectedDays: string[]; // ISO strings of selected dates
  amount: number;
  receiptUrl?: string; // Optional now as we use automated gateways
  gateway: PaymentGateway;
  transactionId?: string;
  collectionDate?: string; // Now optional: ISO string for the requested payout date
  status: PaymentStatus;
  timestamp: string;
  isLocked?: boolean; // New: prevent modification once verified
  changeRequested?: boolean; // New: flag for admin attention
}

export interface GroupConfig {
  name: string;
  contributionAmount: number; // Weekly
  dailyRate: number; // New: Daily contribution rate
  currency: string;
  interval: 'WEEKLY' | 'MONTHLY';
  startDate: string;
  totalMembers: number;
}

export interface Announcement {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  sender: string;
  targetUserId?: string; // New: for targeted messaging
}

export interface ActionPlan {
  id: string;
  title: string;
  description: string;
  targetDate: string;
  status: 'PLANNED' | 'COMPLETED';
}
