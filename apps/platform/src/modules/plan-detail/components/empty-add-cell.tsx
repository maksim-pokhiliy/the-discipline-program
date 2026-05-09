"use client";

import AddIcon from "@mui/icons-material/Add";
import { IconButton } from "@mui/material";

export type EmptyAddCellProps = {
  onAdd: () => void;
  label: string;
  alwaysVisible?: boolean;
};

export const EmptyAddCell: React.FC<EmptyAddCellProps> = ({
  onAdd,
  label,
  alwaysVisible = false,
}) => (
  <IconButton
    aria-label={label}
    onClick={onAdd}
    size="small"
    sx={{
      color: "primary.main",
      opacity: alwaysVisible ? 1 : undefined,
      "@media (hover: hover)": alwaysVisible
        ? undefined
        : {
            opacity: 0,
            "&:hover, &:focus-visible": { opacity: 1 },
          },
    }}
  >
    <AddIcon fontSize="small" />
  </IconButton>
);
