"use client";

import { Stack, TextField, Typography } from "@mui/material";
import type { FieldErrors } from "react-hook-form";

import { type FullTempo, type TempoModifier } from "@repo/contracts/lms/_shared";
import { ToggleSection } from "@repo/ui";

import { TempoDigit } from "./tempo-digit";

const FULL_TEMPO_DEFAULT: FullTempo = {
  eccentric: 3,
  pauseBottom: 1,
  concentric: 0,
  pauseTop: 0,
};
const SLOW_ECCENTRIC_DEFAULT_SEC = 4;
const PAUSE_IN_UP_DEFAULT_SEC = 2;
const HOLD_AFTER_LAST_DEFAULT_SEC = 10;
const PER_NTH_DEFAULT_EVERY_N = 3;
const PER_NTH_DEFAULT_PAUSE_SEC = 2;

const FULL_TEMPO_HELPER = "— eccentric · pause bottom · concentric · pause top";
const FULL_TEMPO_HINT = "X = explosive (0)";
const DURATION_FIELD_WIDTH = 80;
const COUNT_FIELD_WIDTH = 60;
const ROW_STACK_SX = { alignItems: "center", flexWrap: "wrap" } as const;
const TEMPO_SEP = "·";

type TempoEditorProps = {
  value: TempoModifier | null;
  onChange: (next: TempoModifier | null) => void;
  error?: FieldErrors<TempoModifier> | undefined;
  disabled?: boolean;
};

const collapseTempo = (next: TempoModifier): TempoModifier | null => {
  const hasAny =
    next.fullTempo !== undefined ||
    next.slowEccentric !== undefined ||
    next.pauseInUp !== undefined ||
    next.holdAfterLast !== undefined ||
    next.perNthRepPause !== undefined;

  return hasAny ? next : null;
};

export const TempoEditor = ({ value, onChange, disabled = false }: TempoEditorProps) => {
  const current: TempoModifier = value ?? {};
  const fullTempo = current.fullTempo;
  const slowEccentric = current.slowEccentric;
  const pauseInUp = current.pauseInUp;
  const holdAfterLast = current.holdAfterLast;
  const perNthRepPause = current.perNthRepPause;

  const setFullTempo = (next: FullTempo | undefined): void => {
    onChange(collapseTempo({ ...current, fullTempo: next }));
  };

  const setSlowEccentric = (durationSec: number | undefined): void => {
    onChange(
      collapseTempo({
        ...current,
        slowEccentric: durationSec === undefined ? undefined : { durationSec },
      }),
    );
  };

  const setPauseInUp = (durationSec: number | undefined): void => {
    onChange(
      collapseTempo({
        ...current,
        pauseInUp: durationSec === undefined ? undefined : { durationSec, position: "up" },
      }),
    );
  };

  const setHoldAfterLast = (durationSec: number | undefined): void => {
    onChange(
      collapseTempo({
        ...current,
        holdAfterLast: durationSec === undefined ? undefined : { durationSec },
      }),
    );
  };

  return (
    <Stack spacing={1}>
      <ToggleSection
        on={fullTempo !== undefined}
        label="Full tempo (4 digits)"
        helper={FULL_TEMPO_HELPER}
        onToggle={() => setFullTempo(fullTempo === undefined ? FULL_TEMPO_DEFAULT : undefined)}
        disabled={disabled}
      >
        {fullTempo !== undefined && (
          <Stack spacing={1}>
            <Stack direction="row" spacing={1} sx={ROW_STACK_SX}>
              <TempoDigit
                label="ecc"
                value={fullTempo.eccentric}
                onChange={(n) => setFullTempo({ ...fullTempo, eccentric: n })}
                disabled={disabled}
              />

              <Typography variant="body2" color="text.subtle">
                {TEMPO_SEP}
              </Typography>

              <TempoDigit
                label="pause⬇"
                value={fullTempo.pauseBottom}
                onChange={(n) => setFullTempo({ ...fullTempo, pauseBottom: n })}
                disabled={disabled}
              />

              <Typography variant="body2" color="text.subtle">
                {TEMPO_SEP}
              </Typography>

              <TempoDigit
                label="con"
                value={fullTempo.concentric}
                onChange={(n) => setFullTempo({ ...fullTempo, concentric: n })}
                disabled={disabled}
              />

              <Typography variant="body2" color="text.subtle">
                {TEMPO_SEP}
              </Typography>

              <TempoDigit
                label="pause⬆"
                value={fullTempo.pauseTop}
                onChange={(n) => setFullTempo({ ...fullTempo, pauseTop: n })}
                disabled={disabled}
              />
            </Stack>

            <Typography variant="caption" color="text.subtle">
              {FULL_TEMPO_HINT}
            </Typography>
          </Stack>
        )}
      </ToggleSection>

      <ToggleSection
        on={slowEccentric !== undefined}
        label="Slow eccentric"
        onToggle={() =>
          setSlowEccentric(slowEccentric === undefined ? SLOW_ECCENTRIC_DEFAULT_SEC : undefined)
        }
        disabled={disabled}
      >
        {slowEccentric !== undefined && (
          <Stack direction="row" spacing={1} sx={ROW_STACK_SX}>
            <TextField
              type="number"
              size="small"
              value={slowEccentric.durationSec}
              onChange={(e) => setSlowEccentric(Number(e.target.value))}
              inputProps={{ min: 1, step: 0.5 }}
              disabled={disabled}
              sx={{ maxWidth: DURATION_FIELD_WIDTH }}
            />

            <Typography variant="caption" color="text.subtle">
              sec
            </Typography>
          </Stack>
        )}
      </ToggleSection>

      <ToggleSection
        on={pauseInUp !== undefined}
        label="Pause at top"
        onToggle={() => setPauseInUp(pauseInUp === undefined ? PAUSE_IN_UP_DEFAULT_SEC : undefined)}
        disabled={disabled}
      >
        {pauseInUp !== undefined && (
          <Stack direction="row" spacing={1} sx={ROW_STACK_SX}>
            <TextField
              type="number"
              size="small"
              value={pauseInUp.durationSec}
              onChange={(e) => setPauseInUp(Number(e.target.value))}
              inputProps={{ min: 1, step: 0.5 }}
              disabled={disabled}
              sx={{ maxWidth: DURATION_FIELD_WIDTH }}
            />

            <Typography variant="caption" color="text.subtle">
              sec
            </Typography>
          </Stack>
        )}
      </ToggleSection>

      <ToggleSection
        on={holdAfterLast !== undefined}
        label="Hold after last rep"
        onToggle={() =>
          setHoldAfterLast(holdAfterLast === undefined ? HOLD_AFTER_LAST_DEFAULT_SEC : undefined)
        }
        disabled={disabled}
      >
        {holdAfterLast !== undefined && (
          <Stack direction="row" spacing={1} sx={ROW_STACK_SX}>
            <TextField
              type="number"
              size="small"
              value={holdAfterLast.durationSec}
              onChange={(e) => setHoldAfterLast(Number(e.target.value))}
              inputProps={{ min: 1, step: 0.5 }}
              disabled={disabled}
              sx={{ maxWidth: DURATION_FIELD_WIDTH }}
            />

            <Typography variant="caption" color="text.subtle">
              sec
            </Typography>
          </Stack>
        )}
      </ToggleSection>

      <ToggleSection
        on={perNthRepPause !== undefined}
        label="Pause every Nth rep"
        onToggle={() =>
          onChange(
            collapseTempo({
              ...current,
              perNthRepPause:
                perNthRepPause === undefined
                  ? { everyN: PER_NTH_DEFAULT_EVERY_N, pauseSec: PER_NTH_DEFAULT_PAUSE_SEC }
                  : undefined,
            }),
          )
        }
        disabled={disabled}
      >
        {perNthRepPause !== undefined && (
          <Stack direction="row" spacing={1} sx={ROW_STACK_SX}>
            <Typography variant="caption" color="text.subtle">
              every
            </Typography>

            <TextField
              type="number"
              size="small"
              value={perNthRepPause.everyN}
              onChange={(e) =>
                onChange(
                  collapseTempo({
                    ...current,
                    perNthRepPause: { ...perNthRepPause, everyN: Number(e.target.value) },
                  }),
                )
              }
              inputProps={{ min: 1, step: 1 }}
              disabled={disabled}
              sx={{ maxWidth: COUNT_FIELD_WIDTH }}
            />

            <Typography variant="caption" color="text.subtle">
              reps · pause
            </Typography>

            <TextField
              type="number"
              size="small"
              value={perNthRepPause.pauseSec}
              onChange={(e) =>
                onChange(
                  collapseTempo({
                    ...current,
                    perNthRepPause: { ...perNthRepPause, pauseSec: Number(e.target.value) },
                  }),
                )
              }
              inputProps={{ min: 1, step: 0.5 }}
              disabled={disabled}
              sx={{ maxWidth: COUNT_FIELD_WIDTH }}
            />

            <Typography variant="caption" color="text.subtle">
              sec
            </Typography>
          </Stack>
        )}
      </ToggleSection>
    </Stack>
  );
};
