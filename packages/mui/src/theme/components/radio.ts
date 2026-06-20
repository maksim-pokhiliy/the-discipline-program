import { type Components, type Theme } from "@mui/material/styles";

import { selectionControlStyleOverrides } from "./selection-control";

export const MuiRadio: NonNullable<Components<Theme>["MuiRadio"]> = {
  styleOverrides: selectionControlStyleOverrides("50%"),
};
