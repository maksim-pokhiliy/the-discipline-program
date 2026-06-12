import { describe, expect, it } from "vitest";

import { groupSortableId, schemaSortableId } from "./block-item-sortable-id";

describe("block item sortable ids", () => {
  it("prefixes a schema id with its kind", () => {
    expect(schemaSortableId("clp9z8x7w0000abcd1234aa01")).toBe("schema:clp9z8x7w0000abcd1234aa01");
  });

  it("prefixes a group id with its kind", () => {
    expect(groupSortableId("clp9z8x7w0000abcd1234bb01")).toBe("group:clp9z8x7w0000abcd1234bb01");
  });
});
