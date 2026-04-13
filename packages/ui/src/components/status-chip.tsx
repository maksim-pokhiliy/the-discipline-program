import { Chip, type ChipProps, Tooltip } from "@mui/material";

export type StatusChipConfig = {
  label: string;
  color?: ChipProps["color"];
  icon?: React.ReactElement;
  tooltip?: string;
};

type StatusChipProps = StatusChipConfig;

export const StatusChip: React.FC<StatusChipProps> = ({ label, color, icon, tooltip }) => {
  const chip = <Chip size="small" label={label} color={color} icon={icon} variant="outlined" />;

  if (tooltip) {
    return (
      <Tooltip title={tooltip} arrow>
        {chip}
      </Tooltip>
    );
  }

  return chip;
};
