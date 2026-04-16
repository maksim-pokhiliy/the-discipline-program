import { type ContactPageData } from "@repo/contracts/cms/pages";

import { FullscreenSection } from "@app/lib/components/ui";

import { ContactFormSection } from "./sections";

type ContactPageContentProps = {
  data: ContactPageData;
};

export const ContactPageContent = ({ data }: ContactPageContentProps) => (
  <>
    {data.hero && (
      <FullscreenSection
        backgroundImage={data.hero.backgroundImage}
        title={data.hero.title}
        subtitle={data.hero.subtitle}
        buttonText={data.hero.buttonText}
        buttonHref={data.hero.buttonHref}
        priority
      />
    )}

    {data.form && <ContactFormSection form={data.form} programOptions={data.programOptions} />}
  </>
);
