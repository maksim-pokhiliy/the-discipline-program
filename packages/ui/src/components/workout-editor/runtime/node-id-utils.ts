const BLOCK_PREFIX = "block:";
const SECTION_PREFIX = "section:";

export const synthesizeBlockId = (blockIndex: number): string => `${BLOCK_PREFIX}${blockIndex}`;

export const synthesizeSectionId = (blockIndex: number, sectionIndex: number): string =>
  `${SECTION_PREFIX}${blockIndex}:${sectionIndex}`;

export const parseBlockId = (id: string): number | null => {
  if (!id.startsWith(BLOCK_PREFIX)) {
    return null;
  }

  const value = Number.parseInt(id.slice(BLOCK_PREFIX.length), 10);

  return Number.isFinite(value) ? value : null;
};

export type ParsedSectionId = {
  blockIndex: number;
  sectionIndex: number;
};

export const parseSectionId = (id: string): ParsedSectionId | null => {
  if (!id.startsWith(SECTION_PREFIX)) {
    return null;
  }

  const parts = id.slice(SECTION_PREFIX.length).split(":");

  if (parts.length !== 2) {
    return null;
  }

  const [blockRaw, sectionRaw] = parts;

  if (blockRaw === undefined || sectionRaw === undefined) {
    return null;
  }

  const blockIndex = Number.parseInt(blockRaw, 10);
  const sectionIndex = Number.parseInt(sectionRaw, 10);

  if (!Number.isFinite(blockIndex) || !Number.isFinite(sectionIndex)) {
    return null;
  }

  return { blockIndex, sectionIndex };
};
