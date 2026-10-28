import React, { useState, useEffect } from 'react';
import { SupportTicket, SupportMessage, User } from '../types';
import {
  supabaseGetSupportTickets,
  supabaseCreateSupportTicket,
  supabaseAddSupportMessage,
  supabaseSubscribeToSupportTickets,
} from '../services/supabaseDb';
import {
  HelpCircle,
  MessageSquare,
  Send,
  X,
  PlusCircle,
  CheckCircle2,
  Clock,
  Shield,
  Mail,
  Sparkles,
  ChevronRight,
  ArrowLeft,
} from 'lucide-react';

interface HelpSupportModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
}

export const HelpSupportModal: React.FC<HelpSupportModalProps> = ({
  isOpen,
  onClose,
  currentUser,
}) => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [activeTicket, setActiveTicket] = useState<SupportTicket | null>(null);
  const [viewMode, setViewMode] = useState<'LIST' | 'CHAT' | 'CREATE'>('LIST');

  // Form states
  const [newSubject, setNewSubject] = useState('');
  const [newCategory, setNewCategory] = useState<SupportTicket['category']>('GENERAL');
  const [newMessage, setNewMessage] = useState('');
  const [replyInput, setReplyInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const userEmail = currentUser?.email || 'guest@smcsignal.pro';
  const userName = currentUser?.name || 'Trader';

  // Load tickets
  const loadTickets = async () => {
    try {
      const allTickets = await supabaseGetSupportTickets();
      const userTickets = allTickets.filter(
        (t) => t.userEmail.toLowerCase() === userEmail.toLowerCase() || t.userId === currentUser?.id
      );
      setTickets(userTickets);
      if (activeTicket) {
        const refreshed = userTickets.find((t) => t.id === activeTicket.id);
        if (refreshed) setActiveTicket(refreshed);
      }
    } catch (e) {
      console.warn('Error loading support tickets:', e);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    loadTickets();

    const unsub = supabaseSubscribeToSupportTickets((allTickets) => {
      const userTickets = allTickets.filter(
        (t) => t.userEmail.toLowerCase() === userEmail.toLowerCase() || t.userId === currentUser?.id
      );
      setTickets(userTickets);
      if (activeTicket) {
        const refreshed = userTickets.find((t) => t.id === activeTicket.id);
        if (refreshed) setActiveTicket(refreshed);
      }
    });

    return () => {
      if (unsub) unsub();
    };
  }, [isOpen, userEmail, currentUser]);

  if (!isOpen) return null;

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubject.trim() || !newMessage.trim()) return;

    setIsSubmitting(true);
    const now = Date.now();
    const ticketId = `TICKET_${now}_${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const initialMsg: SupportMessage = {
      id: `MSG_${now}`,
      sender: 'USER',
      senderEmail: userEmail,
      senderName: userName,
      message: newMessage.trim(),
      timestamp: now,
    };

    const newTicket: SupportTicket = {
      id: ticketId,
      userId: currentUser?.id || 'guest',
      userEmail,
      userName,
      subject: newSubject.trim(),
      category: newCategory,
      status: 'OPEN',
      createdAt: now,
      updatedAt: now,
      lastMessage: newMessage.trim(),
      unreadByAdmin: true,
      unreadByUser: false,
      messages: [initialMsg],
    };

    await supabaseCreateSupportTicket(newTicket);
    setNewSubject('');
    setNewMessage('');
    setIsSubmitting(false);
    setActiveTicket(newTicket);
    setViewMode('CHAT');
    loadTickets();
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyInput.trim() || !activeTicket) return;

    const now = Date.now();
    const msg: SupportMessage = {
      id: `MSG_${now}`,
      sender: 'USER',
      senderEmail: userEmail,
      senderName: userName,
      message: replyInput.trim(),
      timestamp: now,
    };

    setReplyInput('');
    await supabaseAddSupportMessage(activeTicket.id, msg);
    loadTickets();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#0A0B0D]/85 backdrop-blur-md animate-fadeIn select-none">
      <div className="bg-[#0E1015] border border-[#1F2229] w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden text-[#E0E0E0] flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-[#12141A] border-b border-[#1F2229]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#00FFA3]/10 border border-[#00FFA3]/30 text-[#00FFA3] rounded-xl">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#F3F4F6]">Help &amp; Trading Desk Support</h3>
              <p className="text-[11px] text-[#94A3B8]">
                Direct live communication with SMC Signal Pro Administrators • <strong className="text-[#00FFA3]">smcsignalpro@gmail.com</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#94A3B8] hover:text-[#E0E0E0] p-1.5 rounded-lg hover:bg-[#1A1D26] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6">
          {viewMode === 'LIST' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-[#F3F4F6]">Your Support Tickets</h4>
                  <p className="text-xs text-[#94A3B8]">View administrator replies or ask questions about plans, charts &amp; signals</p>
                </div>
                <button
                  onClick={() => setViewMode('CREATE')}
                  className="px-3.5 py-1.5 bg-[#00FFA3] hover:bg-[#05D588] text-[#0A0B0D] font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-lg shadow-[#00FFA3]/20 transition-all cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>New Message</span>
                </button>
              </div>

              {tickets.length === 0 ? (
                <div className="text-center py-12 px-4 bg-[#12141A] border border-[#1F2229] rounded-2xl space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#00FFA3]/10 text-[#00FFA3] flex items-center justify-center mx-auto border border-[#00FFA3]/20">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <h5 className="font-bold text-sm text-[#F3F4F6]">No Support Inquiries Yet</h5>
                  <p className="text-xs text-[#94A3B8] max-w-sm mx-auto">
                    Have questions about the 24-hour trial, plan approvals, or SMC trade setups? Send a message to our trading desk admins!
                  </p>
                  <button
                    onClick={() => setViewMode('CREATE')}
                    className="px-4 py-2 bg-[#1A1D26] hover:bg-[#222736] text-[#00FFA3] border border-[#00FFA3]/30 font-bold text-xs rounded-xl transition-all cursor-pointer"
                  >
                    Open Support Ticket &rarr;
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {tickets.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => {
                        setActiveTicket(t);
                        setViewMode('CHAT');
                      }}
                      className="p-4 bg-[#12141A] hover:bg-[#161922] border border-[#1F2229] hover:border-[#00FFA3]/40 rounded-xl transition-all cursor-pointer flex items-center justify-between gap-3"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-[#F3F4F6] truncate">{t.subject}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-[#0A0B0D] text-[#94A3B8] border border-[#1F2229]">
                            {t.category}
                          </span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                              t.status === 'RESOLVED'
                                ? 'bg-[#00FFA3]/15 text-[#00FFA3] border border-[#00FFA3]/30'
                                : t.status === 'IN_PROGRESS'
                                ? 'bg-purple-500/15 text-purple-400 border border-purple-500/30'
                                : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                            }`}
                          >
                            {t.status}
                          </span>
                        </div>
                        <p className="text-xs text-[#94A3B8] truncate">{t.lastMessage}</p>
                        <span className="text-[10px] text-[#64748B]">
                          {new Date(t.updatedAt).toLocaleDateString()} at {new Date(t.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-[#64748B] shrink-0" />
                    </div>
                  ))}
                </div>
              )}

              {/* Official Email Dispatch Contact Card */}
              <div className="p-3.5 bg-[#0A0B0D] border border-[#1F2229] rounded-xl text-xs flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-[#94A3B8]">
                  <Mail className="w-4 h-4 text-[#00FFA3]" />
                  <span>Official Email: <strong className="text-[#E0E0E0]">smcsignalpro@gmail.com</strong></span>
                </div>
                <span className="text-[10px] text-[#64748B]">Response Time: &lt; 2 Hours</span>
              </div>
            </div>
          )}

          {viewMode === 'CREATE' && (
            <form onSubmit={handleCreateTicket} className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => setViewMode('LIST')}
                  className="p-1 text-[#94A3B8] hover:text-[#E0E0E0] hover:bg-[#1A1D26] rounded-lg cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <h4 className="font-bold text-sm text-[#F3F4F6]">Create New Support Inquiry</h4>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#94A3B8] mb-1.5">Subject</label>
                <input
                  type="text"
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  placeholder="e.g. Question regarding Pro Plan Approval / UTR"
                  required
                  className="w-full px-3.5 py-2.5 bg-[#12141A] border border-[#1F2229] rounded-xl text-xs text-[#F3F4F6] focus:border-[#00FFA3] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#94A3B8] mb-1.5">Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 bg-[#12141A] border border-[#1F2229] rounded-xl text-xs text-[#F3F4F6] focus:border-[#00FFA3] focus:outline-none"
                >
                  <option value="BILLING">Billing, Payment &amp; Plan Approval</option>
                  <option value="ACCOUNT">Account, Login &amp; 24H Trial</option>
                  <option value="SMC_SIGNALS">SMC Signals Hub &amp; VIP Desk</option>
                  <option value="TECHNICAL">Technical, Chart &amp; Indicators</option>
                  <option value="GENERAL">General Inquiries</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#94A3B8] mb-1.5">Detailed Message</label>
                <textarea
                  rows={4}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Describe your question in detail. Administrator will reply promptly in this thread."
                  required
                  className="w-full px-3.5 py-2.5 bg-[#12141A] border border-[#1F2229] rounded-xl text-xs text-[#F3F4F6] focus:border-[#00FFA3] focus:outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setViewMode('LIST')}
                  className="px-4 py-2 bg-[#1A1D26] hover:bg-[#222736] text-[#94A3B8] font-bold text-xs rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !newSubject.trim() || !newMessage.trim()}
                  className="px-5 py-2 bg-[#00FFA3] hover:bg-[#05D588] text-[#0A0B0D] font-bold text-xs rounded-xl shadow-lg shadow-[#00FFA3]/20 disabled:opacity-50 transition-all cursor-pointer"
                >
                  {isSubmitting ? 'Sending...' : 'Submit to Admin'}
                </button>
              </div>
            </form>
          )}

          {viewMode === 'CHAT' && activeTicket && (
            <div className="flex flex-col h-[520px]">
              {/* Chat Header */}
              <div className="flex items-center justify-between pb-3 border-b border-[#1F2229] mb-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setViewMode('LIST')}
                    className="p-1 text-[#94A3B8] hover:text-[#E0E0E0] hover:bg-[#1A1D26] rounded-lg cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <div>
                    <h4 className="font-bold text-xs text-[#F3F4F6]">{activeTicket.subject}</h4>
                    <span className="text-[10px] text-[#94A3B8] font-mono">ID: {activeTicket.id}</span>
                  </div>
                </div>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                    activeTicket.status === 'RESOLVED'
                      ? 'bg-[#00FFA3]/15 text-[#00FFA3] border border-[#00FFA3]/30'
                      : 'bg-purple-500/15 text-purple-400 border border-purple-500/30'
                  }`}
                >
                  {activeTicket.status}
                </span>
              </div>

              {/* Message Thread */}
              <div className="flex-1 min-h-0 overflow-y-auto space-y-3 pr-1">
                {activeTicket.messages?.map((msg) => {
                  const isMe = msg.sender === 'USER';
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                    >
                      <div className="flex items-center gap-1.5 mb-1 text-[10px] text-[#64748B]">
                        <span>{isMe ? 'You' : '🛡️ SMC Trading Desk Admin'}</span>
                        <span>•</span>
                        <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <div
                        className={`max-w-[85%] p-3 rounded-2xl text-xs leading-relaxed ${
                          isMe
                            ? 'bg-[#00FFA3] text-[#0A0B0D] rounded-tr-none font-medium'
                            : 'bg-[#161922] border border-[#1F2229] text-[#E0E0E0] rounded-tl-none'
                        }`}
                      >
                        {msg.message}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Reply Form */}
              <form onSubmit={handleSendReply} className="flex items-center gap-2 pt-3 border-t border-[#1F2229] mt-3">
                <input
                  type="text"
                  value={replyInput}
                  onChange={(e) => setReplyInput(e.target.value)}
                  placeholder="Type a message to admin..."
                  className="flex-1 px-3.5 py-2.5 bg-[#12141A] border border-[#1F2229] rounded-xl text-xs text-[#F3F4F6] focus:border-[#00FFA3] focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={!replyInput.trim()}
                  className="p-2.5 bg-[#00FFA3] hover:bg-[#05D588] text-[#0A0B0D] rounded-xl font-bold disabled:opacity-40 transition-all cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
