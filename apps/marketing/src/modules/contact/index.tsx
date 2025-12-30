"use client";

import { Stack } from "@mui/material";
import { QueryWrapper } from "@repo/query";
import Head from "next/head";

import { useContactPage } from "@app/lib/hooks";
import { StructuredData } from "@app/shared/components/seo";

import { ContactDirectInfo, ContactFAQ, ContactForm, ContactHero } from "./sections";

export const ContactPage = () => {
  const { data, isLoading, error } = useContactPage();

  return (
    <QueryWrapper
      isLoading={isLoading}
      error={error}
      data={data}
      loadingMessage="Loading contact page..."
    >
      {(data) => (
        <>
          <Head>
            <StructuredData type="faq" data={{ faqItems: data.faq.items }} />
          </Head>

          <Stack spacing={0}>
            <ContactHero hero={data.hero} />
            <ContactForm form={data.form} />
            <ContactDirectInfo directContact={data.directContact} />
            <ContactFAQ faq={data.faq} />
          </Stack>
        </>
      )}
    </QueryWrapper>
  );
};
