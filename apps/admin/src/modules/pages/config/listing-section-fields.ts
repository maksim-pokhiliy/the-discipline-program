import {
  type blogGridSchema,
  type homePageStorefrontProgramsSchema,
  type storefrontGridSchema,
} from "@repo/contracts/cms/pages";

import { type FieldGroup } from "../components/sections/flat-fields-section-form.types";

import { type FieldsOf, type RemainingFields } from "./schema-fields.types";

type ProgramListingFields = RemainingFields<
  FieldsOf<typeof storefrontGridSchema>,
  "title" | "subtitle"
> &
  RemainingFields<
    FieldsOf<typeof homePageStorefrontProgramsSchema>,
    "title" | "subtitle" | "buttonText" | "buttonHref"
  >;

type ArticleListingFields = RemainingFields<FieldsOf<typeof blogGridSchema>, "title" | "subtitle">;

export const PROGRAM_LISTING_GROUP = {
  heading: "Program Card and Pop-Up Text",
  fields: {
    freeLabel: { label: "Price Text for Programs Without a Price" },
    cardActionLabel: { label: "Program Card Button Label" },
    modalDismissLabel: { label: "Pop-Up Dismiss Button Label" },
    modalActionLabel: { label: "Pop-Up Action Button Label" },
  } satisfies ProgramListingFields,
} satisfies FieldGroup;

export const ARTICLE_LISTING_GROUP = {
  heading: "Article Card and Article Page Text",
  fields: {
    readMoreLabel: { label: "Article Card Button Label" },
    minReadSuffix: { label: "Reading Time Suffix" },
    readArticleLabel: { label: "Article Hero Button Label" },
    notPublishedLabel: { label: "Date Text for Unpublished Articles" },
  } satisfies ArticleListingFields,
} satisfies FieldGroup;
