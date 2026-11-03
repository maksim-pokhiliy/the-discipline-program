import { type ReactElement } from "react";

import { type SectionSchemaKey } from "@repo/contracts/cms/pages";

import { BlogGridSectionForm } from "../components/sections/blog-grid-section-form";
import { ContactFormSectionForm } from "../components/sections/contact-form-section-form";
import { ContactSectionForm } from "../components/sections/contact-section-form";
import { CredentialsSectionForm } from "../components/sections/credentials-section-form";
import { FaqSectionForm } from "../components/sections/faq-section-form";
import { FlatFieldsSectionForm } from "../components/sections/flat-fields-section-form";
import { HeroSectionForm } from "../components/sections/hero-section-form";
import { JourneySectionForm } from "../components/sections/journey-section-form";
import { OfferRequisitesSectionForm } from "../components/sections/offer-requisites-section-form";
import { OfferTermsSectionForm } from "../components/sections/offer-terms-section-form";
import { PersonalSectionForm } from "../components/sections/personal-section-form";
import { ReviewsSectionForm } from "../components/sections/reviews-section-form";
import { SeoSectionForm } from "../components/sections/seo-section-form";
import { StorefrontGridSectionForm } from "../components/sections/storefront-grid-section-form";
import { StorefrontProgramsSectionForm } from "../components/sections/storefront-programs-section-form";
import { TitleSectionForm } from "../components/sections/title-section-form";
import { TitleSubtitleSectionForm } from "../components/sections/title-subtitle-section-form";
import { WhyChooseSectionForm } from "../components/sections/why-choose-section-form";

import {
  SITE_ERRORS_GROUPS,
  SITE_FOOTER_GROUPS,
  SITE_LEAD_FORM_GROUPS,
  SITE_NAVIGATION_GROUPS,
} from "./site-section-fields";

export const SECTION_FORMS = {
  "home:hero": <HeroSectionForm sectionType="home:hero" />,
  "home:whyChoose": <WhyChooseSectionForm />,
  "home:storefront": <StorefrontProgramsSectionForm />,
  "home:reviews": <ReviewsSectionForm />,
  "home:contact": <ContactSectionForm />,
  "home:seo": <SeoSectionForm />,
  "storefront:hero": <HeroSectionForm sectionType="storefront:hero" />,
  "storefront:grid": <StorefrontGridSectionForm />,
  "storefront:cta": <ContactSectionForm />,
  "storefront:seo": <SeoSectionForm />,
  "about:hero": <HeroSectionForm sectionType="about:hero" />,
  "about:journey": <JourneySectionForm />,
  "about:credentials": <CredentialsSectionForm />,
  "about:personal": <PersonalSectionForm />,
  "about:cta": <ContactSectionForm />,
  "about:seo": <SeoSectionForm />,
  "blog:hero": <HeroSectionForm sectionType="blog:hero" />,
  "blog:grid": <BlogGridSectionForm />,
  "blog:related": <TitleSectionForm cardTitle="Related Articles Settings" />,
  "blog:seo": <SeoSectionForm />,
  "contact:hero": <HeroSectionForm sectionType="contact:hero" />,
  "contact:form": <ContactFormSectionForm />,
  "contact:seo": <SeoSectionForm />,
  "faq:hero": <HeroSectionForm sectionType="faq:hero" />,
  "faq:content": <FaqSectionForm />,
  "faq:cta": <ContactSectionForm />,
  "faq:seo": <SeoSectionForm />,
  "offer:hero": <TitleSubtitleSectionForm cardTitle="Offer Hero" />,
  "offer:requisites": <OfferRequisitesSectionForm />,
  "offer:terms": <OfferTermsSectionForm />,
  "offer:seo": <SeoSectionForm />,
  "site:navigation": (
    <FlatFieldsSectionForm cardTitle="Navigation Labels" groups={SITE_NAVIGATION_GROUPS} />
  ),
  "site:footer": <FlatFieldsSectionForm cardTitle="Footer Text" groups={SITE_FOOTER_GROUPS} />,
  "site:leadForm": (
    <FlatFieldsSectionForm cardTitle="Lead Form Text" groups={SITE_LEAD_FORM_GROUPS} />
  ),
  "site:errors": <FlatFieldsSectionForm cardTitle="Error Page Text" groups={SITE_ERRORS_GROUPS} />,
} satisfies Record<SectionSchemaKey, ReactElement>;
