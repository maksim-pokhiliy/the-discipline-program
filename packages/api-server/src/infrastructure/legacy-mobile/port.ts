export type LegacySigninResult = {
  userId: string;
  accessToken: string;
  userRoleName: string;
  userPlanName: string;
};

export type LegacyTrainingLevel = {
  id: number;
  name: string;
};

export type LegacyDailyProgram = {
  dayTrainings: {
    trainingNumber: number;
    blocks: { name: string; exercises: string[] }[];
  }[];
};

export type LegacyGeneralProgram = {
  id: number;
  scheduledDate: string;
  trainingLevelId: number;
  isRestDay: boolean;
  dailyProgram: LegacyDailyProgram | null;
};

export type LegacyGeneralProgramWriteInput = {
  levelId: number;
  scheduledDate: string;
  isRestDay: boolean;
  dailyProgram: LegacyDailyProgram | null;
};

export type LegacyIndividualProgram = {
  id: number;
  userId: number;
  scheduledDate: string;
  isRestDay: boolean;
  dailyProgram: LegacyDailyProgram | null;
};

export type LegacyIndividualProgramWriteInput = {
  userId: number;
  scheduledDate: string;
  isRestDay: boolean;
  dailyProgram: LegacyDailyProgram | null;
};

export type LegacyAthlete = {
  id: number;
  username: string;
  firstName: string | null;
  lastName: string | null;
};

export type LegacyMobileClientPort = {
  signin(email: string, password: string): Promise<LegacySigninResult>;
  getTrainingLevels(token: string): Promise<LegacyTrainingLevel[]>;
  getGeneralProgram(
    token: string,
    levelId: number,
    scheduledDate: string,
  ): Promise<LegacyGeneralProgram | null>;
  createGeneralProgram(
    token: string,
    input: LegacyGeneralProgramWriteInput,
  ): Promise<LegacyGeneralProgram>;
  updateGeneralProgram(
    token: string,
    input: LegacyGeneralProgramWriteInput & { id: number },
  ): Promise<LegacyGeneralProgram>;
  getIndividualProgram(
    token: string,
    userId: number,
    scheduledDate: string,
  ): Promise<LegacyIndividualProgram | null>;
  createIndividualProgram(
    token: string,
    input: LegacyIndividualProgramWriteInput,
  ): Promise<LegacyIndividualProgram>;
  deleteIndividualProgram(token: string, id: number): Promise<void>;
  getIndividualAthletes(token: string): Promise<LegacyAthlete[]>;
};
