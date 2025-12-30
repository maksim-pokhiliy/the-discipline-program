"use client";

import { Stack } from "@mui/material";
import { QueryWrapper } from "@repo/query";
import Head from "next/head";
import { useSearchParams } from "next/navigation";

import { StructuredData } from "@app/shared/components/seo";

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
