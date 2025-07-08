"use client";

import { Stack } from "@mui/material";
import Head from "next/head";
import { useSearchParams } from "next/navigation";

import { StructuredData } from "@app/shared/components/seo";
import { QueryWrapper } from "@app/shared/components/ui/query-wrapper";

import { PaymentErrorActionsSection } from "./components/payment-error-actions";
import { PaymentErrorDetailsSection } from "./components/payment-error-details";
import { PaymentErrorHeroSection } from "./components/payment-error-hero";

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
          <Head>
            <StructuredData type="website" />
          </Head>

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
