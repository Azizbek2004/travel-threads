'use client';

import { useState, useEffect } from 'react';

export function useMobile() {
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  useEffect(() => {
    // Handler to call on window resize
    function handleResize() {
      // Mobile devices (phones)
      setIsMobile(window.innerWidth < 768);
      // Tablet devices
      setIsTablet(window.innerWidth >= 768 && window.innerWidth < 991);
    }

    // Add event listener
    window.addEventListener('resize', handleResize);

    // Call handler right away so state gets updated with initial window size
    handleResize();

    // Remove event listener on cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return { isMobile, isTablet, isMobileOrTablet: isMobile || isTablet };
}
