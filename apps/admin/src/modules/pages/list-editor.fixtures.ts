import { type z } from "zod";

import {
  type AdminPageSection,
  type offerTermsSchema,
  type SectionWriteBody,
} from "@repo/contracts/cms/pages";

import { makeSectionRow } from "./pages.fixtures";

const INITIAL_ORDER = ["First", "Second", "Third"];
const MOVED_ORDER = ["Second", "Third", "First"];
const LIST_HEADING = { title: "Fixture list title", subtitle: "Fixture list subtitle" };

export const makeTermsData = (order = INITIAL_ORDER): z.infer<typeof offerTermsSchema> => ({
  title: "Fixture terms title",
  blocks: order.map((name) => ({
    heading: `${name} fixture heading`,
    body: `${name} fixture first paragraph.\n\n${name} fixture second paragraph.`,
  })),
});

const makeFaqData = (order = INITIAL_ORDER) => ({
  ...LIST_HEADING,
  items: order.map((name) => ({ question: `${name} question`, answer: `${name} answer` })),
});

const makeJourneyData = (order = INITIAL_ORDER) => ({
  ...LIST_HEADING,
  timeline: order.map((name) => ({
    year: `${name} year`,
    title: `${name} title`,
    description: `${name} description`,
  })),
});

const makeCredentialsData = (order = INITIAL_ORDER) => ({
  ...LIST_HEADING,
  items: order.map((name) => ({ title: `${name} title`, description: `${name} description` })),
});

const makeWhyChooseData = (order = INITIAL_ORDER) => ({
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
];
