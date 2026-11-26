import { describe, expect, it } from "vitest";

import { SECTION_FIELD_KINDS } from "@repo/contracts/cms/pages";

import { keptWords } from "./unsaved-words";

const SEO = SECTION_FIELD_KINDS["home:seo"];
const FAQ = SECTION_FIELD_KINDS["faq:content"];
const FEATURES = SECTION_FIELD_KINDS["home:whyChoose"];

describe("keptWords", () => {
  it("keeps an edited top-level word at its path", () => {
    expect(keptWords(SEO, { title: "Applied" }, { title: "Edited" }, { title: "Server" })).toEqual([
      { path: "title", value: "Edited" },
    ]);
  });

  it("does not keep an unedited word even when the server changes it", () => {
    expect(keptWords(SEO, { title: "Applied" }, { title: "Applied" }, { title: "Server" })).toEqual(
      [],
    );
  });

  it("does not keep a word that now equals the server's word", () => {
    expect(keptWords(SEO, { title: "Applied" }, { title: "Edited" }, { title: "Edited" })).toEqual(
      [],
    );
  });

  it.each([undefined, null, 7, false, {}, []])("does not keep a non-string edit: %j", (title) => {
    expect(keptWords(SEO, { title: "Applied" }, { title }, { title: "Server" })).toEqual([]);
  });

  it.each(["", " ", "\t\n"])("keeps an unsaved erasure as typed: %j", (title) => {
    expect(keptWords(SEO, { title: "Applied" }, { title }, { title: "Server" })).toEqual([
      { path: "title", value: title },
    ]);
  });

  it.each(["", " ", "\t\n"])(
    "does not keep an empty edit over an empty applied word when the server fills it: %j",
    (title) => {
      expect(keptWords(SEO, { title: "" }, { title }, { title: "Server" })).toEqual([]);
    },
  );

  it.each(["", " ", "\t\n"])("keeps an erasure at its row's next coordinate: %j", (answer) => {
    const applied = {
      items: [
        { id: "a", answer: "Saved A" },
        { id: "b", answer: "Saved B" },
      ],
    };
    const current = {
      items: [
        { id: "a", answer },
        { id: "b", answer: "Saved B" },
      ],
    };
    const next = {
      items: [
        { id: "b", answer: "Saved B" },
        { id: "a", answer: "Server A" },
      ],
    };

    expect(keptWords(FAQ, applied, current, next)).toEqual([
      { path: "items.1.answer", value: answer },
    ]);
  });

  it("keeps nonblank words verbatim without trimming their surrounding whitespace", () => {
    expect(keptWords(SEO, { title: "\t" }, { title: " Edited \n" }, { title: " " })).toEqual([
      { path: "title", value: " Edited \n" },
    ]);
  });

  it("ignores unregistered fields and shared top-level values", () => {
    const applied = { title: "Applied", buttonHref: "/old", backgroundImage: "/old.jpg" };
    const current = {
      title: "Edited",
      buttonHref: "/typed",
      backgroundImage: "/typed.jpg",
      extra: "Typed",
    };
    const next = { title: "Server", buttonHref: "/new", backgroundImage: "/new.jpg" };

    expect(keptWords(SECTION_FIELD_KINDS["home:hero"], applied, current, next)).toEqual([
      { path: "title", value: "Edited" },
    ]);
  });

  it("finds current and applied list words by id and targets the next row coordinates", () => {
    const applied = {
      items: [
        { id: "a", answer: "Saved A" },
        { id: "b", answer: "Saved B" },
        { id: "c", answer: "Saved C" },
      ],
    };
    const current = {
      items: [
        { id: "c", answer: "Edited C" },
        { id: "a", answer: "Edited A" },
        { id: "b", answer: "Saved B" },
      ],
    };
    const next = {
      items: [
        { id: "b", answer: "Server B" },
        { id: "c", answer: "Server C" },
        { id: "a", answer: "Server A" },
      ],
    };

    expect(keptWords(FAQ, applied, current, next)).toEqual([
      { path: "items.1.answer", value: "Edited C" },
      { path: "items.2.answer", value: "Edited A" },
    ]);
  });

  it("drops removed rows while retaining the surviving row's edited words", () => {
    const applied = {
      items: [
        { id: "a", answer: "Saved A" },
        { id: "b", answer: "Saved B" },
      ],
    };
    const current = {
      items: [
        { id: "a", answer: "Edited A" },
        { id: "b", answer: "Edited B" },
      ],
    };
    const next = { items: [{ id: "b", answer: "Saved B" }] };

    expect(keptWords(FAQ, applied, current, next)).toEqual([
      { path: "items.0.answer", value: "Edited B" },
    ]);
  });

  it("does not give an added row words, even if the current body contains that new id", () => {
    const applied = { items: [{ id: "a", answer: "Saved A" }] };
    const current = {
      items: [
        { id: "a", answer: "Edited A" },
        { id: "new", answer: "Unapplied" },
      ],
    };
    const next = {
      items: [
        { id: "new", answer: "" },
        { id: "a", answer: "Saved A" },
      ],
    };

    expect(keptWords(FAQ, applied, current, next)).toEqual([
      { path: "items.1.answer", value: "Edited A" },
    ]);
  });

  it("keeps nothing for a next row absent from the current body", () => {
    expect(
      keptWords(
        FAQ,
        { items: [{ id: "a", answer: "Saved" }] },
        { items: [] },
        {
          items: [{ id: "a", answer: "Server" }],
        },
      ),
    ).toEqual([]);
  });

  it("does not keep a row word equal to the refreshed server word", () => {
    const applied = { items: [{ id: "a", answer: "Saved" }] };
    const current = { items: [{ id: "a", answer: "Edited" }] };
    const next = { items: [{ id: "a", answer: "Edited" }] };

    expect(keptWords(FAQ, applied, current, next)).toEqual([]);
  });

  it("keeps a row word when English empties its server seed and ignores changed shared values", () => {
    const applied = { features: [{ id: "a", description: "Saved", iconName: "Old" }] };
    const current = { features: [{ id: "a", description: "Edited", iconName: "Typed" }] };
    const next = { features: [{ id: "a", description: "", iconName: "New" }] };

    expect(keptWords(FEATURES, applied, current, next)).toEqual([
      { path: "features.0.description", value: "Edited" },
    ]);
  });

  it.each([undefined, "", 7, null, false])(
    "does not match rows with an absent or invalid id: %j",
    (id) => {
      const applied = { items: [{ id, answer: "Saved" }] };
      const current = { items: [{ id, answer: "Edited" }] };
      const next = { items: [{ id, answer: "Server" }] };

      expect(keptWords(FAQ, applied, current, next)).toEqual([]);
    },
  );

  it("does not pair an id-less current row with the next row at its position", () => {
    expect(
      keptWords(
        FAQ,
        { items: [{ id: "a", answer: "Saved" }] },
        {
          items: [{ answer: "Edited" }],
        },
        { items: [{ id: "a", answer: "Server" }] },
      ),
    ).toEqual([]);
  });

  it("ignores non-record rows without shifting the target coordinates", () => {
    const applied = { items: [null, { id: "a", answer: "Saved" }] };
    const current = { items: [false, { id: "a", answer: "Edited" }] };
    const next = { items: ["not a row", { id: "a", answer: "Server" }] };

    expect(keptWords(FAQ, applied, current, next)).toEqual([
      { path: "items.1.answer", value: "Edited" },
    ]);
  });

  it.each([undefined, null, {}, "not a list"])("ignores a malformed list value: %j", (items) => {
    expect(keptWords(FAQ, { items }, { items }, { items })).toEqual([]);
  });

  it("recurses through groups and retains their complete field paths", () => {
    const applied = { fieldLabels: { name: "Saved", contact: "Same" } };
    const current = { fieldLabels: { name: "Edited", contact: "Same" } };
    const next = { fieldLabels: { name: "Server", contact: "Changed" } };

    expect(keptWords(SECTION_FIELD_KINDS["contact:form"], applied, current, next)).toEqual([
      { path: "fieldLabels.name", value: "Edited" },
    ]);
  });

  it("accepts missing or malformed groups as empty records", () => {
    expect(
      keptWords(
        SECTION_FIELD_KINDS["contact:form"],
        { fieldLabels: null },
        {
          fieldLabels: { name: "Edited" },
        },
        {},
      ),
    ).toEqual([{ path: "fieldLabels.name", value: "Edited" }]);
  });

  it("leaves its registry and all three documents unchanged", () => {
    const applied = { features: [{ id: "a", description: "Saved", iconName: "Old" }] };
    const current = { features: [{ id: "a", description: "Edited", iconName: "Typed" }] };
    const next = {
      features: [
        { id: "new", description: "" },
        { id: "a", description: "Saved", iconName: "New" },
      ],
    };
    const original = structuredClone({ tree: FEATURES, applied, current, next });

    expect(keptWords(FEATURES, applied, current, next)).toEqual([
      { path: "features.1.description", value: "Edited" },
    ]);
    expect({ tree: FEATURES, applied, current, next }).toEqual(original);
  });
});
