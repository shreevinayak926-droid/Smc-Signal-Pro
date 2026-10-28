import React from 'react';
import { PushAlert } from '../types';
import { Bell, BellOff, Volume2, VolumeX, CheckCircle2, AlertTriangle, Zap, Calendar, X, Trash2 } from 'lucide-react';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  alerts: PushAlert[];
  onClearAll: () => void;
  onMarkRead: (id: string) => void;
}

// Synthesize pleasant notification chime using Web Audio API
export function playNotificationChime() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880.00, ctx.currentTime + 0.15); // A5

    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch (e) {
    // ignore audio block
  }
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  isOpen,
  onClose,
  alerts,
  onClearAll,
  onMarkRead,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-sm bg-[#0E1015] border-l border-[#1F2229] shadow-2xl flex flex-col text-[#E0E0E0] animate-slideLeft">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5 bg-[#12141A] border-b border-[#1F2229]">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-[#00FFA3]" />
          <h3 className="font-bold text-sm text-[#F3F4F6]">Live Push Notifications</h3>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#0A0B0D] text-[#94A3B8] border border-[#1F2229]">
            {alerts.length}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={onClearAll}
            title="Clear all alerts"
            className="p-1.5 text-[#94A3B8] hover:text-[#FF4D6D] rounded hover:bg-[#1A1D26]"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 text-[#94A3B8] hover:text-[#E0E0E0] rounded hover:bg-[#1A1D26]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="flex-1 p-3 overflow-y-auto space-y-2.5">
        {alerts.length === 0 ? (
          <div className="text-center py-16 text-[#64748B] text-xs">
            <BellOff className="w-8 h-8 mx-auto mb-2 opacity-40 text-[#64748B]" />
            <p>No active alerts right now.</p>
            <p className="text-[10px] text-[#64748B] mt-1">High-impact economic events and SMC signals will appear here in real-time.</p>
          </div>
        ) : (
          alerts.map((alert) => {
            const isHigh = alert.impact === 'HIGH';
            const isSignal = alert.type === 'SIGNAL';
            const isNews = alert.type === 'NEWS';

            return (
              <div
                key={alert.id}
                onClick={() => onMarkRead(alert.id)}
                className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                  !alert.read
                    ? isHigh
                      ? 'bg-[#12141A] border-[#FF4D6D]/40 shadow-sm'
                      : isSignal
                      ? 'bg-[#12141A] border-[#00FFA3]/40 shadow-sm'
                      : 'bg-[#12141A] border-[#1F2229]'
                    : 'bg-[#0A0B0D] border-[#1F2229] opacity-70'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {isNews ? (
                      <Calendar className="w-4 h-4 text-[#FF4D6D] shrink-0" />
                    ) : isSignal ? (
                      <Zap className="w-4 h-4 text-[#00FFA3] shrink-0" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-[#00FFA3] shrink-0" />
                    )}
                    <span className="font-bold text-[#F3F4F6]">{alert.title}</span>
                  </div>

                  <span className="text-[9px] font-mono text-[#64748B]">
                    {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <p className="text-[#94A3B8] mt-1 text-[11px] leading-relaxed pl-6">
                  {alert.message}
                </p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
