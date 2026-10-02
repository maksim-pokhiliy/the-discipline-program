import { fireEvent, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { makeIndividualLink } from "@app/lib/mobile.fixtures";
import { render } from "@app/test/render";

import { IndividualLinkRow } from "./individual-link-row";

const ATHLETE_ID = "ckathl1234567890abcdef0123";
const DISPLAY_NAME = "Pat Platform";
const NO_ACCOUNT_CAPTION = "No Individual-plan account in the mobile app";

const renderRow = (props: Partial<Parameters<typeof IndividualLinkRow>[0]> = {}) =>
  render(
    <IndividualLinkRow
      displayName={DISPLAY_NAME}
      image={null}
      athleteId={ATHLETE_ID}
      canLink={true}
      onLink={vi.fn()}
      onUnlink={vi.fn()}
      isMutating={false}
      {...props}
    />,
  );

const openUnlinkConfirm = (): HTMLElement => {
  fireEvent.click(screen.getByRole("button", { name: "Unlink mobile athlete" }));

  return screen.getByRole("dialog", { name: /Unlink mobile athlete\?/ });
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe("IndividualLinkRow unlinked", () => {
  it("offers Link and no caption when the athlete can be linked", () => {
    renderRow({ canLink: true });

    expect(screen.getByText(DISPLAY_NAME)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Link" })).toBeInTheDocument();
    expect(screen.queryByText(NO_ACCOUNT_CAPTION)).toBeNull();
  });

  it("shows the no-account caption and no Link when the athlete cannot be linked", () => {
    renderRow({ canLink: false });

    expect(screen.getByText(NO_ACCOUNT_CAPTION)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Link" })).toBeNull();
  });

  it("calls onLink once when Link is clicked", () => {
    const onLink = vi.fn();

    renderRow({ onLink });

    fireEvent.click(screen.getByRole("button", { name: "Link" }));

    expect(onLink).toHaveBeenCalledTimes(1);
  });

  it("disables Link while a link mutation is in flight", () => {
    const onLink = vi.fn();

    renderRow({ onLink, isMutating: true });

    const linkButton = screen.getByRole("button", { name: "Link" });

    expect(linkButton).toBeDisabled();

    fireEvent.click(linkButton);

    expect(onLink).not.toHaveBeenCalled();
  });

  it("offers no Unlink action before the athlete is linked", () => {
    renderRow();

    expect(screen.queryByRole("button", { name: "Unlink mobile athlete" })).toBeNull();
  });
});

describe("IndividualLinkRow linked", () => {
  it("shows the athlete with Unlink and neither Link nor the caption, whatever canLink says", () => {
    renderRow({ existingLink: makeIndividualLink({ athleteId: ATHLETE_ID }), canLink: false });

    expect(screen.getByText(DISPLAY_NAME)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Unlink mobile athlete" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Link" })).toBeNull();
    expect(screen.queryByText(NO_ACCOUNT_CAPTION)).toBeNull();
  });

  it("shows the link's publish status", () => {
    renderRow({ existingLink: makeIndividualLink({ athleteId: ATHLETE_ID }) });

    expect(screen.getByText("Never published")).toBeInTheDocument();
  });

  it("asks to stop publishing to the named athlete and calls onUnlink only after confirming", () => {
    const onUnlink = vi.fn();

    renderRow({ existingLink: makeIndividualLink({ athleteId: ATHLETE_ID }), onUnlink });

    const dialog = openUnlinkConfirm();

    expect(
      within(dialog).getByText(`Stop publishing this plan to ${DISPLAY_NAME}?`),
    ).toBeInTheDocument();
    expect(onUnlink).not.toHaveBeenCalled();

    fireEvent.click(within(dialog).getByRole("button", { name: "Unlink" }));

    expect(onUnlink).toHaveBeenCalledTimes(1);
  });

  it("does not call onUnlink when the confirm is cancelled", () => {
    const onUnlink = vi.fn();

    renderRow({ existingLink: makeIndividualLink({ athleteId: ATHLETE_ID }), onUnlink });

    const dialog = openUnlinkConfirm();

    fireEvent.click(within(dialog).getByRole("button", { name: "Cancel" }));

    expect(onUnlink).not.toHaveBeenCalled();
  });

  it("disables Unlink while a mutation is in flight", () => {
    renderRow({ existingLink: makeIndividualLink({ athleteId: ATHLETE_ID }), isMutating: true });

    expect(screen.getByRole("button", { name: "Unlink mobile athlete" })).toBeDisabled();
  });
});
