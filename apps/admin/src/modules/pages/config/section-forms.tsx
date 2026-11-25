import { type ReactElement } from "react";

import { type SectionSchemaKey } from "@repo/contracts/cms/pages";

import { SectionListEditor } from "@app/lib/components/localized-editor/section-list";

import { BlogGridSectionForm } from "../components/sections/blog-grid-section-form";
import { ContactFormSectionForm } from "../components/sections/contact-form-section-form";
import { ContactSectionForm } from "../components/sections/contact-section-form";
import { FlatFieldsSectionForm } from "../components/sections/flat-fields-section-form";
import { HeroSectionForm } from "../components/sections/hero-section-form";
import { PersonalSectionForm } from "../components/sections/personal-section-form";
import { ReviewsSectionForm } from "../components/sections/reviews-section-form";
import { SeoSectionForm } from "../components/sections/seo-section-form";
import { StorefrontGridSectionForm } from "../components/sections/storefront-grid-section-form";
import { StorefrontProgramsSectionForm } from "../components/sections/storefront-programs-section-form";
import { TitleSectionForm } from "../components/sections/title-section-form";
import { TitleSubtitleSectionForm } from "../components/sections/title-subtitle-section-form";

import { LIST_SECTIONS } from "./list-section-fields";
import {
  SITE_ERRORS_GROUPS,
  SITE_FOOTER_GROUPS,
  SITE_LEAD_FORM_GROUPS,
  SITE_NAVIGATION_GROUPS,
} from "./site-section-fields";

export const SECTION_FORMS = {
  "home:hero": <HeroSectionForm sectionType="home:hero" />,
  "home:whyChoose": (
    <TitleSubtitleSectionForm cardTitle="Why Choose Us Settings">
      <SectionListEditor list={LIST_SECTIONS["home:whyChoose"]} />
    </TitleSubtitleSectionForm>
  ),
  "home:storefront": <StorefrontProgramsSectionForm />,
  "home:reviews": <ReviewsSectionForm />,
  "home:contact": <ContactSectionForm />,
  "home:seo": <SeoSectionForm />,
  "storefront:hero": <HeroSectionForm sectionType="storefront:hero" />,
  "storefront:grid": <StorefrontGridSectionForm />,
  "storefront:cta": <ContactSectionForm />,
  "storefront:seo": <SeoSectionForm />,
  "about:hero": <HeroSectionForm sectionType="about:hero" />,
  "about:journey": (
    <TitleSubtitleSectionForm cardTitle="Journey Section Settings">
      <SectionListEditor list={LIST_SECTIONS["about:journey"]} />
    </TitleSubtitleSectionForm>
  ),
  "about:credentials": (
    <TitleSubtitleSectionForm cardTitle="Credentials Section Settings">
      <SectionListEditor list={LIST_SECTIONS["about:credentials"]} />
    </TitleSubtitleSectionForm>
  ),
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
  "faq:content": (
    <TitleSubtitleSectionForm cardTitle="FAQ Settings">
      <SectionListEditor list={LIST_SECTIONS["faq:content"]} />
    </TitleSubtitleSectionForm>
  ),
  "faq:cta": <ContactSectionForm />,
  "faq:seo": <SeoSectionForm />,
  "offer:hero": <TitleSubtitleSectionForm cardTitle="Offer Hero" />,
  "offer:requisites": (
    <TitleSectionForm cardTitle="Requisites Settings">
      <SectionListEditor list={LIST_SECTIONS["offer:requisites"]} />
    </TitleSectionForm>
  ),
  "offer:terms": (
    <TitleSectionForm cardTitle="Terms Settings">
      <SectionListEditor list={LIST_SECTIONS["offer:terms"]} />
    </TitleSectionForm>
  ),
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
