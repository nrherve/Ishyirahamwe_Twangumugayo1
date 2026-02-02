
import { User, UserRole, PaymentStatus, Contribution, GroupConfig, Announcement, HubPayment } from './types';

export const INITIAL_GROUP_CONFIG: GroupConfig = {
  name: "Ishyirahamwe Twangumugayo",
  contributionAmount: 5000,
  dailyRate: 1000,
  currency: "RWF",
  interval: 'WEEKLY',
  startDate: "2026-01-01T08:00:00Z",
  totalMembers: 5
};

export const MOCK_USERS: User[] = [
  { id: '1', name: 'Jean de Dieu Umubyeyi', phone: '+250788123456', role: UserRole.ADMIN, payoutRank: 1, payoutDate: "2026-01-08T18:00:00Z" },
  { id: '2', name: 'Alice Mutoni', phone: '+250788654321', role: UserRole.MEMBER, payoutRank: 2, payoutDate: "2026-01-15T18:00:00Z" },
  { id: '3', name: 'Kevine Uwera', phone: '+250788777888', role: UserRole.MEMBER, payoutRank: 3, payoutDate: "2026-01-22T18:00:00Z" },
  { id: '4', name: 'Emmanuel Gatera', phone: '+250788999000', role: UserRole.MEMBER, payoutRank: 4, payoutDate: "2026-01-29T18:00:00Z" },
  { id: '5', name: 'Sonia Umurerwa', phone: '+250788111222', role: UserRole.MEMBER, payoutRank: 5, payoutDate: "2026-02-05T18:00:00Z" },
];

export const MOCK_CONTRIBUTIONS: Contribution[] = [
  { id: 'c1', userId: '1', amount: 5000, date: '2026-01-02T10:00:00Z', status: PaymentStatus.VERIFIED, cycleNumber: 1 },
  { id: 'c2', userId: '2', amount: 5000, date: '2026-01-02T11:30:00Z', status: PaymentStatus.VERIFIED, cycleNumber: 1 },
  { id: 'c3', userId: '3', amount: 5000, date: '2026-01-03T09:15:00Z', status: PaymentStatus.PENDING, cycleNumber: 1 },
];

export const MOCK_ANNOUNCEMENTS: Announcement[] = [
  { id: 'a1', title: 'Next Meeting', message: 'Hi team, our next physical meeting will be at Kimironko Market, 4 PM Sunday.', timestamp: '2026-01-02T15:00:00Z', sender: 'Admin' },
  { id: 'a2', title: 'Payment Reminder', message: 'Please ensure all payments for Week 1 are sent by Friday evening.', timestamp: '2026-01-03T08:00:00Z', sender: 'Admin' },
];

export const MOCK_HUB_PAYMENTS: HubPayment[] = [
  {
    id: 'hp1',
    userId: '2',
    userName: 'Alice Mutoni',
    selectedDays: ['2026-01-01', '2026-01-02', '2026-01-03'],
    amount: 3000,
    receiptUrl: 'https://images.unsplash.com/photo-1554224155-1696413565d3?auto=format&fit=crop&q=80&w=400',
    gateway: 'NONE',
    collectionDate: '2026-01-15T18:00:00Z',
    status: PaymentStatus.PENDING,
    timestamp: new Date().toISOString()
  }
];
