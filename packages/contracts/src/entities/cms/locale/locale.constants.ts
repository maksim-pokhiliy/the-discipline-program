export const DEFAULT_LOCALE_CODE = "en";

export const DEFAULT_LOCALE_NAME = "English";

export const LOCALE_CONSTANTS = {
  CODE_PATTERN: /^[a-z]{2,3}$/,
  MIN_CODE_LENGTH: 2,
  MAX_CODE_LENGTH: 3,
  MAX_NAME_LENGTH: 50,
  MAX_SORT_ORDER: 999,
} as const;

export const RESERVED_LOCALE_CODES: readonly string[] = ["api", "faq"];
