import { type ReactElement } from "react";

import { Card } from "@mui/material";

import { PulseBandCell, type PulseBandCellProps } from "./pulse-band-cell";

export type PulseBandProps = {
  cells: PulseBandCellProps[];
};

export const PulseBand: React.FC<PulseBandProps> = ({ cells }): ReactElement => (
  <Card
    role="group"
    sx={{
      display: "grid",
      gridTemplateColumns: `repeat(${cells.length}, 1fr)`,
      height: "auto",
      overflow: "hidden",
    }}
  >
    {cells.map((cell) => (
      <PulseBandCell key={cell.label} {...cell} />
    ))}
  </Card>
);
