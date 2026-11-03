import { type z } from "zod";

import { type FieldDescriptor } from "../components/sections/flat-fields-section-form.types";

export type FieldsOf<TSchema extends z.AnyZodObject> = Record<
  keyof TSchema["shape"],
  FieldDescriptor
>;

export type RemainingFields<TFields, TTaken extends keyof TFields> = Omit<TFields, TTaken> &
  Partial<Record<TTaken, never>>;
