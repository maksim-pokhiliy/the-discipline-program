import { createLegacyMobileRestAdapter } from "./rest-adapter";

export type {
  LegacyDailyProgram,
  LegacyGeneralProgram,
  LegacyGeneralProgramWriteInput,
  LegacyMobileClientPort,
  LegacySigninResult,
  LegacyTrainingLevel,
} from "./port";
export { createLegacyMobileRestAdapter } from "./rest-adapter";

export const defaultLegacyMobileClient = createLegacyMobileRestAdapter();
