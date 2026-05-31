"use client";

import { useContext } from "react";

import { CatalogContext, type CatalogContextValue } from "@app/lib/contexts";

export const useCatalog = (): CatalogContextValue => {
  const ctx = useContext(CatalogContext);

  if (ctx === null) {
    throw new Error("useCatalog must be used within CatalogProvider");
  }

  return ctx;
};
