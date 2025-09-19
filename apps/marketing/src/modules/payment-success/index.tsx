"use client";

import { Stack } from "@mui/material";
import Head from "next/head";
import { useSearchParams } from "next/navigation";

import { usePaymentOrder } from "@app/lib/hooks";
import { StructuredData } from "@app/shared/components/seo";
import { QueryWrapper } from "@app/shared/components/ui";

import {
  PaymentSuccessActionsSection,
  PaymentSuccessDetailsSection,
  PaymentSuccessHeroSection,
} from "./sections";

export const PaymentSuccessPage = () => {
  const searchParams = useSearchParams();

  const orderId = searchParams.get("orderId");

  const { data, isLoading, error } = usePaymentOrder(orderId);

  return (
    <QueryWrapper
      isLoading={isLoading}
      error={error}
      data={data}
      loadingMessage="Loading payment details..."
    >
      {(order) => (
        <>
          <Head>
            <StructuredData type="website" />
          </Head>

          <Stack spacing={0}>
            <PaymentSuccessHeroSection />
            <PaymentSuccessDetailsSection order={order} />
            <PaymentSuccessActionsSection />
          </Stack>
        </>
      )}
    </QueryWrapper>
  );
};
