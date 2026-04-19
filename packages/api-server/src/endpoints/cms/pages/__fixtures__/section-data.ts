import { type Prisma } from "@prisma/client";

import { type SectionSchemaKey } from "@repo/contracts/cms/pages";

export const PARTIAL_SECTION_DATA: Record<SectionSchemaKey, Prisma.InputJsonValue> = {
  "home:hero": { title: "Partial Home Hero" },
  "home:whyChoose": { title: "Partial Why Choose" },
  "home:storefront": { title: "Partial Home Storefront" },
  "home:reviews": { title: "Partial Home Reviews" },
  "home:contact": { title: "Partial Home Contact" },
  "storefront:hero": { title: "Partial Storefront Hero" },
  "storefront:grid": { title: "Partial Storefront Grid" },
  "storefront:cta": { title: "Partial Storefront CTA" },
  "about:hero": { title: "Partial About Hero" },
  "about:journey": { title: "Partial About Journey" },
  "about:credentials": { title: "Partial About Credentials" },
  "about:personal": { title: "Partial About Personal" },
  "about:cta": { title: "Partial About CTA" },
  "blog:hero": { title: "Partial Blog Hero" },
  "blog:grid": { readMoreLabel: "Read more" },
  "blog:related": { title: "Partial Related Articles" },
  "contact:hero": { title: "Partial Contact Hero" },
  "contact:form": { title: "Partial Contact Form" },
  "faq:hero": { title: "Partial FAQ Hero" },
  "faq:content": { title: "Partial FAQ Content" },
  "faq:cta": { title: "Partial FAQ CTA" },
};
