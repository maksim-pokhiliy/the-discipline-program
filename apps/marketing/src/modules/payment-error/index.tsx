"use client";

import { Stack } from "@mui/material";
import { useSearchParams } from "next/navigation";

import { QueryWrapper } from "@repo/ui";

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

  const errorData = {
    error,
    orderId,
    timestamp: new Date().toISOString(),
  };

  return (
    <QueryWrapper
      isLoading={false}
      error={null}
      data={errorData}
      loadingMessage="Loading error details..."
    >
      {(data) => (
        <>
          <StructuredData type="website" />

          <Stack spacing={0}>
            <PaymentErrorHeroSection />
            <PaymentErrorDetailsSection error={data.error} orderId={data.orderId} />
            <PaymentErrorActionsSection />
          </Stack>
        </>
      )}
    </QueryWrapper>
  );
};
