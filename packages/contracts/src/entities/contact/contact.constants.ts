export const CONTACT_CONSTANTS = {
  MAX_MESSAGE_LENGTH: 2000,
  MAX_NAME_LENGTH: 100,
  MAX_CONTACT_LENGTH: 100,
  MAX_PROGRAM_LENGTH: 100,
} as const;

export enum ContactStatus {
  NEW = "NEW",
  IN_PROGRESS = "IN_PROGRESS",
  REPLIED = "REPLIED",
  CLOSED = "CLOSED",
}

export const CONTACT_DEFAULTS = {
  status: ContactStatus.NEW,
} as const;
