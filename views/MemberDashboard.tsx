
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { User, Contribution, PaymentStatus, Announcement, GroupConfig, Tab, ActionPlan, HubPayment, PaymentGateway } from '../types';
import { generateFinancialAdvice } from '../geminiService';
import CountdownTimer from '../components/CountdownTimer';
import { useLanguage } from '../LanguageContext';

interface MemberDashboardProps {
  config: GroupConfig;
  user: User;
  contributions: Contribution[];
  announcements: Announcement[];
  actionPlans: ActionPlan[];
  hubPayments: HubPayment[];
  onHubSubmit: (payment: Omit<HubPayment, 'id' | 'userId' | 'userName' | 'status' | 'timestamp'> & { status: PaymentStatus }) => void;
  onUpdatePayoutDates: (userId: string, dates: string[]) => void;
  activeTab: Tab;
}

const MemberDashboard: React.FC<MemberDashboardProps> = ({ config, user, contributions, announcements, actionPlans, hubPayments, onHubSubmit, onUpdatePayoutDates, activeTab }) => {
  const { t, language, setLanguage } = useLanguage();
  const [advice, setAdvice] = useState<string | null>(null);
  const [loadingAdvice, setLoadingAdvice] = useState(false);

  // Dates Selection State
  const [selectedSeasonDates, setSelectedSeasonDates] = useState<string[]>(user.payoutDates || []);

  // Contribution Hub State
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMessage, setProcessingMessage] = useState('');
  
  // Manual Payment State
  const [manualFile, setManualFile] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadAdvice = async () => {
      setLoadingAdvice(true);
      const res = await generateFinancialAdvice(user.name, config.contributionAmount, language);
      setAdvice(res);
      setLoadingAdvice(false);
    };
    loadAdvice();
  }, [user.name, config.contributionAmount, language]);

  // Derived Values
  const activePayoutTarget = useMemo(() => {
    if (!user.payoutDates || user.payoutDates.length === 0) return null;
    const now = Date.now();
    const futureDates = user.payoutDates
      .map(d => new Date(d).getTime())
      .filter(t => t > now + 24 * 60 * 60 * 1000) 
      .sort((a, b) => a - b);
    return futureDates.length > 0 ? new Date(futureDates[0]).toISOString() : null;
  }, [user.payoutDates]);

  const personalContributions = contributions.filter(c => c.userId === user.id);
  const totalSaved = personalContributions.filter(c => c.status === PaymentStatus.VERIFIED).reduce((acc, c) => acc + c.amount, 0);

  const calculatedTotal = useMemo(() => selectedDays.length * config.dailyRate, [selectedDays, config.dailyRate]);
  const canPay = selectedDays.length > 0;

  const calendarData = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysCount = new Date(year, month + 1, 0).getDate();
    const days = [];
    for (let i = 0; i < firstDayOfMonth; i++) days.push(null);
    for (let i = 1; i <= daysCount; i++) {
      days.push(new Date(year, month, i).toISOString().split('T')[0]);
    }
    return days;
  }, [viewDate]);

  const changeMonth = (offset: number) => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + offset, 1));
  };

  const handleToggleDay = (day: string) => {
    setSelectedDays(prev => 
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const handleToggleSeasonDate = (day: string) => {
    if (user.datesLocked) return;
    setSelectedSeasonDates(prev => {
      if (prev.includes(day)) return prev.filter(d => d !== day);
      if (prev.length >= 3) return prev;
      return [...prev, day];
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setManualFile(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const initiatePayment = (gateway: PaymentGateway) => {
    if (selectedDays.length === 0) return;
    if (gateway === 'MANUAL' && !manualFile) return;

    setIsProcessing(true);
    setProcessingMessage(gateway === 'MOMO' ? t('momoPrompt') : gateway === 'PAYPAL' ? t('paypalRedirect') : t('processingPayment'));

    setTimeout(() => {
      const txId = gateway === 'MANUAL' ? `MAN-${Math.random().toString(36).substring(2, 10).toUpperCase()}` : Math.random().toString(36).substring(2, 10).toUpperCase();

      onHubSubmit({
        selectedDays,
        amount: selectedDays.length * config.dailyRate,
        gateway,
        transactionId: txId,
        status: gateway === 'MANUAL' ? PaymentStatus.PENDING : PaymentStatus.VERIFIED,
        receiptUrl: gateway === 'MANUAL' ? manualFile! : undefined
      });

      setIsProcessing(false);
      setSelectedDays([]);
      setManualFile(null);
    }, 2000);
  };

  const renderHome = () => (
    <div className="space-y-12 animate-fadeIn pb-12">
      <section className="bg-emerald-700 rounded-[40px] p-12 text-white relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-600 rounded-full -mr-32 -mt-32 opacity-40"></div>
        <div className="relative z-10">
          <header className="flex justify-between items-start mb-12">
            <div className="max-w-xl">
              <h1 className="text-5xl font-black tracking-tighter mb-4">{config.name}</h1>
              <p className="text-xl text-emerald-100 font-medium leading-relaxed opacity-90">{t('welcomeBack')}, {user.name}.</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md text-white text-[10px] font-black px-4 py-2 rounded-xl uppercase tracking-widest border border-white/20">
               {t('payoutPriority')} #{user.payoutRank}
            </div>
          </header>
          <div className="flex flex-wrap gap-10 border-t border-white/10 pt-10">
             <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-300 mb-2">{t('totalSavings')}</p>
                <p className="text-3xl font-black">{totalSaved.toLocaleString()} {config.currency}</p>
             </div>
             <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-300 mb-2">{t('remainingDays')}</p>
                <p className="text-3xl font-black">90 Days</p>
             </div>
          </div>
        </div>
      </section>

      <section className="bg-white rounded-[48px] shadow-xl shadow-slate-200/50 border border-slate-50 p-12 text-center relative overflow-hidden group">
        <div className="relative z-10">
          <div className="w-16 h-16 bg-amber-500 rounded-[24px] mx-auto mb-6 flex items-center justify-center text-white shadow-xl rotate-3">
             <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-2">{t('nextSeasonPayout')}</h2>
          {activePayoutTarget ? <CountdownTimer targetDate={activePayoutTarget} /> : <div className="p-8 text-slate-400 font-bold italic">{t('noDatesSelected')}</div>}
        </div>
      </section>

      {advice && (
        <section className="bg-indigo-600 rounded-[40px] p-10 text-white shadow-xl">
           <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-200 mb-4">Daily AI Financial Tip</p>
           <p className="text-xl font-medium leading-relaxed italic">"{advice}"</p>
        </section>
      )}

      {/* Company Info Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <section className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-xl space-y-4">
           <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center text-2xl">🌱</div>
           <h3 className="text-xl font-black text-slate-900">{t('missionTitle')}</h3>
           <p className="text-slate-500 font-medium leading-relaxed text-sm">{t('missionText')}</p>
        </section>
        <section className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-xl space-y-4">
           <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center text-2xl">👁️</div>
           <h3 className="text-xl font-black text-slate-900">{t('visionTitle')}</h3>
           <p className="text-slate-500 font-medium leading-relaxed text-sm">{t('visionText')}</p>
        </section>
        <section className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-xl space-y-4">
           <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center text-2xl">🏁</div>
           <h3 className="text-xl font-black text-slate-900">{t('goalsTitle')}</h3>
           <p className="text-slate-500 font-medium leading-relaxed text-sm">{t('goal1Text')}</p>
        </section>
      </div>
    </div>
  );

  const renderHistory = () => (
    <div className="space-y-8 animate-fadeIn pb-12">
      <header>
        <h1 className="text-4xl font-black text-slate-900 tracking-tighter mb-2">{t('tabContributions')}</h1>
        <p className="text-slate-500 font-medium">Detailed log of your verified saving contributions.</p>
      </header>
      <div className="grid grid-cols-1 gap-4">
        {personalContributions.length === 0 ? (
          <div className="bg-white p-12 rounded-[32px] border border-dashed border-slate-200 text-center text-slate-400 italic">No contribution history found.</div>
        ) : (
          personalContributions.map(c => (
            <div key={c.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex justify-between items-center group hover:border-emerald-200 transition-colors">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black ${c.status === PaymentStatus.VERIFIED ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                  {c.status === PaymentStatus.VERIFIED ? '✓' : '!'}
                </div>
                <div>
                  <p className="text-lg font-black text-slate-900">{c.amount.toLocaleString()} {config.currency}</p>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">{new Date(c.date).toLocaleDateString()}</p>
                </div>
              </div>
              <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${c.status === PaymentStatus.VERIFIED ? 'bg-emerald-600 text-white' : 'bg-amber-400 text-amber-900'}`}>{c.status}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );

  const renderUpdates = () => (
    <div className="space-y-8 animate-fadeIn pb-12">
      <header>
        <h1 className="text-4xl font-black text-slate-900 tracking-tighter mb-2">{t('tabUpdates')}</h1>
        <p className="text-slate-500 font-medium">Important community broadcasts and meeting notes.</p>
      </header>
      <div className="space-y-6">
        {announcements.map(ann => (
          <div key={ann.id} className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 rounded-full -mr-12 -mt-12 opacity-50 group-hover:scale-150 transition-transform duration-700"></div>
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-black text-slate-900 leading-tight">{ann.title}</h3>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{new Date(ann.timestamp).toLocaleDateString()}</span>
              </div>
              <p className="text-slate-600 leading-relaxed font-medium">{ann.message}</p>
              <div className="mt-6 pt-6 border-t border-slate-50 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center text-white text-[10px] font-black">{ann.sender.charAt(0)}</div>
                <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">{ann.sender}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderActionPlan = () => (
    <div className="space-y-12 animate-fadeIn pb-12">
      <header>
        <h1 className="text-4xl font-black text-slate-900 tracking-tighter mb-2">{t('tabActionPlan')}</h1>
        <p className="text-slate-500 font-medium">Our community's strategic goals and upcoming tasks.</p>
      </header>
      
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { title: t('goal1Title'), desc: t('goal1Text'), icon: '🎯' },
          { title: t('goal2Title'), desc: t('goal2Text'), icon: '🤝' },
          { title: t('goal3Title'), desc: t('goal3Text'), icon: '🛡️' }
        ].map((goal, i) => (
          <div key={i} className="bg-emerald-50 p-8 rounded-[32px] border border-emerald-100">
            <div className="text-3xl mb-4">{goal.icon}</div>
            <h4 className="text-sm font-black text-emerald-800 uppercase tracking-widest mb-2">{goal.title}</h4>
            <p className="text-xs text-emerald-600 font-medium leading-relaxed">{goal.desc}</p>
          </div>
        ))}
      </section>

      <section className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-xl">
        <h2 className="text-2xl font-black text-slate-900 mb-8">Community Tasks</h2>
        <div className="space-y-6">
          {actionPlans.map(plan => (
            <div key={plan.id} className={`p-6 rounded-3xl border-2 flex items-center justify-between ${plan.status === 'COMPLETED' ? 'border-emerald-100 bg-emerald-50' : 'border-slate-50 bg-white shadow-sm'}`}>
              <div className="flex items-center gap-6">
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${plan.status === 'COMPLETED' ? 'bg-emerald-500 border-emerald-500' : 'border-slate-200'}`}>
                  {plan.status === 'COMPLETED' && <span className="text-white text-[10px]">✓</span>}
                </div>
                <div>
                  <h4 className={`font-black ${plan.status === 'COMPLETED' ? 'text-emerald-700 line-through' : 'text-slate-900'}`}>{plan.title}</h4>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">{new Date(plan.targetDate).toLocaleDateString()}</p>
                </div>
              </div>
              <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${plan.status === 'COMPLETED' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500'}`}>{plan.status}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-12 animate-fadeIn pb-12 max-w-2xl">
      <header>
        <h1 className="text-4xl font-black text-slate-900 tracking-tighter mb-2">{t('tabSettings')}</h1>
        <p className="text-slate-500 font-medium">Manage your profile and platform preferences.</p>
      </header>
      <section className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-xl">
        <div className="flex items-center gap-6 mb-12">
          <div className="w-24 h-24 rounded-[32px] bg-emerald-600 text-white text-3xl font-black flex items-center justify-center shadow-2xl">
            {user.name.charAt(0)}
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-900">{user.name}</h3>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">{user.phone}</p>
          </div>
        </div>
        <div className="space-y-8">
          <div className="flex justify-between items-center p-6 bg-slate-50 rounded-2xl">
            <span className="text-xs font-black text-slate-900 uppercase tracking-widest">Platform Language</span>
            <div className="flex gap-2">
              {['en', 'fr', 'rw'].map(lang => (
                <button key={lang} onClick={() => setLanguage(lang as any)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${language === lang ? 'bg-slate-900 text-white' : 'bg-white text-slate-400 hover:text-emerald-600'}`}>{lang}</button>
              ))}
            </div>
          </div>
          <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-100">
             <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-2">Membership Status</p>
             <p className="text-sm font-bold text-emerald-800">Active member since January 2026. You are currently at priority level #{user.payoutRank} for this season's rotation.</p>
          </div>
        </div>
      </section>
    </div>
  );

  const renderDatesTab = () => (
    <div className="space-y-12 animate-fadeIn max-w-5xl mx-auto pb-12">
      <header>
        <h1 className="text-4xl font-black text-slate-900 tracking-tighter mb-2">{t('seasonTitle')}</h1>
        <p className="text-slate-500 font-medium">{t('payoutDateSelectInfo')}</p>
      </header>
      <section className="bg-white rounded-[40px] p-10 border border-slate-100 shadow-xl">
        <div className="flex justify-between items-center mb-10">
          <h2 className="text-2xl font-black text-slate-900">{t('selectPayoutDates')}</h2>
          <div className="flex gap-2">
            {[1, 2, 3].map(i => (
              <div key={i} className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${selectedSeasonDates.length >= i ? 'bg-amber-100 text-amber-700 border-2 border-amber-300' : 'bg-slate-50 text-slate-300 border-2 border-slate-100'}`}>
                {i}
              </div>
            ))}
          </div>
        </div>
        <div className="bg-slate-50 p-8 rounded-[32px] border border-slate-100 mb-10">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-4">
              <button onClick={() => changeMonth(-1)} className="p-2 bg-white rounded-xl shadow-sm border border-slate-100 hover:text-emerald-600"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg></button>
              <label className="text-sm font-black uppercase tracking-widest">{viewDate.toLocaleString(language, { month: 'long', year: 'numeric' })}</label>
              <button onClick={() => changeMonth(1)} className="p-2 bg-white rounded-xl shadow-sm border border-slate-100 hover:text-emerald-600"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg></button>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-[9px] font-black uppercase text-slate-400">{day}</div>
            ))}
            {calendarData.map((day, idx) => {
              if (!day) return <div key={idx} className="h-12"></div>;
              const isSelected = selectedSeasonDates.includes(day);
              const isPast = new Date(day).getTime() < Date.now();
              return (
                <button 
                  key={day} 
                  disabled={user.datesLocked || (isPast && !isSelected)}
                  onClick={() => handleToggleSeasonDate(day)}
                  className={`h-12 flex items-center justify-center rounded-xl text-xs font-black transition-all ${
                    isSelected ? 'bg-amber-500 text-white shadow-lg ring-2 ring-amber-600' : isPast ? 'bg-slate-100 text-slate-300 cursor-not-allowed' : 'bg-white text-slate-400 border border-slate-100 hover:border-amber-200 hover:text-amber-600'
                  }`}
                >
                  {new Date(day).getDate()}
                </button>
              );
            })}
          </div>
        </div>
        <button onClick={() => onUpdatePayoutDates(user.id, selectedSeasonDates)} disabled={user.datesLocked || selectedSeasonDates.length !== 3} className={`w-full py-5 rounded-[24px] font-black text-lg transition-all shadow-xl active:scale-95 ${user.datesLocked ? 'bg-emerald-50 text-emerald-600 cursor-not-allowed border-2 border-emerald-100' : selectedSeasonDates.length === 3 ? 'bg-slate-900 text-white hover:bg-slate-800' : 'bg-slate-100 text-slate-300 cursor-not-allowed'}`}>
          {user.datesLocked ? t('datesLockedInfo') : t('savePayoutDates')}
        </button>
      </section>
    </div>
  );

  const renderContributionHub = () => (
    <div className="space-y-12 animate-fadeIn max-w-5xl mx-auto pb-12 relative">
      {isProcessing && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-6 text-center">
          <div className="bg-white p-12 rounded-[40px] shadow-2xl max-w-sm w-full space-y-8 animate-scaleIn">
             <div className="w-20 h-20 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto animate-spin"></div>
             <div><h3 className="text-2xl font-black text-slate-900 mb-2">{t('processingPayment')}</h3><p className="text-slate-500 font-medium leading-relaxed">{processingMessage}</p></div>
          </div>
        </div>
      )}
      <header>
        <h1 className="text-4xl font-black text-slate-900 tracking-tighter mb-2">{t('tabContributionHub')}</h1>
        <p className="text-slate-500 font-medium">Select your saving days and choose a payment method.</p>
      </header>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <section className="bg-white rounded-[40px] p-10 border border-slate-100 shadow-xl">
            <h2 className="text-2xl font-black text-slate-900 mb-8">{t('submitSavings')}</h2>
            <div className="space-y-10">
              <div className="bg-slate-50 p-8 rounded-[32px] border border-slate-100">
                <div className="flex justify-between items-center mb-8">
                  <div className="flex items-center gap-4">
                    <button type="button" onClick={() => changeMonth(-1)} className="p-2 bg-white rounded-xl shadow-sm hover:text-emerald-600 border border-slate-100"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg></button>
                    <label className="text-[12px] font-black text-slate-900 uppercase tracking-widest">{viewDate.toLocaleString(language, { month: 'long', year: 'numeric' })}</label>
                    <button type="button" onClick={() => changeMonth(1)} className="p-2 bg-white rounded-xl shadow-sm hover:text-emerald-600 border border-slate-100"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg></button>
                  </div>
                </div>
                <div className="grid grid-cols-7 gap-2">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="text-center text-[9px] font-black uppercase text-slate-400">{day}</div>
                  ))}
                  {calendarData.map((day, idx) => {
                    if (!day) return <div key={idx} className="h-12"></div>;
                    const isSelected = selectedDays.includes(day);
                    return <button key={day} type="button" onClick={() => handleToggleDay(day)} className={`h-12 flex items-center justify-center rounded-xl text-xs font-black transition-all ${isSelected ? 'bg-emerald-600 text-white shadow-lg' : 'bg-white text-slate-400 border border-slate-100 hover:border-emerald-200'}`}>{new Date(day).getDate()}</button>;
                  })}
                </div>
              </div>
              <div className="bg-emerald-50 border border-emerald-100 p-8 rounded-[32px] flex flex-col justify-center">
                <label className="text-[10px] font-black text-emerald-600 uppercase tracking-widest block mb-2">{t('totalAmountPaid')}</label>
                <div className="flex items-baseline gap-2"><span className="text-4xl font-black text-emerald-700">{calculatedTotal.toLocaleString()}</span><span className="text-sm font-black text-emerald-500 uppercase">{config.currency}</span></div>
              </div>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button type="button" disabled={!canPay || isProcessing} onClick={() => initiatePayment('MOMO')} className={`flex items-center justify-center gap-4 py-5 rounded-[28px] font-black transition-all shadow-lg active:scale-95 ${canPay ? 'bg-[#FFCC00] text-[#331E11]' : 'bg-slate-100 text-slate-300'}`}>MTN MoMo</button>
                  <button type="button" disabled={!canPay || isProcessing} onClick={() => initiatePayment('PAYPAL')} className={`flex items-center justify-center gap-4 py-5 rounded-[28px] font-black transition-all shadow-lg active:scale-95 ${canPay ? 'bg-[#003087] text-white' : 'bg-slate-100 text-slate-300'}`}>PayPal</button>
                </div>
                <div className="pt-8 border-t border-slate-100">
                  <h3 className="text-lg font-black text-slate-900 mb-6">{t('manualPayment')}</h3>
                  <div className="space-y-6">
                    <div onClick={() => fileInputRef.current?.click()} className={`relative border-2 border-dashed rounded-[32px] p-10 text-center cursor-pointer transition-all ${manualFile ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300'}`}>
                      {manualFile ? <div className="space-y-4"><img src={manualFile} alt="Preview" className="h-32 mx-auto rounded-xl shadow-md border-2 border-white" /><p className="text-xs font-black text-emerald-600 uppercase tracking-widest">Image Loaded</p></div> : <div className="space-y-4"><div className="w-12 h-12 bg-white rounded-2xl mx-auto flex items-center justify-center text-slate-400 shadow-sm"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg></div><p className="text-sm font-bold text-slate-500">{t('selectFile')}</p></div>}
                      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                    </div>
                    <button type="button" disabled={!canPay || !manualFile || isProcessing} onClick={() => initiatePayment('MANUAL')} className={`w-full py-5 rounded-[28px] font-black transition-all shadow-xl active:scale-95 ${canPay && manualFile ? 'bg-slate-900 text-white hover:bg-slate-800' : 'bg-slate-100 text-slate-300'}`}>{t('submitManualProof')}</button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );

  switch(activeTab) {
    case Tab.CONTRIBUTION_HUB: return renderContributionHub();
    case Tab.DATES: return renderDatesTab();
    case Tab.CONTRIBUTIONS: return renderHistory();
    case Tab.UPDATES: return renderUpdates();
    case Tab.ACTION_PLAN: return renderActionPlan();
    case Tab.SETTINGS: return renderSettings();
    case Tab.HOME:
    default: return renderHome();
  }
};

export default MemberDashboard;
