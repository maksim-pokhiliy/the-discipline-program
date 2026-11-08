import { type z } from "zod";

import { type SECTION_SCHEMAS } from "./pages-api.schema";
import { PAGE_SECTIONS_MAP } from "./pages.constants";
import { type SectionSchemaKey } from "./pages.types";

export enum SectionFieldKind {
  WORD = "word",
  SHARED = "shared",
}

type FieldKindNode<TValue> = TValue extends string
  ? SectionFieldKind
  : TValue extends readonly (infer TRow)[]
    ? { readonly list: FieldKindTree<TRow>; readonly identity?: keyof TRow & string }
    : { readonly group: FieldKindTree<TValue> };

type FieldKindTree<TData> = {
  readonly [TField in keyof TData]-?: FieldKindNode<NonNullable<TData[TField]>>;
};

type SectionFieldKindsMap = {
  readonly [TKey in SectionSchemaKey]: FieldKindTree<z.infer<(typeof SECTION_SCHEMAS)[TKey]>>;
};

export type ListFieldKinds = { readonly list: SectionFieldKindTree; readonly identity?: string };
export type GroupFieldKinds = { readonly group: SectionFieldKindTree };
export type SectionFieldKindNode = SectionFieldKind | ListFieldKinds | GroupFieldKinds;
export type SectionFieldKindTree = { readonly [field: string]: SectionFieldKindNode };

export const isListFieldKinds = (node: SectionFieldKindNode): node is ListFieldKinds =>
  typeof node === "object" && "list" in node;

export const isGroupFieldKinds = (node: SectionFieldKindNode): node is GroupFieldKinds =>
  typeof node === "object" && "group" in node;

const WORD = SectionFieldKind.WORD;
const SHARED = SectionFieldKind.SHARED;
const TITLE_SUBTITLE = { title: WORD, subtitle: WORD } as const;
const CTA = { ...TITLE_SUBTITLE, buttonText: WORD, buttonHref: SHARED } as const;
const HERO = { ...CTA, backgroundImage: SHARED } as const;
const SEO = { title: WORD, description: WORD } as const;
const PROGRAM_LISTING = {
  freeLabel: WORD,
  cardActionLabel: WORD,
  modalDismissLabel: WORD,
  modalActionLabel: WORD,
} as const;

export const SECTION_FIELD_KINDS = {
  [PAGE_SECTIONS_MAP.home.hero]: HERO,
  [PAGE_SECTIONS_MAP.home.whyChoose]: {
    ...TITLE_SUBTITLE,
    features: {
      list: { id: SHARED, title: WORD, description: WORD, iconName: SHARED },
      identity: "id",
    },
  },
  [PAGE_SECTIONS_MAP.home.storefront]: { ...CTA, ...PROGRAM_LISTING },
  [PAGE_SECTIONS_MAP.home.reviews]: TITLE_SUBTITLE,
  [PAGE_SECTIONS_MAP.home.contact]: CTA,
  [PAGE_SECTIONS_MAP.home.seo]: SEO,
  [PAGE_SECTIONS_MAP.storefront.hero]: HERO,
  [PAGE_SECTIONS_MAP.storefront.grid]: { ...TITLE_SUBTITLE, ...PROGRAM_LISTING },
  [PAGE_SECTIONS_MAP.storefront.cta]: CTA,
  [PAGE_SECTIONS_MAP.storefront.seo]: SEO,
  [PAGE_SECTIONS_MAP.about.hero]: HERO,
  [PAGE_SECTIONS_MAP.about.journey]: {
    ...TITLE_SUBTITLE,
    timeline: { list: { year: WORD, title: WORD, description: WORD } },
  },
  [PAGE_SECTIONS_MAP.about.credentials]: {
    ...TITLE_SUBTITLE,
    items: { list: { title: WORD, description: WORD } },
  },
  [PAGE_SECTIONS_MAP.about.personal]: {
    ...TITLE_SUBTITLE,
    description: WORD,
    image: SHARED,
    name: WORD,
    role: WORD,
  },
  [PAGE_SECTIONS_MAP.about.cta]: CTA,
  [PAGE_SECTIONS_MAP.about.seo]: SEO,
  [PAGE_SECTIONS_MAP.blog.hero]: { ...TITLE_SUBTITLE, backgroundImage: SHARED },
  [PAGE_SECTIONS_MAP.blog.grid]: {
    ...TITLE_SUBTITLE,
    readMoreLabel: WORD,
    minReadSuffix: WORD,
    readArticleLabel: WORD,
    notPublishedLabel: WORD,
  },
  [PAGE_SECTIONS_MAP.blog.related]: { title: WORD },
  [PAGE_SECTIONS_MAP.blog.seo]: SEO,
  [PAGE_SECTIONS_MAP.contact.hero]: HERO,
  [PAGE_SECTIONS_MAP.contact.form]: {
    ...TITLE_SUBTITLE,
    successTitle: WORD,
    successMessage: WORD,
    submitLabel: WORD,
    sendAnotherLabel: WORD,
    sendingLabel: WORD,
    errorMessage: WORD,
    fieldLabels: { group: { name: WORD, contact: WORD, program: WORD, message: WORD } },
    fieldPlaceholders: { group: { contact: WORD, message: WORD } },
  },
  [PAGE_SECTIONS_MAP.contact.seo]: SEO,
  [PAGE_SECTIONS_MAP.faq.hero]: HERO,
  [PAGE_SECTIONS_MAP.faq.content]: {
    ...TITLE_SUBTITLE,
    items: { list: { question: WORD, answer: WORD } },
  },
  [PAGE_SECTIONS_MAP.faq.cta]: CTA,
  [PAGE_SECTIONS_MAP.faq.seo]: SEO,
  [PAGE_SECTIONS_MAP.offer.hero]: TITLE_SUBTITLE,
  [PAGE_SECTIONS_MAP.offer.requisites]: {
    title: WORD,
    items: { list: { label: WORD, value: WORD } },
  },
  [PAGE_SECTIONS_MAP.offer.terms]: {
    title: WORD,
    blocks: { list: { heading: WORD, body: WORD } },
  },
  [PAGE_SECTIONS_MAP.offer.seo]: SEO,
  [PAGE_SECTIONS_MAP.site.navigation]: {
    home: WORD,
    storefront: WORD,
    about: WORD,
    blog: WORD,
    faq: WORD,
    contact: WORD,
    offer: WORD,
    navigationLabel: WORD,
    openMenuLabel: WORD,
    closeMenuLabel: WORD,
    languageSwitchLabel: WORD,
  },
  [PAGE_SECTIONS_MAP.site.footer]: { tagline: WORD, subcopy: WORD, rightsLabel: WORD },
  [PAGE_SECTIONS_MAP.site.leadForm]: {
    title: WORD,
    productPrefix: WORD,
    nameLabel: WORD,
    contactLabel: WORD,
    messageLabel: WORD,
    submitLabel: WORD,
    sendingLabel: WORD,
    successTitle: WORD,
    successMessage: WORD,
    sendAnotherLabel: WORD,
    errorMessage: WORD,
    contactRequiredMessage: WORD,
  },
  [PAGE_SECTIONS_MAP.site.errors]: {
    notFoundTitle: WORD,
    errorGlyph: WORD,
    errorTitle: WORD,
    errorIdLabel: WORD,
    retryLabel: WORD,
    homeLabel: WORD,
  },
} as const satisfies SectionFieldKindsMap;
