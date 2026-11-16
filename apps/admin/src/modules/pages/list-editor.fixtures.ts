import { type z } from "zod";

import {
  type AdminPageSection,
  offerTermsSchema,
  aboutPageJourneySchema,
  aboutPageCredentialsSchema,
  faqContentSchema,
  homePageWhyChooseSchema,
  offerRequisitesSchema,
  type SectionSchemaKey,
  type SectionWriteBody,
} from "@repo/contracts/cms/pages";

import { type SectionList } from "./components/section-list";
import { LIST_SECTIONS } from "./config/list-section-fields";
import { makeSectionRow, SECTION_KEYS } from "./pages.fixtures";

const INITIAL_ORDER = ["First", "Second", "Third"];
const MOVED_ORDER = ["Second", "Third", "First"];
const LIST_HEADING = { title: "Fixture list title", subtitle: "Fixture list subtitle" };

export const LAST_ROW_INDEX = 2;

export const makeTermsBlock = (
  name: string,
): z.infer<typeof offerTermsSchema>["blocks"][number] & { id: string } => ({
  id: `fixture-${name}`,
  heading: `${name} fixture heading`,
  body: `${name} fixture first paragraph.\n\n${name} fixture second paragraph.`,
});

export const makeTermsData = (order = INITIAL_ORDER): z.infer<typeof offerTermsSchema> =>
  offerTermsSchema.parse({ title: "Fixture terms title", blocks: order.map(makeTermsBlock) });

const makeFaqData = (order = INITIAL_ORDER) =>
  faqContentSchema.parse({
    ...LIST_HEADING,
    items: order.map((name) => ({
      id: `fixture-${name}`,
      question: `${name} question`,
      answer: `${name} answer`,
    })),
  });

const makeJourneyData = (order = INITIAL_ORDER) =>
  aboutPageJourneySchema.parse({
    ...LIST_HEADING,
    timeline: order.map((name) => ({
      id: `fixture-${name}`,
      year: `${name} year`,
      title: `${name} title`,
      description: `${name} description`,
    })),
  });

const makeCredentialsData = (order = INITIAL_ORDER) =>
  aboutPageCredentialsSchema.parse({
    ...LIST_HEADING,
    items: order.map((name) => ({
      id: `fixture-${name}`,
      title: `${name} title`,
      description: `${name} description`,
    })),
  });

const makeWhyChooseData = (order = INITIAL_ORDER) =>
  homePageWhyChooseSchema.parse({
    ...LIST_HEADING,
    features: order.map((name) => ({
      id: `fixture-${name}`,
      iconName: `${name} icon`,
      title: `${name} title`,
      description: `${name} description`,
    })),
  });

type ListReorderCase = {
  row: AdminPageSection;
  expectedBody: SectionWriteBody;
};

const makeRequisitesData = (order = INITIAL_ORDER) =>
  offerRequisitesSchema.parse({
    title: "Fixture requisites title",
    items: order.map((name) => ({
      id: `fixture-${name}`,
      label: `${name} label`,
      value: `${name} value`,
    })),
  });

export const makeListReorderCases = (): ListReorderCase[] => [
  {
    row: makeSectionRow("faq:content", makeFaqData()),
    expectedBody: { section: "faq:content", data: makeFaqData(MOVED_ORDER) },
  },
  {
    row: makeSectionRow("about:journey", makeJourneyData()),
    expectedBody: { section: "about:journey", data: makeJourneyData(MOVED_ORDER) },
  },
  {
    row: makeSectionRow("about:credentials", makeCredentialsData()),
    expectedBody: { section: "about:credentials", data: makeCredentialsData(MOVED_ORDER) },
  },
  {
    row: makeSectionRow("home:whyChoose", makeWhyChooseData()),
    expectedBody: { section: "home:whyChoose", data: makeWhyChooseData(MOVED_ORDER) },
  },
  {
    row: makeSectionRow("offer:requisites", makeRequisitesData()),
    expectedBody: { section: "offer:requisites", data: makeRequisitesData(MOVED_ORDER) },
  },
  {
    row: makeSectionRow("offer:terms", makeTermsData()),
    expectedBody: { section: "offer:terms", data: makeTermsData(MOVED_ORDER) },
  },
];

type ListAddCase = { section: SectionSchemaKey; list: SectionList };

export const makeListAddCases = (): ListAddCase[] =>
  SECTION_KEYS.flatMap((section) => {
    const entry = Object.entries(LIST_SECTIONS).find(([key]) => key === section);

    return entry === undefined ? [] : [{ section, list: entry[1] }];
  });
