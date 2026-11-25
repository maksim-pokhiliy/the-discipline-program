import { describe, expect, it } from "vitest";

import { type ProductFeatureWrite } from "@repo/contracts/cms/product";
import { BadRequestError } from "@repo/errors";

import { withFeatureIds } from "./feature-identity";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

describe("withFeatureIds", () => {
  it.each(["kept-id", " "])("keeps a non-empty id %j", (id) => {
    const features = [{ id, text: "Kept feature" }];

    expect(withFeatureIds(features)).toEqual(features);
  });

  it("mints a uuid for a missing and for an empty id", () => {
    const features = [{ text: "Missing id" }, { id: "", text: "Empty id" }];
    const result = withFeatureIds(features);

    expect(result).toEqual(features.map(({ text }) => ({ id: expect.stringMatching(UUID), text })));
    expect(new Set(result.map(({ id }) => id)).size).toBe(features.length);
  });

  it("keeps the order and the texts without changing the input", () => {
    const features: ProductFeatureWrite[] = [
      { id: "first", text: "  Untrimmed text  " },
      { text: "New feature" },
      { id: "last", text: "Unchanged last feature" },
    ];
    const original = structuredClone(features);

    expect(withFeatureIds(features)).toEqual([
      features[0],
      { id: expect.stringMatching(UUID), text: "New feature" },
      features[2],
    ]);
    expect(features).toEqual(original);
  });

  it("refuses two features sharing an id, naming it", () => {
    const features = [
      { text: "Missing id" },
      { id: "repeated", text: "First" },
      { id: "repeated", text: "Second" },
    ];
    const original = structuredClone(features);
    const run = () => withFeatureIds(features);

    expect(run).toThrow(BadRequestError);
    expect(run).toThrowError(
      expect.objectContaining({
        message: "Two features of the product share the id repeated",
        statusCode: 400,
        details: { list: "features", id: "repeated" },
      }),
    );
    expect(features).toEqual(original);
  });
});
