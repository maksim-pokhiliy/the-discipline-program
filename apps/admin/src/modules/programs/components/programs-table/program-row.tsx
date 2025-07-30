import DeleteIcon from "@mui/icons-material/Delete";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import EditIcon from "@mui/icons-material/Edit";
import {
  TableRow,
  TableCell,
  Typography,
  Chip,
  Stack,
  IconButton,
  Switch,
  Tooltip,
  Box,
} from "@mui/material";
import { Program } from "@repo/api";

interface ProgramRowProps {
  program: Program;
  onEdit: () => void;
  onDelete: () => void;
  onToggleStatus: () => void;
  isToggling?: boolean;
}

export const ProgramRow = ({
  program,
  onEdit,
  onDelete,
  onToggleStatus,
  isToggling = false,
}: ProgramRowProps) => {
  const formatFeatures = (features: string[]) => {
    if (features.length === 0) return "No features";

    if (features.length <= 3) {
      return features.join(", ");
    }

    const visible = features.slice(0, 2);
    const remaining = features.length - 2;

    return `${visible.join(", ")} and ${remaining} more`;
  };

  const truncateDescription = (text: string, maxLength = 80) => {
    if (text.length <= maxLength) return text;

    return `${text.substring(0, maxLength)}...`;
  };

  return (
    <TableRow hover>
      <TableCell>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Tooltip title="Drag to reorder">
            <IconButton size="small" sx={{ cursor: "grab", color: "text.disabled" }}>
              <DragIndicatorIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Box>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {program.name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              /{program.slug}
            </Typography>
          </Box>
        </Stack>
      </TableCell>

      <TableCell>
        <Tooltip title={program.description}>
          <Typography variant="body2" color="text.secondary">
            {truncateDescription(program.description)}
          </Typography>
        </Tooltip>
      </TableCell>

      <TableCell>
        <Typography variant="body2" sx={{ fontWeight: 500 }}>
          ${program.price}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {program.currency}
        </Typography>
      </TableCell>

      <TableCell>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Switch
            checked={program.isActive}
            onChange={onToggleStatus}
            disabled={isToggling}
            size="small"
          />
          <Chip
            label={program.isActive ? "Active" : "Inactive"}
            color={program.isActive ? "success" : "default"}
            size="small"
            variant="outlined"
          />
        </Stack>
      </TableCell>

      <TableCell>
        <Tooltip title={program.features.join(", ")}>
          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 200 }}>
            {formatFeatures(program.features)}
          </Typography>
        </Tooltip>
      </TableCell>

      <TableCell>
        <Typography variant="body2" sx={{ fontFamily: "monospace" }}>
          {program.sortOrder}
        </Typography>
      </TableCell>

      <TableCell align="right">
        <Stack direction="row" spacing={1}>
          <Tooltip title="Edit program">
            <IconButton size="small" onClick={onEdit} color="primary">
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Delete program">
            <IconButton size="small" onClick={onDelete} color="error">
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      </TableCell>
    </TableRow>
  );
};
