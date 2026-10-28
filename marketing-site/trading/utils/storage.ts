import { AccountState, Position, TrialInfo, PushAlert } from '../types';

const STORAGE_KEYS = {
  ACCOUNT: 'smc_signal_account_state_v1',
  DEVICE_ID: 'smc_signal_device_fingerprint_v1',
  TRIAL: 'smc_signal_trial_v1',
  NOTIFICATIONS: 'smc_signal_alerts_v1',
  SETTINGS: 'smc_signal_user_settings_v1',
};

export const INITIAL_ACCOUNT_STATE: AccountState = {
  balance: 50000.00, // $50,000 Paper Trading Demo Account
  equity: 50000.00,
  margin: 0,
  freeMargin: 50000.00,
  marginLevel: 100,
  leverage: 100,
  positions: [],
  history: [],
};

export function getOrCreateDeviceFingerprint(): string {
  if (typeof window === 'undefined') return 'smc-device-server';
  let fp = localStorage.getItem(STORAGE_KEYS.DEVICE_ID);
  if (!fp) {
    const userAgent = navigator.userAgent.replace(/[^a-zA-Z0-9]/g, '').slice(0, 16);
    const screenRes = `${window.screen?.width || 1920}x${window.screen?.height || 1080}`;
    const rand = Math.random().toString(36).substring(2, 8);
    fp = `DEV_${userAgent}_${screenRes}_${rand}`;
    localStorage.setItem(STORAGE_KEYS.DEVICE_ID, fp);
  }
  return fp;
}

export function loadAccountState(): AccountState {
  if (typeof window === 'undefined') return INITIAL_ACCOUNT_STATE;
  try {
    const data = localStorage.getItem(STORAGE_KEYS.ACCOUNT);
    if (!data) return INITIAL_ACCOUNT_STATE;
    const parsed: AccountState = JSON.parse(data);
    if (parsed && Array.isArray(parsed.history)) {
      parsed.history = parsed.history.filter((h) => h.id !== 'demo-hist-1' && h.id !== 'demo-hist-2');
    }
    return parsed;
  } catch (e) {
    console.error('Failed to load account state', e);
    return INITIAL_ACCOUNT_STATE;
  }
}

export function saveAccountState(state: AccountState): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.ACCOUNT, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save account state', e);
  }
}

export function loadStoredTrial(): TrialInfo | null {
  if (typeof window === 'undefined') return null;
  try {
    const data = localStorage.getItem(STORAGE_KEYS.TRIAL);
    if (!data) return null;
    return JSON.parse(data);
  } catch (e) {
    return null;
  }
}

export function saveStoredTrial(trial: TrialInfo): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.TRIAL, JSON.stringify(trial));
  } catch (e) {
    console.error('Failed to save trial state', e);
  }
}

export function loadStoredAlerts(): PushAlert[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    if (!data) return [];
    return JSON.parse(data);
  } catch (e) {
    return [];
  }
}

export function saveStoredAlerts(alerts: PushAlert[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(alerts.slice(0, 50)));
  } catch (e) {
    console.error('Failed to save alerts', e);
  }
}
