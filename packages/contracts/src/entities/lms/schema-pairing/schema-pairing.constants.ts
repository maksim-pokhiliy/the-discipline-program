export const SCHEMA_PAIRING_RELATIONS = ["ALTERNATING_SETS"] as const;
export type SchemaPairingRelation = (typeof SCHEMA_PAIRING_RELATIONS)[number];
