import { alpha, type Theme } from "@mui/material/styles";
import { type PickerComponents } from "@mui/x-date-pickers/themeAugmentation";

const PICKERS_INPUT_HEIGHT_SM = 30;

export const MuiDatePicker: NonNullable<PickerComponents<Theme>["MuiDatePicker"]> = {
  defaultProps: {
    slotProps: {
      openPickerButton: { size: "small" },
    },
  },
};

export const MuiPickersOutlinedInput: NonNullable<
  PickerComponents<Theme>["MuiPickersOutlinedInput"]
> = {
  styleOverrides: {
    root: ({ theme }) => ({
      backgroundColor: alpha(theme.palette.common.white, 0.02),

      "& .MuiPickersOutlinedInput-notchedOutline": {
        borderColor: theme.palette.divider,
        transition: theme.transitions.create("border-color"),
      },

      "&:hover .MuiPickersOutlinedInput-notchedOutline": {
        borderColor: theme.palette.dividerStrong,
      },

      "&.Mui-focused": {
        backgroundColor: alpha(theme.palette.primary.main, 0.05),
      },

      "&.Mui-focused .MuiPickersOutlinedInput-notchedOutline": {
        borderWidth: 1,
      },

      "&.MuiPickersInputBase-inputSizeSmall": {
        height: PICKERS_INPUT_HEIGHT_SM,

        "& .MuiPickersSectionList-root": {
          fontSize: theme.typography.body2.fontSize,
          paddingTop: theme.spacing(0.5),
          paddingBottom: theme.spacing(0.5),
        },
      },
    }),
  },
};
