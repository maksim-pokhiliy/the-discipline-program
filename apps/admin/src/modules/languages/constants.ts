import { SECTION_SCHEMAS } from "@repo/contracts/cms/pages";

export const TRANSLATABLE_SECTION_COUNT = Object.keys(SECTION_SCHEMAS).length;
export const LANGUAGES_PATH = "/languages";
export const LANGUAGE_CREATE_PATH = `${LANGUAGES_PATH}/create`;
export const languageEditPath = (code: string): string => `${LANGUAGES_PATH}/${code}`;
