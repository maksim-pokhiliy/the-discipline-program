import { Program } from "@repo/api";

export const generateUniqueSlug = (baseName: string, existingPrograms: Program[]): string => {
  const baseSlug = baseName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();

  const existingSlugs = new Set(existingPrograms.map((p) => p.slug));

  if (!existingSlugs.has(baseSlug)) {
    return baseSlug;
  }

  let counter = 1;
  let newSlug = `${baseSlug}-${counter}`;

  while (existingSlugs.has(newSlug)) {
    counter++;
    newSlug = `${baseSlug}-${counter}`;
  }

  return newSlug;
};

export const createDuplicateProgram = (
  originalProgram: Program,
  programs: Program[],
): Omit<Program, "id" | "createdAt" | "updatedAt"> => {
  const duplicateName = `${originalProgram.name} (Copy)`;
  const duplicateSlug = generateUniqueSlug(duplicateName, programs);
  const maxSortOrder = Math.max(...programs.map((p) => p.sortOrder), 0);

  return {
    name: duplicateName,
    slug: duplicateSlug,
    description: originalProgram.description,
    price: originalProgram.price,
    currency: originalProgram.currency,
    features: [...originalProgram.features],
    isActive: false,
    sortOrder: maxSortOrder + 1,
  };
};
