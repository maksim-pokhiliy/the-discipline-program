export const CONTACT_CONSTANTS = {
  MIN_MESSAGE_LENGTH: 1,
  MAX_MESSAGE_LENGTH: 2000,
  MAX_NAME_LENGTH: 100,
  MAX_PROGRAM_LENGTH: 100,
} as const;

export const CONTACT_STATUSES = ["NEW", "IN_PROGRESS", "REPLIED", "CLOSED"] as const;

export const CONTACT_STATUS_ENUM = {
  NEW: "NEW",
  IN_PROGRESS: "IN_PROGRESS",
  REPLIED: "REPLIED",
  CLOSED: "CLOSED",
} as const;

export const CONTACT_DEFAULTS = {
  status: "NEW",
} as const;
