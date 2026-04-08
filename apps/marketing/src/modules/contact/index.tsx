"use client";

import { type ContactPageData } from "@repo/contracts/pages";
import { QueryWrapper } from "@repo/ui";

import { FullscreenSection } from "@app/lib/components/ui";
import { useContactPage } from "@app/lib/hooks";

import { ContactFormSection } from "./sections";

type ContactPageClientProps = {
  initialData: ContactPageData;
};

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
          <FullscreenSection
            backgroundImage={data.hero.backgroundImage}
            title={data.hero.title}
            subtitle={data.hero.subtitle}
            buttonText={data.hero.buttonText}
            buttonHref={data.hero.buttonHref}
          />
          <ContactFormSection form={data.form} programOptions={data.programOptions} />
        </>
      )}
    </QueryWrapper>
  );
};
