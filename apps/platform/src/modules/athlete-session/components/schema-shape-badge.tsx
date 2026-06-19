import { type ReactElement } from "react";

import { Chip } from "@mui/material";

import { type Composition, formatRepetitionLabel } from "@repo/contracts/lms/composition";

const ONCE_LABEL = "once";

export type SchemaShapeBadgeProps = {
  composition: Composition;
};

export const SchemaShapeBadge = ({ composition }: SchemaShapeBadgeProps): ReactElement | null => {
  const label = formatRepetitionLabel(composition);

  if (label === null || label === ONCE_LABEL) {
    return null;
  }

  return <Chip variant="indicator" color="primary" label={label} />;
};
