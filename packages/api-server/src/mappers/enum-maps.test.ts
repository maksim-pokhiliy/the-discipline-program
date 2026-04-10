import {
  ActionItemResolveReason as PrismaActionItemResolveReason,
  ActionItemSeverity as PrismaActionItemSeverity,
  ActionItemStatus as PrismaActionItemStatus,
  ActionItemType as PrismaActionItemType,
  ContactSubmissionStatus as PrismaContactSubmissionStatus,
  Currency as PrismaCurrency,
  Gender as PrismaGender,
  HealthStatus as PrismaHealthStatus,
  PlanEnrollmentStatus as PrismaPlanEnrollmentStatus,
  PriceInterval as PrismaPriceInterval,
  Role as PrismaRole,
  TrainingPlanStatus as PrismaTrainingPlanStatus,
} from "@prisma/client";
import { describe, expect, it } from "vitest";

import { ContactStatus } from "@repo/contracts/cms/contact";
import { PriceInterval, ProductCurrency } from "@repo/contracts/cms/product";
import { Gender, HealthStatus } from "@repo/contracts/coaching/athlete-profile";
import {
  ActionItemResolveReason,
  ActionItemSeverity,
  ActionItemStatus,
  ActionItemType,
} from "@repo/contracts/coaching/coach-action-item";
import { UserRole } from "@repo/contracts/iam/auth";
import { PlanEnrollmentStatus } from "@repo/contracts/lms/plan-enrollment";
import { TrainingPlanStatus } from "@repo/contracts/lms/training-plan";

import {
  ACTION_ITEM_RESOLVE_REASON_MAP,
  ACTION_ITEM_SEVERITY_MAP,
  ACTION_ITEM_STATUS_MAP,
  ACTION_ITEM_TYPE_MAP,
  CONTACT_SUBMISSION_STATUS_MAP,
  CONTACT_STATUS_TO_PRISMA_MAP,
  CURRENCY_MAP,
  GENDER_MAP,
  HEALTH_STATUS_MAP,
  PLAN_ENROLLMENT_STATUS_MAP,
  PRICE_INTERVAL_MAP,
  ROLE_MAP,
  TRAINING_PLAN_STATUS_MAP,
} from "./enum-maps";

describe("TRAINING_PLAN_STATUS_MAP", () => {
  it("covers every Prisma TrainingPlanStatus value", () => {
    const prismaValues = Object.values(PrismaTrainingPlanStatus);

    expect(Object.keys(TRAINING_PLAN_STATUS_MAP)).toHaveLength(prismaValues.length);
    prismaValues.forEach((v) => {
      expect(TRAINING_PLAN_STATUS_MAP).toHaveProperty(v);
    });
  });

  it("maps to correct contract values", () => {
    expect(TRAINING_PLAN_STATUS_MAP.DRAFT).toBe(TrainingPlanStatus.DRAFT);
    expect(TRAINING_PLAN_STATUS_MAP.ACTIVE).toBe(TrainingPlanStatus.ACTIVE);
    expect(TRAINING_PLAN_STATUS_MAP.ARCHIVED).toBe(TrainingPlanStatus.ARCHIVED);
  });
});

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

describe("ROLE_MAP", () => {
  it("covers every Prisma Role value", () => {
    const prismaValues = Object.values(PrismaRole);

    expect(Object.keys(ROLE_MAP)).toHaveLength(prismaValues.length);
    prismaValues.forEach((v) => {
      expect(ROLE_MAP).toHaveProperty(v);
    });
  });

  it("maps to correct contract values", () => {
    expect(ROLE_MAP.USER).toBe(UserRole.USER);
    expect(ROLE_MAP.COACH).toBe(UserRole.COACH);
    expect(ROLE_MAP.ADMIN).toBe(UserRole.ADMIN);
  });
});

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

describe("PLAN_ENROLLMENT_STATUS_MAP", () => {
  it("covers every Prisma PlanEnrollmentStatus value", () => {
    const prismaValues = Object.values(PrismaPlanEnrollmentStatus);

    expect(Object.keys(PLAN_ENROLLMENT_STATUS_MAP)).toHaveLength(prismaValues.length);
    prismaValues.forEach((v) => {
      expect(PLAN_ENROLLMENT_STATUS_MAP).toHaveProperty(v);
    });
  });

  it("maps to correct contract values", () => {
    expect(PLAN_ENROLLMENT_STATUS_MAP.ACTIVE).toBe(PlanEnrollmentStatus.ACTIVE);
    expect(PLAN_ENROLLMENT_STATUS_MAP.PAUSED).toBe(PlanEnrollmentStatus.PAUSED);
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
  it("no two Prisma keys map to the same contract value in any map", () => {
    const maps = [
      TRAINING_PLAN_STATUS_MAP,
      CURRENCY_MAP,
      PRICE_INTERVAL_MAP,
      ROLE_MAP,
      GENDER_MAP,
      HEALTH_STATUS_MAP,
      PLAN_ENROLLMENT_STATUS_MAP,
      ACTION_ITEM_TYPE_MAP,
      ACTION_ITEM_SEVERITY_MAP,
      ACTION_ITEM_STATUS_MAP,
      ACTION_ITEM_RESOLVE_REASON_MAP,
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
