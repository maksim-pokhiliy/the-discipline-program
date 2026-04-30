export type EditingTarget = { kind: "all" } | { kind: "athlete"; enrollmentId: string };

export type EditingTargetContextValue = {
  target: EditingTarget;
  setTarget: (next: EditingTarget) => void;
};
