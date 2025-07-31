"use client";

import { Stack } from "@mui/material";
import Head from "next/head";
import { useSearchParams } from "next/navigation";

import { usePaymentOrder } from "@app/lib/hooks/use-payment-order";
import { StructuredData } from "@app/shared/components/seo";
import { QueryWrapper } from "@app/shared/components/ui/query-wrapper";

import { PaymentSuccessActionsSection } from "./sections/payment-success-actions";
import { PaymentSuccessDetailsSection } from "./sections/payment-success-details";
import { PaymentSuccessHeroSection } from "./sections/payment-success-hero";

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
