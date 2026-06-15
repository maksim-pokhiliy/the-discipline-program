"use client";

import AvTimer from "@mui/icons-material/AvTimer";
import HourglassBottom from "@mui/icons-material/HourglassBottom";
import LooksOne from "@mui/icons-material/LooksOne";
import Repeat from "@mui/icons-material/Repeat";
import Stairs from "@mui/icons-material/Stairs";
import Timer from "@mui/icons-material/Timer";

import { type RepetitionAxis } from "./axis-draft.types";
import { type AxisModeTile } from "./axis-mode-button-grid";

const ICON_FONT_SIZE = "small" as const;

export type RepetitionTile = AxisModeTile<RepetitionAxis["kind"]> & { hint: string };

export const REPETITION_TILES: readonly RepetitionTile[] = [
  {
    kind: "once",
    label: "Once",
    icon: <LooksOne fontSize={ICON_FONT_SIZE} />,
    hint: "Perform the contents once.",
  },
  {
    kind: "count",
    label: "Rounds",
    icon: <Repeat fontSize={ICON_FONT_SIZE} />,
    hint: "Repeat N rounds — exact or a range (3 or 3–5).",
  },
  {
    kind: "ladder",
    label: "Ladder",
    icon: <Stairs fontSize={ICON_FONT_SIZE} />,
    hint: "Round-counter ladder — contents repeat per step, shared across movements (Fran 21-15-9). Distinct from a rep-scheme ladder ROW.",
  },
  {
    kind: "timeCap",
    label: "Time cap",
    icon: <HourglassBottom fontSize={ICON_FONT_SIZE} />,
    hint: "Work toward a cap.",
  },
  {
    kind: "cadence",
    label: "EMOM",
    icon: <Timer fontSize={ICON_FONT_SIZE} />,
    hint: "Start work every interval, for N rounds. Children are positional slots.",
  },
  {
    kind: "interval",
    label: "Interval",
    icon: <AvTimer fontSize={ICON_FONT_SIZE} />,
    hint: "Work / rest cycle × N (Tabata). work:rest is a first-class unit.",
  },
];
