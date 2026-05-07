import { type BlockType } from "@repo/contracts/lms/block-type";
import { type Exercise } from "@repo/contracts/lms/exercise";
import { type SchemeType } from "@repo/contracts/lms/scheme-type";

export type Lookups = {
  readonly exercises: ReadonlyMap<string, Exercise>;
  readonly blockTypes: ReadonlyMap<string, BlockType>;
  readonly schemeTypes: ReadonlyMap<string, SchemeType>;
};
