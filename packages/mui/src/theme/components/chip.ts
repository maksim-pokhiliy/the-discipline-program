import { type ChipProps } from "@mui/material";
import { type Components, type Theme, alpha } from "@mui/material/styles";

declare module "@mui/material/Chip" {
  interface ChipPropsVariantOverrides {
    indicator: true;
    tag: true;
  }
}

const CHIP_HEIGHT = 24;
const CHIP_HEIGHT_SM = 20;
const CHIP_RADIUS = 12;
const CHIP_LABEL_PX_SM = 6;
const CHIP_FONT_SM_PX = 11;
const CHIP_VARIANT_HEIGHT = 22;
const CHIP_INDICATOR_FONT_PX = 11;
const CHIP_TAG_FONT_PX = 10;
const CHIP_INDICATOR_RADIUS = 9999;
const CHIP_TAG_RADIUS = 2;
const TINT_PRIMARY = 0.18;
const TINT_COLOR = 0.18;
const TINT_PRIMARY_HOVER = 0.26;
const TINT_COLOR_HOVER = 0.24;
const TINT_DEFAULT_HOVER = 0.12;
const DELETE_ICON_OPACITY = 0.7;

type ChipColor = NonNullable<ChipProps["color"]>;
type TintColor = Exclude<ChipColor, "default">;

const tintFor = (color: TintColor): number => (color === "primary" ? TINT_PRIMARY : TINT_COLOR);

const hoverTintFor = (color: TintColor): number =>
  color === "primary" ? TINT_PRIMARY_HOVER : TINT_COLOR_HOVER;

export const MuiChip: NonNullable<Components<Theme>["MuiChip"]> = {
  styleOverrides: {
    root: ({ theme, ownerState }) => ({
      fontSize: theme.typography.caption.fontSize,
      fontWeight: 500,
      height: CHIP_HEIGHT,
      borderRadius: CHIP_RADIUS,

      ...(ownerState.variant === "indicator" && {
        height: CHIP_VARIANT_HEIGHT,
        fontWeight: 600,
        fontSize: theme.typography.pxToRem(CHIP_INDICATOR_FONT_PX),
        borderRadius: CHIP_INDICATOR_RADIUS,
      }),

      ...(ownerState.variant === "tag" && {
        height: CHIP_VARIANT_HEIGHT,
        fontWeight: 700,
        fontSize: theme.typography.pxToRem(CHIP_TAG_FONT_PX),
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        borderRadius: CHIP_TAG_RADIUS,
        backgroundColor: theme.palette.text.primary,
        color: theme.palette.background.default,
      }),
    }),

    sizeSmall: ({ theme }) => ({
      height: CHIP_HEIGHT_SM,
      fontSize: theme.typography.pxToRem(CHIP_FONT_SM_PX),

      "& .MuiChip-label": {
        paddingLeft: CHIP_LABEL_PX_SM,
        paddingRight: CHIP_LABEL_PX_SM,
      },
    }),

    filled: ({ theme, ownerState }) => {
      const color = ownerState.color ?? "default";

      if (color === "default") {
        return {
          backgroundColor: theme.palette.action.selected,
          color: theme.palette.text.primary,

          "& .MuiChip-deleteIcon": {
            color: theme.palette.text.secondary,
            "&:hover, &:active": { color: theme.palette.text.primary },
          },

          "&.MuiChip-clickable:hover": {
            backgroundColor: alpha(theme.palette.common.white, TINT_DEFAULT_HOVER),
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
