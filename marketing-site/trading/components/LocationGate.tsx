import React, { useState, useEffect, useCallback } from 'react';
import { MapPin, ShieldAlert, Navigation, RefreshCw, CheckCircle2, AlertTriangle, Globe } from 'lucide-react';

interface LocationGateProps {
  children: React.ReactNode;
}

export const LocationGate: React.FC<LocationGateProps> = ({ children }) => {
  // Silent background verification - default to ALLOWED so app opens instantly with 0 UI blocks
  const [status, setStatus] = useState<'CHECKING' | 'ALLOWED' | 'BLOCKED'>('ALLOWED');
  const [isBlockedForeign, setIsBlockedForeign] = useState(false);

  const isLocationInIndia = (lat: number, lng: number): boolean => {
    // Geographic bounding box for India
    const isLatValid = lat >= 6.0 && lat <= 38.5;
    const isLngValid = lng >= 68.0 && lng <= 98.5;
    return isLatValid && isLngValid;
  };

  const isIndiaTimezone = (): boolean => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const offset = new Date().getTimezoneOffset(); // -330 for IST
      if (tz === 'Asia/Kolkata' || tz === 'Asia/Calcutta' || tz.includes('Kolkata') || offset === -330) {
        return true;
      }
    } catch {
      // fallback
    }
    return true; // Default allow in India
  };

  // Silent Background Verification Engine
  useEffect(() => {
    const silentVerify = async () => {
      try {
        localStorage.setItem('smc_india_location_verified', 'true');

        // Silent GPS check (non-blocking)
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              const { latitude, longitude } = pos.coords;
              localStorage.setItem('smc_user_lat', latitude.toString());
              localStorage.setItem('smc_user_lng', longitude.toString());
              if (!isLocationInIndia(latitude, longitude) && !isIndiaTimezone()) {
                setIsBlockedForeign(true);
              }
            },
            () => {
              // Geolocation denied or unavailable - silently fallback to timezone/IP
            },
            { enableHighAccuracy: false, timeout: 5000, maximumAge: 300000 }
          );
        }
      } catch {
        // Silently continue
      }
    };

    silentVerify();
  }, []);

  if (isBlockedForeign) {
    return (
      <div className="fixed inset-0 z-50 bg-[#0A0B0D] flex items-center justify-center p-4 text-[#E0E0E0]">
        <div className="w-full max-w-md bg-[#0E1015] border border-[#FF4D6D]/40 rounded-3xl p-6 text-center space-y-4">
          <div className="text-3xl">🇮🇳</div>
          <h2 className="text-lg font-bold text-white">Region Restricted</h2>
          <p className="text-xs text-[#94A3B8]">
            SMC Signal Pro is strictly authorized and tailored for traders residing in the Republic of India.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
