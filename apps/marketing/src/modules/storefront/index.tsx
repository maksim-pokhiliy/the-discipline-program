import { type StorefrontProgramsPageData } from "@repo/contracts/cms/pages";
import { SuspenseWrapper } from "@repo/ui";

import { StructuredData } from "@app/lib/components/seo";
import { FullscreenSection, PageCTASection } from "@app/lib/components/ui";

import { StorefrontProgramsGridSection } from "./sections";

type StorefrontProgramsPageContentProps = {
  data: StorefrontProgramsPageData;
};

export const StorefrontProgramsPageContent = ({ data }: StorefrontProgramsPageContentProps) => (
  <>
    <StructuredData type="storefront" data={{ products: data.productsList }} />
    <FullscreenSection
      backgroundImage={data.hero.backgroundImage}
      title={data.hero.title}
      subtitle={data.hero.subtitle}
      buttonText={data.hero.buttonText}
      buttonHref={data.hero.buttonHref}
    />
    <SuspenseWrapper>
      <StorefrontProgramsGridSection grid={data.grid} productsList={data.productsList} />
    </SuspenseWrapper>
    <PageCTASection
      id="storefront-cta"
      title={data.cta.title}
      subtitle={data.cta.subtitle}
      buttonText={data.cta.buttonText}
      buttonHref={data.cta.buttonHref}
    />
  </>
);
