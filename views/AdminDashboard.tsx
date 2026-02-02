
import React, { useState, useMemo } from 'react';
import { User, Contribution, PaymentStatus, Announcement, GroupConfig, Tab, ActionPlan, HubPayment, UserRole, PaymentGateway } from '../types';
import { useLanguage } from '../LanguageContext';
import { draftAnnouncement } from '../geminiService';

interface AdminDashboardProps {
  config: GroupConfig;
  onUpdateConfig: (config: Partial<GroupConfig>) => void;
  user: User;
  users: User[];
  contributions: Contribution[];
  announcements: Announcement[];
  actionPlans: ActionPlan[];
  hubPayments: HubPayment[];
  onVerifyPayment: (id: string) => void;
  onAddAnnouncement: (title: string, message: string, targetUserId?: string) => void;
  onAddActionPlan: (plan: Omit<ActionPlan, 'id' | 'status'>) => void;
  onUpdateActionStatus: (id: string, status: 'PLANNED' | 'COMPLETED') => void;
  onDeleteActionPlan: (id: string) => void;
  onHubVerify: (id: string, isApproved: boolean) => void;
  onUnlockCollection: (id: string) => void;
  onUnlockDates: (userId: string) => void;
  activeTab: Tab;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  config, onUpdateConfig, user, users, contributions, announcements, actionPlans, hubPayments,
  onVerifyPayment, onAddAnnouncement, onAddActionPlan, 
  onUpdateActionStatus, onDeleteActionPlan, onHubVerify, onUnlockCollection, onUnlockDates, activeTab 
}) => {
  const { t, language, setLanguage } = useLanguage();
  const [viewingReceipt, setViewingReceipt] = useState<string | null>(null);
  
  // Broadcast Tool State
  const [broadcastTopic, setBroadcastTopic] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [isDrafting, setIsDrafting] = useState(false);
  const [targetRecipientId, setTargetRecipientId] = useState<string>(''); // empty for All

  // Action Plan Form State
  const [newActionTitle, setNewActionTitle] = useState('');
  const [newActionDesc, setNewActionDesc] = useState('');
  const [newActionDate, setNewActionDate] = useState('');

  // Local state for configuration edits
  const [localConfig, setLocalConfig] = useState({
    name: config.name,
    dailyRate: config.dailyRate,
    currency: config.currency,
    startDate: config.startDate.split('T')[0]
  });

  const totalPool = contributions.filter(c => c.status === PaymentStatus.VERIFIED).reduce((acc, c) => acc + c.amount, 0);

  const handleAIDraft = async () => {
    if (!broadcastTopic) return;
    setIsDrafting(true);
    const draft = await draftAnnouncement(broadcastTopic, language);
    setBroadcastMessage(draft);
    setIsDrafting(false);
  };

  const handleSaveConfig = () => {
    onUpdateConfig({
      name: localConfig.name,
      dailyRate: localConfig.dailyRate,
      currency: localConfig.currency,
      startDate: new Date(localConfig.startDate).toISOString()
    });
  };

  const handleCreateActionPlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newActionTitle || !newActionDate) return;
    onAddActionPlan({
      title: newActionTitle,
      description: newActionDesc,
      targetDate: new Date(newActionDate).toISOString()
    });
    setNewActionTitle('');
    setNewActionDesc('');
    setNewActionDate('');
  };

  const renderHome = () => (
    <div className="space-y-12 animate-fadeIn pb-12">
      <section className="bg-emerald-700 rounded-[40px] p-12 text-white relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-600 rounded-full -mr-32 -mt-32 opacity-40"></div>
        <div className="relative z-10 max-w-2xl">
          <h1 className="text-5xl font-black tracking-tighter mb-4">{config.name}</h1>
          <p className="text-xl text-emerald-100 font-medium opacity-90">{t('adminPortal')}</p>
          <div className="mt-8 flex gap-4">
             <div className="bg-white/10 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/10">
               <p className="text-[10px] font-black uppercase tracking-widest text-emerald-300">{t('groupBalance')}</p>
               <p className="text-2xl font-black">{totalPool.toLocaleString()} {config.currency}</p>
             </div>
             <div className="bg-white/10 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/10">
               <p className="text-[10px] font-black uppercase tracking-widest text-emerald-300">{t('cycleMembers')}</p>
               <p className="text-2xl font-black">{users.length}</p>
             </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section className="bg-white rounded-[40px] p-10 border border-slate-100 shadow-xl space-y-8">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600">
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            </div>
            <h2 className="text-2xl font-black text-slate-900">{t('hubConfigTitle')}</h2>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('hubNameLabel')}</label>
              <input 
                value={localConfig.name} 
                onChange={e => setLocalConfig({...localConfig, name: e.target.value})} 
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('dailyRateLabel')}</label>
                <input 
                  type="number"
                  value={localConfig.dailyRate} 
                  onChange={e => setLocalConfig({...localConfig, dailyRate: Number(e.target.value)})} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('currencyLabel')}</label>
                <input 
                  value={localConfig.currency} 
                  onChange={e => setLocalConfig({...localConfig, currency: e.target.value})} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('payoutStartLabel')}</label>
              <input 
                type="date"
                value={localConfig.startDate} 
                onChange={e => setLocalConfig({...localConfig, startDate: e.target.value})} 
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
              />
            </div>

            <button 
              onClick={handleSaveConfig}
              className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg hover:bg-emerald-700 active:scale-95 transition-all"
            >
              {t('saveConfigBtn')}
            </button>
          </div>
        </section>

        <section className="bg-slate-900 rounded-[40px] p-10 text-white shadow-xl space-y-8 h-full flex flex-col">
          <h2 className="text-2xl font-black">{t('goalsTitle')}</h2>
          <div className="space-y-4 flex-1">
            {[
              { title: t('goal1Title'), icon: '🎯', text: t('goal1Text') }, 
              { title: t('goal2Title'), icon: '🤝', text: t('goal2Text') },
              { title: t('goal3Title'), icon: '🛡️', text: t('goal3Text') }
            ].map((g, i) => (
              <div key={i} className="flex gap-4 p-6 rounded-3xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-xl shrink-0">{g.icon}</div>
                <div>
                  <h4 className="font-black text-base mb-1">{g.title}</h4>
                  <p className="text-xs text-slate-400 leading-relaxed font-medium">{g.text}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

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

  const renderUpdates = () => (
    <div className="space-y-12 animate-fadeIn pb-12">
      <header>
        <h1 className="text-4xl font-black text-slate-900 tracking-tighter mb-2">{t('tabUpdates')}</h1>
        <p className="text-slate-500 font-medium">Broadcast new announcements or send targeted alerts to specific members.</p>
      </header>
      <section className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-xl space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('recipientLabel')}</label>
              <select 
                value={targetRecipientId} 
                onChange={(e) => setTargetRecipientId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-slate-900 font-bold focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">🌍 {t('allMembers')}</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>👤 {u.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('broadcastTopic')}</label>
              <input value={broadcastTopic} onChange={(e) => setBroadcastTopic(e.target.value)} placeholder="e.g., Annual Assembly" className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-slate-900 font-bold" />
            </div>
            <button onClick={handleAIDraft} disabled={isDrafting || !broadcastTopic} className="w-full bg-indigo-50 text-indigo-700 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-indigo-100 transition-colors flex items-center justify-center gap-2">
              {isDrafting ? <div className="w-4 h-4 border-2 border-indigo-700 border-t-transparent rounded-full animate-spin"></div> : <span>✨ {t('aiDraft')}</span>}
            </button>
          </div>
          <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('broadcastMessage')}</label>
            <textarea value={broadcastMessage} onChange={(e) => setBroadcastMessage(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-6 text-slate-900 font-bold h-48 resize-none focus:ring-2 focus:ring-emerald-500 transition-all" />
          </div>
        </div>
        <button onClick={() => { onAddAnnouncement(broadcastTopic, broadcastMessage, targetRecipientId || undefined); setBroadcastTopic(''); setBroadcastMessage(''); setTargetRecipientId(''); }} disabled={!broadcastMessage} className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-lg shadow-xl active:scale-95 transition-all">
          {t('sendBroadcast')}
        </button>
      </section>
      
      {/* Sent History for Admin Reference */}
      <section className="space-y-6">
        <h3 className="text-xl font-black text-slate-900">Broadcast History</h3>
        <div className="space-y-4">
          {announcements.map(ann => (
            <div key={ann.id} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                   <h4 className="font-black text-slate-900">{ann.title}</h4>
                   <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${ann.targetUserId ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                     {ann.targetUserId ? 'Targeted' : 'Global'}
                   </span>
                </div>
                <p className="text-xs text-slate-500 truncate max-w-md">{ann.message}</p>
              </div>
              <span className="text-[10px] font-black text-slate-400 uppercase">{new Date(ann.timestamp).toLocaleDateString()}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );

  const renderActionPlan = () => (
    <div className="space-y-12 animate-fadeIn pb-12">
      <header>
        <h1 className="text-4xl font-black text-slate-900 tracking-tighter mb-2">{t('tabActionPlan')}</h1>
        <p className="text-slate-500 font-medium">Create community milestones and track their progress toward completion.</p>
      </header>

      {/* Creation Form */}
      <section className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-xl space-y-8">
        <h2 className="text-2xl font-black text-slate-900">{t('createNewAction')}</h2>
        <form onSubmit={handleCreateActionPlan} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('actionTitle')}</label>
                <input required value={newActionTitle} onChange={e => setNewActionTitle(e.target.value)} placeholder="e.g., Monthly Audit" className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-slate-900 font-bold" />
             </div>
             <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('actionDate')}</label>
                <input required type="datetime-local" value={newActionDate} onChange={e => setNewActionDate(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-slate-900 font-bold" />
             </div>
          </div>
          <div className="space-y-2">
             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('actionDesc')}</label>
             <textarea value={newActionDesc} onChange={e => setNewActionDesc(e.target.value)} placeholder={t('actionPlanPlaceholder')} className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-slate-900 font-bold h-24 resize-none" />
          </div>
          <button type="submit" className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg hover:bg-emerald-700 active:scale-95 transition-all">
             {t('addAction')}
          </button>
        </form>
      </section>

      <div className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-xl">
        <h2 className="text-2xl font-black text-slate-900 mb-8">Active Community Milestones</h2>
        <div className="grid grid-cols-1 gap-4">
          {actionPlans.map(ap => (
            <div key={ap.id} className="p-6 rounded-3xl border border-slate-100 flex justify-between items-center group hover:bg-slate-50 transition-colors">
              <div>
                <div className="flex items-center gap-3">
                   <h4 className="font-black text-slate-900">{ap.title}</h4>
                   {new Date(ap.targetDate).getTime() - Date.now() < 48 * 60 * 60 * 1000 && ap.status === 'PLANNED' && (
                     <span className="px-2 py-0.5 bg-rose-100 text-rose-600 rounded-lg text-[8px] font-black uppercase tracking-widest animate-pulse">48h Alert</span>
                   )}
                </div>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">
                  {new Date(ap.targetDate).toLocaleDateString()} @ {new Date(ap.targetDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
                {ap.description && <p className="text-xs text-slate-500 mt-2 font-medium">{ap.description}</p>}
              </div>
              <div className="flex items-center gap-4">
                <button onClick={() => onUpdateActionStatus(ap.id, ap.status === 'PLANNED' ? 'COMPLETED' : 'PLANNED')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${ap.status === 'COMPLETED' ? 'bg-emerald-600 text-white shadow-md' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>
                  {ap.status}
                </button>
                <button onClick={() => onDeleteActionPlan(ap.id)} className="text-rose-500 hover:text-rose-700 transition-colors p-2 hover:bg-rose-50 rounded-lg">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderMembers = () => (
    <div className="space-y-8 animate-fadeIn pb-12">
      <header>
        <h1 className="text-4xl font-black text-slate-900 tracking-tighter mb-2">{t('tabMembers')}</h1>
        <p className="text-slate-500 font-medium">Manage the hub's community members and rotation ranks.</p>
      </header>
      <div className="bg-white rounded-[40px] border border-slate-100 shadow-xl overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
            <tr>
              <th className="px-10 py-5">Rank</th>
              <th className="px-10 py-5">Name</th>
              <th className="px-10 py-5">Phone</th>
              <th className="px-10 py-5">Dates Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {users.map(u => (
              <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-10 py-6 font-black text-emerald-600">#{u.payoutRank}</td>
                <td className="px-10 py-6 font-black text-slate-900">{u.name}</td>
                <td className="px-10 py-6 text-slate-400 font-bold">{u.phone}</td>
                <td className="px-10 py-6">
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${u.datesLocked ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>
                      {u.datesLocked ? 'Locked' : 'Open'}
                    </span>
                    {u.datesLocked && (
                      <button onClick={() => onUnlockDates(u.id)} className="text-[10px] font-black text-rose-600 uppercase hover:underline">Reset</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderHistory = () => (
    <div className="space-y-8 animate-fadeIn pb-12">
      <header>
        <h1 className="text-4xl font-black text-slate-900 tracking-tighter mb-2">Group Audit History</h1>
        <p className="text-slate-500 font-medium">Historical ledger of all verified community contributions.</p>
      </header>
      <div className="bg-white rounded-[40px] border border-slate-100 shadow-xl overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
            <tr>
              <th className="px-10 py-5">Date</th>
              <th className="px-10 py-5">Member</th>
              <th className="px-10 py-5">Amount</th>
              <th className="px-10 py-5">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {contributions.filter(c => c.status === PaymentStatus.VERIFIED).map(c => {
              const member = users.find(u => u.id === c.userId);
              return (
                <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-10 py-6 text-slate-500 font-medium text-xs">{new Date(c.date).toLocaleDateString()}</td>
                  <td className="px-10 py-6 font-black text-slate-900">{member?.name}</td>
                  <td className="px-10 py-6 font-black text-slate-900">{c.amount.toLocaleString()} {config.currency}</td>
                  <td className="px-10 py-6">
                    <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-100 text-emerald-700">VERIFIED</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-12 animate-fadeIn pb-12 max-w-2xl mx-auto">
      <header>
        <h1 className="text-4xl font-black text-slate-900 tracking-tighter mb-2">{t('tabSettings')}</h1>
        <p className="text-slate-500 font-medium">Administrator account and system preferences.</p>
      </header>
      
      <section className="bg-white p-12 rounded-[48px] border border-slate-100 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-50 rounded-full -mr-24 -mt-24 opacity-60"></div>
        
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row items-center gap-8 mb-12">
            <div className="w-32 h-32 rounded-[40px] bg-slate-900 text-white text-4xl font-black flex items-center justify-center shadow-2xl rotate-3">
              {user.name.charAt(0)}
            </div>
            <div className="text-center md:text-left">
              <div className="flex flex-col md:flex-row items-center gap-3 mb-2">
                <h3 className="text-3xl font-black text-slate-900">{user.name}</h3>
                <span className="px-4 py-1.5 bg-emerald-100 text-emerald-700 rounded-xl text-[10px] font-black uppercase tracking-[0.2em]">
                  {t('systemAdmin')}
                </span>
              </div>
              <p className="text-slate-400 font-bold uppercase tracking-widest text-sm mb-4">{user.phone}</p>
              <p className="text-slate-500 font-medium leading-relaxed max-w-sm">{t('adminProfileDesc')}</p>
            </div>
          </div>

          <div className="space-y-6 pt-10 border-t border-slate-50">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 p-8 bg-slate-50 rounded-[32px] border border-slate-100">
              <div className="text-center md:text-left">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Language Preference</p>
                <p className="text-sm font-bold text-slate-900">Choose the system display language.</p>
              </div>
              <div className="flex gap-2">
                {(['en', 'fr', 'rw'] as const).map(lang => (
                  <button 
                    key={lang} 
                    onClick={() => setLanguage(lang)} 
                    className={`px-6 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${language === lang ? 'bg-slate-900 text-white shadow-xl' : 'bg-white text-slate-400 border border-slate-200 hover:text-emerald-600 hover:border-emerald-200'}`}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-6 bg-indigo-50 rounded-[24px] border border-indigo-100 text-center">
                <p className="text-[9px] font-black text-indigo-600 uppercase tracking-widest mb-1">System Health</p>
                <p className="text-xl font-black text-indigo-900">Optimal</p>
              </div>
              <div className="p-6 bg-emerald-50 rounded-[24px] border border-emerald-100 text-center">
                <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-1">Last Audit</p>
                <p className="text-xl font-black text-emerald-900">Today</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );

  const renderDatesTab = () => {
    const sortedMembers = [...users].sort((a, b) => (a.payoutRank || 0) - (b.payoutRank || 0));
    return (
      <div className="space-y-12 animate-fadeIn max-w-5xl mx-auto pb-12">
        <header>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter mb-2">{t('globalSchedule')}</h1>
          <p className="text-slate-500 font-medium">Master overview of all member selected payout dates.</p>
        </header>
        <div className="grid grid-cols-1 gap-6">
          {sortedMembers.map(u => (
            <div key={u.id} className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6 group hover:border-amber-100 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-black">#{u.payoutRank}</div>
                <div><h3 className="text-xl font-black text-slate-900">{u.name}</h3><p className="text-xs text-slate-400 font-bold uppercase tracking-widest">{u.phone}</p></div>
              </div>
              <div className="flex flex-wrap gap-3">
                {u.payoutDates && u.payoutDates.length > 0 ? u.payoutDates.map((date, idx) => (
                    <div key={idx} className="bg-amber-50 text-amber-700 border border-amber-200 px-4 py-2 rounded-xl text-xs font-black">{new Date(date).toLocaleDateString()}</div>
                )) : <span className="text-slate-300 italic text-sm">{t('noDatesSelected')}</span>}
              </div>
              <div className="flex items-center gap-4">
                {u.datesLocked && <button onClick={() => onUnlockDates(u.id)} className="p-3 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-100 transition-colors"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg></button>}
                <div className={`w-3 h-3 rounded-full ${u.datesLocked ? 'bg-emerald-500' : 'bg-slate-200'}`} />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderContributionHub = () => (
    <div className="space-y-12 animate-fadeIn max-w-5xl mx-auto relative">
      {viewingReceipt && (
        <div className="fixed inset-0 z-[100] bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-8 animate-fadeIn" onClick={() => setViewingReceipt(null)}>
           <div className="relative max-w-3xl w-full bg-white p-4 rounded-[32px] shadow-2xl animate-scaleIn" onClick={e => e.stopPropagation()}>
              <button onClick={() => setViewingReceipt(null)} className="absolute -top-4 -right-4 w-10 h-10 bg-rose-500 text-white rounded-full flex items-center justify-center shadow-lg border-2 border-white hover:bg-rose-600 transition-colors"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
              <img src={viewingReceipt} alt="Receipt" className="w-full max-h-[80vh] object-contain rounded-2xl" />
           </div>
        </div>
      )}
      <header>
        <h1 className="text-4xl font-black text-slate-900 tracking-tighter mb-2">{t('verificationHub')}</h1>
        <p className="text-slate-500 font-medium">Verify community transaction history and manual submissions.</p>
      </header>
      <div className="bg-white rounded-[40px] border border-slate-100 shadow-xl overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
            <tr><th className="px-10 py-5">Date</th><th className="px-10 py-5">Member</th><th className="px-10 py-5">Method</th><th className="px-10 py-5">Amount</th><th className="px-10 py-5">Status</th><th className="px-10 py-5">Action</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {hubPayments.map(p => (
              <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-10 py-6 text-slate-500 font-medium text-xs">{new Date(p.timestamp).toLocaleDateString()}</td>
                <td className="px-10 py-6 font-black text-slate-900 text-sm">{p.userName}</td>
                <td className="px-10 py-6"><div className="flex items-center gap-2"><span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${p.gateway === 'MANUAL' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>{p.gateway === 'MANUAL' ? t('manualLabel') : t('apiLabel')}</span><span className="text-[10px] font-bold text-slate-400">{p.gateway}</span></div></td>
                <td className="px-10 py-6 font-black text-slate-900 text-sm">{p.amount.toLocaleString()} {config.currency}</td>
                <td className="px-10 py-6"><span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${p.status === PaymentStatus.VERIFIED ? 'bg-emerald-100 text-emerald-700' : p.status === PaymentStatus.PENDING ? 'bg-amber-100 text-amber-700' : p.status === PaymentStatus.REJECTED ? 'bg-rose-100 text-rose-700' : 'bg-rose-100 text-rose-700'}`}>{p.status}</span></td>
                <td className="px-10 py-6"><div className="flex items-center gap-2">{p.receiptUrl && <button onClick={() => setViewingReceipt(p.receiptUrl!)} className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-emerald-600 hover:text-white transition-all shadow-sm"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg></button>}{p.status === PaymentStatus.PENDING && <><button onClick={() => onHubVerify(p.id, true)} className="px-3 py-2 bg-emerald-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest shadow-md hover:bg-emerald-700 transition-all active:scale-95">{t('approve')}</button><button onClick={() => onHubVerify(p.id, false)} className="px-3 py-2 bg-rose-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest shadow-md hover:bg-rose-700 transition-all active:scale-95">{t('reject')}</button></>}</div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  switch(activeTab) {
    case Tab.CONTRIBUTION_HUB: return renderContributionHub();
    case Tab.DATES: return renderDatesTab();
    case Tab.MEMBERS: return renderMembers();
    case Tab.UPDATES: return renderUpdates();
    case Tab.ACTION_PLAN: return renderActionPlan();
    case Tab.CONTRIBUTIONS: return renderHistory();
    case Tab.SETTINGS: return renderSettings();
    case Tab.HOME:
    default: return renderHome();
  }
};

export default AdminDashboard;
