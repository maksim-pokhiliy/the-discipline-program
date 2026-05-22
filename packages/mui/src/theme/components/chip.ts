import { type ChipProps } from "@mui/material";
import { type Components, type Theme, alpha } from "@mui/material/styles";

const CHIP_HEIGHT = 24;
const CHIP_RADIUS = 12;
const TINT_PRIMARY = 0.12;
const TINT_COLOR = 0.18;
const TINT_PRIMARY_HOVER = 0.18;
const TINT_COLOR_HOVER = 0.24;
const DELETE_ICON_OPACITY = 0.7;

type ChipColor = NonNullable<ChipProps["color"]>;
type TintColor = Exclude<ChipColor, "default">;

const tintFor = (color: TintColor): number => (color === "primary" ? TINT_PRIMARY : TINT_COLOR);

const hoverTintFor = (color: TintColor): number =>
  color === "primary" ? TINT_PRIMARY_HOVER : TINT_COLOR_HOVER;

export const MuiChip: NonNullable<Components<Theme>["MuiChip"]> = {
  styleOverrides: {
    root: {
      fontWeight: 500,
      height: CHIP_HEIGHT,
      borderRadius: CHIP_RADIUS,
    },

    filled: ({ theme, ownerState }) => {
      const color = ownerState.color ?? "default";

      if (color === "default") {
        return {
          backgroundColor: theme.palette.action.hover,
          color: theme.palette.text.primary,

          "& .MuiChip-deleteIcon": {
            color: theme.palette.text.secondary,
            "&:hover, &:active": { color: theme.palette.text.primary },
          },

          "&.MuiChip-clickable:hover": {
            backgroundColor: theme.palette.action.selected,
          },
        };
      }

      const main = theme.palette[color].main;

      return {
        backgroundColor: alpha(main, tintFor(color)),
        color: main,

        "& .MuiChip-deleteIcon": {
          color: alpha(main, DELETE_ICON_OPACITY),
          "&:hover, &:active": { color: main },
        },

        "&.MuiChip-clickable:hover": {
          backgroundColor: alpha(main, hoverTintFor(color)),
        },
      };
    },
  },
};
