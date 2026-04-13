import { type AboutPageData } from "@repo/contracts/cms/pages";

import { FullscreenSection, PageCTASection } from "@app/lib/components/ui";

import { AboutCredentialsSection, AboutJourneySection, AboutPersonalSection } from "./sections";

type AboutPageContentProps = {
  data: AboutPageData;
};

export const AboutPageContent = ({ data }: AboutPageContentProps) => (
  <>
    <FullscreenSection
      backgroundImage={data.hero.backgroundImage}
      title={data.hero.title}
      subtitle={data.hero.subtitle}
      buttonText={data.hero.buttonText}
      buttonHref={data.hero.buttonHref}
    />
    <AboutJourneySection journey={data.journey} />
    <AboutCredentialsSection credentials={data.credentials} />
    <AboutPersonalSection personal={data.personal} />
    <PageCTASection
      id="about-cta"
      title={data.cta.title}
      subtitle={data.cta.subtitle}
      buttonText={data.cta.buttonText}
      buttonHref={data.cta.buttonHref}
    />
  </>
);
