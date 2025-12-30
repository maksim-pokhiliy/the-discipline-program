"use client";

import { Stack } from "@mui/material";
import { ContactPageData } from "@repo/api";
import { QueryWrapper } from "@repo/query";
import Head from "next/head";

import { useContactPage } from "@app/lib/hooks";
import { StructuredData } from "@app/shared/components/seo";

import { ContactDirectInfo, ContactFAQ, ContactForm, ContactHero } from "./sections";

interface ContactPageClientProps {
  initialData: ContactPageData;
}

export const ContactPageClient = ({ initialData }: ContactPageClientProps) => {
  const { data, isLoading, error } = useContactPage({ initialData });

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
