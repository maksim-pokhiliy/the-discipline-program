import { type Position } from "@repo/contracts/lms/schema-row";

const POSITION_UNDERSCORE_RE = /_/g;
const SPACE = " ";

export const formatPosition = (position: Position): string =>
  position.toLowerCase().replace(POSITION_UNDERSCORE_RE, SPACE);
