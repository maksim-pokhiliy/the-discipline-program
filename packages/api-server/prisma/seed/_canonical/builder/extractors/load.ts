import { type Load } from "@repo/contracts/lms/_shared";

/**
 * Single-bracket → Load (absolute / without_weight / null if not a load).
 * Returns null when content is non-load (pace, position, side, etc.).
 *
 * Load patterns covered (per analysis/artifacts/03-content/load-edge-cases.md +
 * modifier-scope.md §1):
 *
 *  - `15 kg`, `24 kg`                         → absolute.single
 *  - `2x 15 kg`, `2x15 kg`, `DB 2x 15 kg`     → absolute.dual
 *  - `1x 15 kg`, `DB 1x 15 kg`                → absolute.single_arm
 *  - `N/M kg`                                  → absolute.dual_value
 *  - `5 KB 24 kg + 10 DB 15 kg`               → absolute.split_tier (stages)
 *  - `15 kg | LEFT arm DO | RIGHT arm HOLD …` → absolute.with_asymmetric_arm
 *  - `24 kg | to the parallel`                → absolute.with_depth_modifier
 *  - `WITHOUT WEIGHT`                          → without_weight (drop-stage)
 *  - `EXPLODE / WITHOUT WEIGHT`               → without_weight (drop-stage)
 *  - `EXPLODE`                                 → without_weight (drop-stage)
 */
export function tryParseLoad(inner: string): Load | null {
  const txt = inner.trim();

  if (txt.length === 0) {
    return null;
  }

  // Without-weight indicators (case-insensitive)
  if (/^(without\s+weight|explode)(\s*\/\s*(without\s+weight|explode))?$/i.test(txt)) {
    return { kind: "without_weight", context: "drop_set_stage" };
  }

  // Composite split-tier: "5 KB 24 kg + 10 DB 15 kg"
  const splitTier = txt.match(
    /^(\d+)\s+(KB|DB|BB)\s+(\d+(?:\.\d+)?)\s*kg\s*\+\s*(\d+)\s+(KB|DB|BB)\s+(\d+(?:\.\d+)?)\s*kg$/i,
  );

  if (splitTier) {
    const eqMap: Record<string, "DUMBBELL" | "KETTLEBELL" | "BARBELL"> = {
      DB: "DUMBBELL",
      KB: "KETTLEBELL",
      BB: "BARBELL",
    };

    return {
      kind: "absolute",
      weight: {
        variant: "split_tier",
        stages: [
          {
            reps: parseInt(splitTier[1]!, 10),
            equipment: eqMap[splitTier[2]!.toUpperCase()]!,
            valueKg: parseFloat(splitTier[3]!),
          },
          {
            reps: parseInt(splitTier[4]!, 10),
            equipment: eqMap[splitTier[5]!.toUpperCase()]!,
            valueKg: parseFloat(splitTier[6]!),
          },
        ],
      },
    };
  }

  // Composite asymmetric arm: "15 kg | LEFT arm DO | RIGHT arm HOLD in UP"
  const asymMatch = txt.match(
    /^(\d+(?:\.\d+)?)\s*kg\s*\|\s*(LEFT|RIGHT)\s*arm\s*DO\s*\|\s*(LEFT|RIGHT)\s*arm\s*HOLD(?:\s+in\s+UP)?/i,
  );

  if (asymMatch) {
    const workingArm = asymMatch[2]!.toLowerCase() as "left" | "right";

    return {
      kind: "absolute",
      weight: {
        variant: "with_asymmetric_arm",
        valueKg: parseFloat(asymMatch[1]!),
        workingArm,
        passiveArmAction: "hold_in_up",
      },
    };
  }

  // Composite depth modifier: "24 kg | to the parallel"
  const depthMatch = txt.match(
    /^(\d+(?:\.\d+)?)\s*kg\s*\|\s*(to\s+the\s+parallel|full\s+rom|partial)\s*$/i,
  );

  if (depthMatch) {
    const depthRaw = depthMatch[2]!.toLowerCase().replace(/\s+/g, "_");
    const depth: "to_parallel" | "full_rom" | "partial" =
      depthRaw === "to_the_parallel"
        ? "to_parallel"
        : depthRaw === "full_rom"
          ? "full_rom"
          : "partial";

    return {
      kind: "absolute",
      weight: {
        variant: "with_depth_modifier",
        valueKg: parseFloat(depthMatch[1]!),
        depth,
      },
    };
  }

  // Dual-value: "50/30 kg"
  const dualValueMatch = txt.match(/^(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)\s*kg$/);

  if (dualValueMatch) {
    return {
      kind: "absolute",
      weight: {
        variant: "dual_value",
        first: parseFloat(dualValueMatch[1]!),
        second: parseFloat(dualValueMatch[2]!),
        resolver: "athlete_profile",
      },
    };
  }

  // Dual: "2x 15 kg" / "2x15 kg" / "DB 2x 15 kg"
  const dualMatch = txt.match(/^(?:DB\s+|KB\s+|BB\s+)?2x\s*(\d+(?:\.\d+)?)\s*kg$/i);

  if (dualMatch) {
    return {
      kind: "absolute",
      weight: { variant: "dual", valueKg: parseFloat(dualMatch[1]!) },
    };
  }

  // Single-arm: "1x 15 kg" / "DB 1x 15 kg"
  const singleArmMatch = txt.match(/^(?:DB\s+|KB\s+|BB\s+)?1x\s*(\d+(?:\.\d+)?)\s*kg$/i);

  if (singleArmMatch) {
    return {
      kind: "absolute",
      weight: { variant: "single_arm", valueKg: parseFloat(singleArmMatch[1]!) },
    };
  }

  // Single (no x-prefix): "15 kg" / "24 kg"
  const singleMatch = txt.match(/^(?:DB\s+|KB\s+|BB\s+)?(\d+(?:\.\d+)?)\s*kg$/i);

  if (singleMatch) {
    return {
      kind: "absolute",
      weight: { variant: "single", valueKg: parseFloat(singleMatch[1]!) },
    };
  }

  return null;
}
