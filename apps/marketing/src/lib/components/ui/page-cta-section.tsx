import { ContentSection } from "@repo/ui";

import { CTASection } from "./cta-section";

type PageCTASectionProps = {
  id: string;
  title?: string | undefined;
  subtitle?: string | undefined;
  buttonText?: string | undefined;
  buttonHref?: string | undefined;
};

export const PageCTASection = ({
  id,
  title,
  subtitle,
  buttonText,
  buttonHref,
}: PageCTASectionProps) => {
  return (
    <ContentSection id={id} surface="raised">
      <CTASection
        title={title}
        subtitle={subtitle}
        buttonText={buttonText}
        buttonHref={buttonHref}
      />
    </ContentSection>
  );
};
