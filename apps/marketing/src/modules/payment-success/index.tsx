"use client";

import { Stack } from "@mui/material";

import { StructuredData } from "@app/lib/components/seo";

import { PaymentSuccessActionsSection, PaymentSuccessHeroSection } from "./sections";

export const PaymentSuccessPage = () => (
  <>
    <StructuredData type="website" />

    <Stack spacing={0}>
      <PaymentSuccessHeroSection />
      <PaymentSuccessActionsSection />
    </Stack>
  </>
);
