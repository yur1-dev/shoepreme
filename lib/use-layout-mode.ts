"use client";

import { useState, useEffect } from "react";

export const MOBILE_BREAKPOINT = 768;
export const TABLET_BREAKPOINT = 1024;

interface LayoutMode {
  isMobile: boolean;
  isTablet: boolean;
  isMobileOrTablet: boolean;
}

export function useLayoutMode(): LayoutMode {
  const [layout, setLayout] = useState<LayoutMode>({
    isMobile: false,
    isTablet: false,
    isMobileOrTablet: false,
  });

  useEffect(() => {
    function computeLayout() {
      const width = window.innerWidth;
      const isMobile = width < MOBILE_BREAKPOINT;
      const isTablet = width >= MOBILE_BREAKPOINT && width < TABLET_BREAKPOINT;
      setLayout({
        isMobile,
        isTablet,
        isMobileOrTablet: isMobile || isTablet,
      });
    }

    computeLayout();
    window.addEventListener("resize", computeLayout);
    return () => window.removeEventListener("resize", computeLayout);
  }, []);

  return layout;
}
