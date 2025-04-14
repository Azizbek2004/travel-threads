"use client";

import { useState, useEffect } from "react";

const MOBILE_MAX_WIDTH = 768;
const TABLET_MAX_WIDTH = 1024;

export const useMobile = () => {
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    function handleResize() {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }

    window.addEventListener("resize", handleResize);
    handleResize(); // Call on mount to set initial value

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isMobile = windowSize.width <= MOBILE_MAX_WIDTH;
  const isTablet =
    windowSize.width > MOBILE_MAX_WIDTH && windowSize.width <= TABLET_MAX_WIDTH;
  const isMobileOrTablet = isMobile || isTablet;

  return { isMobile, isTablet, isMobileOrTablet };
};
