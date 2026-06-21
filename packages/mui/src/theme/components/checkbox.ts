import { type Components, type Theme } from "@mui/material/styles";

import { selectionControlStyleOverrides } from "./selection-control";

export const MuiCheckbox: NonNullable<Components<Theme>["MuiCheckbox"]> = {
  styleOverrides: selectionControlStyleOverrides("4px"),
};
