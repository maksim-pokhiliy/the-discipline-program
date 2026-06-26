import { type z } from "zod";

import { ApiClient, type HttpMethod } from "@repo/api-client";
import {
  legacyAthletesSchema,
  type LegacyGeneralProgram as LegacyGeneralProgramWire,
  legacyGeneralProgramSchema,
  type LegacyIndividualProgram as LegacyIndividualProgramWire,
  legacyIndividualProgramSchema,
  type LegacySigninResponse as LegacySigninWire,
  legacySigninResponseSchema,
  legacyTrainingLevelsSchema,
} from "@repo/contracts/coaching/legacy-mobile";
import { mobilePublishEnv } from "@repo/env/mobile-publish";
import {
  AppError,
  BadGatewayError,
  InternalServerError,
  NotFoundError,
  ServiceUnavailableError,
} from "@repo/errors";

import type {
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

const LEGACY_TIMEOUT_MS = 10_000;
const LEGACY_MAX_RETRIES = 2;
const LEGACY_WRITE_MAX_RETRIES = 0;

const SIGNIN_PATH = "/auth/signin";
const TRAINING_LEVELS_PATH = "/trainingLevel/all";
const GENERAL_PROGRAM_PATH = "/generalProgram";
const INDIVIDUAL_PROGRAM_PATH = "/individualProgram";
const USERS_PATH = "/user";

const UPSTREAM_FAILURE_ERRORS = [InternalServerError, ServiceUnavailableError] as const;

const buildNoAuthClient = (): ApiClient =>
  new ApiClient({
    baseUrl: mobilePublishEnv.LEGACY_MOBILE_API_BASE_URL,
    timeoutMs: LEGACY_TIMEOUT_MS,
    maxRetries: LEGACY_MAX_RETRIES,
  });

const buildAuthedClient = (token: string, maxRetries: number = LEGACY_MAX_RETRIES): ApiClient =>
  new ApiClient({
    baseUrl: mobilePublishEnv.LEGACY_MOBILE_API_BASE_URL,
    timeoutMs: LEGACY_TIMEOUT_MS,
    maxRetries,
    getHeaders: () => ({ Authorization: token }),
  });

type LegacyWriteBody = {
  trainingLevel: { id: number };
  scheduledDate: string;
  isRestDay: boolean;
  dailyProgram: LegacyDailyProgram | null;
};

const toWriteBody = (input: LegacyGeneralProgramWriteInput): LegacyWriteBody => ({
  trainingLevel: { id: input.levelId },
  scheduledDate: input.scheduledDate,
  isRestDay: input.isRestDay,
  dailyProgram: input.dailyProgram,
});

const isUpstreamFailure = (error: AppError): boolean =>
  UPSTREAM_FAILURE_ERRORS.some((errorClass) => error instanceof errorClass);

const mapLegacyError = (error: unknown): AppError => {
  if (error instanceof AppError) {
    if (isUpstreamFailure(error)) {
      return new BadGatewayError("legacy mobile request failed", { cause: error });
    }

    return error;
  }

  return new BadGatewayError("legacy mobile request failed", {
    cause: error instanceof Error ? error : undefined,
  });
};

const requestLegacy = async <S extends z.ZodType>(
  client: ApiClient,
  path: string,
  method: HttpMethod,
  responseSchema: S,
  body?: unknown,
  queryParams?: Record<string, string>,
): Promise<z.infer<S>> => {
  try {
    return await client.request<z.infer<S>>(path, method, body, queryParams, { responseSchema });
  } catch (error) {
    throw mapLegacyError(error);
  }
};

const toSigninResult = (payload: LegacySigninWire): LegacySigninResult => ({
  userId: payload.userId,
  accessToken: payload.accessToken,
  userRoleName: payload.userRole.name,
  userPlanName: payload.userPlan.name,
});

const toGeneralProgram = (payload: LegacyGeneralProgramWire): LegacyGeneralProgram => ({
  id: payload.id,
  scheduledDate: payload.scheduledDate,
  trainingLevelId: payload.trainingLevel.id,
  isRestDay: payload.isRestDay,
  dailyProgram: payload.dailyProgram,
});

const toIndividualProgram = (payload: LegacyIndividualProgramWire): LegacyIndividualProgram => ({
  id: payload.id,
  userId: payload.userId,
  scheduledDate: payload.scheduledDate,
  isRestDay: payload.isRestDay,
  dailyProgram: payload.dailyProgram,
});

export const createLegacyMobileRestAdapter = (): LegacyMobileClientPort => {
  const signin = async (email: string, password: string): Promise<LegacySigninResult> => {
    const payload = await requestLegacy(
      buildNoAuthClient(),
      SIGNIN_PATH,
      "POST",
      legacySigninResponseSchema,
      { username: email, password },
    );

    return toSigninResult(payload);
  };

  const getTrainingLevels = async (token: string): Promise<LegacyTrainingLevel[]> => {
    const payload = await requestLegacy(
      buildAuthedClient(token),
      TRAINING_LEVELS_PATH,
      "GET",
      legacyTrainingLevelsSchema,
    );

    return payload.map((level) => ({ id: level.id, name: level.name }));
  };

  const getGeneralProgram = async (
    token: string,
    levelId: number,
    scheduledDate: string,
  ): Promise<LegacyGeneralProgram | null> => {
    try {
      const payload = await requestLegacy(
        buildAuthedClient(token),
        GENERAL_PROGRAM_PATH,
        "GET",
        legacyGeneralProgramSchema,
        undefined,
        { trainingLevelId: String(levelId), scheduledDate },
      );

      return toGeneralProgram(payload);
    } catch (error) {
      if (error instanceof NotFoundError) {
        return null;
      }

      throw error;
    }
  };

  const createGeneralProgram = async (
    token: string,
    input: LegacyGeneralProgramWriteInput,
  ): Promise<LegacyGeneralProgram> => {
    const payload = await requestLegacy(
      buildAuthedClient(token, LEGACY_WRITE_MAX_RETRIES),
      GENERAL_PROGRAM_PATH,
      "POST",
      legacyGeneralProgramSchema,
      toWriteBody(input),
    );

    return toGeneralProgram(payload);
  };

  const updateGeneralProgram = async (
    token: string,
    input: LegacyGeneralProgramWriteInput & { id: number },
  ): Promise<LegacyGeneralProgram> => {
    const payload = await requestLegacy(
      buildAuthedClient(token, LEGACY_WRITE_MAX_RETRIES),
      GENERAL_PROGRAM_PATH,
      "PUT",
      legacyGeneralProgramSchema,
      { id: input.id, ...toWriteBody(input) },
    );

    return toGeneralProgram(payload);
  };

  const getIndividualProgram = async (
    token: string,
    userId: number,
    scheduledDate: string,
  ): Promise<LegacyIndividualProgram | null> => {
    try {
      const payload = await requestLegacy(
        buildAuthedClient(token),
        INDIVIDUAL_PROGRAM_PATH,
        "GET",
        legacyIndividualProgramSchema,
        undefined,
        { userId: String(userId), scheduledDate },
      );

      return toIndividualProgram(payload);
    } catch (error) {
      if (error instanceof NotFoundError) {
        return null;
      }

      throw error;
    }
  };

  const createIndividualProgram = async (
    token: string,
    input: LegacyIndividualProgramWriteInput,
  ): Promise<LegacyIndividualProgram> => {
    const payload = await requestLegacy(
      buildAuthedClient(token, LEGACY_WRITE_MAX_RETRIES),
      INDIVIDUAL_PROGRAM_PATH,
      "POST",
      legacyIndividualProgramSchema,
      input,
    );

    return toIndividualProgram(payload);
  };

  const deleteIndividualProgram = async (token: string, id: number): Promise<void> => {
    try {
      await buildAuthedClient(token, LEGACY_WRITE_MAX_RETRIES).requestNoContent(
        `${INDIVIDUAL_PROGRAM_PATH}/${id}`,
        "DELETE",
      );
    } catch (error) {
      const mapped = mapLegacyError(error);

      if (mapped instanceof NotFoundError) {
        return;
      }

      throw mapped;
    }
  };

  const getIndividualAthletes = async (token: string): Promise<LegacyAthlete[]> => {
    const payload = await requestLegacy(
      buildAuthedClient(token),
      USERS_PATH,
      "GET",
      legacyAthletesSchema,
      undefined,
      { userPlanId: "2" },
    );

    return payload.map((athlete) => ({
      id: athlete.id,
      username: athlete.username,
      firstName: athlete.firstName,
      lastName: athlete.lastName,
    }));
  };

  return {
    signin,
    getTrainingLevels,
    getGeneralProgram,
    createGeneralProgram,
    updateGeneralProgram,
    getIndividualProgram,
    createIndividualProgram,
    deleteIndividualProgram,
    getIndividualAthletes,
  };
};
