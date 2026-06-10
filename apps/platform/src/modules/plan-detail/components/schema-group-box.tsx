import { type ReactElement, type ReactNode } from "react";

import { Box } from "@mui/material";

import { AccentGroupCard } from "@repo/ui";

const GROUP_BOX_TEST_ID = "schema-group-box";

type SchemaGroupBoxProps = {
  label: ReactNode;
  children: ReactNode;
};

export const SchemaGroupBox: React.FC<SchemaGroupBoxProps> = ({
  label,
  children,
}): ReactElement => (
  <Box data-testid={GROUP_BOX_TEST_ID}>
    <AccentGroupCard header={label}>{children}</AccentGroupCard>
  </Box>
);
