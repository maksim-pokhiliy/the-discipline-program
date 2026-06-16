"use client";

import CheckIcon from "@mui/icons-material/Check";
import RemoveIcon from "@mui/icons-material/Remove";
import { Button } from "@mui/material";

const SELECT_ALL_LABEL = "Select all";

type SelectAllButtonProps = {
  total: number;
  selectedCount: number;
  onToggle: () => void;
};

export const SelectAllButton: React.FC<SelectAllButtonProps> = ({
  total,
  selectedCount,
  onToggle,
}) => {
  const isAll = selectedCount === total && total > 0;
  const isSome = selectedCount > 0 && !isAll;

  const label = isAll ? `Selected ${selectedCount}` : `${SELECT_ALL_LABEL} ${total}`;
  const icon = isAll ? <CheckIcon /> : isSome ? <RemoveIcon /> : undefined;

  return (
    <Button
      size="small"
      variant="text"
      color={isAll ? "primary" : "inherit"}
      onClick={onToggle}
      aria-pressed={isAll}
      {...(icon !== undefined && { startIcon: icon })}
    >
      {label}
    </Button>
  );
};
