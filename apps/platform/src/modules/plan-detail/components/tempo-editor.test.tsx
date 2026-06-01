import { fireEvent, screen } from "@testing-library/react";
import type { FieldErrors } from "react-hook-form";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Mock } from "vitest";

import type { TempoModifier } from "@repo/contracts/lms/_shared";

import { render } from "@app/test/render";

import { TempoEditor } from "./tempo-editor";

const onChange: Mock = vi.fn();

afterEach(() => {
  onChange.mockReset();
});

const toggleAxis = (label: string): void => {
  fireEvent.click(screen.getByText(label));
};

describe("TempoEditor axes", () => {
  it("renders all 5 tempo axes", () => {
    render(<TempoEditor value={null} onChange={onChange} />);

    for (const label of [
      "Full tempo (4 digits)",
      "Slow eccentric",
      "Pause at top",
      "Hold after last rep",
      "Pause every Nth rep",
    ]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });
});

describe("TempoEditor first-on builds a default axis", () => {
  it("builds the full-tempo default when toggled on from null", () => {
    render(<TempoEditor value={null} onChange={onChange} />);

    toggleAxis("Full tempo (4 digits)");

    expect(onChange).toHaveBeenCalledWith({
      fullTempo: { eccentric: 3, pauseBottom: 1, concentric: 0, pauseTop: 0 },
    });
  });

  it("builds the slow-eccentric default when toggled on from null", () => {
    render(<TempoEditor value={null} onChange={onChange} />);

    toggleAxis("Slow eccentric");

    expect(onChange).toHaveBeenCalledWith({ slowEccentric: { durationSec: 4 } });
  });

  it("builds the pause-at-top default carrying position up when toggled on", () => {
    render(<TempoEditor value={null} onChange={onChange} />);

    toggleAxis("Pause at top");

    expect(onChange).toHaveBeenCalledWith({ pauseInUp: { durationSec: 2, position: "up" } });
  });

  it("builds the pause-every-nth default when toggled on from null", () => {
    render(<TempoEditor value={null} onChange={onChange} />);

    toggleAxis("Pause every Nth rep");

    expect(onChange).toHaveBeenCalledWith({ perNthRepPause: { everyN: 3, pauseSec: 2 } });
  });
});

describe("TempoEditor last-off collapses to null", () => {
  it("emits null when the only active axis is toggled off", () => {
    render(<TempoEditor value={{ slowEccentric: { durationSec: 4 } }} onChange={onChange} />);

    toggleAxis("Slow eccentric");

    expect(onChange).toHaveBeenCalledWith(null);
  });

  it("keeps the other axes when one of several is toggled off", () => {
    render(
      <TempoEditor
        value={{ slowEccentric: { durationSec: 4 }, holdAfterLast: { durationSec: 10 } }}
        onChange={onChange}
      />,
    );

    toggleAxis("Slow eccentric");

    expect(onChange).toHaveBeenCalledWith({ holdAfterLast: { durationSec: 10 } });
  });
});

describe("TempoEditor full-tempo digit block", () => {
  it("renders four tempo digit inputs when full tempo is on", () => {
    render(
      <TempoEditor
        value={{ fullTempo: { eccentric: 3, pauseBottom: 1, concentric: 0, pauseTop: 0 } }}
        onChange={onChange}
      />,
    );

    for (const label of ["ecc", "pause⬇", "con", "pause⬆"]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });
});

describe("TempoEditor modifier field error surfaces inline (REV-001)", () => {
  it("renders the slow-eccentric durationSec message when it is invalid", () => {
    const error: FieldErrors<TempoModifier> = {
      slowEccentric: {
        durationSec: { type: "too_small", message: "Number must be greater than 0" },
      },
    };

    render(
      <TempoEditor
        value={{ slowEccentric: { durationSec: 0 } }}
        onChange={onChange}
        error={error}
      />,
    );

    expect(screen.getByText("Number must be greater than 0")).toBeInTheDocument();
  });

  it("renders the pause-every-nth everyN message when it is invalid", () => {
    const error: FieldErrors<TempoModifier> = {
      perNthRepPause: { everyN: { type: "too_small", message: "Number must be greater than 0" } },
    };

    render(
      <TempoEditor
        value={{ perNthRepPause: { everyN: 0, pauseSec: 2 } }}
        onChange={onChange}
        error={error}
      />,
    );

    expect(screen.getByText("Number must be greater than 0")).toBeInTheDocument();
  });
});
