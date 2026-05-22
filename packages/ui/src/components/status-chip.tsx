import { Chip, type ChipProps, Tooltip } from "@mui/material";

export type StatusChipConfig = {
  label: string;
  color?: ChipProps["color"] | undefined;
  icon?: React.ReactElement | undefined;
  tooltip?: string | undefined;
};

type StatusChipProps = StatusChipConfig;

export const StatusChip: React.FC<StatusChipProps> = ({ label, color, icon, tooltip }) => {
  const chip = (
    <Chip
      size="small"
      label={label}
      {...(color !== undefined && { color })}
      {...(icon !== undefined && { icon })}
    />
  );

  if (tooltip) {
    return (
      <Tooltip title={tooltip} arrow>
        {chip}
      </Tooltip>
    );
  }

  return chip;
};
