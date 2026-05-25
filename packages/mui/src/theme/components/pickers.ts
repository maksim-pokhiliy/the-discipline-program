import { type Theme } from "@mui/material/styles";
import { type PickerComponents } from "@mui/x-date-pickers/themeAugmentation";

const PICKERS_INPUT_HEIGHT_SM = 30;

export const MuiPickersOutlinedInput: NonNullable<
  PickerComponents<Theme>["MuiPickersOutlinedInput"]
> = {
  styleOverrides: {
    root: ({ theme }) => ({
      "&.MuiPickersInputBase-sizeSmall": {
        height: PICKERS_INPUT_HEIGHT_SM,

        "& .MuiPickersSectionList-root, & .MuiPickersInputBase-input": {
          fontSize: theme.typography.body2.fontSize,
          paddingTop: theme.spacing(0.5),
          paddingBottom: theme.spacing(0.5),
        },
      },
    }),
  },
};
