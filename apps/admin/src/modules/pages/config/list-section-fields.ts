import {
  PAGE_SECTIONS_MAP,
  type credentialItemSchema,
  type faqItemSchema,
  type requisiteItemSchema,
  type SectionSchemaKey,
  type termsBlockSchema,
  type timelineItemSchema,
  type whyChooseFeatureItemSchema,
} from "@repo/contracts/cms/pages";

import { type SectionList } from "@app/lib/components/localized-editor/section-list";

import { type RowFieldsOf } from "./schema-fields.types";

export const LIST_SECTIONS = {
  [PAGE_SECTIONS_MAP.home.whyChoose]: {
    name: "features",
    countLabel: "Feature Cards",
    addLabel: "Add New Card",
    itemName: "feature card",
    fields: {
      iconName: { label: "Icon Name", columns: 4 },
      title: { label: "Feature Title", columns: 8 },
      description: { label: "Description", minRows: 2 },
    } satisfies RowFieldsOf<typeof whyChooseFeatureItemSchema>,
  },
  [PAGE_SECTIONS_MAP.about.journey]: {
    name: "timeline",
    countLabel: "Timeline",
    addLabel: "Add Timeline Item",
    itemName: "timeline item",
    fields: {
      year: { label: "Year", columns: 2 },
      title: { label: "Title", columns: 10 },
      description: { label: "Description", minRows: 2 },
    } satisfies RowFieldsOf<typeof timelineItemSchema>,
  },
  [PAGE_SECTIONS_MAP.about.credentials]: {
    name: "items",
    countLabel: "Credentials",
    addLabel: "Add Credential",
    itemName: "credential",
    fields: {
      title: { label: "Title" },
      description: { label: "Description" },
    } satisfies RowFieldsOf<typeof credentialItemSchema>,
  },
  [PAGE_SECTIONS_MAP.faq.content]: {
    name: "items",
    countLabel: "FAQ Items",
    addLabel: "Add FAQ Item",
    itemName: "FAQ item",
    fields: {
      question: { label: "Question" },
      answer: { label: "Answer", minRows: 2 },
    } satisfies RowFieldsOf<typeof faqItemSchema>,
  },
  [PAGE_SECTIONS_MAP.offer.requisites]: {
    name: "items",
    countLabel: "Requisites",
    addLabel: "Add Requisite",
    itemName: "requisite",
    fields: {
      label: { label: "Label", columns: 4 },
      value: { label: "Value", columns: 8 },
    } satisfies RowFieldsOf<typeof requisiteItemSchema>,
  },
  [PAGE_SECTIONS_MAP.offer.terms]: {
    name: "blocks",
    countLabel: "Terms Blocks",
    addLabel: "Add Terms Block",
    itemName: "terms block",
    fields: {
      heading: { label: "Heading" },
      body: { label: "Body", minRows: 4 },
    } satisfies RowFieldsOf<typeof termsBlockSchema>,
  },
} satisfies Partial<Record<SectionSchemaKey, SectionList>>;
