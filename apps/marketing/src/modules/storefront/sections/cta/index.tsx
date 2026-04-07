import { type StorefrontProgramsPageData } from "@repo/contracts/pages";

import { PageCTASection } from "@app/lib/components/ui";

type StorefrontProgramsCTAProps = {
  cta: StorefrontProgramsPageData["cta"];
};

export const StorefrontProgramsCTA = ({ cta }: StorefrontProgramsCTAProps) => {
  return (
    <PageCTASection
      id="storefront-cta"
      title={cta.title}
      subtitle={cta.subtitle}
      buttonText={cta.buttonText}
      buttonHref={cta.buttonHref}
    />
  );
};
