import { createLegacyMobileRestAdapter } from "./rest-adapter";

export type {
  LegacyAthlete,
  LegacyDailyProgram,
  LegacyGeneralProgram,
  LegacyGeneralProgramWriteInput,
  LegacyIndividualProgram,
  LegacyIndividualProgramWriteInput,
  LegacyMobileClientPort,
  LegacySigninResult,
  LegacyTrainingLevel,
} from "./port";
export { createLegacyMobileRestAdapter } from "./rest-adapter";

export const defaultLegacyMobileClient = createLegacyMobileRestAdapter();
