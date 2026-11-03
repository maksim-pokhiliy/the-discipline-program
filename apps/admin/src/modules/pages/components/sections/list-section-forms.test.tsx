import { fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { clickButton, nthButton } from "@app/test/interactions";

import { LAST_ROW_INDEX, makeListReorderCases } from "../../list-editor.fixtures";
import { renderSectionEditor } from "../../pages.fixtures";

describe("populated list section forms", () => {
  it.each(makeListReorderCases())(
    "moves rows up and down in $row.section and saves every field in order",
    async ({ row, expectedBody }) => {
      const onSave = vi.fn();

      renderSectionEditor(row, onSave);

      expect(nthButton("Move up", 0)).toBeDisabled();
      expect(nthButton("Move down", LAST_ROW_INDEX)).toBeDisabled();
      fireEvent.click(nthButton("Move down", 0));
      fireEvent.click(nthButton("Move down", 1));
      clickButton("Update Section");

      await waitFor(() => expect(onSave).toHaveBeenCalledExactlyOnceWith(expectedBody));
    },
  );
});
