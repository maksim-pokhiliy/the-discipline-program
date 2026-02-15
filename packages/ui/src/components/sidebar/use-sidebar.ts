"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "sidebar-expanded";

export const useSidebar = () => {
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);

    if (stored !== null) {
      setExpanded(stored === "true");
    }
  }, []);

  const toggle = useCallback(() => {
    setExpanded((prev) => {
      const next = !prev;

      localStorage.setItem(STORAGE_KEY, String(next));

      return next;
    });
  }, []);

  return { expanded, toggle };
};
