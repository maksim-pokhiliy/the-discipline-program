import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { render } from "../../test/render";

import { type Column } from "./types";

import { DataTable } from "./index";

type Row = { id: string; name: string };

const columns: Column<Row>[] = [{ id: "name", label: "Name", render: (row) => row.name }];

describe("DataTable empty state", () => {
  it("renders custom emptyMessage when data is empty", () => {
    render(<DataTable data={[]} columns={columns} emptyMessage="Nothing yet" />);

    expect(screen.getByText("Nothing yet")).toBeInTheDocument();
  });

  it("renders default emptyMessage when not provided", () => {
    render(<DataTable data={[]} columns={columns} />);

    expect(screen.getByText("No data found")).toBeInTheDocument();
  });

  it("does not render toolbar when no filters, action, or searchable columns", () => {
    render(<DataTable data={[]} columns={columns} emptyMessage="Empty" />);

    expect(screen.queryByPlaceholderText("Search...")).not.toBeInTheDocument();
  });

  it("does not render pagination when paginated is false", () => {
    const { container } = render(<DataTable data={[]} columns={columns} emptyMessage="Empty" />);

    expect(container.querySelector(".MuiTablePagination-root")).not.toBeInTheDocument();
  });

  it("renders pagination with count=0 when paginated and data empty", () => {
    const { container } = render(
      <DataTable data={[]} columns={columns} emptyMessage="Empty" paginated />,
    );

    expect(container.querySelector(".MuiTablePagination-root")).toBeInTheDocument();
  });

  it("renders header row plus single empty-state row (2 rows total)", () => {
    render(<DataTable data={[]} columns={columns} emptyMessage="Empty" />);

    const rows = screen.getAllByRole("row");

    expect(rows).toHaveLength(2);
  });

  it("does not crash with single column and empty data", () => {
    const singleColumn: Column<Row>[] = [{ id: "name", label: "Name", render: (row) => row.name }];

    expect(() =>
      render(<DataTable data={[]} columns={singleColumn} emptyMessage="Empty" />),
    ).not.toThrow();
  });
});
