import { type ReactElement, type ReactNode } from "react";

import { Box, Card, alpha } from "@mui/material";

const HEADER_BG_ALPHA = 0.06;
const HEADER_BORDER_ALPHA = 0.3;

export type AccentGroupCardProps = {
  header: ReactNode;
  children: ReactNode;
};

export const AccentGroupCard: React.FC<AccentGroupCardProps> = ({
  header,
  children,
}): ReactElement => (
  <Card variant="accent-dashed">
    <Box
      sx={(theme) => ({
        p: 1,
        bgcolor: alpha(theme.palette.primary.main, HEADER_BG_ALPHA),
        borderBottom: "1px dashed",
        borderColor: alpha(theme.palette.primary.main, HEADER_BORDER_ALPHA),
      })}
    >
      {header}
    </Box>
    <Box sx={{ p: 1 }}>{children}</Box>
  </Card>
);
