export type AthleteLoadContext = {
  bodyweightKg: number | null;
  currentOneRMByExercise: Map<string, number>;
  profileSelections: Record<string, string>;
};

export type ResolvedLoad =
  | { status: "resolved"; kg: number; perHand: boolean }
  | { status: "unresolved"; reason: "missing_one_rm"; prompt: "set_one_rm"; exerciseId: string }
  | {
      status: "unresolved";
      reason: "missing_profile_pick";
      prompt: "pick_profile";
      axisNames: string[];
    }
  | { status: "bodyweight" }
  | { status: "not_applicable" };
