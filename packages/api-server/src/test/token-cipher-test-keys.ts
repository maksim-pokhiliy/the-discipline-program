const ENV_KEY_LENGTH = 44;

export const MOBILE_PUBLISH_KEY_ENV_NAME = "MOBILE_PUBLISH_ENCRYPTION_KEY";

export const KEY_DECODING_TO_33_BYTES = "A".repeat(ENV_KEY_LENGTH);

export const readTestEnvKey = (name: string): string => {
  const value = process.env[name];

  if (value === undefined || value === "") {
    throw new Error(`${name} is not set in the test env of vitest.config.ts`);
  }

  return value;
};
