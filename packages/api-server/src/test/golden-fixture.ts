export const GOLDEN_PASSWORD = "Admin123!";

export const GOLDEN_BCRYPT_HASH = "$2a$10$xGFVeUFmZ9fBD3ihEPQZt.bl85fgMvCX0kdxA71xYpPDT4f72oiAy";

export const LEGACY_ROLE_USER = 1;
export const LEGACY_ROLE_ADMIN = 2;
export const LEGACY_PLAN_GENERAL = 1;
export const LEGACY_LEVEL_SCALED = 1;
export const LEGACY_LEVEL_PRO = 2;

export type GoldenFixtureUser = {
  email: string;
  legacyUserId: number;
  legacyRoleId: number;
  legacyPlanId: number;
  legacyLevelId: number;
  isEnabled: boolean;
  firstName: string;
  lastName: string;
};

export const GOLDEN_ATHLETE: GoldenFixtureUser = {
  email: "athlete@tdp.local",
  legacyUserId: 1001,
  legacyRoleId: LEGACY_ROLE_USER,
  legacyPlanId: LEGACY_PLAN_GENERAL,
  legacyLevelId: LEGACY_LEVEL_PRO,
  isEnabled: true,
  firstName: "Test",
  lastName: "Athlete",
};

export const GOLDEN_ADMIN: GoldenFixtureUser = {
  email: "admin@tdp.local",
  legacyUserId: 1002,
  legacyRoleId: LEGACY_ROLE_ADMIN,
  legacyPlanId: LEGACY_PLAN_GENERAL,
  legacyLevelId: LEGACY_LEVEL_PRO,
  isEnabled: true,
  firstName: "Root",
  lastName: "Admin",
};

export const GOLDEN_DISABLED: GoldenFixtureUser = {
  email: "disabled@tdp.local",
  legacyUserId: 1003,
  legacyRoleId: LEGACY_ROLE_USER,
  legacyPlanId: LEGACY_PLAN_GENERAL,
  legacyLevelId: LEGACY_LEVEL_SCALED,
  isEnabled: false,
  firstName: "Dis",
  lastName: "Abled",
};

export const GOLDEN_UNKNOWN_EMAIL = "ghost@tdp.local";

export const GOLDEN_FIXTURE_USERS: readonly GoldenFixtureUser[] = [
  GOLDEN_ATHLETE,
  GOLDEN_ADMIN,
  GOLDEN_DISABLED,
];
