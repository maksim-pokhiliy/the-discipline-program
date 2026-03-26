"use client";

import { type ContactPageData } from "@repo/contracts/pages";
import { QueryWrapper } from "@repo/query";

import { useContactPage } from "@app/lib/hooks";

import { ContactHero } from "./sections";

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
      {(data) => <ContactHero hero={data.hero} />}
    </QueryWrapper>
  );
};
