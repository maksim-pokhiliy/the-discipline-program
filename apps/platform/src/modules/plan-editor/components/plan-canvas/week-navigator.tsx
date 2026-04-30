"use client";

import { useCallback, useMemo } from "react";

import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { IconButton, MenuItem, Stack, TextField, Typography } from "@mui/material";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { useTouchTargetSx } from "./use-touch-target-sx";

export type WeekNavigatorProps = {
  fromWeek: number;
  toWeek: number;
  maxIndex: number;
};

const WINDOW_SPAN = 5;

export const WeekNavigator = ({ fromWeek, toWeek, maxIndex }: WeekNavigatorProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const touchTargetSx = useTouchTargetSx();

  const setRange = useCallback(
    (next: { fromWeek: number; toWeek: number }) => {
      const params = new URLSearchParams(searchParams.toString());

      params.set("fromWeek", String(next.fromWeek));
      params.set("toWeek", String(next.toWeek));
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const span = Math.max(1, toWeek - fromWeek + 1);

  const handlePrev = () => {
    if (fromWeek <= 0) {
      return;
    }

    const nextFrom = Math.max(0, fromWeek - span);
    const nextTo = Math.min(maxIndex, nextFrom + span - 1);

    setRange({ fromWeek: nextFrom, toWeek: nextTo });
  };

  const handleNext = () => {
    if (toWeek >= maxIndex) {
      return;
    }

    const nextTo = Math.min(maxIndex, toWeek + span);
    const nextFrom = Math.max(0, nextTo - span + 1);

    setRange({ fromWeek: nextFrom, toWeek: nextTo });
  };

  const handleSelect = (value: number) => {
    const half = Math.floor(WINDOW_SPAN / 2);
    const nextFrom = Math.max(0, value - half);
    const nextTo = Math.min(maxIndex, nextFrom + WINDOW_SPAN - 1);

    setRange({ fromWeek: nextFrom, toWeek: nextTo });
  };

  const weeks = useMemo(() => {
    const out: number[] = [];

    for (let i = 0; i <= maxIndex; i += 1) {
      out.push(i);
    }

    return out;
  }, [maxIndex]);

  return (
    <Stack direction="row" spacing={1} alignItems="center" sx={{ p: 2, pb: 1 }}>
      <IconButton
        onClick={handlePrev}
        disabled={fromWeek <= 0}
        size="small"
        aria-label="Previous weeks"
        sx={touchTargetSx}
      >
        <ChevronLeftIcon />
      </IconButton>

      <Typography variant="subtitle2">
        Weeks {fromWeek + 1}–{toWeek + 1} of {maxIndex + 1}
      </Typography>

      <TextField
        select
        size="small"
        value={Math.min(Math.max(fromWeek, 0), maxIndex)}
        onChange={(event) => handleSelect(Number(event.target.value))}
        sx={[{ minWidth: 120 }, touchTargetSx]}
        aria-label="Jump to week"
      >
        {weeks.map((index) => (
          <MenuItem key={index} value={index}>
            Week {index + 1}
          </MenuItem>
        ))}
      </TextField>

      <IconButton
        onClick={handleNext}
        disabled={toWeek >= maxIndex}
        size="small"
        aria-label="Next weeks"
        sx={touchTargetSx}
      >
        <ChevronRightIcon />
      </IconButton>
    </Stack>
  );
};
