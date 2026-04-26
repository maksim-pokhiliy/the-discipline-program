import { z } from "zod";

export const modalitySchema = z.enum([
  "BARBELL",
  "DUMBBELL",
  "KETTLEBELL",
  "BODYWEIGHT",
  "CARDIO",
  "BANDED",
  "MIXED",
  "MACHINE",
]);
