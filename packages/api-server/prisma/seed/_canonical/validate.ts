import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  canonicalSeedSchema,
  type CanonicalSchemaNode,
  type CanonicalBlock,
  type CanonicalSeed,
} from "./canonical-schema.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const JSON_PATH = resolve(__dirname, "plan-denys.json");

interface CoverageCell {
  id: string;
  required: number;
  description: string;
  count: number;
}

function walkSchemas(node: CanonicalSchemaNode, visitor: (n: CanonicalSchemaNode) => void): void {
  visitor(node);
  for (const sub of node.subSchemas) {
    walkSchemas(sub, visitor);
  }
}

function walkBlocks(seed: CanonicalSeed, visitor: (b: CanonicalBlock) => void): void {
  for (const w of seed.weeks) {
    for (const d of w.days) {
      for (const s of d.sessions) {
        for (const b of s.blocks) {
          visitor(b);
        }
      }
    }
  }
  for (const ps of seed.phase7Examples) {
    for (const b of ps.blocks) {
      visitor(b);
    }
  }
}

function tallyCoverage(seed: CanonicalSeed): CoverageCell[] {
  const cells: CoverageCell[] = [];

  // §3 archetypes (34: 33 sample + super-set Phase 7)
  const archetypeNames = [
    "n-rounds",
    "named-themed-sets",
    "ladder-descending",
    "emom-sub-minute-slot",
    "parallel-ladders-descending",
    "single-line-with-then-connector",
    "run-distance",
    "flat-list-headerless",
    "named-exercise-program",
    "single-line-bare",
    "pull-ups-dips-cycle",
    "emom-nested-per-minute",
    "placeholder-body",
    "composite-rounds-with-rest",
    "ladder-ascending",
    "single-line-total-counter",
    "composite-intervals-then-rounds",
    "nested-rounds-over-rounds",
    "nested-rounds-over-parallel-ladder",
    "alternating-sets",
    "time-window-outer",
    "parallel-ladders-mixed-direction",
    "nested-composite-rounds-over-ladder",
    "composite-intervals-work-rest-progressive",
    "url-only-body",
    "ladder-vertex-down-pyramid",
    "ladder-spike",
    "amrap-flat",
    "parallel-pyramids",
    "composite-intervals-work-rest-fixed",
    "composite-intervals-on-off-max-tail",
    "composite-rolling-rounds",
    "practice-list",
    "super-set",
  ];
  const archetypeCounts: Record<string, number> = Object.fromEntries(
    archetypeNames.map((a) => [a, 0]),
  );

  walkBlocks(seed, (b) => {
    for (const sch of b.schemas) {
      walkSchemas(sch, (n) => {
        archetypeCounts[n.archetype.archetype] = (archetypeCounts[n.archetype.archetype] ?? 0) + 1;
      });
    }
  });
  for (const a of archetypeNames) {
    cells.push({
      id: `archetype:${a}`,
      required: a === "alternating-sets" ? 2 : 1,
      description: `archetype ${a}`,
      count: archetypeCounts[a] ?? 0,
    });
  }

  // §4 row kinds
  const rowKindCounts: Record<string, number> = {};
  let standaloneUrlWrappedTrue = 0;
  let standaloneUrlWrappedFalse = 0;

  walkBlocks(seed, (b) => {
    for (const sch of b.schemas) {
      walkSchemas(sch, (n) => {
        for (const r of n.rows) {
          rowKindCounts[r.rowKind] = (rowKindCounts[r.rowKind] ?? 0) + 1;

          if (r.rowKind === "STANDALONE_URL" && r.rowPayload.rowKind === "STANDALONE_URL") {
            if (r.rowPayload.wrapped) {
              standaloneUrlWrappedTrue += 1;
            } else {
              standaloneUrlWrappedFalse += 1;
            }
          }
        }
      });
    }
  });
  for (const rk of [
    "EXERCISE",
    "REST",
    "FOOTNOTE",
    "STANDALONE_LOAD",
    "STANDALONE_URL",
    "PLACEHOLDER",
    "INNER_LADDER_MARKER",
    "REP_DEFINITION",
    "REST_SLOT",
  ]) {
    cells.push({
      id: `rowKind:${rk}`,
      required: rk === "STANDALONE_URL" ? 2 : 1,
      description: `rowKind ${rk}`,
      count: rowKindCounts[rk] ?? 0,
    });
  }
  cells.push({
    id: "standaloneUrl:wrapped=true",
    required: 1,
    description: "standalone wrapped URL",
    count: standaloneUrlWrappedTrue,
  });
  cells.push({
    id: "standaloneUrl:wrapped=false",
    required: 1,
    description: "standalone bare URL",
    count: standaloneUrlWrappedFalse,
  });

  // §5 exercise forms
  const formCounts: Record<string, number> = {};

  walkBlocks(seed, (b) => {
    for (const sch of b.schemas) {
      walkSchemas(sch, (n) => {
        for (const r of n.rows) {
          if (r.rowKind === "EXERCISE" && r.rowPayload.rowKind === "EXERCISE") {
            formCounts[r.rowPayload.exercise.form] =
              (formCounts[r.rowPayload.exercise.form] ?? 0) + 1;
          }
        }
      });
    }
  });
  for (const f of [
    "atomic",
    "compound",
    "cyclical",
    "sandwich",
    "or_alternative",
    "placeholder_ref",
  ]) {
    cells.push({
      id: `exerciseForm:${f}`,
      required: 1,
      description: `exercise.form ${f}`,
      count: formCounts[f] ?? 0,
    });
  }

  // §6.1 Load.kind
  const loadKindCounts: Record<string, number> = {};

  walkBlocks(seed, (b) => {
    for (const sch of b.schemas) {
      walkSchemas(sch, (n) => {
        for (const r of n.rows) {
          if (r.load) {
            loadKindCounts[r.load.kind] = (loadKindCounts[r.load.kind] ?? 0) + 1;
          }

          if (r.rowKind === "STANDALONE_LOAD" && r.rowPayload.rowKind === "STANDALONE_LOAD") {
            const lk = r.rowPayload.load.kind;

            loadKindCounts[lk] = (loadKindCounts[lk] ?? 0) + 1;
          }
        }

        // also check schema.archetype for nested staged-program loads
        if (n.archetype.archetype === "named-exercise-program") {
          for (const stage of n.archetype.params.program.stages) {
            if (stage.load) {
              loadKindCounts[stage.load.kind] = (loadKindCounts[stage.load.kind] ?? 0) + 1;
            }
          }
        }
      });
    }
  });
  for (const lk of ["absolute", "percentage", "bodyweight", "without_weight", "unspecified"]) {
    cells.push({
      id: `load:${lk}`,
      required: 1,
      description: `Load.kind ${lk}`,
      count: loadKindCounts[lk] ?? 0,
    });
  }

  // §6.2 Weight variants (under absolute)
  const variantCounts: Record<string, number> = {};

  walkBlocks(seed, (b) => {
    for (const sch of b.schemas) {
      walkSchemas(sch, (n) => {
        for (const r of n.rows) {
          if (r.load && r.load.kind === "absolute") {
            variantCounts[r.load.weight.variant] = (variantCounts[r.load.weight.variant] ?? 0) + 1;
          }
        }
      });
    }
  });
  for (const v of [
    "single",
    "dual",
    "single_arm",
    "compound_device",
    "split_tier",
    "dual_value",
    "with_asymmetric_arm",
    "with_depth_modifier",
  ]) {
    cells.push({
      id: `weight:${v}`,
      required: 1,
      description: `Weight.variant ${v}`,
      count: variantCounts[v] ?? 0,
    });
  }

  // §6.3 PercentageReference scopes
  const pctScopeCounts: Record<string, number> = {};

  walkBlocks(seed, (b) => {
    for (const sch of b.schemas) {
      walkSchemas(sch, (n) => {
        const visit = (load: any): void => {
          if (load?.kind === "percentage") {
            pctScopeCounts[load.reference.scope] = (pctScopeCounts[load.reference.scope] ?? 0) + 1;
          }
        };

        for (const r of n.rows) {
          visit(r.load);
        }

        if (n.archetype.archetype === "named-exercise-program") {
          for (const stage of n.archetype.params.program.stages) {
            visit(stage.load);
          }
        }
      });
    }
  });
  for (const s of ["self", "movement_family", "other_exercise"]) {
    cells.push({
      id: `pctScope:${s}`,
      required: 1,
      description: `PercentageReference.scope ${s}`,
      count: pctScopeCounts[s] ?? 0,
    });
  }

  // §7 RepNotation kinds & max subForms
  const repKindCounts: Record<string, number> = {};
  const maxSubFormCounts: Record<string, number> = {};
  const unitBoundForms = { value: 0, range: 0 };

  walkBlocks(seed, (b) => {
    for (const sch of b.schemas) {
      walkSchemas(sch, (n) => {
        for (const r of n.rows) {
          if (r.reps) {
            repKindCounts[r.reps.kind] = (repKindCounts[r.reps.kind] ?? 0) + 1;

            if (r.reps.kind === "max") {
              maxSubFormCounts[r.reps.subForm] = (maxSubFormCounts[r.reps.subForm] ?? 0) + 1;
            }

            if (r.reps.kind === "unit_bound") {
              if (r.reps.value !== undefined) {
                unitBoundForms.value += 1;
              }

              if (r.reps.range !== undefined) {
                unitBoundForms.range += 1;
              }
            }
          }
          // compoundRep field also counts compound_rep_unit semantically
        }
      });
    }
  });
  for (const k of [
    "count",
    "range",
    "unit_bound",
    "max",
    "implicit",
    "total_flag",
    "compound_rep_unit",
  ]) {
    cells.push({
      id: `rep:${k}`,
      required: 1,
      description: `RepNotation.kind ${k}`,
      count: repKindCounts[k] ?? 0,
    });
  }
  cells.push({
    id: "rep:unit_bound.value",
    required: 1,
    description: "unit_bound value-form",
    count: unitBoundForms.value,
  });
  cells.push({
    id: "rep:unit_bound.range",
    required: 1,
    description: "unit_bound range-form",
    count: unitBoundForms.range,
  });
  for (const sf of ["bare", "progressive", "in_remaining_time"]) {
    cells.push({
      id: `rep:max.${sf}`,
      required: 1,
      description: `max.subForm ${sf}`,
      count: maxSubFormCounts[sf] ?? 0,
    });
  }

  // §8 PerLimbDistribution
  const sideCounts: Record<string, number> = {};
  const explicitSplitSides = { left: 0, right: 0 };

  walkBlocks(seed, (b) => {
    for (const sch of b.schemas) {
      walkSchemas(sch, (n) => {
        for (const r of n.rows) {
          if (r.side) {
            sideCounts[r.side.kind] = (sideCounts[r.side.kind] ?? 0) + 1;

            if (r.side.kind === "explicit_split") {
              explicitSplitSides[r.side.side] += 1;
            }
          }
        }
      });
    }
  });
  for (const k of ["each_leg", "each_arm", "explicit_split", "alternating"]) {
    cells.push({
      id: `side:${k}`,
      required: k === "explicit_split" ? 2 : 1,
      description: `PerLimbDistribution.kind ${k}`,
      count: sideCounts[k] ?? 0,
    });
  }
  cells.push({
    id: "side:explicit_split.left",
    required: 1,
    description: "explicit_split LEFT",
    count: explicitSplitSides.left,
  });
  cells.push({
    id: "side:explicit_split.right",
    required: 1,
    description: "explicit_split RIGHT",
    count: explicitSplitSides.right,
  });

  // §9 TempoModifier axes
  const tempoCounts: Record<string, number> = {};

  walkBlocks(seed, (b) => {
    for (const sch of b.schemas) {
      walkSchemas(sch, (n) => {
        for (const r of n.rows) {
          if (!r.tempo) {
            continue;
          }

          if (r.tempo.fullTempo) {
            tempoCounts.fullTempo = (tempoCounts.fullTempo ?? 0) + 1;
          }

          if (r.tempo.pauseInUp) {
            tempoCounts.pauseInUp = (tempoCounts.pauseInUp ?? 0) + 1;
          }

          if (r.tempo.slowEccentric) {
            tempoCounts.slowEccentric = (tempoCounts.slowEccentric ?? 0) + 1;
          }

          if (r.tempo.holdAfterLast) {
            tempoCounts.holdAfterLast = (tempoCounts.holdAfterLast ?? 0) + 1;
          }

          if (r.tempo.perNthRepPause) {
            tempoCounts.perNthRepPause = (tempoCounts.perNthRepPause ?? 0) + 1;
          }
        }
      });
    }
  });
  for (const k of ["fullTempo", "slowEccentric", "pauseInUp", "holdAfterLast", "perNthRepPause"]) {
    cells.push({
      id: `tempo:${k}`,
      required: 1,
      description: `TempoModifier.${k}`,
      count: tempoCounts[k] ?? 0,
    });
  }

  // §10 SequenceIndicator kinds
  const seqCounts: Record<string, number> = {};

  walkBlocks(seed, (b) => {
    for (const sch of b.schemas) {
      walkSchemas(sch, (n) => {
        for (const r of n.rows) {
          if (r.sequence) {
            seqCounts[r.sequence.kind] = (seqCounts[r.sequence.kind] ?? 0) + 1;
          }

          if (r.rowKind === "FOOTNOTE" && r.rowPayload.rowKind === "FOOTNOTE") {
            // footnote.target acts as round-scope sequence indicator semantically
          }
        }
      });
    }
  });
  for (const k of [
    "before_named",
    "after_named",
    "before_named_after_named_composite",
    "only_once_before",
    "after_each_round",
    "after_each_typed_round",
  ]) {
    cells.push({
      id: `seq:${k}`,
      required: 1,
      description: `SequenceIndicator.kind ${k}`,
      count: seqCounts[k] ?? 0,
    });
  }

  // §11 Intensity dims
  const intCounts: Record<string, number> = {};
  const effortForms = { single: 0, range: 0 };
  const paceValues: Record<string, number> = {};
  const hrZoneValues: Record<string, number> = {};
  const numericPaceTypes: Record<string, number> = {};
  const collect = (intensity: any): void => {
    if (!intensity) {
      return;
    }

    if (intensity.effortPercent) {
      intCounts.effortPercent = (intCounts.effortPercent ?? 0) + 1;

      if ("value" in intensity.effortPercent) {
        effortForms.single += 1;
      }

      if ("range" in intensity.effortPercent) {
        effortForms.range += 1;
      }
    }

    if (intensity.rpe) {
      intCounts.rpe = (intCounts.rpe ?? 0) + 1;
    }

    if (intensity.pace) {
      intCounts.pace = (intCounts.pace ?? 0) + 1;
      paceValues[intensity.pace] = (paceValues[intensity.pace] ?? 0) + 1;
    }

    if (intensity.hrZone) {
      intCounts.hrZone = (intCounts.hrZone ?? 0) + 1;
      hrZoneValues[intensity.hrZone.zone] = (hrZoneValues[intensity.hrZone.zone] ?? 0) + 1;
    }

    if (intensity.numericPace) {
      intCounts.numericPace = (intCounts.numericPace ?? 0) + 1;
      numericPaceTypes[intensity.numericPace.paceType] =
        (numericPaceTypes[intensity.numericPace.paceType] ?? 0) + 1;
    }
  };

  walkBlocks(seed, (b) => {
    collect(b.intensity);
    for (const sch of b.schemas) {
      walkSchemas(sch, (n) => {
        collect(n.intensity);
        for (const r of n.rows) {
          collect(r.intensity);
        }
      });
    }
  });
  for (const k of ["effortPercent", "rpe", "pace", "hrZone", "numericPace"]) {
    cells.push({
      id: `intensity:${k}`,
      required: k === "effortPercent" ? 2 : 1,
      description: `Intensity.${k}`,
      count: intCounts[k] ?? 0,
    });
  }
  cells.push({
    id: "intensity:effortPercent.single",
    required: 1,
    description: "effortPercent value-form",
    count: effortForms.single,
  });
  cells.push({
    id: "intensity:effortPercent.range",
    required: 1,
    description: "effortPercent range-form",
    count: effortForms.range,
  });
  for (const p of ["easy", "moderate", "hard", "recovery"]) {
    cells.push({
      id: `intensity:pace.${p}`,
      required: 1,
      description: `pace ${p}`,
      count: paceValues[p] ?? 0,
    });
  }
  for (const z of ["Z1", "Z2", "Z3", "Z4", "Z5"]) {
    cells.push({
      id: `intensity:hrZone.${z}`,
      required: 1,
      description: `hrZone ${z}`,
      count: hrZoneValues[z] ?? 0,
    });
  }
  for (const pt of ["min_per_distance", "distance_per_min"]) {
    cells.push({
      id: `intensity:numericPace.${pt}`,
      required: 1,
      description: `numericPace paceType ${pt}`,
      count: numericPaceTypes[pt] ?? 0,
    });
  }

  // §12 RestSpec
  const restScopes: Record<string, number> = {};
  const restUnits: Record<string, number> = {};
  const restQualifiers: Record<string, number> = {};
  let setIndexCount = 0;
  const visitRest = (spec: any): void => {
    if (!spec) {
      return;
    }

    restScopes[spec.scope] = (restScopes[spec.scope] ?? 0) + 1;
    restUnits[spec.duration.unit] = (restUnits[spec.duration.unit] ?? 0) + 1;

    if (spec.qualifier) {
      restQualifiers[spec.qualifier] = (restQualifiers[spec.qualifier] ?? 0) + 1;
    }

    if (spec.setIndex !== undefined) {
      setIndexCount += 1;
    }
  };

  walkBlocks(seed, (b) => {
    for (const sch of b.schemas) {
      walkSchemas(sch, (n) => {
        for (const r of n.rows) {
          if (r.rowKind === "REST" && r.rowPayload.rowKind === "REST") {
            visitRest(r.rowPayload.parsed);
          }
        }

        if (n.archetype.archetype === "composite-rounds-with-rest") {
          visitRest(n.archetype.params.rest);
        }

        if (n.archetype.archetype === "nested-composite-rounds-over-ladder") {
          visitRest(n.archetype.params.rest);
        }

        if (n.archetype.archetype === "named-exercise-program") {
          visitRest(n.archetype.params.program.restBetweenStages);
        }

        if (n.archetype.archetype === "super-set") {
          visitRest(n.archetype.params.restBetweenPairs);
        }
      });
    }
  });
  for (const s of ["between_sets", "between_rounds", "between_intervals", "after_specific_set"]) {
    cells.push({
      id: `restScope:${s}`,
      required: 1,
      description: `RestSpec.scope ${s}`,
      count: restScopes[s] ?? 0,
    });
  }
  for (const u of ["sec", "min", "range_sec", "range_min"]) {
    cells.push({
      id: `restUnit:${u}`,
      required: 1,
      description: `RestSpec.duration.unit ${u}`,
      count: restUnits[u] ?? 0,
    });
  }
  for (const q of ["until_recovery", "fixed", "range"]) {
    cells.push({
      id: `restQualifier:${q}`,
      required: 1,
      description: `RestSpec.qualifier ${q}`,
      count: restQualifiers[q] ?? 0,
    });
  }
  cells.push({
    id: "restSetIndex",
    required: 1,
    description: "RestSpec.setIndex set",
    count: setIndexCount,
  });

  // §13 TimeCap
  const timeCapForms = { minNoMax: 0, minWithMax: 0, sec: 0 };

  walkBlocks(seed, (b) => {
    if (b.timeCap) {
      if (b.timeCap.unit === "sec") {
        timeCapForms.sec += 1;
      } else if (b.timeCap.max !== undefined) {
        timeCapForms.minWithMax += 1;
      } else {
        timeCapForms.minNoMax += 1;
      }
    }
  });
  cells.push({
    id: "timeCap:min.noMax",
    required: 1,
    description: "timeCap unit=min, no max",
    count: timeCapForms.minNoMax,
  });
  cells.push({
    id: "timeCap:min.withMax",
    required: 1,
    description: "timeCap unit=min, with max",
    count: timeCapForms.minWithMax,
  });
  cells.push({
    id: "timeCap:sec",
    required: 1,
    description: "timeCap unit=sec",
    count: timeCapForms.sec,
  });

  // §14 SchemaKind
  const kindCounts: Record<string, number> = {};

  walkBlocks(seed, (b) => {
    for (const sch of b.schemas) {
      walkSchemas(sch, (n) => {
        kindCounts[n.kind] = (kindCounts[n.kind] ?? 0) + 1;
      });
    }
  });
  for (const k of ["ATOMIC", "HEADERLESS", "NESTED", "NAMED", "COMPOSITE"]) {
    cells.push({
      id: `schemaKind:${k}`,
      required: 1,
      description: `SchemaKind ${k}`,
      count: kindCounts[k] ?? 0,
    });
  }

  // §16 Position enum
  const positionCounts: Record<string, number> = {};

  walkBlocks(seed, (b) => {
    for (const sch of b.schemas) {
      walkSchemas(sch, (n) => {
        for (const r of n.rows) {
          if (r.position) {
            positionCounts[r.position] = (positionCounts[r.position] ?? 0) + 1;
          }
        }
      });
    }
  });
  for (const p of [
    "NEUTRAL_GRIP",
    "FROM_SOFA",
    "FROM_BOX",
    "FROM_BOX_OR_SOFA",
    "FROM_SOFA_BOX",
    "WITHOUT_BENCH",
    "WITHOUT_JUMP",
    "HOLD_FARM_CARRY",
    "HAND_ON_DB",
    "HANDS_ON_DB",
    "HAND_ON_DB_NEUTRAL_GRIP",
  ]) {
    cells.push({
      id: `position:${p}`,
      required: 1,
      description: `Position ${p}`,
      count: positionCounts[p] ?? 0,
    });
  }

  // §17 StagedProgram programKind
  const programKindCounts: Record<string, number> = {};

  walkBlocks(seed, (b) => {
    for (const sch of b.schemas) {
      walkSchemas(sch, (n) => {
        if (n.archetype.archetype === "named-exercise-program") {
          const pk = n.archetype.params.program.programKind;

          programKindCounts[pk] = (programKindCounts[pk] ?? 0) + 1;
        }
      });
    }
  });
  for (const pk of ["drop_set", "wave", "cluster"]) {
    cells.push({
      id: `programKind:${pk}`,
      required: 1,
      description: `StagedProgram.programKind ${pk}`,
      count: programKindCounts[pk] ?? 0,
    });
  }

  // §18 SlotSpec
  const slotCounts = { single: 0, grouped: 0 };

  walkBlocks(seed, (b) => {
    for (const sch of b.schemas) {
      walkSchemas(sch, (n) => {
        if (n.archetype.archetype === "emom-sub-minute-slot") {
          slotCounts[n.archetype.params.slot.kind] += 1;
        }
      });
    }
  });
  cells.push({
    id: "slot:single",
    required: 1,
    description: "SlotSpec.single",
    count: slotCounts.single,
  });
  cells.push({
    id: "slot:grouped",
    required: 1,
    description: "SlotSpec.grouped",
    count: slotCounts.grouped,
  });

  // §20 Placeholder kinds
  const phKindCounts: Record<string, number> = {};

  walkBlocks(seed, (b) => {
    for (const sch of b.schemas) {
      walkSchemas(sch, (n) => {
        for (const r of n.rows) {
          if (r.rowKind === "PLACEHOLDER" && r.rowPayload.rowKind === "PLACEHOLDER") {
            phKindCounts[r.rowPayload.placeholder.placeholderKind] =
              (phKindCounts[r.rowPayload.placeholder.placeholderKind] ?? 0) + 1;
          }
        }
      });
    }
  });
  for (const k of ["muscle_group_reference", "purpose_category", "coach_choice_slot"]) {
    cells.push({
      id: `placeholderKind:${k}`,
      required: 1,
      description: `PlaceholderKind ${k}`,
      count: phKindCounts[k] ?? 0,
    });
  }

  // §21 CompoundRow / Cyclical / Sandwich / OrAlternative.purpose
  const purposeCounts: Record<string, number> = {};

  walkBlocks(seed, (b) => {
    for (const sch of b.schemas) {
      walkSchemas(sch, (n) => {
        for (const r of n.rows) {
          if (r.rowKind === "EXERCISE" && r.rowPayload.rowKind === "EXERCISE") {
            if (r.rowPayload.exercise.form === "or_alternative") {
              const p = r.rowPayload.exercise.orAlternative.purpose;

              purposeCounts[p] = (purposeCounts[p] ?? 0) + 1;
            }
          }
        }
      });
    }
  });
  for (const p of ["scale_down", "equipment_substitute", "coach_choice"]) {
    cells.push({
      id: `orPurpose:${p}`,
      required: 1,
      description: `OrAlternative.purpose ${p}`,
      count: purposeCounts[p] ?? 0,
    });
  }

  // §22 CompoundRepDefinition
  const compRepForms: Record<string, number> = {};

  walkBlocks(seed, (b) => {
    for (const sch of b.schemas) {
      walkSchemas(sch, (n) => {
        for (const r of n.rows) {
          if (r.compoundRep) {
            compRepForms[r.compoundRep.form] = (compRepForms[r.compoundRep.form] ?? 0) + 1;
          }
        }
      });
    }
  });
  for (const f of ["inline_equality", "curly_brace"]) {
    cells.push({
      id: `compoundRep:${f}`,
      required: 1,
      description: `CompoundRepDefinition.form ${f}`,
      count: compRepForms[f] ?? 0,
    });
  }

  // §23 Footnote
  const footnoteMarkers: Record<string, number> = {};
  const footnoteTargets: Record<string, number> = {};

  walkBlocks(seed, (b) => {
    for (const sch of b.schemas) {
      walkSchemas(sch, (n) => {
        for (const r of n.rows) {
          if (r.rowKind === "FOOTNOTE" && r.rowPayload.rowKind === "FOOTNOTE") {
            footnoteMarkers[r.rowPayload.marker] = (footnoteMarkers[r.rowPayload.marker] ?? 0) + 1;
            footnoteTargets[r.rowPayload.target] = (footnoteTargets[r.rowPayload.target] ?? 0) + 1;
          }
        }
      });
    }
  });
  for (const m of ["*", "**"]) {
    cells.push({
      id: `footnoteMarker:${m}`,
      required: 1,
      description: `Footnote.marker ${m}`,
      count: footnoteMarkers[m] ?? 0,
    });
  }
  for (const t of ["each_round", "each_set", "each_typed_round"]) {
    cells.push({
      id: `footnoteTarget:${t}`,
      required: 1,
      description: `Footnote.target ${t}`,
      count: footnoteTargets[t] ?? 0,
    });
  }

  // §2 entity invariants
  let restDays = 0;
  let activeDays = 0;
  let emptyBlocks = 0;
  let multiLabelBlocks = 0;
  let blockIntensitySet = 0;
  let blockTimeCapSet = 0;
  let schemaNotesSet = 0;
  let schemaIntensitySet = 0;
  let subSchemas = 0;
  let altGroupSchemas = 0;
  let sessionFreeze = 0;
  let implicitBlocks = 0;
  let singleLabelBlocks = 0;

  for (const w of seed.weeks) {
    for (const d of w.days) {
      if (d.label === "rest-day" && d.sessions.length === 0) {
        restDays += 1;
      }

      if (d.label === null) {
        activeDays += 1;
      }

      for (const s of d.sessions) {
        if (s.freezeLoadsAtCreation) {
          sessionFreeze += 1;
        }

        for (const b of s.blocks) {
          if (b.schemas.length === 0) {
            emptyBlocks += 1;
          }

          if (b.labels.length === 0) {
            implicitBlocks += 1;
          }

          if (b.labels.length === 1) {
            singleLabelBlocks += 1;
          }

          if (b.labels.length >= 2) {
            multiLabelBlocks += 1;
          }

          if (b.intensity) {
            blockIntensitySet += 1;
          }

          if (b.timeCap) {
            blockTimeCapSet += 1;
          }

          for (const sch of b.schemas) {
            walkSchemas(sch, (n) => {
              if (n.notes) {
                schemaNotesSet += 1;
              }

              if (n.intensity) {
                schemaIntensitySet += 1;
              }

              if (n.alternatingGroupRef) {
                altGroupSchemas += 1;
              }
            });
            for (const sub of sch.subSchemas) {
              walkSchemas(sub, () => {
                subSchemas += 1;
              });
            }
          }
        }
      }
    }
  }
  for (const ps of seed.phase7Examples) {
    if (ps.freezeLoadsAtCreation) {
      sessionFreeze += 1;
    }
  }
  cells.push({ id: "entity:restDay", required: 1, description: "Day with REST", count: restDays });
  cells.push({
    id: "entity:activeDay",
    required: 1,
    description: "Day with null label",
    count: activeDays,
  });
  cells.push({
    id: "entity:emptyBlock",
    required: 1,
    description: "Block with schemas=[]",
    count: emptyBlocks,
  });
  cells.push({
    id: "entity:implicitBlock",
    required: 1,
    description: "Block with labels=[]",
    count: implicitBlocks,
  });
  cells.push({
    id: "entity:singleLabelBlock",
    required: 1,
    description: "Block with 1 label",
    count: singleLabelBlocks,
  });
  cells.push({
    id: "entity:multiLabelBlock",
    required: 1,
    description: "Block with ≥2 labels",
    count: multiLabelBlocks,
  });
  cells.push({
    id: "entity:blockIntensity",
    required: 1,
    description: "Block with intensity",
    count: blockIntensitySet,
  });
  cells.push({
    id: "entity:blockTimeCap",
    required: 1,
    description: "Block with timeCap",
    count: blockTimeCapSet,
  });
  cells.push({
    id: "entity:schemaNotes",
    required: 1,
    description: "Schema with notes",
    count: schemaNotesSet,
  });
  cells.push({
    id: "entity:schemaIntensity",
    required: 1,
    description: "Schema with intensity",
    count: schemaIntensitySet,
  });
  cells.push({
    id: "entity:subSchemas",
    required: 1,
    description: "Sub-schemas exist",
    count: subSchemas,
  });
  cells.push({
    id: "entity:alternatingGroup",
    required: 2,
    description: "Schemas in alternating-group",
    count: altGroupSchemas,
  });
  cells.push({
    id: "entity:sessionFreeze",
    required: 1,
    description: "Session freezeLoadsAtCreation=true",
    count: sessionFreeze,
  });

  return cells;
}

function checkCrossReferences(seed: CanonicalSeed): string[] {
  const errors: string[] = [];
  const exRefs = new Set(seed.catalog.exercises.map((e) => e.ref));
  const lblRefs = new Set(seed.catalog.labels.map((l) => l.ref));

  // X1, X2, X5, X6
  const walkExercise = (id: string, ctx: string): void => {
    if (!exRefs.has(id)) {
      errors.push(`X1 unresolved exerciseRef "${id}" at ${ctx}`);
    }
  };
  const walkLabel = (id: string | null, ctx: string): void => {
    if (id !== null && !lblRefs.has(id)) {
      errors.push(`X2 unresolved labelRef "${id}" at ${ctx}`);
    }
  };
  const altGroups = new Map<string, { count: number; relations: Set<string> }>();

  // Track row refIds per block for parallel-ladder / super-set resolution
  const visitBlock = (b: CanonicalBlock, ctx: string): void => {
    for (const lr of b.labels) {
      walkLabel(lr, `${ctx}.labels`);
    }
    for (const sch of b.schemas) {
      visitSchema(sch, `${ctx}.schemas[${sch.order}]`);
    }
  };
  const visitSchema = (n: CanonicalSchemaNode, ctx: string): void => {
    const localRowRefs = new Set<string>();

    for (const r of n.rows) {
      if (r.refId) {
        localRowRefs.add(r.refId);
      }

      if (r.rowKind === "EXERCISE" && r.rowPayload.rowKind === "EXERCISE") {
        const ex = r.rowPayload.exercise;

        if (ex.form === "atomic") {
          walkExercise(ex.exerciseId, `${ctx}.row${r.order}.atomic`);
        } else if (ex.form === "compound") {
          for (const el of ex.compound.elements) {
            walkExercise(el.exerciseId, `${ctx}.row${r.order}.compound`);
          }
        } else if (ex.form === "cyclical") {
          walkExercise(ex.cyclical.primaryExerciseId, `${ctx}.row${r.order}.cyclical.primary`);
          walkExercise(ex.cyclical.secondaryExerciseId, `${ctx}.row${r.order}.cyclical.secondary`);
        } else if (ex.form === "sandwich") {
          walkExercise(ex.sandwich.opening.exerciseId, `${ctx}.sandwich.opening`);
          walkExercise(ex.sandwich.middle.exerciseId, `${ctx}.sandwich.middle`);
          walkExercise(ex.sandwich.closing.exerciseId, `${ctx}.sandwich.closing`);
        } else if (ex.form === "or_alternative") {
          walkExercise(ex.orAlternative.primaryExerciseId, `${ctx}.or.primary`);
          walkExercise(ex.orAlternative.alternativeExerciseId, `${ctx}.or.alternative`);
        } else if (ex.form === "placeholder_ref") {
          walkExercise(ex.placeholderExerciseId, `${ctx}.placeholder_ref`);
        }
      }

      if (r.compoundRep) {
        for (const c of r.compoundRep.composition) {
          walkExercise(c.exerciseId, `${ctx}.row${r.order}.compoundRep`);
        }
      }

      if (r.rowKind === "FOOTNOTE" && r.rowPayload.rowKind === "FOOTNOTE") {
        for (const el of r.rowPayload.content.elements) {
          walkExercise(el.exerciseId, `${ctx}.footnote`);
        }
      }

      if (r.rowKind === "REP_DEFINITION" && r.rowPayload.rowKind === "REP_DEFINITION") {
        for (const c of r.rowPayload.equality.composition) {
          walkExercise(c.exerciseId, `${ctx}.repdef`);
        }
      }
    }
    // archetypeParams cross-refs
    const ap = n.archetype;

    if (ap.archetype === "named-exercise-program") {
      walkExercise(ap.params.exerciseId, `${ctx}.archetype.exerciseId`);
    }

    if (ap.archetype === "composite-intervals-then-rounds") {
      const ex = ap.params.preambleExercise;

      if (ex.form === "atomic") {
        walkExercise(ex.exerciseId, `${ctx}.archetype.preamble`);
      }
    }

    if (ap.archetype === "composite-intervals-on-off-max-tail") {
      walkExercise(ap.params.tailExerciseId, `${ctx}.archetype.tail`);
    }

    if (ap.archetype === "super-set") {
      for (const pair of ap.params.pairs) {
        for (const ref of pair.schemaRows) {
          if (!localRowRefs.has(ref)) {
            errors.push(`X5 super-set schemaRows ref "${ref}" not in schema rows at ${ctx}`);
          }
        }
      }
    }

    if (
      ap.archetype === "parallel-ladders-descending" ||
      ap.archetype === "parallel-ladders-mixed-direction"
    ) {
      for (const lad of ap.params.ladders) {
        if (lad.pairedWithInnerRowId && !localRowRefs.has(lad.pairedWithInnerRowId)) {
          errors.push(
            `X5 parallel-ladder pairedWithInnerRowId "${lad.pairedWithInnerRowId}" not in schema rows at ${ctx}`,
          );
        }
      }
    }

    if (ap.archetype === "parallel-pyramids") {
      for (const lad of ap.params.pyramids) {
        if (lad.pairedWithInnerRowId && !localRowRefs.has(lad.pairedWithInnerRowId)) {
          errors.push(
            `X5 parallel-pyramids pairedWithInnerRowId "${lad.pairedWithInnerRowId}" not in schema rows at ${ctx}`,
          );
        }
      }
    }

    if (n.alternatingGroupRef) {
      const k = n.alternatingGroupRef;
      const existing = altGroups.get(k) ?? { count: 0, relations: new Set<string>() };

      existing.count += 1;

      if (n.alternatingGroupRelation) {
        existing.relations.add(n.alternatingGroupRelation);
      }

      altGroups.set(k, existing);
    }

    for (const sub of n.subSchemas) {
      visitSchema(sub, `${ctx}.sub${sub.order}`);
    }
  };

  for (const w of seed.weeks) {
    for (const d of w.days) {
      walkLabel(d.label, `week${w.weekIndex}.${d.dayOfWeek}.label`);
      for (const s of d.sessions) {
        walkLabel(s.label, `week${w.weekIndex}.${d.dayOfWeek}.session${s.order}.label`);
        for (const b of s.blocks) {
          visitBlock(
            b,
            `week${w.weekIndex}.${d.dayOfWeek}.session${s.order}.${b.blockInstanceRef}`,
          );
        }
      }
    }
  }
  for (const ps of seed.phase7Examples) {
    for (const b of ps.blocks) {
      visitBlock(b, `phase7.${ps.exampleId}`);
    }
  }

  // X6: AlternatingGroup ref must have ≥2 members with same relation
  for (const [k, g] of altGroups) {
    if (g.count < 2) {
      errors.push(`X6 alternatingGroupRef "${k}" has ${g.count} member(s), need ≥2`);
    }

    if (g.relations.size !== 1) {
      errors.push(`X6 alternatingGroupRef "${k}" has ${g.relations.size} distinct relations`);
    }
  }

  // X8: monotonic weekOffsetFromTodayWeeks
  let prev = -Infinity;

  for (const w of seed.weeks) {
    if (w.weekOffsetFromTodayWeeks <= prev) {
      errors.push(`X8 weekOffsetFromTodayWeeks not monotonic at weekIndex ${w.weekIndex}`);
    }

    prev = w.weekOffsetFromTodayWeeks;
  }
  // X9: weekIndex contiguous 1..totalWeeks
  for (let i = 0; i < seed.weeks.length; i++) {
    if (seed.weeks[i]!.weekIndex !== i + 1) {
      errors.push(`X9 weekIndex ${seed.weeks[i]!.weekIndex} at position ${i} (expected ${i + 1})`);
    }
  }

  return errors;
}

function main(): void {
  const raw = readFileSync(JSON_PATH, "utf8");
  const json: unknown = JSON.parse(raw);
  const result = canonicalSeedSchema.safeParse(json);

  if (!result.success) {
    console.error("Zod validation failed:");
    const issues = result.error.issues.slice(0, 50);

    for (const issue of issues) {
      console.error(`  · path=${issue.path.join(".")}: ${issue.message}`);
    }

    if (result.error.issues.length > 50) {
      console.error(`  … and ${result.error.issues.length - 50} more issues`);
    }

    process.exitCode = 1;

    return;
  }

  console.log("Zod validation: OK");

  const xrefErrors = checkCrossReferences(result.data);

  if (xrefErrors.length > 0) {
    console.error(`Cross-reference check failed (${xrefErrors.length} errors):`);
    for (const e of xrefErrors.slice(0, 30)) {
      console.error(`  · ${e}`);
    }

    if (xrefErrors.length > 30) {
      console.error(`  … and ${xrefErrors.length - 30} more`);
    }

    process.exitCode = 3;
  } else {
    console.log("Cross-reference check: OK");
  }

  const cells = tallyCoverage(result.data);
  const missing = cells.filter((c) => c.count < c.required);
  const passing = cells.length - missing.length;

  console.log(`Coverage: ${passing}/${cells.length} cells satisfied`);

  if (missing.length > 0) {
    console.log("Missing cells:");
    for (const m of missing) {
      console.log(`  · ${m.id} (need ≥${m.required}, have ${m.count}) — ${m.description}`);
    }
    process.exitCode = 2;
  } else {
    console.log("All required cells met.");
  }
}

main();
