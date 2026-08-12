import { describe, expect, it } from "vitest";

import {
  legacyShimBadRequest,
  legacyShimDenied,
  legacyShimNotFound,
  legacyShimOk,
  legacyShimOkEmpty,
  legacyShimUnauthorized,
  renderLegacyProgramOutcome,
  renderLegacyShimOutcome,
  renderLegacyUserOutcome,
} from "../responses";
import type { LegacyProgramOutcome, LegacyUserOutcome } from "../types";

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

describe("legacy shim user outcome helpers", () => {
  it("renders an ok-empty as 200 with no body, never 204", async () => {
    const response = legacyShimOkEmpty();

    expect(response.status).toBe(200);
    expect(response.status).not.toBe(204);
    expect(await response.text()).toBe("");
  });

  it("renders a bad request as 400 with no body", async () => {
    const response = legacyShimBadRequest();

    expect(response.status).toBe(400);
    expect(await response.text()).toBe("");
  });

  it("renders an unauthorized as 401 with no body", async () => {
    const response = legacyShimUnauthorized();

    expect(response.status).toBe(401);
    expect(await response.text()).toBe("");
  });

  it("renders a not found as 404 with no body", async () => {
    const response = legacyShimNotFound();

    expect(response.status).toBe(404);
    expect(await response.text()).toBe("");
  });
});

describe("renderLegacyUserOutcome", () => {
  it("maps ok-json to a 200 json body", async () => {
    const response = renderLegacyUserOutcome({ kind: "ok-json", payload: { id: 1001 } });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ id: 1001 });
  });

  it("maps ok-empty to a 200 empty body", async () => {
    const response = renderLegacyUserOutcome({ kind: "ok-empty" });

    expect(response.status).toBe(200);
    expect(await response.text()).toBe("");
  });

  it("maps not-found to 404", () => {
    expect(renderLegacyUserOutcome({ kind: "not-found" }).status).toBe(404);
  });

  it("maps unauthorized to 401", () => {
    expect(renderLegacyUserOutcome({ kind: "unauthorized" }).status).toBe(401);
  });

  it("maps bad-request to 400", () => {
    expect(renderLegacyUserOutcome({ kind: "bad-request" }).status).toBe(400);
  });

  it("never maps any business outcome to the 403 that signs the athlete out", () => {
    const outcomes: LegacyUserOutcome<{ id: number }>[] = [
      { kind: "ok-json", payload: { id: 1 } },
      { kind: "ok-empty" },
      { kind: "not-found" },
      { kind: "unauthorized" },
      { kind: "bad-request" },
    ];

    for (const outcome of outcomes) {
      expect(renderLegacyUserOutcome(outcome).status).not.toBe(403);
    }
  });
});

describe("renderLegacyProgramOutcome", () => {
  it("maps ok-json to a 200 json body", async () => {
    const response = renderLegacyProgramOutcome({ kind: "ok-json", payload: { id: 1 } });

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("application/json");
    expect(await response.json()).toEqual({ id: 1 });
  });

  it("maps not-found to 404 with no body", async () => {
    const response = renderLegacyProgramOutcome({ kind: "not-found" });

    expect(response.status).toBe(404);
    expect(await response.text()).toBe("");
  });

  it("never maps a program outcome to the 403 that signs the athlete out", () => {
    const outcomes: LegacyProgramOutcome<{ id: number }>[] = [
      { kind: "ok-json", payload: { id: 1 } },
      { kind: "not-found" },
    ];

    for (const outcome of outcomes) {
      expect(renderLegacyProgramOutcome(outcome).status).not.toBe(403);
    }
  });
});
