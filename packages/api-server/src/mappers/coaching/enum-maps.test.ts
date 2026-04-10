import {
  ActionItemResolveReason as PrismaActionItemResolveReason,
  ActionItemSeverity as PrismaActionItemSeverity,
  ActionItemStatus as PrismaActionItemStatus,
  ActionItemType as PrismaActionItemType,
  Gender as PrismaGender,
  HealthStatus as PrismaHealthStatus,
} from "@prisma/client";
import { describe, expect, it } from "vitest";

import { Gender, HealthStatus } from "@repo/contracts/coaching/athlete-profile";
import {
  ActionItemResolveReason,
  ActionItemSeverity,
  ActionItemStatus,
  ActionItemType,
} from "@repo/contracts/coaching/coach-action-item";

import {
  ACTION_ITEM_RESOLVE_REASON_MAP,
  ACTION_ITEM_SEVERITY_MAP,
  ACTION_ITEM_STATUS_MAP,
  ACTION_ITEM_TYPE_MAP,
  GENDER_MAP,
  HEALTH_STATUS_MAP,
} from "./enum-maps";

describe("GENDER_MAP", () => {
  it("covers every Prisma Gender value", () => {
    const prismaValues = Object.values(PrismaGender);

    expect(Object.keys(GENDER_MAP)).toHaveLength(prismaValues.length);
    prismaValues.forEach((v) => {
      expect(GENDER_MAP).toHaveProperty(v);
    });
  });

  it("maps to correct contract values", () => {
    expect(GENDER_MAP.MALE).toBe(Gender.MALE);
    expect(GENDER_MAP.FEMALE).toBe(Gender.FEMALE);
  });
});

describe("HEALTH_STATUS_MAP", () => {
  it("covers every Prisma HealthStatus value", () => {
    const prismaValues = Object.values(PrismaHealthStatus);

    expect(Object.keys(HEALTH_STATUS_MAP)).toHaveLength(prismaValues.length);
    prismaValues.forEach((v) => {
      expect(HEALTH_STATUS_MAP).toHaveProperty(v);
    });
  });

  it("maps to correct contract values", () => {
    expect(HEALTH_STATUS_MAP.HEALTHY).toBe(HealthStatus.HEALTHY);
    expect(HEALTH_STATUS_MAP.INJURED).toBe(HealthStatus.INJURED);
    expect(HEALTH_STATUS_MAP.RESTRICTED).toBe(HealthStatus.RESTRICTED);
  });
});

describe("ACTION_ITEM_TYPE_MAP", () => {
  it("covers every Prisma ActionItemType value", () => {
    const prismaValues = Object.values(PrismaActionItemType);

    expect(Object.keys(ACTION_ITEM_TYPE_MAP)).toHaveLength(prismaValues.length);
    prismaValues.forEach((v) => {
      expect(ACTION_ITEM_TYPE_MAP).toHaveProperty(v);
    });
  });

  it("maps to correct contract values", () => {
    expect(ACTION_ITEM_TYPE_MAP.MISSED_WORKOUTS).toBe(ActionItemType.MISSED_WORKOUTS);
    expect(ACTION_ITEM_TYPE_MAP.NEW_NO_START).toBe(ActionItemType.NEW_NO_START);
    expect(ACTION_ITEM_TYPE_MAP.HEALTH_REPORT).toBe(ActionItemType.HEALTH_REPORT);
  });
});

describe("ACTION_ITEM_SEVERITY_MAP", () => {
  it("covers every Prisma ActionItemSeverity value", () => {
    const prismaValues = Object.values(PrismaActionItemSeverity);

    expect(Object.keys(ACTION_ITEM_SEVERITY_MAP)).toHaveLength(prismaValues.length);
    prismaValues.forEach((v) => {
      expect(ACTION_ITEM_SEVERITY_MAP).toHaveProperty(v);
    });
  });

  it("maps to correct contract values", () => {
    expect(ACTION_ITEM_SEVERITY_MAP.INFO).toBe(ActionItemSeverity.INFO);
    expect(ACTION_ITEM_SEVERITY_MAP.WARNING).toBe(ActionItemSeverity.WARNING);
    expect(ACTION_ITEM_SEVERITY_MAP.CRITICAL).toBe(ActionItemSeverity.CRITICAL);
  });
});

describe("ACTION_ITEM_STATUS_MAP", () => {
  it("covers every Prisma ActionItemStatus value", () => {
    const prismaValues = Object.values(PrismaActionItemStatus);

    expect(Object.keys(ACTION_ITEM_STATUS_MAP)).toHaveLength(prismaValues.length);
    prismaValues.forEach((v) => {
      expect(ACTION_ITEM_STATUS_MAP).toHaveProperty(v);
    });
  });

  it("maps to correct contract values", () => {
    expect(ACTION_ITEM_STATUS_MAP.OPEN).toBe(ActionItemStatus.OPEN);
    expect(ACTION_ITEM_STATUS_MAP.RESOLVED).toBe(ActionItemStatus.RESOLVED);
  });
});

describe("ACTION_ITEM_RESOLVE_REASON_MAP", () => {
  it("covers every Prisma ActionItemResolveReason value", () => {
    const prismaValues = Object.values(PrismaActionItemResolveReason);

    expect(Object.keys(ACTION_ITEM_RESOLVE_REASON_MAP)).toHaveLength(prismaValues.length);
    prismaValues.forEach((v) => {
      expect(ACTION_ITEM_RESOLVE_REASON_MAP).toHaveProperty(v);
    });
  });

  it("maps to correct contract values", () => {
    expect(ACTION_ITEM_RESOLVE_REASON_MAP.AUTO_CONDITION_CLEARED).toBe(
      ActionItemResolveReason.AUTO_CONDITION_CLEARED,
    );
    expect(ACTION_ITEM_RESOLVE_REASON_MAP.AUTO_ENROLLMENT_ENDED).toBe(
      ActionItemResolveReason.AUTO_ENROLLMENT_ENDED,
    );
    expect(ACTION_ITEM_RESOLVE_REASON_MAP.MANUAL_CONTACTED).toBe(
      ActionItemResolveReason.MANUAL_CONTACTED,
    );
  });
});

describe("symmetry", () => {
  it("no two Prisma keys map to the same contract value in any coaching map", () => {
    const maps = [
      GENDER_MAP,
      HEALTH_STATUS_MAP,
      ACTION_ITEM_TYPE_MAP,
      ACTION_ITEM_SEVERITY_MAP,
      ACTION_ITEM_STATUS_MAP,
      ACTION_ITEM_RESOLVE_REASON_MAP,
    ];

    maps.forEach((map) => {
      const values = Object.values(map);
      const unique = new Set(values);

      expect(unique.size).toBe(values.length);
    });
  });
});
