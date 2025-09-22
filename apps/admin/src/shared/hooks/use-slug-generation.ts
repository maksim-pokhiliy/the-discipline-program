"use client";

import { useState } from "react";

const generateSlug = (value: string): string => {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
};

export const useSlugGeneration = (value: string) => {
  const [isManuallyChanged, setIsManuallyChanged] = useState(false);

  const handleSlugManualChange = () => {
    setIsManuallyChanged(true);
  };

  const getAutoSlug = () => {
    if (isManuallyChanged) return "";

    return generateSlug(value);
  };

  return {
    isManuallyChanged,
    handleSlugManualChange,
    getAutoSlug,
  };
};
