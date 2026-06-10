import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { render } from "@app/test/render";

const { SchemaGroupBox } = await import("./schema-group-box");

const BOX_TEST_ID = "schema-group-box";

describe("SchemaGroupBox", () => {
  it("renders an AccentGroupCard with the schema-group-box test id (MT-2)", () => {
    render(
      <SchemaGroupBox label={<span data-testid="box-label">Label</span>}>
        <span data-testid="box-child">Member</span>
      </SchemaGroupBox>,
    );

    const box = screen.getByTestId(BOX_TEST_ID);
    const card = box.querySelector(".MuiCard-root");

    expect(box).toBeInTheDocument();
    expect(card).not.toBeNull();
    expect(card).toHaveStyle({ borderStyle: "dashed" });
  });

  it("places the label node in the header zone and the children in the body zone", () => {
    render(
      <SchemaGroupBox label={<span data-testid="box-label">Label</span>}>
        <span data-testid="box-child">Member</span>
      </SchemaGroupBox>,
    );

    const label = screen.getByTestId("box-label");
    const child = screen.getByTestId("box-child");

    expect(label).toBeInTheDocument();
    expect(child).toBeInTheDocument();
    expect(label.compareDocumentPosition(child) & Node.DOCUMENT_POSITION_FOLLOWING).not.toBe(0);
  });
});
