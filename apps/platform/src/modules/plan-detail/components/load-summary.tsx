"use client";

import { Chip } from "@mui/material";

import type {
  Load,
  PercentageReference,
  Weight,
  WeightCompoundDeviceEquipment,
  WeightDepthModifier,
  WeightPassiveArmAction,
  WeightWorkingArm,
} from "@repo/contracts/lms/_shared";

const EQUIPMENT_SHORT: Record<WeightCompoundDeviceEquipment, string> = {
  BODYWEIGHT: "bodyweight",
  DUMBBELL: "DB",
  KETTLEBELL: "KB",
  BARBELL: "BB",
  BAND: "band",
  PARALLEL_BARS: "bars",
  RINGS: "rings",
  BOX: "box",
  SOFA: "sofa",
  BOX_OR_SOFA: "box/sofa",
  MIXED: "mixed",
  UNKNOWN: "unknown",
};

const ARM_LABELS: Record<WeightWorkingArm, string> = {
  left: "left arm",
  right: "right arm",
};

const PASSIVE_ARM_ACTION_LABELS: Record<WeightPassiveArmAction, string> = {
  hold_in_up: "hold in up",
  hold_static: "hold static",
  hold_with_extra_weight: "hold with extra weight",
};

const DEPTH_LABELS: Record<WeightDepthModifier, string> = {
  to_parallel: "to parallel",
  full_rom: "full ROM",
  partial: "partial",
};

const formatWeight = (weight: Weight): string => {
  switch (weight.variant) {
    case "single":
      return `${weight.valueKg} kg single`;
    case "dual":
      return `${weight.valueKg} kg dual`;
    case "single_arm":
      return `${weight.valueKg} kg single arm`;
    case "compound_device":
      return `${weight.valueKg} kg · ${weight.count}× ${EQUIPMENT_SHORT[weight.equipment]}`;
    case "split_tier":
      return `split: ${weight.stages
        .map((stage) => `${stage.reps}×${stage.valueKg} kg ${EQUIPMENT_SHORT[stage.equipment]}`)
        .join(", ")}`;
    case "dual_value":
      return `${weight.first} / ${weight.second} kg`;
    case "with_asymmetric_arm": {
      const arm = ARM_LABELS[weight.workingArm];
      const action = PASSIVE_ARM_ACTION_LABELS[weight.passiveArmAction];
      const extra =
        weight.passiveExtraWeight !== undefined
          ? ` (+${weight.passiveExtraWeight.valueKg} kg)`
          : "";

      return `${weight.valueKg} kg, ${arm}, ${action}${extra}`;
    }
    case "with_depth_modifier":
      return `${weight.valueKg} kg ${DEPTH_LABELS[weight.depth]}`;
    default:
      return "weight";
  }
};

const formatReference = (reference: PercentageReference): string => {
  switch (reference.scope) {
    case "self":
      return " of self";
    case "movement_family":
      return ` of ${reference.movementFamily}`;
    case "other_exercise":
      return " of another exercise";
    default:
      return "";
  }
};

export const formatLoad = (load: Load): string => {
  switch (load.kind) {
    case "absolute":
      return formatWeight(load.weight);
    case "percentage": {
      const range =
        load.rangeMax !== undefined ? `${load.value}-${load.rangeMax}` : `${load.value}`;

      return `${range}%${formatReference(load.reference)}`;
    }
    case "bodyweight":
      return "bodyweight";
    case "without_weight":
      return "no weight (drop set)";
    case "unspecified":
      return "load unspecified";
    default:
      return "load";
  }
};

type LoadSummaryProps = {
  load: Load;
};

export const LoadSummary = ({ load }: LoadSummaryProps) => {
  return <Chip size="small" label={formatLoad(load)} />;
};
