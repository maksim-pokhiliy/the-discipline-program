import { type Gender } from "@prisma/client";

import { type OneRMRecordSource } from "@repo/contracts/lms/one-rm-record";

export type AthleteOneRMBase = {
  valueKg: number;
  recordedAt: Date;
  source: OneRMRecordSource;
};

export type AthleteLoadContext = {
  bodyweightKg: number | null;
  currentOneRMByExercise: Map<string, AthleteOneRMBase>;
  profileSelections: Record<string, string>;
  gender: Gender | null;
};

export type ResolvedLoadProfileCoord = {
  axisId: string;
  label: string;
  value: string;
  binding: "GENDER" | null;
};

export type ResolvedLoadSource =
  | { kind: "profile"; coords: ResolvedLoadProfileCoord[] }
  | {
      kind: "one_rm";
      exerciseId: string;
      percent: number;
      percentMax?: number | undefined;
      baseKg: number;
      recordedAt: string;
      recordSource: OneRMRecordSource;
    };

export type ResolvedLoad =
  | {
      status: "resolved";
      kg: number;
      perHand: boolean;
      source?: ResolvedLoadSource | undefined;
    }
  | { status: "unresolved"; reason: "missing_one_rm"; prompt: "set_one_rm"; exerciseId: string }
  | {
      status: "unresolved";
      reason: "missing_profile_pick";
      prompt: "pick_profile";
      axisLabels: string[];
    }
  | {
      status: "unresolved";
      reason: "missing_profile_attribute";
      prompt: "set_profile_attribute";
      attribute: "gender";
      axisLabels: string[];
    }
  | { status: "bodyweight" }
  | { status: "not_applicable" };
