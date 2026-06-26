import { z } from "zod";

import { legacyTrainingLevelsSchema, mobileAthletesSchema } from "../legacy-mobile";

import { connectMobileSchema, mobileConnectionSchema } from "./mobile-connection.schema";

export const connectMobileRequestSchema = connectMobileSchema;
export const connectMobileResponseSchema = mobileConnectionSchema;
export const getMobileConnectionsResponseSchema = z.array(mobileConnectionSchema);
export const getTrainingLevelsResponseSchema = legacyTrainingLevelsSchema;
export const getMobileAthletesResponseSchema = mobileAthletesSchema;
