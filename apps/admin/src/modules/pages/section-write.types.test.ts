import type { ComponentProps } from "react";

import { describe, expectTypeOf, it } from "vitest";

import type {
  AdminPageDetails,
  AdminPageSection,
  CorrelatedAdminPageDetails,
  SectionWriteBody,
  UpdatePageSectionBody,
} from "@repo/contracts/cms/pages";

import type { createPagesAPI } from "@app/lib/api/endpoints";
import type { useUpdatePageSection } from "@app/lib/hooks";

import type { SectionEditor } from "./components/section-editor";

type EndpointBody = Parameters<ReturnType<typeof createPagesAPI>["updateSection"]>[1];
type HookVariables = Parameters<ReturnType<typeof useUpdatePageSection>["mutate"]>[0];
type EditorBody = Parameters<ComponentProps<typeof SectionEditor>["onSave"]>[0];
type ForeignBody = { section: "home:seo"; data: { items: [] } };
type MatchedBody = { section: "home:seo"; data: { title: string; description: string } };

describe("section write types at the admin call sites", () => {
  it("reject a payload of another section in the endpoint body", () => {
    expectTypeOf<ForeignBody>().not.toExtend<EndpointBody>();
  });

  it("reject a payload of another section in the hook variables", () => {
    expectTypeOf<{ slug: string; body: ForeignBody }>().not.toExtend<HookVariables>();
  });

  it("reject a payload of another section in the editor save body", () => {
    expectTypeOf<ForeignBody>().not.toExtend<EditorBody>();
  });

  it("accept a payload matched to its section at every call site", () => {
    expectTypeOf<MatchedBody>().toExtend<EndpointBody>();
    expectTypeOf<{ slug: string; body: MatchedBody }>().toExtend<HookVariables>();
    expectTypeOf<MatchedBody>().toExtend<EditorBody>();
  });

  it("keep the write alias equal to the contract body", () => {
    expectTypeOf<SectionWriteBody>().toEqualTypeOf<UpdatePageSectionBody>();
    expectTypeOf<SectionWriteBody<"offer:terms">>().toEqualTypeOf<
      Extract<UpdatePageSectionBody, { section: "offer:terms" }>
    >();
  });

  it("keep the correlated read row inside the contract row", () => {
    expectTypeOf<AdminPageSection>().toExtend<AdminPageDetails["sections"][number]>();
    expectTypeOf<CorrelatedAdminPageDetails>().toExtend<AdminPageDetails>();
  });
});
