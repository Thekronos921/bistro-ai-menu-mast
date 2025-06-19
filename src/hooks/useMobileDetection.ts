
import { useState, useEffect } from 'react';

interface MobileDetection {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  screenSize: 'mobile' | 'tablet' | 'desktop';
  touchDevice: boolean;
}

export const useMobileDetection = (): MobileDetection => {
  const [detection, setDetection] = useState<MobileDetection>({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    screenSize: 'desktop',
    touchDevice: false
  });

  useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth;
      const touchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      
      const isMobile = width < 768;
      const isTablet = width >= 768 && width < 1024;
      const isDesktop = width >= 1024;
      
      let screenSize: 'mobile' | 'tablet' | 'desktop' = 'desktop';
      if (isMobile) screenSize = 'mobile';
      else if (isTablet) screenSize = 'tablet';
      
      setDetection({
        isMobile,
        isTablet,
        isDesktop,
        screenSize,
        touchDevice
      });
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);
    
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  return detection;
};
