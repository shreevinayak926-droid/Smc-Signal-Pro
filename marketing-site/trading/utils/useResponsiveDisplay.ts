import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';

export interface DisplayInfo {
  width: number;
  height: number;
  isNative: boolean;
  platform: 'android' | 'ios' | 'web';
  isMobile: boolean;
  isSmallMobile: boolean;
  isNormalMobile: boolean;
  isLargeMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isMobileOrTablet: boolean;
  orientation: 'portrait' | 'landscape';
  displayMode: 'small-mobile' | 'mobile' | 'tablet' | 'desktop';
  hasTouch: boolean;
}

const getDisplayInfo = (): DisplayInfo => {
  const width = typeof window !== 'undefined' ? window.innerWidth : 384;
  const height = typeof window !== 'undefined' ? window.innerHeight : 848;
  
  let isNative = false;
  let platform: 'android' | 'ios' | 'web' = 'web';

  try {
    isNative = Capacitor.isNativePlatform();
    platform = Capacitor.getPlatform() as 'android' | 'ios' | 'web';
  } catch {
    isNative = false;
    platform = 'web';
  }

  // Detect display categories: Mobile (< 768px or native), Tablet (768px-1023px), Desktop (>= 1024px)
  const isSmallMobile = width <= 384;
  const isNormalMobile = width > 384 && width <= 430;
  const isLargeMobile = width > 430 && width < 768;
  const isTablet = width >= 768 && width < 1024 && !isNative;
  const isDesktop = width >= 1024 && !isNative;
  const isMobile = width < 768 || isNative;
  const isMobileOrTablet = width < 1024 || isNative;

  const orientation: 'portrait' | 'landscape' = width > height ? 'landscape' : 'portrait';

  let displayMode: 'small-mobile' | 'mobile' | 'tablet' | 'desktop' = 'mobile';
  if (isSmallMobile) displayMode = 'small-mobile';
  else if (isTablet) displayMode = 'tablet';
  else if (isDesktop) displayMode = 'desktop';

  const hasTouch = typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);

  return {
    width,
    height,
    isNative,
    platform,
    isMobile,
    isSmallMobile,
    isNormalMobile,
    isLargeMobile,
    isTablet,
    isDesktop,
    isMobileOrTablet,
    orientation,
    displayMode,
    hasTouch,
  };
};

export const useResponsiveDisplay = (): DisplayInfo => {
  const [displayInfo, setDisplayInfo] = useState<DisplayInfo>(getDisplayInfo);

  useEffect(() => {
    const handleResize = () => {
      setDisplayInfo(getDisplayInfo());
    };

    window.addEventListener('resize', handleResize, { passive: true });
    window.addEventListener('orientationchange', handleResize, { passive: true });
    
    // Also observe screen orientation if available
    if (typeof window !== 'undefined' && window.screen?.orientation) {
      window.screen.orientation.addEventListener('change', handleResize);
    }

    // Immediate sync on mount
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      if (typeof window !== 'undefined' && window.screen?.orientation) {
        window.screen.orientation.removeEventListener('change', handleResize);
      }
    };
  }, []);

  return displayInfo;
};
