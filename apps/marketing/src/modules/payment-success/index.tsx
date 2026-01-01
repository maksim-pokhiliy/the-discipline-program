"use client";

import { Stack } from "@mui/material";
import { QueryWrapper } from "@repo/query";
import Head from "next/head";
// import { useSearchParams } from "next/navigation";

import { StructuredData } from "@app/shared/components/seo";

import {
  PaymentSuccessActionsSection,
  // PaymentSuccessDetailsSection,
  PaymentSuccessHeroSection,
} from "./sections";

export const PaymentSuccessPage = () => {
  // const searchParams = useSearchParams();

  // const orderId = searchParams.get("orderId");

  const { data, isLoading, error } = { data: {}, isLoading: false, error: null };

  return (
    <QueryWrapper
      isLoading={isLoading}
      error={error}
      data={data}
      loadingMessage="Loading payment details..."
    >
      {/* eslint-disable-next-line @typescript-eslint/no-unused-vars */}
      {(order) => (
        <>
          <Head>
            <StructuredData type="website" />
          </Head>

          <Stack spacing={0}>
            <PaymentSuccessHeroSection />
            {/* <PaymentSuccessDetailsSection order={order as PaymentOrder} /> */}
            <PaymentSuccessActionsSection />
          </Stack>
        </>
      )}
    </QueryWrapper>
  );
};
