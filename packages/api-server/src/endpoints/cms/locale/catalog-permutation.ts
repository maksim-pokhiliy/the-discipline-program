export const isCatalogPermutation = (
  catalogCodes: readonly string[],
  orderedCodes: readonly string[],
): boolean => {
  const catalog = new Set(catalogCodes);
  const ordered = new Set(orderedCodes);

  return (
    ordered.size === orderedCodes.length &&
    ordered.size === catalog.size &&
    [...ordered].every((code) => catalog.has(code))
  );
};
