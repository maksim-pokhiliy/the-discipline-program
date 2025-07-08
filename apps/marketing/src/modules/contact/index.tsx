"use client";

import { Stack } from "@mui/material";
import Head from "next/head";

import { useContactPage } from "@app/lib/hooks/use-marketing-api";
import { StructuredData } from "@app/shared/components/seo";
import { QueryWrapper } from "@app/shared/components/ui/query-wrapper";

import { ContactDirectInfo } from "./components/contact-direct-info";
import { ContactFAQ } from "./components/contact-faq";
import { ContactForm } from "./components/contact-form";
import { ContactHero } from "./components/contact-hero";

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
