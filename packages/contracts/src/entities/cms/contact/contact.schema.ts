import { z } from "zod";

import { CONTACT_CONSTANTS, ContactStatus } from "./contact.constants";

const isControlChar = (code: number): boolean =>
  (code >= 0 && code <= 8) ||
  code === 11 ||
  code === 12 ||
  (code >= 14 && code <= 31) ||
  code === 127;

const stripHtmlAndControlChars = (value: string): string => {
  const withoutScripts = value
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "");
  const withoutTags = withoutScripts.replace(/<[^>]*>/g, "");
  let result = "";

  for (const char of withoutTags) {
    if (!isControlChar(char.charCodeAt(0))) {
      result += char;
    }
  }

  return result;
};

export const contactSubmissionItemSchema = z.object({
  id: z.string().cuid(),
  name: z.string().nullable(),
  contact: z.string().nullable(),
  program: z.string().nullable(),
  message: z.string(),
  status: z.nativeEnum(ContactStatus),
  notes: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const createContactSubmissionSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(CONTACT_CONSTANTS.MAX_NAME_LENGTH)
    .transform(stripHtmlAndControlChars),
  contact: z
    .string()
    .min(1, "Phone, Telegram, or other contact is required")
    .max(CONTACT_CONSTANTS.MAX_CONTACT_LENGTH)
    .transform(stripHtmlAndControlChars),
  program: z
    .string()
    .max(CONTACT_CONSTANTS.MAX_PROGRAM_LENGTH)
    .transform(stripHtmlAndControlChars)
    .optional(),
  message: z
    .string()
    .min(1, "Message is required")
    .max(CONTACT_CONSTANTS.MAX_MESSAGE_LENGTH)
    .transform(stripHtmlAndControlChars),
});
