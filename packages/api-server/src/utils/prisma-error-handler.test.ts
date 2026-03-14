import { Prisma } from "@prisma/client";
import { describe, expect, it } from "vitest";

import { ConflictError, NotFoundError } from "@repo/errors";

import { handlePrismaError } from "./prisma-error-handler";

const makePrismaError = (
  code: string,
  meta?: Record<string, unknown>,
): Prisma.PrismaClientKnownRequestError => {
  const error = new Prisma.PrismaClientKnownRequestError("Prisma error", {
    code,
    clientVersion: "5.0.0",
    meta,
  });

  return error;
};

describe("handlePrismaError", () => {
  it("P2002 throws ConflictError with field from meta.target", () => {
    const error = makePrismaError("P2002", { target: ["email"] });

    expect(() => handlePrismaError(error, { entity: "User" })).toThrow(ConflictError);

    try {
      handlePrismaError(error, { entity: "User" });
    } catch (e) {
      expect((e as ConflictError).message).toBe("User with this email already exists");
    }
  });

  it("P2002 uses context.field when meta.target is not an array", () => {
    const error = makePrismaError("P2002", {});

    try {
      handlePrismaError(error, { entity: "Blog post", field: "slug" });
    } catch (e) {
      expect((e as ConflictError).message).toBe("Blog post with this slug already exists");
    }
  });

  it("P2002 falls back to 'value' when no field info available", () => {
    const error = makePrismaError("P2002", {});

    try {
      handlePrismaError(error, { entity: "Item" });
    } catch (e) {
      expect((e as ConflictError).message).toBe("Item with this value already exists");
    }
  });

  it("P2025 throws NotFoundError", () => {
    const error = makePrismaError("P2025");

    expect(() => handlePrismaError(error, { entity: "Product" })).toThrow(NotFoundError);

    try {
      handlePrismaError(error, { entity: "Product" });
    } catch (e) {
      expect((e as NotFoundError).message).toBe("Product not found");
    }
  });

  it("unknown Prisma error code is rethrown as-is", () => {
    const error = makePrismaError("P2003");

    expect(() => handlePrismaError(error, { entity: "X" })).toThrow(
      Prisma.PrismaClientKnownRequestError,
    );
  });

  it("non-Prisma error is rethrown as-is", () => {
    const error = new Error("Some random error");

    expect(() => handlePrismaError(error, { entity: "X" })).toThrow("Some random error");
  });

  it("non-Error value is rethrown", () => {
    expect(() => handlePrismaError("string error", { entity: "X" })).toThrow();
  });
});
