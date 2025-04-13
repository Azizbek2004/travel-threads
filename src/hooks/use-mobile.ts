"use client"

import { useState, useEffect } from "react"

export function useMobile() {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== "undefined" ? window.innerWidth : 0,
    height: typeof window !== "undefined" ? window.innerHeight : 0,
  })

  useEffect(() => {
    // Handler to call on window resize
    function handleResize() {
      // Set window width/height to state
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }

    // Add event listener
    window.addEventListener("resize", handleResize)

    // Call handler right away so state gets updated with initial window size
    handleResize()

    // Remove event listener on cleanup
    return () => window.removeEventListener("resize", handleResize)
  }, []) // Empty array ensures that effect is only run on mount and unmount

  // Define breakpoints that match Material UI's default breakpoints
  const isMobile = windowSize.width < 600 // xs
  const isTablet = windowSize.width >= 600 && windowSize.width < 960 // sm to md
  const isDesktop = windowSize.width >= 960 // md and above
  const isMobileOrTablet = windowSize.width < 960 // xs to sm

  return {
    windowSize,
    isMobile,
    isTablet,
    isDesktop,
    isMobileOrTablet,
  }
}
