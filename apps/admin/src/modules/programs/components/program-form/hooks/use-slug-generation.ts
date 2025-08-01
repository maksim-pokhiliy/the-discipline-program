"use client";

import { useState } from "react";

const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
};

export const useSlugGeneration = (name: string) => {
  const [isManuallyChanged, setIsManuallyChanged] = useState(false);

  const handleSlugManualChange = () => {
    setIsManuallyChanged(true);
  };

  const getAutoSlug = () => {
    if (isManuallyChanged) return "";

    return generateSlug(name);
  };

  return {
    isManuallyChanged,
    handleSlugManualChange,
    getAutoSlug,
  };
};
