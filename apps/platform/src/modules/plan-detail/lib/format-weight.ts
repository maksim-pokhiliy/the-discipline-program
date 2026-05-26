import {
  type Weight,
  type WeightCompoundDeviceEquipment,
  type WeightSplitTierEquipment,
} from "@repo/contracts/lms/_shared";

const KG_SUFFIX = " kg";
const SINGLE_ARM_SUFFIX = " kg (single-arm)";
const DUAL_PREFIX = "2 × ";
const SPACE = " ";
const MIDDLE_DOT_SEPARATOR = " · ";
const STAGE_AT = " @ ";
const STAGE_JOIN = " → ";
const DUAL_VALUE_SUFFIX = " kg (M/F)";
const DUAL_VALUE_SEPARATOR = " / ";
const ASYMMETRIC_INFIX = " arm working, passive: ";
const UNDERSCORE_RE = /_/g;
const UNDERSCORE_REPLACEMENT = " ";

type CompoundDeviceEquipmentLabel = WeightCompoundDeviceEquipment | WeightSplitTierEquipment;

const EQUIPMENT_LABELS: Record<CompoundDeviceEquipmentLabel, string> = {
  BODYWEIGHT: "Bodyweight",
  DUMBBELL: "Dumbbell",
  KETTLEBELL: "Kettlebell",
  BARBELL: "Barbell",
  BAND: "Band",
  PARALLEL_BARS: "Parallel bars",
  RINGS: "Rings",
  BOX: "Box",
  SOFA: "Sofa",
  BOX_OR_SOFA: "Box / sofa",
  MIXED: "Mixed",
  UNKNOWN: "—",
};

const equipmentLabel = (equipment: CompoundDeviceEquipmentLabel): string =>
  EQUIPMENT_LABELS[equipment].toLowerCase();

export const formatWeight = (weight: Weight): string => {
  switch (weight.variant) {
    case "single":
      return `${weight.valueKg}${KG_SUFFIX}`;
    case "dual":
      return `${DUAL_PREFIX}${weight.valueKg}${KG_SUFFIX}`;
    case "single_arm":
      return `${weight.valueKg}${SINGLE_ARM_SUFFIX}`;
    case "compound_device": {
      const countPrefix = weight.count === 2 ? DUAL_PREFIX : "";

      return `${countPrefix}${weight.valueKg}${KG_SUFFIX}${SPACE}${equipmentLabel(weight.equipment)}`;
    }
    case "split_tier":
      return weight.stages
        .map((stage) => `${stage.reps}${STAGE_AT}${stage.valueKg}${KG_SUFFIX}`)
        .join(STAGE_JOIN);
    case "dual_value":
      return `${weight.first}${DUAL_VALUE_SEPARATOR}${weight.second}${DUAL_VALUE_SUFFIX}`;
    case "with_asymmetric_arm":
      return `${weight.valueKg}${KG_SUFFIX}${MIDDLE_DOT_SEPARATOR}${weight.workingArm}${ASYMMETRIC_INFIX}${weight.passiveArmAction.replace(UNDERSCORE_RE, UNDERSCORE_REPLACEMENT)}`;
    case "with_depth_modifier":
      return `${weight.valueKg}${KG_SUFFIX}${MIDDLE_DOT_SEPARATOR}${weight.depth.replace(UNDERSCORE_RE, UNDERSCORE_REPLACEMENT)}`;
    default:
      weight satisfies never;

      return "";
  }
};
