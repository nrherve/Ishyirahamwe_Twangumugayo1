
import React, { useState, useMemo } from 'react';
import { UserRole, Language, Tab, ActionPlan, HubPayment, Announcement } from '../types';
import { useLanguage } from '../LanguageContext';

interface LayoutProps {
  children: React.ReactNode;
  userRole: UserRole | null;
  onLogout: () => void;
  userName?: string;
  userId?: string; // New: To identify the current user for targeted alerts
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  actionPlans: ActionPlan[];
  hubPayments: HubPayment[];
  announcements: Announcement[];
}

const LogoIcon = () => (
  <div className="relative w-8 h-8 flex items-center justify-center bg-amber-400 rounded-full border-2 border-amber-600 shadow-md">
    <svg className="w-5 h-5 text-amber-900" viewBox="0 0 24 24" fill="currentColor">
       <path d="M12 3L4 9V21H20V9L12 3Z" fillOpacity="0.8" />
       <path d="M12 11C11.4477 11 11 11.4477 11 12C11 12.5523 11.4477 13 12 13C12.5523 13 13 12.5523 13 12C13 11.4477 12.5523 11 12 11ZM9 12C9 10.3431 10.3431 9 12 9C13.6569 9 15 10.3431 15 12C15 12.7956 14.6839 13.5174 14.1716 14.0503L15 18H13L12.5 15.5H11.5L11 18H9L9.82843 14.0503C9.31607 13.5174 9 12.7956 9 12Z" fill="white" />
    </svg>
    <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-600 rounded-full border border-white"></div>
    <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-green-600 rounded-full border border-white"></div>
  </div>
);

const Layout: React.FC<LayoutProps> = ({ children, userRole, onLogout, userName, userId, activeTab, setActiveTab, actionPlans, hubPayments, announcements }) => {
  const { language, setLanguage, t } = useLanguage();
  const [showNotifications, setShowNotifications] = useState(false);

  const isUrgent = (dateStr: string) => {
    const target = new Date(dateStr).getTime();
    const now = new Date().getTime();
    const diff = target - now;
    const hours = diff / (1000 * 60 * 60);
    // 48-hour logic as per guardrails
    return hours > 0 && hours <= 48;
  };

  const dynamicAlerts = useMemo(() => {
    const actionAlerts = actionPlans
      .filter(ap => ap.status === 'PLANNED' && isUrgent(ap.targetDate))
      .map(ap => {
        const date = new Date(ap.targetDate);
        return {
          id: `alert-${ap.id}`,
          title: ap.title,
          text: t('reminderAlert')
            .replace('{title}', ap.title)
            .replace('{date}', date.toLocaleDateString())
            .replace('{time}', date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })),
          type: 'urgent',
          timestamp: ap.targetDate
        };
      });

    const collectionAlerts = hubPayments
      .filter(hp => hp.status === 'VERIFIED' && hp.collectionDate && isUrgent(hp.collectionDate))
      .map(hp => {
        const date = new Date(hp.collectionDate);
        return {
          id: `collect-${hp.id}`,
          title: "Collection Reminder",
          text: t('collectionAlert')
            .replace('{days}', hp.selectedDays.length.toString())
            .replace('{date}', date.toLocaleDateString()),
          type: 'collection',
          timestamp: hp.collectionDate
        };
      });

    const announcementAlerts = announcements
      .filter(a => {
        const diff = Date.now() - new Date(a.timestamp).getTime();
        const isRecent = diff < 24 * 60 * 60 * 1000;
        // Targeted logic: show if global (!targetUserId) or if targeted specifically at this user
        const isForMe = !a.targetUserId || a.targetUserId === userId;
        return isRecent && isForMe;
      })
      .map(a => ({
        id: `ann-${a.id}`,
        title: t('newAnnouncement').replace('{title}', a.title),
        text: a.message.length > 60 ? a.message.substring(0, 60) + "..." : a.message,
        type: 'broadcast',
        timestamp: a.timestamp
      }));

    return [...actionAlerts, ...collectionAlerts, ...announcementAlerts].sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }, [actionPlans, hubPayments, announcements, t, userId]);

  const totalNotifications = dynamicAlerts.length;

  const menuItems = [
    { id: Tab.HOME, label: t('tabHome'), icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
    )},
    { id: Tab.CONTRIBUTION_HUB, label: t('tabContributionHub'), icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
    )},
    { id: Tab.DATES, label: t('tabDates'), icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
    )},
    { id: Tab.ACTION_PLAN, label: t('tabActionPlan'), icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
    )},
    { id: Tab.UPDATES, label: t('tabUpdates'), icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
    )},
    { id: Tab.CONTRIBUTIONS, label: t('tabContributions'), icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
    )},
    ...(userRole === UserRole.ADMIN ? [{ id: Tab.MEMBERS, label: t('tabMembers'), icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
    )}] : []),
    { id: Tab.SETTINGS, label: t('tabSettings'), icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
    )}
  ];

  const languages: { id: Language; label: string }[] = [
    { id: 'en', label: 'EN' },
    { id: 'fr', label: 'FR' },
    { id: 'rw', label: 'RW' }
  ];

  if (!userRole) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <header className="p-6 flex justify-between items-center max-w-7xl mx-auto w-full">
          <div className="flex items-center gap-2">
            <LogoIcon />
            <span className="font-black text-slate-900 tracking-tighter text-lg leading-tight ml-2">Twangumugayo</span>
          </div>
          <div className="flex gap-2">
            {languages.map(lang => (
              <button 
                key={lang.id} 
                onClick={() => setLanguage(lang.id)} 
                className={`px-3 py-1.5 text-xs font-black rounded-lg uppercase transition-all ${
                  language === lang.id 
                    ? 'bg-slate-900 text-white shadow-lg shadow-slate-200' 
                    : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                }`}
              >
                {lang.label}
              </button>
            ))}
          </div>
        </header>
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex overflow-hidden">
      <aside className="w-72 bg-white border-r border-slate-200 h-screen sticky top-0 flex flex-col shadow-xl z-50">
        <div className="p-8 border-b border-slate-100 flex items-center gap-3">
          <LogoIcon />
          <h1 className="text-sm font-black text-slate-800 tracking-tighter uppercase leading-tight">Twangumugayo</h1>
        </div>

        <nav className="flex-1 p-6 space-y-2 overflow-y-auto">
          {menuItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl font-bold text-sm transition-all duration-200 ${
                activeTab === item.id 
                  ? 'bg-emerald-50 text-emerald-700 shadow-sm border-emerald-100' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
              }`}
            >
              <span className={`${activeTab === item.id ? 'text-emerald-600' : 'text-slate-400'}`}>
                {item.icon}
              </span>
              {item.label}
              {activeTab === item.id && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-500"></div>}
            </button>
          ))}
        </nav>

        <div className="p-6 border-t border-slate-100 space-y-4">
          <div className="bg-slate-50 rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-xs shadow-sm">
                {userName?.charAt(0)}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-black text-slate-900 truncate">{userName}</p>
                <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">{userRole}</p>
              </div>
            </div>
          </div>
          
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 bg-white text-rose-600 border border-rose-100 rounded-xl text-xs font-black hover:bg-rose-50 hover:border-rose-200 transition-all active:scale-95 group shadow-sm shadow-rose-900/5"
          >
            <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            {t('logout')}
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto h-screen relative flex flex-col">
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-100 px-8 py-4 flex justify-end items-center gap-4">
          <div className="flex gap-2 mr-2">
            {languages.map(lang => (
              <button 
                key={lang.id} 
                onClick={() => setLanguage(lang.id)} 
                className={`px-3 py-1.5 text-[10px] font-black rounded-lg uppercase transition-all ${
                  language === lang.id 
                    ? 'bg-slate-900 text-white shadow-md' 
                    : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                }`}
              >
                {lang.label}
              </button>
            ))}
          </div>

          <div className="relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className={`relative p-2.5 rounded-xl transition-all ${showNotifications ? 'bg-emerald-100 text-emerald-700' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'}`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
              {totalNotifications > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-white text-[10px] font-black flex items-center justify-center rounded-full border-2 border-white">
                  {totalNotifications}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-fadeIn origin-top-right">
                <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                  <span className="text-xs font-black text-slate-900 uppercase tracking-widest">Notifications</span>
                  <button onClick={() => setShowNotifications(false)} className="text-slate-400 hover:text-slate-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {dynamicAlerts.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-xs italic">No new notifications</div>
                  ) : (
                    dynamicAlerts.map(alert => (
                      <div key={alert.id} className="p-4 hover:bg-emerald-50 transition-colors border-b border-slate-50">
                        <div className="flex items-start gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            alert.type === 'collection' ? 'bg-indigo-100 text-indigo-600' : 
                            alert.type === 'broadcast' ? 'bg-blue-100 text-blue-600' :
                            'bg-emerald-100 text-emerald-600'
                          }`}>
                             {alert.type === 'broadcast' ? (
                               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>
                             ) : (
                               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                             )}
                          </div>
                          <div>
                            <p className="text-xs font-black text-slate-900 mb-1">{alert.title}</p>
                            <p className="text-[11px] text-slate-700 leading-relaxed">{alert.text}</p>
                            <p className="text-[8px] text-slate-400 mt-1 uppercase font-bold">{new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </header>

        <div className="flex-1 px-8 py-10">
          <div className="max-w-5xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Layout;
