import { describe, expect, it } from "vitest";

import { formatDateParam, parseDateParam } from "./date-calendar";

describe("parseDateParam", () => {
  it("parses a canonical YYYY-MM-DD string", () => {
    const date = parseDateParam("2026-05-04");

    expect(date).not.toBeNull();
    expect(date?.getFullYear()).toBe(2026);
    expect(date?.getMonth()).toBe(4);
    expect(date?.getDate()).toBe(4);
  });

  it("round-trips through formatDateParam", () => {
    const input = "2026-05-04";
    const date = parseDateParam(input);

    expect(date).not.toBeNull();
    expect(formatDateParam(date as Date)).toBe(input);
  });

  it("returns null for an empty string", () => {
    expect(parseDateParam("")).toBeNull();
  });

  it("returns null for non-date input", () => {
    expect(parseDateParam("invalid")).toBeNull();
  });

  it("returns null for month overflow (2026-13-01)", () => {
    expect(parseDateParam("2026-13-01")).toBeNull();
  });

  it("returns null for month zero (2026-00-15)", () => {
    expect(parseDateParam("2026-00-15")).toBeNull();
  });

  it("returns null for day overflow (2026-02-30)", () => {
    expect(parseDateParam("2026-02-30")).toBeNull();
  });

  it("returns null for day overflow in 31-day month (2026-05-32)", () => {
    expect(parseDateParam("2026-05-32")).toBeNull();
  });

  it("returns null for slash separators (2026/05/04)", () => {
    expect(parseDateParam("2026/05/04")).toBeNull();
  });

  it("returns null for non-zero-padded values (2026-5-4)", () => {
    expect(parseDateParam("2026-5-4")).toBeNull();
  });

  it("returns null for full ISO with time (2026-05-04T00:00:00Z)", () => {
    expect(parseDateParam("2026-05-04T00:00:00Z")).toBeNull();
  });

  it("returns null for whitespace-padded input", () => {
    expect(parseDateParam("  2026-05-04  ")).toBeNull();
  });

  it("returns null for negative year prefix", () => {
    expect(parseDateParam("-2026-05-04")).toBeNull();
  });

  it("accepts leap-year Feb 29 (2024-02-29)", () => {
    const date = parseDateParam("2024-02-29");

    expect(date).not.toBeNull();
    expect(date?.getMonth()).toBe(1);
    expect(date?.getDate()).toBe(29);
  });

  it("returns null for non-leap Feb 29 (2025-02-29)", () => {
    expect(parseDateParam("2025-02-29")).toBeNull();
  });
});
