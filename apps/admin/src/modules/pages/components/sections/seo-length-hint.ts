export const SEO_TITLE_LENGTH_HINT = 60;
export const SEO_DESCRIPTION_LENGTH_HINT = 160;

export const formatLengthHint = (value: string | undefined, recommendedLength: number): string =>
  `${value?.length ?? 0} / ${recommendedLength}`;
