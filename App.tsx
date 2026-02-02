
import React, { useState } from 'react';
import Layout from './components/Layout';
import AdminDashboard from './views/AdminDashboard';
import MemberDashboard from './views/MemberDashboard';
import { User, UserRole, Contribution, PaymentStatus, Announcement, GroupConfig, Tab, ActionPlan, HubPayment } from './types';
import { INITIAL_GROUP_CONFIG, MOCK_USERS, MOCK_CONTRIBUTIONS, MOCK_ANNOUNCEMENTS, MOCK_HUB_PAYMENTS } from './constants';
import { useLanguage } from './LanguageContext';

const App: React.FC = () => {
  const { t } = useLanguage();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [contributions, setContributions] = useState<Contribution[]>(MOCK_CONTRIBUTIONS);
  const [announcements, setAnnouncements] = useState<Announcement[]>(MOCK_ANNOUNCEMENTS);
  const [actionPlans, setActionPlans] = useState<ActionPlan[]>([
    { id: 'ap1', title: 'Monthly Collection', description: 'Collection of contributions for Jan rotation.', targetDate: '2026-01-30T10:00:00Z', status: 'PLANNED' },
    { id: 'ap2', title: 'Security Meeting', description: 'Reviewing group digital security.', targetDate: '2026-01-12T16:00:00Z', status: 'PLANNED' }
  ]);
  const [hubPayments, setHubPayments] = useState<HubPayment[]>(MOCK_HUB_PAYMENTS.map(p => ({ ...p, isLocked: true, gateway: 'NONE' })));
  const [config, setConfig] = useState<GroupConfig>(INITIAL_GROUP_CONFIG);
  const [activeTab, setActiveTab] = useState<Tab>(Tab.HOME);

  if (!currentUser) {
    return (
      <Layout userRole={null} onLogout={() => {}} activeTab={activeTab} setActiveTab={setActiveTab} actionPlans={[]} hubPayments={[]} announcements={[]}>
        <div className="flex-1 flex flex-col items-center justify-center p-6 animate-fadeIn">
          <div className="bg-white p-12 rounded-[40px] shadow-2xl border border-slate-100 max-w-md w-full text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 rounded-full -mr-16 -mt-16 opacity-50"></div>
            {/* Themed Logo Placeholder */}
            <div className="w-24 h-24 bg-amber-400 border-4 border-amber-600 rounded-[32px] mx-auto mb-10 flex flex-col items-center justify-center text-amber-900 shadow-2xl rotate-6 hover:rotate-0 transition-transform duration-500">
               <svg className="w-10 h-10 mb-1" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 3L4 9V21H20V9L12 3Z" />
               </svg>
               <svg className="w-6 h-6" viewBox="0 0 24 24" fill="white">
                  <path d="M12 11C11.4477 11 11 11.4477 11 12C11 12.5523 11.4477 13 12 13C12.5523 13 13 12.5523 13 12C13 11.4477 12.5523 11 12 11ZM9 12C9 10.3431 10.3431 9 12 9C13.6569 9 15 10.3431 15 12C15 12.7956 14.6839 13.5174 14.1716 14.0503L15 18H13L12.5 15.5H11.5L11 18H9L9.82843 14.0503C9.31607 13.5174 9 12.7956 9 12Z" />
               </svg>
            </div>
            <h1 className="text-3xl font-black text-slate-900 mb-4 tracking-tighter uppercase leading-tight">{t('appName')}</h1>
            <p className="text-slate-500 mb-10 font-medium leading-relaxed">{t('loginSubtitle')}</p>
            <div className="space-y-4">
              <button
                onClick={() => { setCurrentUser(MOCK_USERS[0]); setActiveTab(Tab.HOME); }}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black py-5 rounded-2xl transition-all shadow-xl hover:-translate-y-1 active:scale-95"
              >
                {t('adminPortalBtn')}
              </button>
              <button
                onClick={() => { setCurrentUser(MOCK_USERS[1]); setActiveTab(Tab.HOME); }}
                className="w-full bg-emerald-700 hover:bg-emerald-600 text-white font-black py-5 rounded-2xl transition-all shadow-xl hover:-translate-y-1 active:scale-95"
              >
                {t('memberPortalBtn')}
              </button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  const handleUpdatePayoutDates = (userId: string, dates: string[]) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, payoutDates: dates, datesLocked: true } : u));
    if (currentUser.id === userId) {
      setCurrentUser(prev => prev ? { ...prev, payoutDates: dates, datesLocked: true } : null);
    }
  };

  const handleUnlockDates = (userId: string) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, datesLocked: false } : u));
  };

  const handleVerifyPayment = (id: string) => {
    setContributions(prev => prev.map(c => c.id === id ? { ...c, status: PaymentStatus.VERIFIED } : c));
  };

  const handleAddAnnouncement = (title: string, message: string, targetUserId?: string) => {
    const newAnn: Announcement = {
      id: Math.random().toString(),
      title,
      message,
      timestamp: new Date().toISOString(),
      sender: currentUser.name,
      targetUserId
    };
    setAnnouncements(prev => [newAnn, ...prev]);
  };

  const handleAddActionPlan = (plan: Omit<ActionPlan, 'id' | 'status'>) => {
    const newPlan: ActionPlan = {
      ...plan,
      id: Math.random().toString(),
      status: 'PLANNED'
    };
    setActionPlans(prev => [...prev, newPlan]);
  };

  const handleUpdateActionStatus = (id: string, status: 'PLANNED' | 'COMPLETED') => {
    setActionPlans(prev => prev.map(ap => ap.id === id ? { ...ap, status } : ap));
  };

  const handleDeleteActionPlan = (id: string) => {
    setActionPlans(prev => prev.filter(ap => ap.id !== id));
  };

  const handleHubSubmit = (payment: Omit<HubPayment, 'id' | 'userId' | 'userName' | 'status' | 'timestamp'> & { status: PaymentStatus }) => {
    const newPayment: HubPayment = {
      ...payment,
      id: Math.random().toString(),
      userId: currentUser.id,
      userName: currentUser.name,
      timestamp: new Date().toISOString(),
      isLocked: payment.status === PaymentStatus.VERIFIED
    };

    setHubPayments(prev => [newPayment, ...prev]);

    if (newPayment.status === PaymentStatus.VERIFIED) {
      const newContribution: Contribution = {
        id: Math.random().toString(),
        userId: currentUser.id,
        amount: newPayment.amount,
        date: new Date().toISOString(),
        status: PaymentStatus.VERIFIED,
        cycleNumber: 1
      };
      setContributions(prev => [newContribution, ...prev]);
    }
  };

  const handleHubVerify = (id: string, isApproved: boolean) => {
    setHubPayments(prev => prev.map(p => {
      if (p.id !== id) return p;
      const expectedAmount = p.selectedDays.length * config.dailyRate;
      const status = isApproved 
        ? (p.amount === expectedAmount ? PaymentStatus.VERIFIED : PaymentStatus.MISMATCH)
        : PaymentStatus.REJECTED;
      return { ...p, status, isLocked: isApproved };
    }));
  };

  const handleUnlockCollection = (id: string) => {
    setHubPayments(prev => prev.map(p => p.id === id ? { ...p, isLocked: false } : p));
  };

  const handleUpdateConfig = (newConfig: Partial<GroupConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  };

  return (
    <Layout 
      userRole={currentUser.role} 
      onLogout={() => setCurrentUser(null)} 
      userName={currentUser.name}
      userId={currentUser.id}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      actionPlans={actionPlans}
      hubPayments={hubPayments}
      announcements={announcements}
    >
      {currentUser.role === UserRole.ADMIN ? (
        <AdminDashboard
          config={config}
          onUpdateConfig={handleUpdateConfig}
          user={currentUser}
          users={users}
          contributions={contributions}
          announcements={announcements}
          actionPlans={actionPlans}
          hubPayments={hubPayments}
          onVerifyPayment={handleVerifyPayment}
          onAddAnnouncement={handleAddAnnouncement}
          onAddActionPlan={handleAddActionPlan}
          onUpdateActionStatus={handleUpdateActionStatus}
          onDeleteActionPlan={handleDeleteActionPlan}
          onHubVerify={handleHubVerify}
          onUnlockCollection={handleUnlockCollection}
          onUnlockDates={handleUnlockDates}
          activeTab={activeTab}
        />
      ) : (
        <MemberDashboard
          config={config}
          user={currentUser}
          contributions={contributions}
          announcements={announcements}
          activeTab={activeTab}
          actionPlans={actionPlans}
          hubPayments={hubPayments}
          onHubSubmit={handleHubSubmit}
          onUpdatePayoutDates={handleUpdatePayoutDates}
        />
      )}
    </Layout>
  );
};

export default App;
