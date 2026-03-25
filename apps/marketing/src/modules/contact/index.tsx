"use client";

import { Stack } from "@mui/material";

import { type ContactPageData } from "@repo/contracts/pages";
import { QueryWrapper } from "@repo/query";

import { useContactPage } from "@app/lib/hooks";

import { ContactDirectInfo, ContactForm } from "./sections";

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
        <Stack spacing={0}>
          <ContactForm form={data.form} programOptions={data.programOptions} />
          <ContactDirectInfo directContact={data.directContact} />
        </Stack>
      )}
    </QueryWrapper>
  );
};
