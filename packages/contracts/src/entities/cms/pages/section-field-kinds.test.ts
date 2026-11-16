import { describe, expect, it } from "vitest";
import { z } from "zod";

import { SECTION_SCHEMAS } from "./pages-api.schema";
import { isPublicPageSlug, PAGE_SECTIONS_MAP, PageSlug } from "./pages.constants";
import {
  isGroupFieldKinds,
  isListFieldKinds,
  SECTION_FIELD_KINDS,
  SectionFieldKind,
  type SectionFieldKindTree,
} from "./section-field-kinds";

type ClassifiedField = { path: string; kind: SectionFieldKind };
type ListIdentity = { path: string; identity: string | null };

const SECTION_KEYS = Object.values(PAGE_SECTIONS_MAP).flatMap((sections) =>
  Object.values(sections),
);
const SHARED_PATHS = [
  "home:hero.buttonHref",
  "home:hero.backgroundImage",
  "home:whyChoose.features[].id",
  "home:whyChoose.features[].iconName",
  "home:storefront.buttonHref",
  "home:contact.buttonHref",
  "storefront:hero.buttonHref",
  "storefront:hero.backgroundImage",
  "storefront:cta.buttonHref",
  "about:hero.buttonHref",
  "about:hero.backgroundImage",
  "about:personal.image",
  "about:cta.buttonHref",
  "blog:hero.backgroundImage",
  "contact:hero.buttonHref",
  "contact:hero.backgroundImage",
  "faq:hero.buttonHref",
  "faq:hero.backgroundImage",
  "faq:cta.buttonHref",
];

const stringPaths = (schema: unknown, path: string): string[] => {
  if (schema instanceof z.ZodOptional) {
    return stringPaths(schema.unwrap(), path);
  }

  if (schema instanceof z.ZodString) {
    return [path];
  }

  if (schema instanceof z.ZodArray) {
    return stringPaths(schema.element, `${path}[]`);
  }

  if (schema instanceof z.ZodObject) {
    return Object.entries(schema.shape).flatMap(([field, child]) =>
      stringPaths(child, `${path}.${field}`),
    );
  }

  throw new Error(`Unsupported section schema at ${path}`);
};

const classifiedFields = (tree: SectionFieldKindTree, path: string): ClassifiedField[] =>
  Object.entries(tree).flatMap(([field, node]) => {
    const fieldPath = `${path}.${field}`;

    if (isListFieldKinds(node)) {
      return classifiedFields(node.list, `${fieldPath}[]`);
    }

    if (isGroupFieldKinds(node)) {
      return classifiedFields(node.group, fieldPath);
    }

    return [{ path: fieldPath, kind: node }];
  });

const listIdentities = (tree: SectionFieldKindTree, path: string): ListIdentity[] =>
  Object.entries(tree).flatMap(([field, node]) => {
    const fieldPath = `${path}.${field}`;

    if (isListFieldKinds(node)) {
      return [
        { path: fieldPath, identity: node.identity ?? null },
        ...listIdentities(node.list, `${fieldPath}[]`),
      ];
    }

    return isGroupFieldKinds(node) ? listIdentities(node.group, fieldPath) : [];
  });

describe("SECTION_FIELD_KINDS", () => {
  it("holds an entry for every section key and nothing else", () => {
    expect(Object.keys(SECTION_FIELD_KINDS).sort()).toEqual(Object.keys(SECTION_SCHEMAS).sort());
  });

  it("classifies every string field of every section schema, list rows and nested groups included", () => {
    for (const section of SECTION_KEYS) {
      const fields = classifiedFields(SECTION_FIELD_KINDS[section], section);

      expect(fields.map((field) => field.path).sort()).toEqual(
        stringPaths(SECTION_SCHEMAS[section], section).sort(),
      );

      for (const field of fields) {
        expect(Object.values(SectionFieldKind)).toContain(field.kind);
      }
    }
  });

  it("marks exactly the links, image URLs, icon names and row ids as shared", () => {
    const shared = SECTION_KEYS.flatMap((section) =>
      classifiedFields(SECTION_FIELD_KINDS[section], section),
    )
      .filter((field) => field.kind === SectionFieldKind.SHARED)
      .map((field) => field.path);

    expect(shared.sort()).toEqual([...SHARED_PATHS].sort());
  });

  it("reads the navigation link labels as words", () => {
    const navigation = SECTION_FIELD_KINDS[PAGE_SECTIONS_MAP.site.navigation];

    for (const slug of Object.values(PageSlug).filter(isPublicPageSlug)) {
      expect(navigation[slug]).toBe(SectionFieldKind.WORD);
    }
  });

  it("identifies feature rows by their id and no other list by a field", () => {
    const identities = SECTION_KEYS.flatMap((section) =>
      listIdentities(SECTION_FIELD_KINDS[section], section),
    );

    expect(identities).toEqual([
      { path: "home:whyChoose.features", identity: "id" },
      { path: "about:journey.timeline", identity: null },
      { path: "about:credentials.items", identity: null },
      { path: "faq:content.items", identity: null },
      { path: "offer:requisites.items", identity: null },
      { path: "offer:terms.blocks", identity: null },
    ]);
  });
});
