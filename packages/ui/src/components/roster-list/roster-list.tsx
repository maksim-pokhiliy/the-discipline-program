import { type ReactElement, type ReactNode } from "react";

import { Card } from "@mui/material";

export type RosterListProps = {
  children: ReactNode;
};

export const RosterList = ({ children }: RosterListProps): ReactElement => (
  <Card sx={{ height: "auto", overflow: "hidden" }}>{children}</Card>
);
