Задача: Phase 7 — Professional CrossFit coverage extensions для проекта построения доменной модели тренировочных сессий.

КОНТЕКСТ

Ты — соседняя сессия в рамках workflow по построению доменной модели. Phase 1-6 закрыты (см. `analysis/artifacts/`). Phase 7 — точечное расширение модели под подготовку **профессионального CrossFit атлета**: добавляет 6 expressiveness gaps выявленных main session.

ПЕРВЫМ ДЕЛОМ прочитай файл-контракт:

`/home/maksym/projects/contrib/the-discipline-program/analysis/artifacts/00-meta/workflow.md`

Не нарушать. Phase 7 — additive (никаких structural rebuilds). Все Phase 1-6 артефакты — ground truth.

DECISIONS INHERITED — все Phase 1-6 ratified остаются. Не пересматривать.

PHASE 7 SCOPE — 6 EXTENSIONS

Main session ratified 6 точечных additive changes для покрытия professional CrossFit programming:

### Ext 1: HR zones в Intensity

Endurance/aerobic work на Z1-Z5 prescriptions.

Final shape:

```typescript
Intensity.hrZone?: { zone: "Z1" | "Z2" | "Z3" | "Z4" | "Z5" }
```

Resolution: categorical zone. Athlete-specific BPM ranges резолвятся через `Athlete.profile.hrMax` (placeholder в profileAttributes JSON). Phase 7 model **не** хранит абсолютные BPM — только zone enum.

### Ext 2: Numeric pace в Intensity

Running / rowing / swimming interval prescriptions (e.g. `4:30/km`, `1:50/500m`).

Final shape:

```typescript
Intensity.numericPace?: {
  value: string,           // "4:30" — MM:SS format
  distanceUnit: "km" | "mi" | "m" | "yd" | "lap",
  paceType: "min_per_distance" | "distance_per_min"
}
```

Default paceType = `min_per_distance` (running/rowing standard).

### Ext 3: Full 4-digit tempo в TempoModifier

Olympic/accessory tempo notation `3-1-2-0` (eccentric-pauseBottom-concentric-pauseTop, all seconds).

Final shape:

```typescript
TempoModifier.fullTempo?: {
  eccentric: number,        // seconds
  pauseBottom: number,
  concentric: number,
  pauseTop: number
}
```

"X" (eXplosive) notation = 0 seconds.

### Ext 4: StagedProgram (rename + generalize DropSetProgram)

Текущий DropSetProgram covers только Bulgarian split squats drop-set. Generalize для:

- **Drop-set** (existing): weight decrement per stage.
- **Wave loading**: progressive weight increase (`5×3 @ 70/80/90%`).
- **Cluster sets**: mini-rest между rep clusters внутри одного set.

Final structure:

```typescript
StagedProgram {
  stages: Stage[],
  restBetweenStages?: RestSpec,        // Ext 4 addition
  programKind: "drop_set" | "wave" | "cluster"
}
Stage {
  reps: number | RepNotation,
  load?: Load,                          // weight override (drop-set / wave)
  indicator?: "explode" | "without_weight" | enum   // existing
}
```

Migration: **rename `DropSetProgram` → `StagedProgram` везде** (types.ts, references в archetype params, implementation-notes.md algorithms). Phase 5/6 naming was tentative; Phase 7 finalizes.

### Ext 5: super-set archetype

Bodybuilding-style paired exercises sequentially as single super-set (A1, A2 / B1, B2 patterns) часто встречается в CrossFit accessory.

Final archetype:

- Name: `super-set`
- Family: `ROUNDS_SETS` (close family, не new family)
- archetype_params shape:
  ```typescript
  ArchetypeSuperSetParams {
    pairs: SuperSetPair[],
    restBetweenPairs?: RestSpec,
    rounds: number              // how many rounds of full super-set
  }
  SuperSetPair {
    label: string,              // "A1" | "A2" | "B1" | etc.
    schemaRows: SchemaRowRef[]  // 2+ rows executed sequentially
  }
  ```

NOT reuse SchemaPairing — это для bidirectional schema relation (alternating-sets). Super-set — это **ordered exercise sequence внутри одной schema**.

### Ext 6: Equipment enum extensions

Add для professional CrossFit equipment:

- `YOKE` (strongman)
- `ATLAS_STONE` (strongman)
- `SLED` (sled push/pull)
- `ASSAULT_BIKE`
- `SKI_ERG`
- `ROW_ERG`
- `JUMP_ROPE` (для double unders, хоть и bodyweight-adjacent)

Add to existing `Equipment` enum. Order alphabetical в schema.prisma.

Q-RESOLUTIONS (Q16-Q21)

| ID  | Question                         | Final Resolution                                                                                   |
| --- | -------------------------------- | -------------------------------------------------------------------------------------------------- |
| Q16 | HR zone reference                | Categorical zone only. Athlete HR max stored в `profileAttributes.hrMax` (placeholder).            |
| Q17 | Numeric pace distance unit       | Enum: km / mi / m / yd / lap. Default paceType=`min_per_distance`.                                 |
| Q18 | Full tempo notation              | 4-digit (eccentric-pauseBottom-concentric-pauseTop) в seconds. "X" → 0.                            |
| Q19 | StagedProgram migration          | Rename DropSetProgram → StagedProgram (clean rename, не alias). Phase 7 finalizes.                 |
| Q20 | super-set vs SchemaPairing reuse | Archetype params (NOT SchemaPairing entity). SchemaPairing остаётся для alternating-sets.          |
| Q21 | Equipment enum extensions        | Ratify all 7 additions (YOKE / ATLAS_STONE / SLED / ASSAULT_BIKE / SKI_ERG / ROW_ERG / JUMP_ROPE). |

ВХОДНЫЕ ДАННЫЕ

Все артефакты Phase 1-6. Особо приоритет:

- `06-formalization/schema.prisma` (для Equipment enum extension)
- `06-formalization/types.ts` (для VO shape updates + StagedProgram rename)
- `06-formalization/er-final.md` (для diagram updates)
- `06-formalization/stress-final.md` (для new stress cases)
- `06-formalization/implementation-notes.md` (для new resolution algorithms)
- `05-synthesis/domain-model.md` (для VO catalog updates)
- `05-synthesis/edge-cases.md` (для Q16-Q21 documentation)
- `00-meta/workflow.md` (для glossary update)

ЦЕЛЬ

Все артефакты должны отражать полную картину после Phase 7 — следующий шаг (в новой сессии) — построение UI на основе модели. Артефакты = ground truth для UI work.

ЗАДАЧИ

### Task 1 — schema.prisma

`06-formalization/schema.prisma`:

- Extend `enum Equipment` — add 7 new values per Ext 6 (alphabetical order).
- НИ ОДНОЙ другой structural change. Intensity / TempoModifier / StagedProgram / super-set archetype — все хранятся в JSON columns (Json type), structural Prisma не меняется. **Это критически важно**.
- Сохранить existing comments / formatting.

### Task 2 — types.ts

`06-formalization/types.ts`:

- Update `Intensity` struct: add `hrZone?` and `numericPace?` fields per Ext 1, Ext 2.
- Update `TempoModifier` discriminated union или struct: add `fullTempo?` variant per Ext 3.
- **Rename** `DropSetProgram` → `StagedProgram`. Update all references. Add `restBetweenStages?: RestSpec` and `programKind: "drop_set" | "wave" | "cluster"` per Ext 4.
- Add `ArchetypeSuperSetParams` interface per Ext 5.
- Add new ArchetypeParams discriminated union case for super-set archetype.
- Equipment enum import — verify reflects new values from schema.prisma.

### Task 3 — er-final.md

`06-formalization/er-final.md`:

- Update comments mentioning `Intensity` to include hrZone / numericPace.
- Update `TempoModifier` comment.
- Update `StagedProgram` mention (rename from DropSetProgram).
- Add super-set archetype reference in archetypes catalog discussion.
- Update Equipment enum example в notes.

### Task 4 — stress-final.md

`06-formalization/stress-final.md`:

- Add **§7 Phase 7 professional CrossFit stress test** — гипотетические 6 sessions covering:
  1. HR Z2 base run (60 min Zone 2).
  2. Row intervals 8×500m @ 1:50/500m pace.
  3. Tempo back squat 5×5 @ 75% with 3-1-2-0 tempo.
  4. Snatch wave 3×3 @ 70/80/90% (StagedProgram programKind=wave).
  5. Strict pull-up cluster 5×[3+3+3] (StagedProgram programKind=cluster).
  6. Accessory super-set A1: 12 DB row, A2: 15 push-up, 3 rounds (super-set archetype).

Pseudo-code для каждого. Verify 0 gaps после extensions.

### Task 5 — implementation-notes.md

`06-formalization/implementation-notes.md`:

- Update §3 resolution algorithms — add:
  - HR zone resolution (zone → BPM range via `Athlete.profile.hrMax * zone_percent_table`).
  - Numeric pace interpretation (`min_per_distance` vs `distance_per_min`).
  - Full tempo parser (4-digit "3-1-2-0" string → 4 numbers).
  - StagedProgram execution flow (3 programKind variants).
  - Super-set execution flow (rounds × pairs × per-pair sequential).
- Update JSON shape fixtures для Intensity / TempoModifier / StagedProgram.
- Add Zod schemas для new VOs.

### Task 6 — domain-model.md (Phase 5 backfill)

`05-synthesis/domain-model.md`:

- Update §2 VO catalog: Intensity (add hrZone / numericPace), TempoModifier (add fullTempo), rename DropSetProgram → StagedProgram (+ programKind + restBetweenStages).
- Update §3 Schema kinds + archetypes mapping: add super-set archetype с params.
- Update §1 Entities — Exercise.primaryEquipment enum reflects new values.

### Task 7 — edge-cases.md (Phase 5 backfill)

`05-synthesis/edge-cases.md`:

- Add §10 Phase 7 extensions с Q16-Q21 documentation (resolutions table).
- Update §5 open questions — mark Q16-Q21 closed.

### Task 8 — workflow.md (Phase 0 backfill)

`00-meta/workflow.md`:

- Add Phase 7 entry в фаз list (отдельная секция or note под Phase 6).
- Glossary update: add HR zone, numeric pace, full tempo, super-set archetype, staged program.

ВЫХОДНЫЕ АРТЕФАКТЫ

Updated files:

1. `06-formalization/schema.prisma` (Equipment enum extension).
2. `06-formalization/types.ts` (Intensity / TempoModifier / StagedProgram / SuperSet params).
3. `06-formalization/er-final.md` (comments updated).
4. `06-formalization/stress-final.md` (Phase 7 stress §7).
5. `06-formalization/implementation-notes.md` (algorithms + JSON fixtures + Zod).
6. `05-synthesis/domain-model.md` (VO catalog updates).
7. `05-synthesis/edge-cases.md` (Q16-Q21 closed).
8. `00-meta/workflow.md` (Phase 7 entry + glossary).

Никаких новых файлов в `07-extensions/` — все backfills в existing artifacts. Цель — **полная единая картина** после Phase 7.

ACCEPTANCE

- 6 extensions implemented across 8 files.
- Q16-Q21 resolutions reflected.
- Phase 7 stress test 6/6 fit (HR run / pace intervals / tempo squat / wave loading / cluster pulls / super-set).
- All cross-references updated (DropSetProgram → StagedProgram везде).
- Equipment enum 7 new values.
- Никаких structural Prisma changes (только enum extension).
- Все Phase 1-6 ratified decisions preserved.

ПРАВИЛА РАБОТЫ

- НЕ менять Prisma structural (только Equipment enum). VOs остаются в JSON columns.
- НЕ менять existing Phase 1-6 ratified decisions.
- НЕ создавать новые директории. Все updates в existing files.
- НЕ память, web, video.
- НЕ читать вне `analysis/`.
- НЕ делегировать sub-agentам.
- Russian content для documentation, English identifiers/code.
- Без эмодзи / подписей / комментариев в коде.

ОТЧЁТ ПО ОКОНЧАНИИ

В чате коротко:

- 8 файлов updated, conkretly что в каждом.
- Q16-Q21 resolutions verified implemented.
- Phase 7 stress 6/6 fit verified.
- Equipment enum 7 new values added.
- DropSetProgram → StagedProgram rename — verify no orphan references.
- Готовность к UI implementation.
