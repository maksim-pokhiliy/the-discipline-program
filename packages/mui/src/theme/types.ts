import { type Palette, type PaletteColor } from "@mui/material/styles";

export type PaletteColorKey = {
  [K in keyof Palette]: Palette[K] extends PaletteColor ? K : never;
}[keyof Palette];
