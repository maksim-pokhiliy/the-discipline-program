import { type ChipProps } from "@mui/material";

import { ContactStatus } from "@repo/contracts/cms/contact";

export const CONTACT_STATUS_CONFIG: Record<
  ContactStatus,
  { label: string; color: ChipProps["color"] }
> = {
  [ContactStatus.NEW]: { label: "New", color: "info" },
  [ContactStatus.IN_PROGRESS]: { label: "In Progress", color: "warning" },
  [ContactStatus.REPLIED]: { label: "Replied", color: "success" },
  [ContactStatus.CLOSED]: { label: "Closed", color: "default" },
};
