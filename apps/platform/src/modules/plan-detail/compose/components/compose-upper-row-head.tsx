"use client";

import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { IconButton, Stack, Tooltip, Typography } from "@mui/material";
import type { TypographyVariant } from "@mui/material";

const DUPLICATE_TOOLTIP = "Duplicate";

const tooltipChildSx = { display: "inline-flex" };

type ComposeUpperRowHeadProps = {
  label: string;
  variant: TypographyVariant;
  duplicateAria: string;
  isStructuralEditingAllowed: boolean;
  onDuplicate: () => void;
};

export const ComposeUpperRowHead: React.FC<ComposeUpperRowHeadProps> = ({
  label,
  variant,
  duplicateAria,
  isStructuralEditingAllowed,
  onDuplicate,
}) => (
  <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
    <Typography variant={variant} sx={{ flex: 1, minWidth: 0 }}>
      {label}
    </Typography>

    {isStructuralEditingAllowed && (
      <Tooltip title={DUPLICATE_TOOLTIP}>
        <span style={tooltipChildSx}>
          <IconButton size="small" aria-label={duplicateAria} onClick={onDuplicate}>
            <ContentCopyIcon fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>
    )}
  </Stack>
);
