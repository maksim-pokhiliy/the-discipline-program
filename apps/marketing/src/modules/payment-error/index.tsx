"use client";

import { Stack } from "@mui/material";
import { useSearchParams } from "next/navigation";

import { StructuredData } from "@app/lib/components/seo";

import {
  PaymentErrorActionsSection,
  PaymentErrorDetailsSection,
  PaymentErrorHeroSection,
} from "./sections";

export const PaymentErrorPage = () => {
  const searchParams = useSearchParams();

  const error = searchParams.get("error") || "Unknown error occurred";
  const orderId = searchParams.get("orderId");

  return (
    <>
      <StructuredData type="website" />

      <Stack spacing={0}>
        <PaymentErrorHeroSection />
        <PaymentErrorDetailsSection error={error} orderId={orderId} />
        <PaymentErrorActionsSection />
      </Stack>
    </>
  );
};
