const NOTES_JOIN = "\n";

export const notesListToText = (notes: string[] | null): string =>
  notes === null ? "" : notes.join(NOTES_JOIN);

export const textToNotesList = (text: string | null): string[] | null => {
  if (text === null) {
    return null;
  }

  const trimmed = text.trim();

  return trimmed === "" ? null : [text];
};
