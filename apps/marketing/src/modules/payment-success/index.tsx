"use client";

import { Stack } from "@mui/material";
import Head from "next/head";

import { StructuredData } from "@app/lib/components/seo";

import { PaymentSuccessActionsSection, PaymentSuccessHeroSection } from "./sections";

export const PaymentSuccessPage = () => (
  <>
    <Head>
      <StructuredData type="website" />
    </Head>

    <Stack spacing={0}>
      <PaymentSuccessHeroSection />
      <PaymentSuccessActionsSection />
    </Stack>
  </>
);
