import { fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { clickButton, nthButton } from "@app/test/interactions";

import { makeListReorderCases } from "../../list-editor.fixtures";
import { renderSectionEditor } from "../../pages.fixtures";

describe("populated list section forms", () => {
  it.each(makeListReorderCases())(
    "moves rows up and down in $row.section and saves every field in order",
    async ({ row, expectedBody }) => {
      const onSave = vi.fn();

      renderSectionEditor(row, onSave);

      fireEvent.click(nthButton("Move up", 1));
      fireEvent.click(nthButton("Move down", 1));
      clickButton("Update Section");

      await waitFor(() => expect(onSave).toHaveBeenCalledExactlyOnceWith(expectedBody));
    },
  );
});
