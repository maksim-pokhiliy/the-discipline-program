import { z } from "zod";

import { isValidIsoDate, parseLegacyDate } from "../src/endpoints/mobile-compat/legacy-date";

export const LEGACY_ADMIN_SYNTHETIC_EMAIL = "legacy-admin@thedisciplineprogram.com";

type UsernameOverride = {
  sourceUsername: string;
  email: string;
  isForcedDisabled: boolean;
  isCredentialWithheld: boolean;
};

const USERNAME_OVERRIDES: ReadonlyMap<number, UsernameOverride> = new Map([
  [
    17,
    {
      sourceUsername: "admin",
      email: LEGACY_ADMIN_SYNTHETIC_EMAIL,
      isForcedDisabled: true,
      isCredentialWithheld: true,
    },
  ],
]);

const BCRYPT_HASH_SHAPE = /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/;
const MAX_INT4 = 2_147_483_647;

const legacySourceRowSchema = z
  .object({
    id: z.number().int().positive().max(MAX_INT4),
    username: z.string().min(1),
    password: z
      .string()
      .regex(
        BCRYPT_HASH_SHAPE,
        "is not a bcrypt hash; importing it verbatim would lock the account out permanently",
      ),
    user_role_id: z.number().int(),
    training_level_id: z.number().int(),
    first_name: z.string().nullable(),
    last_name: z.string().nullable(),
    phone_number: z.string().nullable(),
    date_of_birth: z.string().refine(isValidIsoDate).nullable(),
    team_id: z.number().int().nullable(),
    user_plan_id: z.number().int(),
    is_enabled: z.boolean(),
  })
  .strict();

export const legacySourceSchema = z
  .array(legacySourceRowSchema)
  .min(1, "the export holds no rows; a run that imports nothing is almost always a wrong target");

export type LegacySourceRow = z.infer<typeof legacySourceRowSchema>;

export type NormalizedLegacyUser = {
  legacyUserId: number;
  sourceUsername: string;
  email: string;
  isSyntheticEmail: boolean;
  passwordHash: string | null;
  name: string | null;
  legacyRoleId: number;
  legacyPlanId: number;
  legacyLevelId: number;
  isEnabled: boolean;
  firstName: string | null;
  lastName: string | null;
  phoneNumber: string | null;
  dateOfBirth: Date | null;
  hasLegacyTeam: boolean;
};

export type SourceDefect =
  | { kind: "username-not-an-email"; legacyUserId: number }
  | { kind: "override-source-mismatch"; legacyUserId: number; expectedUsername: string };

export type ParsedLegacySource = {
  rows: readonly NormalizedLegacyUser[];
  defects: readonly SourceDefect[];
};

const emailSchema = z.string().email();

export const isEmailShaped = (value: string): boolean => emailSchema.safeParse(value).success;

export const composeUserName = (
  firstName: string | null,
  lastName: string | null,
): string | null => {
  const parts = [firstName, lastName]
    .map((part) => part?.trim() ?? "")
    .filter((part) => part !== "");

  return parts.length > 0 ? parts.join(" ") : null;
};

const normalizeRow = (
  row: LegacySourceRow,
): { row: NormalizedLegacyUser } | { defect: SourceDefect } => {
  const normalizedUsername = row.username.toLowerCase().trim();
  const override = USERNAME_OVERRIDES.get(row.id);

  if (override !== undefined && override.sourceUsername !== normalizedUsername) {
    return {
      defect: {
        kind: "override-source-mismatch",
        legacyUserId: row.id,
        expectedUsername: override.sourceUsername,
      },
    };
  }

  const email = override?.email ?? normalizedUsername;

  if (override === undefined && !isEmailShaped(email)) {
    return { defect: { kind: "username-not-an-email", legacyUserId: row.id } };
  }

  return {
    row: {
      legacyUserId: row.id,
      sourceUsername: row.username,
      email,
      isSyntheticEmail: override !== undefined,
      passwordHash: override?.isCredentialWithheld === true ? null : row.password,
      name: composeUserName(row.first_name, row.last_name),
      legacyRoleId: row.user_role_id,
      legacyPlanId: row.user_plan_id,
      legacyLevelId: row.training_level_id,
      isEnabled: override?.isForcedDisabled === true ? false : row.is_enabled,
      firstName: row.first_name,
      lastName: row.last_name,
      phoneNumber: row.phone_number,
      dateOfBirth: parseLegacyDate(row.date_of_birth),
      hasLegacyTeam: row.team_id !== null,
    },
  };
};

export const normalizeLegacySource = (
  sourceRows: readonly LegacySourceRow[],
): ParsedLegacySource => {
  const rows: NormalizedLegacyUser[] = [];
  const defects: SourceDefect[] = [];

  for (const sourceRow of sourceRows) {
    const outcome = normalizeRow(sourceRow);

    if ("defect" in outcome) {
      defects.push(outcome.defect);

      continue;
    }

    rows.push(outcome.row);
  }

  return { rows, defects };
};

export const parseLegacySource = (raw: unknown): ParsedLegacySource =>
  normalizeLegacySource(legacySourceSchema.parse(raw));
