import { Prisma } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { z } from "zod";

import { BadRequestError, ConflictError, InternalServerError, NotFoundError } from "@repo/errors";

import { handlePrismaError } from "./prisma-error-handler";

const makePrismaError = (
  code: string,
  meta?: Record<string, unknown>,
): Prisma.PrismaClientKnownRequestError => {
  const error = new Prisma.PrismaClientKnownRequestError("Prisma error", {
    code,
    clientVersion: "5.0.0",
    ...(meta && { meta }),
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

  it("P2003 throws BadRequestError for FK constraint violation", () => {
    const error = makePrismaError("P2003", { field_name: "planId" });

    expect(() => handlePrismaError(error, { entity: "Enrollment" })).toThrow(BadRequestError);

    try {
      handlePrismaError(error, { entity: "Enrollment" });
    } catch (e) {
      expect((e as BadRequestError).message).toBe("Referenced Enrollment does not exist");
    }
  });

  it("P2011 throws BadRequestError for null constraint violation", () => {
    const error = makePrismaError("P2011", { constraint: ["title"] });

    expect(() => handlePrismaError(error, { entity: "Product" })).toThrow(BadRequestError);

    try {
      handlePrismaError(error, { entity: "Product" });
    } catch (e) {
      expect((e as BadRequestError).message).toBe("Required field is missing for Product");
    }
  });

  it("P2034 throws ConflictError for write conflict", () => {
    const error = makePrismaError("P2034");

    expect(() => handlePrismaError(error, { entity: "Workout" })).toThrow(ConflictError);

    try {
      handlePrismaError(error, { entity: "Workout" });
    } catch (e) {
      expect((e as ConflictError).message).toBe("Workout was modified concurrently, please retry");
    }
  });

  it("unknown Prisma error code throws InternalServerError without leaking the raw message", () => {
    const error = makePrismaError("P9999");

    expect(() => handlePrismaError(error, { entity: "X" })).toThrow(InternalServerError);

    try {
      handlePrismaError(error, { entity: "X" });
    } catch (e) {
      expect((e as InternalServerError).message).toBe("Database operation failed for X");
    }
  });

  it("PrismaClientUnknownRequestError throws InternalServerError", () => {
    const error = new Prisma.PrismaClientUnknownRequestError("Unknown error", {
      clientVersion: "5.0.0",
    });

    expect(() => handlePrismaError(error, { entity: "User" })).toThrow(InternalServerError);
  });

  it("non-Prisma error throws InternalServerError without leaking the raw message", () => {
    const error = new Error("Some random error");

    expect(() => handlePrismaError(error, { entity: "X" })).toThrow(InternalServerError);

    try {
      handlePrismaError(error, { entity: "X" });
    } catch (e) {
      expect((e as InternalServerError).message).toBe("Database operation failed for X");
    }
  });

  it("non-Error value throws InternalServerError", () => {
    expect(() => handlePrismaError("string error", { entity: "X" })).toThrow(InternalServerError);
  });

  it("ZodError throws InternalServerError with DbCorruption kind and structured issues", () => {
    const parseResult = z.object({ rpe: z.object({ value: z.number().positive() }) }).safeParse({
      rpe: { value: -5 },
    });

    if (parseResult.success) {
      throw new Error("test setup: expected Zod parse to fail");
    }

    expect(() => handlePrismaError(parseResult.error, { entity: "Block" })).toThrow(
      InternalServerError,
    );

    try {
      handlePrismaError(parseResult.error, { entity: "Block" });
    } catch (e) {
      const err = e as InternalServerError;

      expect(err.message).toBe("Block content failed schema validation");
      expect(err.details?.kind).toBe("DbCorruption");
      expect(err.details?.entity).toBe("Block");
      expect(Array.isArray(err.details?.issues)).toBe(true);

      const issues = err.details?.issues as Array<{ path: string; message: string; code: string }>;

      expect(issues.length).toBeGreaterThan(0);
      expect(issues[0]?.path).toContain("rpe");
    }
  });

  it("non-Zod non-Prisma Error subclass throws InternalServerError (regression guard for ZodError branch)", () => {
    class CustomError extends Error {
      constructor(message: string) {
        super(message);
        this.name = "CustomError";
      }
    }

    const error = new CustomError("custom failure");

    expect(() => handlePrismaError(error, { entity: "X" })).toThrow(InternalServerError);
  });
});
