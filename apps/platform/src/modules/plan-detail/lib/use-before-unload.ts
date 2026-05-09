"use client";

import { useEffect } from "react";

const BEFORE_UNLOAD_EVENT = "beforeunload";

export const useBeforeUnload = (isDirty: boolean): void => {
  useEffect(() => {
    if (!isDirty) {
      return;
    }

    const handler = (event: BeforeUnloadEvent): void => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener(BEFORE_UNLOAD_EVENT, handler);

    return () => {
      window.removeEventListener(BEFORE_UNLOAD_EVENT, handler);
    };
  }, [isDirty]);
};
