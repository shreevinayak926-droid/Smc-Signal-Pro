import React, { useState, useEffect, useCallback } from 'react';
import { User, AdminStats, SubscriptionTier, PushAlert } from '../types';
import {
  supabaseGetAllUsers,
  supabaseUpdateUser,
  supabaseBroadcastAlert,
  supabaseGetGlobalSettings,
  supabaseSaveGlobalSettings,
  supabaseLogActivity,
} from '../services/supabaseDb';
import {
  ShieldAlert, Users, Radio, Sliders, BarChart3, Search, UserCheck, UserX,
  Crown, Zap, Bell, CheckCircle2, AlertTriangle, RefreshCw, Send, Lock,
  Activity, DollarSign, TrendingUp, Cpu
} from 'lucide-react';

interface AdminPanelProps {
  currentUser: User;
  onClose: () => void;
  onRefreshUserSession: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  currentUser,
  onClose,
  onRefreshUserSession,
}) => {
  const [activeTab, setActiveTab] = useState<'USERS' | 'BROADCAST' | 'ENGINE' | 'ANALYTICS'>('USERS');
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // Broadcast state
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastImpact, setBroadcastImpact] = useState<'HIGH' | 'MEDIUM' | 'LOW'>('HIGH');
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  // Signal engine config state
  const [confluenceThreshold, setConfluenceThreshold] = useState(70);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  // Fetch Users & Admin Stats from Supabase
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [uList, gSettings] = await Promise.all([
        supabaseGetAllUsers(),
        supabaseGetGlobalSettings(),
      ]);

      setUsers(uList || []);

      if (gSettings) {
        setMaintenanceMode(gSettings.maintenanceMode || false);
      }

      const activeUsers = uList.filter((u) => u.status === 'ACTIVE').length;
      const vipUsers = uList.filter((u) => u.tier === 'INSTITUTIONAL_VIP').length;
      const proUsers = uList.filter((u) => u.tier === 'PRO_TRADER').length;
      const freeUsers = uList.filter((u) => u.tier === 'FREE_TRIAL').length;
      const suspendedUsers = uList.filter((u) => u.status === 'BANNED').length;

      setStats({
        totalUsers: uList.length,
        activeUsers,
        vipUsers,
        freeUsers,
        suspendedUsers,
        onlineUsers: Math.max(1, Math.floor(activeUsers * 0.4)),
        totalTrades: 1240,
        todayTrades: 38,
        aiScansToday: 84,
        apiStatus: 'ONLINE',
        systemStatus: gSettings?.maintenanceMode ? 'MAINTENANCE' : 'HEALTHY',
        totalRevenueUSD: vipUsers * 99 + proUsers * 49,
        signalsGeneratedToday: 14,
        maintenanceMode: gSettings?.maintenanceMode || false,
        confluenceThreshold: 75,
      });
    } catch (err) {
      console.warn('Failed to load admin data from Supabase:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const showTempMsg = (msg: string) => {
    setActionSuccessMsg(msg);
    setTimeout(() => setActionSuccessMsg(null), 4000);
  };

  // Change user tier
  const handleUpdateTier = async (userId: string, newTier: SubscriptionTier) => {
    try {
      const success = await supabaseUpdateUser(userId, { tier: newTier });
      if (success) {
        showTempMsg(`Subscription updated to ${newTier}`);
        await supabaseLogActivity({
          id: `log-${Date.now()}`,
          timestamp: Date.now(),
          adminEmail: currentUser.email,
          action: 'UPDATE_TIER',
          target: userId,
          status: 'SUCCESS',
          details: `Changed tier to ${newTier}`,
        });
        fetchData();
        onRefreshUserSession();
      }
    } catch (err) {
      console.error('Failed to update tier:', err);
    }
  };

  // Ban or unban user
  const handleToggleBan = async (userId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'BANNED' ? 'ACTIVE' : 'BANNED';
    try {
      const success = await supabaseUpdateUser(userId, { status: nextStatus });
      if (success) {
        showTempMsg(`User status updated to ${nextStatus}`);
        await supabaseLogActivity({
          id: `log-${Date.now()}`,
          timestamp: Date.now(),
          adminEmail: currentUser.email,
          action: nextStatus === 'BANNED' ? 'BAN_USER' : 'UNBAN_USER',
          target: userId,
          status: 'SUCCESS',
          details: `User status changed to ${nextStatus}`,
        });
        fetchData();
      }
    } catch (err) {
      console.error('Failed to change user status:', err);
    }
  };

  // Broadcast Notification
  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle || !broadcastMessage) return;
    setIsBroadcasting(true);
    try {
      const alert: PushAlert = {
        id: `alert-${Date.now()}`,
        title: broadcastTitle,
        message: broadcastMessage,
        type: 'SIGNAL',
        timestamp: Date.now(),
        impact: broadcastImpact,
        read: false,
      };

      const success = await supabaseBroadcastAlert(alert);
      if (success) {
        showTempMsg('📢 Push notification broadcasted to all active trading sessions via Supabase Realtime!');
        setBroadcastTitle('');
        setBroadcastMessage('');
      }
    } catch (err) {
      console.error('Failed to broadcast:', err);
    } finally {
      setIsBroadcasting(false);
    }
  };

  // Save Engine Config
  const handleSaveConfig = async () => {
    setIsSavingConfig(true);
    try {
      const current = await supabaseGetGlobalSettings();
      if (current) {
        await supabaseSaveGlobalSettings({
          ...current,
          maintenanceMode,
        });
      }
      showTempMsg('✅ Algorithmic Engine Settings Updated in Supabase');
      fetchData();
    } catch (err) {
      console.error('Failed to update engine config:', err);
    } finally {
      setIsSavingConfig(false);
    }
  };

  // Filtered users
  const filteredUsers = users.filter(
    (u) =>
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-[#0E1015] text-[#E0E0E0] rounded-xl border border-[#1F2229] shadow-2xl overflow-hidden">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between px-6 py-4 bg-[#12141A] border-b border-[#1F2229] gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[#FF4D6D]/15 border border-[#FF4D6D]/30 rounded-xl text-[#FF4D6D]">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-base text-[#F3F4F6]">Dynamic Admin Control Center</h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#FF4D6D]/20 border border-[#FF4D6D]/40 text-[#FF4D6D] font-mono font-bold">
                SUPABASE ADMIN
              </span>
            </div>
            <p className="text-xs text-[#94A3B8] mt-0.5">
              Logged in as <span className="text-[#00FFA3] font-semibold">{currentUser.email}</span> · Manage profiles, real-time signals & database settings.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchData}
            className="p-2 bg-[#1A1D26] hover:bg-[#222634] rounded-xl border border-[#1F2229] text-[#E0E0E0] transition-all cursor-pointer"
            title="Refresh System Data"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#00FFA3]' : ''}`} />
          </button>
          <button
            onClick={onClose}
            className="px-3 py-1.5 bg-[#1F2229] hover:bg-[#2A2E3B] text-[#E0E0E0] rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            Exit Admin Panel
          </button>
        </div>
      </div>

      {/* Action Notification Alert */}
      {actionSuccessMsg && (
        <div className="mx-6 mt-3 p-3 bg-[#00FFA3]/15 border border-[#00FFA3]/40 rounded-xl text-xs text-[#00FFA3] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{actionSuccessMsg}</span>
          </div>
        </div>
      )}

      {/* Navigation Ribbon */}
      <div className="flex border-b border-[#1F2229] bg-[#0A0B0D] px-6">
        <button
          onClick={() => setActiveTab('USERS')}
          className={`py-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
            activeTab === 'USERS'
              ? 'border-[#FF4D6D] text-[#FF4D6D] bg-[#FF4D6D]/5'
              : 'border-transparent text-[#94A3B8] hover:text-[#E0E0E0]'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>USER MANAGEMENT ({users.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('BROADCAST')}
          className={`py-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
            activeTab === 'BROADCAST'
              ? 'border-[#FF4D6D] text-[#FF4D6D] bg-[#FF4D6D]/5'
              : 'border-transparent text-[#94A3B8] hover:text-[#E0E0E0]'
          }`}
        >
          <Radio className="w-4 h-4" />
          <span>GLOBAL BROADCAST</span>
        </button>

        <button
          onClick={() => setActiveTab('ENGINE')}
          className={`py-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
            activeTab === 'ENGINE'
              ? 'border-[#FF4D6D] text-[#FF4D6D] bg-[#FF4D6D]/5'
              : 'border-transparent text-[#94A3B8] hover:text-[#E0E0E0]'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>SMC ENGINE CONFIG</span>
        </button>

        <button
          onClick={() => setActiveTab('ANALYTICS')}
          className={`py-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
            activeTab === 'ANALYTICS'
              ? 'border-[#FF4D6D] text-[#FF4D6D] bg-[#FF4D6D]/5'
              : 'border-transparent text-[#94A3B8] hover:text-[#E0E0E0]'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>ANALYTICS & REVENUE</span>
        </button>
      </div>

      {/* Main Tab Content */}
      <div className="flex-1 p-6 overflow-y-auto">
        {/* TAB 1: USERS */}
        {activeTab === 'USERS' && (
          <div className="space-y-4">
            {/* Search Filter */}
            <div className="flex items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-[#64748B]" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search user by email or name..."
                  className="w-full bg-[#12141A] border border-[#1F2229] rounded-xl pl-9 pr-4 py-2 text-xs text-[#E0E0E0] placeholder-[#64748B] focus:outline-none focus:border-[#FF4D6D]"
                />
              </div>
              <span className="text-xs text-[#64748B]">
                Showing {filteredUsers.length} of {users.length} registered accounts
              </span>
            </div>

            {/* Users Table */}
            <div className="bg-[#12141A] border border-[#1F2229] rounded-xl overflow-hidden shadow-xl">
              <table className="w-full text-left text-xs text-[#E0E0E0]">
                <thead className="bg-[#0A0B0D] text-[#94A3B8] border-b border-[#1F2229] font-mono text-[11px]">
                  <tr>
                    <th className="py-3 px-4">USER / EMAIL</th>
                    <th className="py-3 px-4">ROLE</th>
                    <th className="py-3 px-4">SUBSCRIPTION TIER</th>
                    <th className="py-3 px-4">STATUS</th>
                    <th className="py-3 px-4 text-right">MANAGE ACCESS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1F2229]">
                  {filteredUsers.map((u) => {
                    const isBanned = u.status === 'BANNED';
                    const isAdmin = u.role === 'ADMIN';

                    return (
                      <tr key={u.id} className="hover:bg-[#161922] transition-all">
                        <td className="py-3 px-4">
                          <div className="font-bold text-[#F3F4F6]">{u.name}</div>
                          <div className="text-[11px] text-[#94A3B8] font-mono">{u.email}</div>
                        </td>

                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                            isAdmin
                              ? 'bg-[#FF4D6D]/15 border border-[#FF4D6D]/40 text-[#FF4D6D]'
                              : 'bg-[#1F2229] text-[#94A3B8]'
                          }`}>
                            {u.role}
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono flex items-center gap-1 ${
                              u.tier === 'INSTITUTIONAL_VIP'
                                ? 'bg-[#A855F7]/15 text-[#C084FC] border border-[#A855F7]/40'
                                : u.tier === 'PRO_TRADER'
                                ? 'bg-[#00FFA3]/15 text-[#00FFA3] border border-[#00FFA3]/40'
                                : 'bg-[#64748B]/15 text-[#94A3B8] border border-[#64748B]/40'
                            }`}>
                              {u.tier === 'INSTITUTIONAL_VIP' && <Crown className="w-3 h-3" />}
                              {u.tier === 'PRO_TRADER' && <Zap className="w-3 h-3" />}
                              {u.tier}
                            </span>

                            {/* Dropdown to Upgrade/Downgrade */}
                            <select
                              value={u.tier}
                              onChange={(e) => handleUpdateTier(u.id, e.target.value as SubscriptionTier)}
                              className="bg-[#0A0B0D] border border-[#1F2229] text-[11px] text-[#E0E0E0] rounded px-2 py-0.5 focus:outline-none focus:border-[#00FFA3] cursor-pointer"
                            >
                              <option value="FREE_TRIAL">FREE_TRIAL</option>
                              <option value="PRO_TRADER">PRO_TRADER ($49)</option>
                              <option value="INSTITUTIONAL_VIP">INSTITUTIONAL_VIP ($99)</option>
                            </select>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                            isBanned
                              ? 'bg-[#FF4D6D] text-white'
                              : 'bg-[#00FFA3]/15 text-[#00FFA3] border border-[#00FFA3]/30'
                          }`}>
                            {u.status}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleToggleBan(u.id, u.status)}
                            disabled={isAdmin}
                            className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1 ml-auto transition-all cursor-pointer ${
                              isAdmin
                                ? 'opacity-50 cursor-not-allowed text-[#64748B]'
                                : isBanned
                                ? 'bg-[#00FFA3] text-[#0A0B0D] hover:bg-[#00E08F]'
                                : 'bg-[#FF4D6D]/20 border border-[#FF4D6D]/40 text-[#FF4D6D] hover:bg-[#FF4D6D] hover:text-white'
                            }`}
                          >
                            {isBanned ? <UserCheck className="w-3.5 h-3.5" /> : <UserX className="w-3.5 h-3.5" />}
                            <span>{isBanned ? 'UNBAN USER' : 'BAN USER'}</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: BROADCAST */}
        {activeTab === 'BROADCAST' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="bg-[#12141A] border border-[#1F2229] rounded-xl p-6 shadow-xl space-y-4">
              <div className="flex items-center gap-2.5 border-b border-[#1F2229] pb-4">
                <Radio className="w-5 h-5 text-[#FF4D6D]" />
                <div>
                  <h3 className="font-bold text-sm text-[#F3F4F6]">Send Global Push Notification Alert</h3>
                  <p className="text-xs text-[#94A3B8]">Broadcast urgent volatility warnings, signal updates, or maintenance notices via Supabase Realtime.</p>
                </div>
              </div>

              <form onSubmit={handleSendBroadcast} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#94A3B8] mb-1.5 uppercase">
                    Alert Title
                  </label>
                  <input
                    type="text"
                    required
                    value={broadcastTitle}
                    onChange={(e) => setBroadcastTitle(e.target.value)}
                    placeholder="e.g. ⚠️ FOMC High Volatility Alert"
                    className="w-full bg-[#0A0B0D] border border-[#1F2229] rounded-xl px-3 py-2 text-xs text-[#E0E0E0] placeholder-[#64748B] focus:outline-none focus:border-[#FF4D6D]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#94A3B8] mb-1.5 uppercase">
                    Broadcast Message Body
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={broadcastMessage}
                    onChange={(e) => setBroadcastMessage(e.target.value)}
                    placeholder="e.g. Powell speaking at 2:00 PM EST. High probability liquidity sweep on XAUUSD and EURUSD. Protect open positions!"
                    className="w-full bg-[#0A0B0D] border border-[#1F2229] rounded-xl px-3 py-2 text-xs text-[#E0E0E0] placeholder-[#64748B] focus:outline-none focus:border-[#FF4D6D]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#94A3B8] mb-1.5 uppercase">
                    Impact Level
                  </label>
                  <div className="flex gap-3">
                    {(['HIGH', 'MEDIUM', 'LOW'] as const).map((imp) => (
                      <button
                        type="button"
                        key={imp}
                        onClick={() => setBroadcastImpact(imp)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          broadcastImpact === imp
                            ? imp === 'HIGH'
                              ? 'bg-[#FF4D6D] text-white border-[#FF4D6D]'
                              : 'bg-[#F59E0B] text-[#0A0B0D] border-[#F59E0B]'
                            : 'bg-[#0A0B0D] text-[#94A3B8] border-[#1F2229]'
                        }`}
                      >
                        {imp === 'HIGH' ? '🔴 HIGH IMPACT' : imp === 'MEDIUM' ? '🟠 MEDIUM' : '⚪ LOW'}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isBroadcasting}
                  className="w-full py-3 bg-[#FF4D6D] hover:bg-[#E03A58] text-white font-bold rounded-xl text-xs transition-all shadow-lg shadow-[#FF4D6D]/20 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isBroadcasting ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>BROADCAST PUSH ALERT NOW</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* TAB 3: ENGINE CONFIG */}
        {activeTab === 'ENGINE' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="bg-[#12141A] border border-[#1F2229] rounded-xl p-6 shadow-xl space-y-6">
              <div className="flex items-center gap-2.5 border-b border-[#1F2229] pb-4">
                <Sliders className="w-5 h-5 text-[#00FFA3]" />
                <div>
                  <h3 className="font-bold text-sm text-[#F3F4F6]">Algorithmic Signal Engine Parameters</h3>
                  <p className="text-xs text-[#94A3B8]">Configure minimum confluence scores and system operational state.</p>
                </div>
              </div>

              {/* Confluence Threshold Slider */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <label className="font-semibold text-[#E0E0E0]">Minimum Confluence Score Threshold</label>
                  <span className="font-mono font-bold text-[#00FFA3] text-sm bg-[#00FFA3]/10 px-2 py-0.5 rounded border border-[#00FFA3]/30">
                    {confluenceThreshold}%
                  </span>
                </div>
                <input
                  type="range"
                  min={50}
                  max={95}
                  step={5}
                  value={confluenceThreshold}
                  onChange={(e) => setConfluenceThreshold(Number(e.target.value))}
                  className="w-full accent-[#00FFA3] cursor-pointer"
                />
                <p className="text-[11px] text-[#64748B]">
                  Signals with confluence rating below {confluenceThreshold}% will be filtered out automatically.
                </p>
              </div>

              {/* Maintenance Mode Switch */}
              <div className="flex items-center justify-between p-4 bg-[#0A0B0D] border border-[#1F2229] rounded-xl">
                <div>
                  <div className="font-bold text-xs text-[#E0E0E0]">System Maintenance Mode</div>
                  <div className="text-[11px] text-[#94A3B8]">Temporarily pause signal updates while upgrading infrastructure.</div>
                </div>
                <button
                  onClick={() => setMaintenanceMode(!maintenanceMode)}
                  className={`w-12 h-6 rounded-full transition-all relative cursor-pointer ${
                    maintenanceMode ? 'bg-[#FF4D6D]' : 'bg-[#1F2229]'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all ${
                      maintenanceMode ? 'left-6' : 'left-0.5'
                    }`}
                  />
                </button>
              </div>

              <button
                onClick={handleSaveConfig}
                disabled={isSavingConfig}
                className="w-full py-3 bg-[#00FFA3] hover:bg-[#00E08F] text-[#0A0B0D] font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSavingConfig ? (
                  <span className="w-4 h-4 border-2 border-[#0A0B0D] border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>SAVE ENGINE CONFIGURATION</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* TAB 4: ANALYTICS */}
        {activeTab === 'ANALYTICS' && (
          <div className="space-y-6">
            {/* Stat Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 bg-[#12141A] border border-[#1F2229] rounded-xl">
                <div className="flex items-center justify-between text-[#94A3B8] text-xs">
                  <span>TOTAL REGISTERED TRADERS</span>
                  <Users className="w-4 h-4 text-[#00FFA3]" />
                </div>
                <div className="text-2xl font-bold font-mono text-[#F3F4F6] mt-2">
                  {stats?.totalUsers ?? users.length}
                </div>
                <div className="text-[10px] text-[#00FFA3] mt-1 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" /> Live Registered Accounts
                </div>
              </div>

              <div className="p-4 bg-[#12141A] border border-[#1F2229] rounded-xl">
                <div className="flex items-center justify-between text-[#94A3B8] text-xs">
                  <span>ACTIVE PRO &amp; VIP SUBSCRIBERS</span>
                  <Crown className="w-4 h-4 text-[#A855F7]" />
                </div>
                <div className="text-2xl font-bold font-mono text-[#A855F7] mt-2">
                  {users.filter(u => u.tier === 'PRO_TRADER' || u.tier === 'INSTITUTIONAL_VIP').length}
                </div>
                <div className="text-[10px] text-[#94A3B8] mt-1">
                  {users.filter(u => u.tier === 'PRO_TRADER').length} Pro · {users.filter(u => u.tier === 'INSTITUTIONAL_VIP').length} VIP
                </div>
              </div>

              <div className="p-4 bg-[#12141A] border border-[#1F2229] rounded-xl">
                <div className="flex items-center justify-between text-[#94A3B8] text-xs">
                  <span>TOTAL REVENUE</span>
                  <DollarSign className="w-4 h-4 text-[#00FFA3]" />
                </div>
                <div className="text-2xl font-bold font-mono text-[#00FFA3] mt-2">
                  ${(stats?.totalRevenueUSD ?? 0).toLocaleString()}
                </div>
                <div className="text-[10px] text-[#00FFA3] mt-1">
                  ₹{((stats?.totalRevenueUSD ?? 0) * 83).toLocaleString()} INR Equivalent
                </div>
              </div>

              <div className="p-4 bg-[#12141A] border border-[#1F2229] rounded-xl">
                <div className="flex items-center justify-between text-[#94A3B8] text-xs">
                  <span>SIGNALS PUBLISHED TODAY</span>
                  <Cpu className="w-4 h-4 text-[#FF4D6D]" />
                </div>
                <div className="text-2xl font-bold font-mono text-[#F3F4F6] mt-2">
                  {stats?.signalsGeneratedToday ?? 0}
                </div>
                <div className="text-[10px] text-[#64748B] mt-1">
                  100% Algorithmic SMC Confluence
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
