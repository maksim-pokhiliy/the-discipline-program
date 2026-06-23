import { type Gender } from "@prisma/client";

export type AthleteLoadContext = {
  bodyweightKg: number | null;
  currentOneRMByExercise: Map<string, number>;
  profileSelections: Record<string, string>;
  gender: Gender | null;
};

export type ResolvedLoad =
  | { status: "resolved"; kg: number; perHand: boolean }
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
