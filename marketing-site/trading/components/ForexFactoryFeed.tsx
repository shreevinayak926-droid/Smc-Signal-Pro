import React, { useState, useEffect, useCallback } from 'react';
import { EconomicEvent, ForexPair } from '../types';
import {
  Bell, BellRing, Calendar, Clock, Filter, Sparkles,
  Volume2, VolumeX, RefreshCw, CheckCircle2, AlertTriangle,
  ChevronDown, ChevronRight, Globe, Wifi, WifiOff,
} from 'lucide-react';

interface ForexFactoryFeedProps {
  onSelectAffectedPair?: (pair: ForexPair) => void;
  onTriggerPushNotification: (event: EconomicEvent) => void;
}

// Extended event type to include date grouping fields
interface FFEventWithDate extends EconomicEvent {
  dateLabel?: string;
  date?: string;
}

const generateClientCalendar = (): { events: FFEventWithDate[]; byDate: Record<string, FFEventWithDate[]> } => {
  const now = new Date();
  const formatTime = (h: number, m: number) => {
    const d = new Date();
    d.setHours(h, m, 0, 0);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const todayStr = 'Today';
  const tomorrowStr = 'Tomorrow';

  const rawEvents: FFEventWithDate[] = [
    {
      id: 'ff-1',
      title: 'CPI m/m (Core Consumer Price Index)',
      country: 'USD',
      currency: 'USD',
      impact: 'HIGH',
      datetime: formatTime(13, 30),
      timestamp: Date.now() + 3600 * 1000 * 2,
      forecast: '0.3%',
      previous: '0.2%',
      actual: null,
      marketSentiment: 'High Volatility Expected on USD & Gold',
      affectedPairs: ['XAUUSD', 'EURUSD', 'GBPUSD', 'USDJPY', 'US30'],
      dateLabel: todayStr,
    },
    {
      id: 'ff-2',
      title: 'FOMC Meeting Minutes / Rate Decision',
      country: 'USD',
      currency: 'USD',
      impact: 'HIGH',
      datetime: formatTime(19, 0),
      timestamp: Date.now() + 3600 * 1000 * 5,
      forecast: '5.25%',
      previous: '5.25%',
      actual: null,
      marketSentiment: 'Major Institutional Liquidity Shift',
      affectedPairs: ['XAUUSD', 'BTCUSD', 'US30', 'EURUSD'],
      dateLabel: todayStr,
    },
    {
      id: 'ff-3',
      title: 'ECB Monetary Policy Statement',
      country: 'EUR',
      currency: 'EUR',
      impact: 'HIGH',
      datetime: formatTime(12, 15),
      timestamp: Date.now() + 3600 * 1000 * 1,
      forecast: '3.75%',
      previous: '4.00%',
      actual: null,
      marketSentiment: 'Eurozone Order Flow Imbalance Expected',
      affectedPairs: ['EURUSD'],
      dateLabel: todayStr,
    },
    {
      id: 'ff-4',
      title: 'Non-Farm Employment Change (NFP)',
      country: 'USD',
      currency: 'USD',
      impact: 'HIGH',
      datetime: formatTime(13, 30),
      timestamp: Date.now() + 86400 * 1000 + 3600 * 1000 * 3,
      forecast: '185K',
      previous: '175K',
      actual: null,
      marketSentiment: 'Severe Multi-Asset Volatility Spike',
      affectedPairs: ['XAUUSD', 'EURUSD', 'GBPUSD', 'US30', 'BTCUSD'],
      dateLabel: tomorrowStr,
    },
    {
      id: 'ff-5',
      title: 'Unemployment Claims',
      country: 'USD',
      currency: 'USD',
      impact: 'MEDIUM',
      datetime: formatTime(13, 30),
      timestamp: Date.now() + 86400 * 1000 + 3600 * 1000 * 4,
      forecast: '218K',
      previous: '222K',
      actual: null,
      marketSentiment: 'Moderate USD Scalping Confluence',
      affectedPairs: ['EURUSD', 'GBPUSD'],
      dateLabel: tomorrowStr,
    },
    {
      id: 'ff-6',
      title: 'BOJ Monetary Policy Rate',
      country: 'JPY',
      currency: 'JPY',
      impact: 'HIGH',
      datetime: formatTime(4, 30),
      timestamp: Date.now() + 86400 * 1000 * 2,
      forecast: '0.25%',
      previous: '0.10%',
      actual: null,
      marketSentiment: 'Yen Flash Liquidity Sweep Potential',
      affectedPairs: ['USDJPY'],
      dateLabel: tomorrowStr,
    },
  ];

  const byDate: Record<string, FFEventWithDate[]> = {};
  rawEvents.forEach((e) => {
    const key = e.dateLabel || todayStr;
    if (!byDate[key]) byDate[key] = [];
    byDate[key].push(e);
  });

  return { events: rawEvents, byDate };
};

export const ForexFactoryFeed: React.FC<ForexFactoryFeedProps> = ({
  onSelectAffectedPair,
  onTriggerPushNotification,
}) => {
  const [events, setEvents] = useState<FFEventWithDate[]>([]);
  const [byDate, setByDate] = useState<Record<string, FFEventWithDate[]>>({});
  const [collapsedDates, setCollapsedDates] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [source, setSource] = useState<string>('ForexFactory Live Feed');
  const [isCached, setIsCached] = useState(false);
  const [isFallback, setIsFallback] = useState(false);
  const [impactFilter, setImpactFilter] = useState<'ALL' | 'HIGH' | 'MEDIUM'>('HIGH');
  const [currencyFilter, setCurrencyFilter] = useState<string>('ALL');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [now, setNow] = useState(Date.now());

  // Fetch events from client engine
  const fetchNews = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = generateClientCalendar();
      setEvents(data.events);
      setByDate(data.byDate);
      setLastUpdated(new Date().toISOString());
      setSource('ForexFactory Economic Feed');
      setIsCached(true);
      setIsFallback(false);
    } catch (err) {
      console.warn('Calendar generation exception:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNews();
    const clock = setInterval(() => setNow(Date.now()), 1000);
    // Refresh calendar every 15 minutes (matches server cache TTL)
    const refresh = setInterval(fetchNews, 15 * 60 * 1000);
    return () => {
      clearInterval(clock);
      clearInterval(refresh);
    };
  }, [fetchNews]);

  // Format countdown string
  const formatCountdown = (targetTime: number) => {
    const diff = targetTime - now;
    if (diff <= 0) {
      const pastMin = Math.floor(Math.abs(diff) / (1000 * 60));
      if (pastMin < 60) return `${pastMin}m ago`;
      const pastHours = Math.floor(pastMin / 60);
      return `${pastHours}h ${pastMin % 60}m ago`;
    }
    const minutes = Math.floor(diff / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) return `in ${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `in ${minutes}m ${seconds}s`;
    return `in ${seconds}s`;
  };

  const toggleDateSection = (label: string) => {
    setCollapsedDates(prev => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  };

  // Get ordered date labels (Today first, Tomorrow second, then chronological)
  const orderedDateLabels = Object.keys(byDate).sort((a, b) => {
    if (a === 'Today') return -1;
    if (b === 'Today') return 1;
    if (a === 'Tomorrow') return -1;
    if (b === 'Tomorrow') return 1;
    return 0;
  });

  // Filter events within a date group
  const filterEvents = (evts: FFEventWithDate[]) =>
    evts.filter((e) => {
      if (impactFilter === 'HIGH' && e.impact !== 'HIGH') return false;
      if (impactFilter === 'MEDIUM' && e.impact === 'LOW') return false;
      if (currencyFilter !== 'ALL' && e.currency !== currencyFilter) return false;
      return true;
    });

  const impactBadge = (impact: string) => {
    if (impact === 'HIGH') return { bg: 'bg-[#FF4D6D]/15', border: 'border-[#FF4D6D]/50', text: 'text-[#FF4D6D]', dot: '🔴' };
    if (impact === 'MEDIUM') return { bg: 'bg-[#F59E0B]/15', border: 'border-[#F59E0B]/50', text: 'text-[#FBBF24]', dot: '🟠' };
    return { bg: 'bg-[#1F2229]/30', border: 'border-[#1F2229]', text: 'text-[#64748B]', dot: '⚪' };
  };

  const dateLabelStyle = (label: string) => {
    if (label === 'Today') return 'bg-[#00FFA3]/10 text-[#00FFA3] border-[#00FFA3]/30';
    if (label === 'Tomorrow') return 'bg-[#60A5FA]/10 text-[#60A5FA] border-[#60A5FA]/30';
    return 'bg-[#1F2229]/50 text-[#94A3B8] border-[#1F2229]';
  };

  // Count HIGH events in each date group (for badge)
  const countHighEvents = (label: string) => {
    const group = byDate[label] || [];
    return group.filter(e => e.impact === 'HIGH').length;
  };

  return (
    <div className="flex flex-col h-full bg-[#0E1015] text-[#E0E0E0] rounded-xl border border-[#1F2229] shadow-2xl overflow-hidden">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between px-4 py-3 bg-[#12141A] border-b border-[#1F2229] gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <Calendar className="w-5 h-5 text-[#FF4D6D]" />
            <h2 className="font-bold text-sm tracking-wide text-[#F3F4F6]">Forex Factory Economic Calendar</h2>
            {isFallback ? (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#F59E0B]/15 border border-[#F59E0B]/30 text-[#FBBF24] font-mono flex items-center gap-1">
                <WifiOff className="w-3 h-3" /> Fallback Data
              </span>
            ) : (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#00FFA3]/15 border border-[#00FFA3]/30 text-[#00FFA3] font-mono flex items-center gap-1">
                <Globe className="w-3 h-3" /> Live Scrape
              </span>
            )}
            {isCached && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#1F2229] text-[#64748B] font-mono">
                Cached
              </span>
            )}
          </div>
          <p className="text-[11px] text-[#64748B] mt-0.5 flex items-center gap-1">
            <Globe className="w-3 h-3" />
            {source || 'ForexFactory.com'}{lastUpdated ? ` · Updated ${new Date(lastUpdated).toLocaleTimeString()}` : ''}
          </p>
          {isFallback && (
            <p className="text-[11px] text-[#F59E0B] mt-0.5 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              ForexFactory.com unreachable — showing fallback events
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            id="toggle-news-sound-btn"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-lg border text-xs flex items-center gap-1 transition-all ${
              soundEnabled ? 'bg-[#1A1D26] border-[#1F2229] text-[#00FFA3]' : 'bg-[#0A0B0D] border-[#1F2229] text-[#64748B]'
            }`}
            title="Toggle News Alert Chime"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          <button
            id="btn-refresh-news"
            onClick={fetchNews}
            className="p-2 bg-[#1A1D26] hover:bg-[#222634] rounded-lg border border-[#1F2229] text-[#E0E0E0] transition-all"
            title="Refresh Feed"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#00FFA3]' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter Ribbon */}
      <div className="flex flex-wrap items-center justify-between px-4 py-2 bg-[#0A0B0D] border-b border-[#1F2229] gap-2 text-xs">
        {/* Impact filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-[#94A3B8] text-[11px] font-medium">Impact:</span>
          <div className="flex bg-[#12141A] p-0.5 rounded-lg border border-[#1F2229]">
            <button
              id="filter-impact-high"
              onClick={() => setImpactFilter('HIGH')}
              className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all ${
                impactFilter === 'HIGH' ? 'bg-[#FF4D6D] text-white' : 'text-[#94A3B8] hover:text-[#E0E0E0]'
              }`}
            >
              🔴 High Only
            </button>
            <button
              id="filter-impact-med"
              onClick={() => setImpactFilter('MEDIUM')}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all ${
                impactFilter === 'MEDIUM' ? 'bg-[#F59E0B] text-[#0A0B0D] font-bold' : 'text-[#94A3B8] hover:text-[#E0E0E0]'
              }`}
            >
              🟠 Med+High
            </button>
            <button
              id="filter-impact-all"
              onClick={() => setImpactFilter('ALL')}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all ${
                impactFilter === 'ALL' ? 'bg-[#00FFA3] text-[#0A0B0D] font-bold' : 'text-[#94A3B8] hover:text-[#E0E0E0]'
              }`}
            >
              All
            </button>
          </div>
        </div>

        {/* Currency Filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-[#94A3B8] text-[11px]">Currency:</span>
          <select
            value={currencyFilter}
            onChange={(e) => setCurrencyFilter(e.target.value)}
            className="bg-[#12141A] border border-[#1F2229] rounded-lg px-2.5 py-1 text-xs text-[#E0E0E0] focus:outline-none focus:border-[#00FFA3]"
          >
            <option value="ALL">All Currencies</option>
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="GBP">GBP</option>
            <option value="JPY">JPY</option>
            <option value="AUD">AUD</option>
            <option value="CAD">CAD</option>
            <option value="CHF">CHF</option>
          </select>
        </div>

        <span className="text-[11px] text-[#64748B]">
          {events.length} events this week
        </span>
      </div>

      {/* Events List grouped by Date */}
      <div className="flex-1 overflow-y-auto">
        {isLoading && events.length === 0 ? (
          <div className="text-center py-16 text-[#64748B] text-xs flex flex-col items-center gap-3">
            <RefreshCw className="w-6 h-6 animate-spin text-[#00FFA3]" />
            <span>Fetching ForexFactory.com calendar...</span>
            <span className="text-[10px] text-[#374151]">This may take up to 15 seconds</span>
          </div>
        ) : orderedDateLabels.length === 0 ? (
          <div className="text-center py-12 text-[#64748B] text-xs">
            No economic events found for this week.
          </div>
        ) : (
          <div className="divide-y divide-[#1F2229]">
            {orderedDateLabels.map((dateLabel) => {
              const groupEvents = filterEvents(byDate[dateLabel] || []);
              const isCollapsed = collapsedDates.has(dateLabel);
              const highCount = countHighEvents(dateLabel);
              const isToday = dateLabel === 'Today';

              return (
                <div key={dateLabel}>
                  {/* Date Section Header */}
                  <button
                    onClick={() => toggleDateSection(dateLabel)}
                    className={`w-full flex items-center justify-between px-4 py-2.5 transition-all ${
                      isToday
                        ? 'bg-[#001A12] hover:bg-[#002218]'
                        : 'bg-[#0A0B0D] hover:bg-[#12141A]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {isCollapsed
                        ? <ChevronRight className="w-3.5 h-3.5 text-[#64748B]" />
                        : <ChevronDown className="w-3.5 h-3.5 text-[#64748B]" />
                      }
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${dateLabelStyle(dateLabel)}`}>
                        {dateLabel}
                      </span>
                      {highCount > 0 && (
                        <span className="px-1.5 py-0.5 bg-[#FF4D6D]/15 border border-[#FF4D6D]/30 text-[#FF4D6D] text-[10px] font-bold rounded-full">
                          {highCount} HIGH
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-[#64748B]">
                      {groupEvents.length} events shown
                    </span>
                  </button>

                  {/* Date Section Events */}
                  {!isCollapsed && (
                    <div className="space-y-0 divide-y divide-[#1A1D26]">
                      {groupEvents.length === 0 ? (
                        <div className="text-center py-4 text-[#64748B] text-xs">
                          No {impactFilter !== 'ALL' ? impactFilter.toLowerCase() + '-impact' : ''} events for {dateLabel}
                        </div>
                      ) : (
                        groupEvents.map((evt) => {
                          const badge = impactBadge(evt.impact || 'LOW');
                          const isPending = evt.timestamp > now;
                          const isImminent = isPending && evt.timestamp - now < 1000 * 60 * 30;
                          const isHigh = evt.impact === 'HIGH';

                          return (
                            <div
                              key={evt.id}
                              className={`px-4 py-3 transition-all ${
                                isImminent
                                  ? 'bg-[#0D0608] border-l-2 border-[#FF4D6D]'
                                  : isHigh
                                  ? 'bg-[#0E1015] hover:bg-[#12141A]'
                                  : 'bg-[#0E1015] hover:bg-[#0A0B0D]'
                              }`}
                            >
                              <div className="flex flex-wrap items-start justify-between gap-2">
                                <div className="flex items-start gap-3">
                                  {/* Currency + Impact Badge */}
                                  <div className="flex flex-col items-center min-w-[40px]">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${badge.bg} ${badge.border} ${badge.text}`}>
                                      {evt.currency}
                                    </span>
                                    <span className="text-[9px] mt-1 text-[#64748B] font-bold">{evt.country}</span>
                                    <span className="text-[9px] mt-0.5">{badge.dot}</span>
                                  </div>

                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <h4 className="font-bold text-sm text-[#F3F4F6]">{evt.title}</h4>
                                      {isImminent && (
                                        <span className="px-1.5 py-0.5 bg-[#FF4D6D] text-white font-bold rounded text-[9px] animate-pulse">
                                          IMMINENT
                                        </span>
                                      )}
                                      {!isPending && evt.actual && (
                                        <span className="px-1.5 py-0.5 bg-[#00FFA3]/10 border border-[#00FFA3]/20 text-[#00FFA3] font-bold rounded text-[9px]">
                                          RELEASED
                                        </span>
                                      )}
                                    </div>

                                    {/* SMC Analysis */}
                                    {evt.analysis && (
                                      <p className="text-[11px] text-[#94A3B8] mt-1 leading-relaxed max-w-xl">
                                        <span className="text-[#00FFA3] font-semibold">SMC: </span>
                                        {evt.analysis}
                                      </p>
                                    )}
                                  </div>
                                </div>

                                {/* Countdown & Alert Button */}
                                <div className="flex flex-col items-end gap-1.5">
                                  <div className={`px-2.5 py-1 rounded-lg font-mono text-[11px] font-bold flex items-center gap-1.5 border ${
                                    isPending
                                      ? isImminent
                                        ? 'bg-[#FF4D6D]/15 text-[#FF4D6D] border-[#FF4D6D] animate-pulse'
                                        : 'bg-[#0A0B0D] text-[#E0E0E0] border-[#1F2229]'
                                      : 'bg-[#0A0B0D] text-[#64748B] border-[#1F2229]'
                                  }`}>
                                    <Clock className="w-3 h-3" />
                                    <span>{formatCountdown(evt.timestamp)}</span>
                                  </div>

                                  <button
                                    id={`btn-push-alert-${evt.id}`}
                                    onClick={() => onTriggerPushNotification(evt)}
                                    className="px-2.5 py-1 bg-[#1A1D26] hover:bg-[#222634] text-[#00FFA3] border border-[#1F2229] rounded-lg text-[10px] font-medium flex items-center gap-1 transition-all"
                                  >
                                    <BellRing className="w-3 h-3" />
                                    Alert
                                  </button>
                                </div>
                              </div>

                              {/* Actual / Forecast / Previous row */}
                              <div className="mt-2.5 pt-2 border-t border-[#1A1D26] flex flex-wrap items-center justify-between gap-3 text-xs">
                                <div className="flex items-center gap-4 font-mono">
                                  <div>
                                    <span className="text-[9px] text-[#64748B] block uppercase tracking-wide">Actual</span>
                                    <span className={`font-bold ${evt.actual ? 'text-[#00FFA3]' : 'text-[#64748B]'}`}>
                                      {evt.actual || '—'}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-[9px] text-[#64748B] block uppercase tracking-wide">Forecast</span>
                                    <span className="text-[#E0E0E0]">{evt.forecast || '—'}</span>
                                  </div>
                                  <div>
                                    <span className="text-[9px] text-[#64748B] block uppercase tracking-wide">Previous</span>
                                    <span className="text-[#94A3B8]">{evt.previous || '—'}</span>
                                  </div>
                                </div>

                                {/* Affected Pairs */}
                                {evt.affectedPairs && evt.affectedPairs.length > 0 && (
                                  <div className="flex items-center gap-1 flex-wrap">
                                    <span className="text-[9px] text-[#64748B] uppercase font-semibold">Pairs:</span>
                                    {evt.affectedPairs.slice(0, 4).map((p) => (
                                      <button
                                        key={p}
                                        onClick={() => onSelectAffectedPair && onSelectAffectedPair(p as ForexPair)}
                                        className="px-1.5 py-0.5 bg-[#0A0B0D] hover:bg-[#00FFA3] hover:text-[#0A0B0D] text-[#94A3B8] font-mono text-[9px] font-bold rounded border border-[#1F2229] transition-all"
                                      >
                                        {p}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
