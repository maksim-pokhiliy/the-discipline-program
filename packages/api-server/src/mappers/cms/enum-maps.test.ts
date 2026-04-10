import {
  ContactSubmissionStatus as PrismaContactSubmissionStatus,
  Currency as PrismaCurrency,
  PriceInterval as PrismaPriceInterval,
} from "@prisma/client";
import { describe, expect, it } from "vitest";

import { ContactStatus } from "@repo/contracts/cms/contact";
import { PriceInterval, ProductCurrency } from "@repo/contracts/cms/product";

import {
  CONTACT_STATUS_TO_PRISMA_MAP,
  CONTACT_SUBMISSION_STATUS_MAP,
  CURRENCY_MAP,
  PRICE_INTERVAL_MAP,
} from "./enum-maps";

describe("CURRENCY_MAP", () => {
  it("covers every Prisma Currency value", () => {
    const prismaValues = Object.values(PrismaCurrency);

    expect(Object.keys(CURRENCY_MAP)).toHaveLength(prismaValues.length);
    prismaValues.forEach((v) => {
      expect(CURRENCY_MAP).toHaveProperty(v);
    });
  });

  it("maps to correct contract values", () => {
    expect(CURRENCY_MAP.USD).toBe(ProductCurrency.USD);
    expect(CURRENCY_MAP.EUR).toBe(ProductCurrency.EUR);
    expect(CURRENCY_MAP.UAH).toBe(ProductCurrency.UAH);
  });
});

describe("PRICE_INTERVAL_MAP", () => {
  it("covers every Prisma PriceInterval value", () => {
    const prismaValues = Object.values(PrismaPriceInterval);

    expect(Object.keys(PRICE_INTERVAL_MAP)).toHaveLength(prismaValues.length);
    prismaValues.forEach((v) => {
      expect(PRICE_INTERVAL_MAP).toHaveProperty(v);
    });
  });

  it("maps to correct contract values", () => {
    expect(PRICE_INTERVAL_MAP.MONTHLY).toBe(PriceInterval.MONTHLY);
    expect(PRICE_INTERVAL_MAP.YEARLY).toBe(PriceInterval.YEARLY);
    expect(PRICE_INTERVAL_MAP.ONE_TIME).toBe(PriceInterval.ONE_TIME);
  });
});

describe("CONTACT_SUBMISSION_STATUS_MAP", () => {
  it("covers every Prisma ContactSubmissionStatus value", () => {
    const prismaValues = Object.values(PrismaContactSubmissionStatus);

    expect(Object.keys(CONTACT_SUBMISSION_STATUS_MAP)).toHaveLength(prismaValues.length);
    prismaValues.forEach((v) => {
      expect(CONTACT_SUBMISSION_STATUS_MAP).toHaveProperty(v);
    });
  });

  it("maps to correct contract values", () => {
    expect(CONTACT_SUBMISSION_STATUS_MAP.NEW).toBe(ContactStatus.NEW);
    expect(CONTACT_SUBMISSION_STATUS_MAP.IN_PROGRESS).toBe(ContactStatus.IN_PROGRESS);
    expect(CONTACT_SUBMISSION_STATUS_MAP.REPLIED).toBe(ContactStatus.REPLIED);
    expect(CONTACT_SUBMISSION_STATUS_MAP.CLOSED).toBe(ContactStatus.CLOSED);
  });
});

describe("CONTACT_STATUS_TO_PRISMA_MAP", () => {
  it("covers every contract ContactStatus value", () => {
    const contractValues = Object.values(ContactStatus);

    expect(Object.keys(CONTACT_STATUS_TO_PRISMA_MAP)).toHaveLength(contractValues.length);
    contractValues.forEach((v) => {
      expect(CONTACT_STATUS_TO_PRISMA_MAP).toHaveProperty(v);
    });
  });

  it("maps to correct Prisma values", () => {
    expect(CONTACT_STATUS_TO_PRISMA_MAP[ContactStatus.NEW]).toBe(PrismaContactSubmissionStatus.NEW);
    expect(CONTACT_STATUS_TO_PRISMA_MAP[ContactStatus.IN_PROGRESS]).toBe(
      PrismaContactSubmissionStatus.IN_PROGRESS,
    );
    expect(CONTACT_STATUS_TO_PRISMA_MAP[ContactStatus.REPLIED]).toBe(
      PrismaContactSubmissionStatus.REPLIED,
    );
    expect(CONTACT_STATUS_TO_PRISMA_MAP[ContactStatus.CLOSED]).toBe(
      PrismaContactSubmissionStatus.CLOSED,
    );
  });
});

describe("symmetry", () => {
  it("no two Prisma keys map to the same contract value in any cms map", () => {
    const maps = [
      CURRENCY_MAP,
      PRICE_INTERVAL_MAP,
      CONTACT_SUBMISSION_STATUS_MAP,
      CONTACT_STATUS_TO_PRISMA_MAP,
    ];

    maps.forEach((map) => {
      const values = Object.values(map);
      const unique = new Set(values);

      expect(unique.size).toBe(values.length);
    });
  });
});
