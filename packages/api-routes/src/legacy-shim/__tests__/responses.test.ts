import { describe, expect, it } from "vitest";

import { legacyShimDenied, legacyShimOk, renderLegacyShimOutcome } from "../responses";

describe("legacy shim responses", () => {
  it("renders a denial the way the legacy stack does: 403, no body, no content-type", async () => {
    const response = legacyShimDenied();

    expect(response.status).toBe(403);
    expect(response.headers.get("content-type")).toBeNull();
    expect(await response.text()).toBe("");
  });

  it("renders success as exactly 200 because the app treats every other status as failure", async () => {
    const response = legacyShimOk({ id: 1, name: "Scaled" });

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("application/json");
    expect(await response.json()).toEqual({ id: 1, name: "Scaled" });
  });

  it("maps an ok outcome through the single mapping site", async () => {
    const response = renderLegacyShimOutcome({ kind: "ok", payload: [{ id: 2 }] });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([{ id: 2 }]);
  });

  it("maps a denied outcome through the single mapping site", async () => {
    const response = renderLegacyShimOutcome({ kind: "denied" });

    expect(response.status).toBe(403);
    expect(await response.text()).toBe("");
  });

  it("never renders an array response as an object", async () => {
    const response = legacyShimOk([{ id: 1, name: "General" }]);

    expect(await response.json()).toBeInstanceOf(Array);
  });
});
