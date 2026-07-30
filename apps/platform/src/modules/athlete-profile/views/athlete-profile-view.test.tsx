import { act, fireEvent, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  Gender,
  type GetAthleteProfileResponse,
  HealthStatus,
  type UpdateAthleteProfileRequest,
} from "@repo/contracts/coaching/athlete-profile";
import { type ProfileAxis } from "@repo/contracts/coaching/profile-axis";
import { NotFoundError } from "@repo/errors";

import {
  PICK_APPLYING_LABEL,
  PICK_CURRENT_LABEL,
  PICK_OUTCOME_DISMISS_MS,
  PICK_RETRY_LABEL,
} from "@app/lib/level-switch";
import { render } from "@app/test/render";

import {
  BODY_HEIGHT_EMPTY_TITLE,
  BODY_HEIGHT_EYEBROW,
  BODY_HEIGHT_SET_LABEL,
  BODY_STAT_SAVE_LABEL,
  BODY_WEIGHT_CANCEL_LABEL,
  BODY_WEIGHT_EMPTY_TITLE,
  BODY_WEIGHT_SAVE_LABEL,
  BODY_WEIGHT_SET_LABEL,
  CLEAR_PICK_ARIA_PREFIX,
  CLEAR_PICK_ARIA_SUFFIX,
  ERROR_LABEL,
  GENDER_FIELD_LABEL,
  HEALTH_NOTE_FIELD_LABEL,
  HEALTH_STATUS_FIELD_LABEL,
  HEIGHT_UNIT_LABEL,
  KG_LABEL,
  PROFILE_PICKS_NO_AXES,
  ROLE_BADGE_LABEL,
  TITLE_LABEL,
} from "../utils/athlete-profile.constants";

const VALID_CUID = "clz00000000000000000fake1";
const VALID_USER_CUID = "clz00000000000000000user1";
const LEVEL_AXIS_ID = "clz00000000000000000axs01";
const SCALE_AXIS_ID = "clz00000000000000000axs02";
const NOW = new Date("2026-06-16T09:00:00.000Z");
const STRIP_EXIT_GRACE_MS = 1000;

const plainAxis = (id: string, label: string, values: string[]): ProfileAxis => ({
  id,
  key: label.toLowerCase(),
  label,
  values,
  binding: null,
  createdAt: NOW,
  updatedAt: NOW,
});

const MOCK_AXES: ProfileAxis[] = [
  plainAxis(LEVEL_AXIS_ID, "Level", ["RX", "SC"]),
  plainAxis(SCALE_AXIS_ID, "Scale", ["M", "F"]),
];

const profileState = {
  data: undefined as GetAthleteProfileResponse | undefined,
  isLoading: false,
  error: null as Error | null,
};
const axesState = { data: MOCK_AXES as ProfileAxis[] | undefined };
const updateMutate = vi.fn();
const updateMutateAsync = vi.fn<(patch: UpdateAthleteProfileRequest) => Promise<unknown>>();
const uploadMutate = vi.fn();
const updateSession = vi.fn().mockResolvedValue(null);
const sessionUser = {
  name: "Aria Stone" as string | null,
  email: "aria@example.com" as string | null,
  image: null as string | null,
};

vi.mock("@app/lib/hooks", () => ({
  useAthleteProfile: () => ({
    data: profileState.data,
    isLoading: profileState.isLoading,
    error: profileState.error,
  }),
  useAthleteProfileAxes: () => ({ data: axesState.data }),
  useUpdateAthleteProfile: () => ({
    mutate: updateMutate,
    mutateAsync: updateMutateAsync,
    isPending: false,
  }),
  useSwitchAthleteProfileLevel: () => ({
    mutate: updateMutate,
    mutateAsync: updateMutateAsync,
    isPending: false,
  }),
  useUploadImage: () => ({ mutate: uploadMutate, isPending: false }),
}));

vi.mock("@repo/auth/client", () => ({
  useSession: () => ({
    data: {
      user: {
        name: sessionUser.name,
        email: sessionUser.email,
        image: sessionUser.image,
        role: "ATHLETE",
      },
    },
    update: updateSession,
  }),
}));

const { AthleteProfileView } = await import("./athlete-profile-view");

const makeProfile = (
  overrides: Partial<GetAthleteProfileResponse> = {},
): GetAthleteProfileResponse => ({
  id: VALID_CUID,
  userId: VALID_USER_CUID,
  image: null,
  gender: null,
  heightCm: null,
  weightKg: 82.5,
  healthStatus: HealthStatus.HEALTHY,
  healthNote: null,
  profileSelections: null,
  createdAt: NOW,
  updatedAt: NOW,
  ...overrides,
});

const writeOptimisticSelections = (patch: UpdateAthleteProfileRequest): void => {
  const { profileSelections } = patch;

  if (profileSelections === undefined || profileState.data === undefined) {
    return;
  }

  profileState.data = { ...profileState.data, profileSelections };
};

const commitPatchOnResolve = (): void => {
  updateMutateAsync.mockImplementation((patch) => {
    writeOptimisticSelections(patch);

    return Promise.resolve();
  });
};

const holdPatchInFlight = (): void => {
  updateMutateAsync.mockImplementation((patch) => {
    writeOptimisticSelections(patch);

    return new Promise<void>(() => undefined);
  });
};

const statCardByEyebrow = (eyebrow: string): HTMLElement => {
  let node: HTMLElement | null = screen.getByText(eyebrow);
  let card: HTMLElement = node;

  while (node?.parentElement) {
    node = node.parentElement;

    if (within(node).queryAllByRole("button", { name: /edit/i }).length === 1) {
      card = node;
    } else {
      break;
    }
  }

  return card;
};

const flushTimers = async (ms: number): Promise<void> => {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
};

const axisStateChip = (label: string): HTMLElement => {
  const card = screen.getByRole("radiogroup", { name: label }).parentElement;
  const chip = card?.querySelector<HTMLElement>(".MuiChip-root") ?? null;

  if (chip === null) {
    throw new Error(`no state chip rendered in the ${label} axis card`);
  }

  return chip;
};

beforeEach(() => {
  profileState.data = makeProfile();
  profileState.isLoading = false;
  profileState.error = null;
  axesState.data = MOCK_AXES;
  sessionUser.name = "Aria Stone";
  sessionUser.email = "aria@example.com";
  sessionUser.image = null;
  updateMutate.mockReset();
  updateMutateAsync.mockReset();
  updateMutateAsync.mockResolvedValue(undefined);
  uploadMutate.mockReset();
  updateSession.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("AthleteProfileView missing profile (404)", () => {
  it("renders the empty editable body-weight state when the profile is a NotFoundError", () => {
    profileState.data = undefined;
    profileState.error = new NotFoundError();

    render(<AthleteProfileView />);

    expect(screen.getByText(BODY_WEIGHT_EMPTY_TITLE)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: BODY_WEIGHT_SET_LABEL })).toBeInTheDocument();
  });

  it("does not render an error Alert when the profile is a NotFoundError", () => {
    profileState.data = undefined;
    profileState.error = new NotFoundError();

    render(<AthleteProfileView />);

    expect(screen.queryByText(ERROR_LABEL)).toBeNull();
  });
});

describe("AthleteProfileView generic error", () => {
  it("renders the error Alert for a non-404 error", () => {
    profileState.data = undefined;
    profileState.error = new Error("boom");

    render(<AthleteProfileView />);

    expect(screen.getByText(ERROR_LABEL)).toBeInTheDocument();
  });

  it("does not render the body cards for a non-404 error", () => {
    profileState.data = undefined;
    profileState.error = new Error("boom");

    render(<AthleteProfileView />);

    expect(screen.queryByText(TITLE_LABEL)).toBeNull();
    expect(screen.queryByText(BODY_WEIGHT_EMPTY_TITLE)).toBeNull();
  });
});

describe("AthleteProfileView loading", () => {
  it("renders the loading state and not the cards while loading", () => {
    profileState.data = undefined;
    profileState.isLoading = true;

    render(<AthleteProfileView />);

    expect(screen.queryByText(TITLE_LABEL)).toBeNull();
    expect(screen.queryByText(BODY_WEIGHT_EMPTY_TITLE)).toBeNull();
  });
});

describe("AthleteProfileView body weight display", () => {
  it("displays the set weight value and the kg unit", () => {
    profileState.data = makeProfile({ weightKg: 82.5 });

    render(<AthleteProfileView />);

    expect(screen.getByText("82.5")).toBeInTheDocument();
    expect(screen.getByText(KG_LABEL)).toBeInTheDocument();
  });
});

describe("AthleteProfileView body height", () => {
  it("displays the set height value and the cm unit as a stat card twin of weight", () => {
    profileState.data = makeProfile({ heightCm: 180 });

    render(<AthleteProfileView />);

    expect(screen.getByText("180")).toBeInTheDocument();
    expect(screen.getByText(HEIGHT_UNIT_LABEL)).toBeInTheDocument();
  });

  it("renders the empty height state with a Set height action when height is null", () => {
    profileState.data = makeProfile({ heightCm: null });

    render(<AthleteProfileView />);

    expect(screen.getByText(BODY_HEIGHT_EMPTY_TITLE)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: BODY_HEIGHT_SET_LABEL })).toBeInTheDocument();
  });

  it("saves the parsed integer height via mutate when a valid height is entered", () => {
    profileState.data = makeProfile({ heightCm: 180 });

    render(<AthleteProfileView />);

    const heightCard = statCardByEyebrow(BODY_HEIGHT_EYEBROW);

    fireEvent.click(within(heightCard).getByRole("button", { name: /edit/i }));
    fireEvent.change(within(heightCard).getByRole("spinbutton"), { target: { value: "185" } });
    fireEvent.click(within(heightCard).getByRole("button", { name: BODY_STAT_SAVE_LABEL }));

    expect(updateMutate).toHaveBeenCalledTimes(1);
    expect(updateMutate).toHaveBeenCalledWith({ heightCm: 185 });
  });

  it("clamps a height above the max to 300 on save", () => {
    profileState.data = makeProfile({ heightCm: 180 });

    render(<AthleteProfileView />);

    const heightCard = statCardByEyebrow(BODY_HEIGHT_EYEBROW);

    fireEvent.click(within(heightCard).getByRole("button", { name: /edit/i }));
    fireEvent.change(within(heightCard).getByRole("spinbutton"), { target: { value: "420" } });
    fireEvent.click(within(heightCard).getByRole("button", { name: BODY_STAT_SAVE_LABEL }));

    expect(updateMutate).toHaveBeenCalledTimes(1);
    expect(updateMutate).toHaveBeenCalledWith({ heightCm: 300 });
  });

  it.each([
    ["zero", "0"],
    ["a negative number", "-5"],
    ["a non-numeric string", "abc"],
    ["an empty string", ""],
  ])("keeps Save disabled and does not call mutate for %s", (_label, value) => {
    profileState.data = makeProfile({ heightCm: 180 });

    render(<AthleteProfileView />);

    const heightCard = statCardByEyebrow(BODY_HEIGHT_EYEBROW);

    fireEvent.click(within(heightCard).getByRole("button", { name: /edit/i }));
    fireEvent.change(within(heightCard).getByRole("spinbutton"), { target: { value } });

    const saveButton = within(heightCard).getByRole("button", { name: BODY_STAT_SAVE_LABEL });

    expect(saveButton).toBeDisabled();

    fireEvent.click(saveButton);

    expect(updateMutate).not.toHaveBeenCalled();
  });
});

describe("AthleteProfileView body weight edit", () => {
  it("saves the parsed value via mutate when a valid weight is entered", () => {
    profileState.data = makeProfile({ weightKg: 82.5 });

    render(<AthleteProfileView />);

    fireEvent.click(screen.getByRole("button", { name: /edit/i }));
    fireEvent.change(screen.getByRole("spinbutton"), { target: { value: "90.4" } });
    fireEvent.click(screen.getByRole("button", { name: BODY_WEIGHT_SAVE_LABEL }));

    expect(updateMutate).toHaveBeenCalledTimes(1);
    expect(updateMutate).toHaveBeenCalledWith({ weightKg: 90.4 });
  });

  it("clamps a weight above the max to 500 on save", () => {
    profileState.data = makeProfile({ weightKg: 82.5 });

    render(<AthleteProfileView />);

    fireEvent.click(screen.getByRole("button", { name: /edit/i }));
    fireEvent.change(screen.getByRole("spinbutton"), { target: { value: "640" } });
    fireEvent.click(screen.getByRole("button", { name: BODY_WEIGHT_SAVE_LABEL }));

    expect(updateMutate).toHaveBeenCalledTimes(1);
    expect(updateMutate).toHaveBeenCalledWith({ weightKg: 500 });
  });

  it("rounds a sub-decimal weight to one decimal place on save", () => {
    profileState.data = makeProfile({ weightKg: 82.5 });

    render(<AthleteProfileView />);

    fireEvent.click(screen.getByRole("button", { name: /edit/i }));
    fireEvent.change(screen.getByRole("spinbutton"), { target: { value: "80.46" } });
    fireEvent.click(screen.getByRole("button", { name: BODY_WEIGHT_SAVE_LABEL }));

    expect(updateMutate).toHaveBeenCalledWith({ weightKg: 80.5 });
  });

  it.each([
    ["zero", "0"],
    ["a negative number", "-5"],
    ["a non-numeric string", "abc"],
    ["an empty string", ""],
  ])("keeps Save disabled and does not call mutate for %s", (_label, value) => {
    profileState.data = makeProfile({ weightKg: 82.5 });

    render(<AthleteProfileView />);

    fireEvent.click(screen.getByRole("button", { name: /edit/i }));
    fireEvent.change(screen.getByRole("spinbutton"), { target: { value } });

    const saveButton = screen.getByRole("button", { name: BODY_WEIGHT_SAVE_LABEL });

    expect(saveButton).toBeDisabled();

    fireEvent.click(saveButton);

    expect(updateMutate).not.toHaveBeenCalled();
  });

  it("does not expose a clear-weight control in the editing state", () => {
    profileState.data = makeProfile({ weightKg: 82.5 });

    render(<AthleteProfileView />);

    fireEvent.click(screen.getByRole("button", { name: /edit/i }));

    expect(screen.getByRole("button", { name: BODY_WEIGHT_SAVE_LABEL })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: BODY_WEIGHT_CANCEL_LABEL })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /clear|remove/i })).toBeNull();
  });
});

describe("AthleteProfileView profile picks", () => {
  it("renders an axis card per catalog axis with its label and option rows", () => {
    profileState.data = makeProfile({ profileSelections: null });

    render(<AthleteProfileView />);

    expect(screen.getByText("Level")).toBeInTheDocument();
    expect(screen.getByText("Scale")).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "RX" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "SC" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "M" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "F" })).toBeInTheDocument();
  });

  it("checks the saved pick by axisId-keyed selection", () => {
    profileState.data = makeProfile({ profileSelections: { [LEVEL_AXIS_ID]: "SC" } });

    render(<AthleteProfileView />);

    expect(screen.getByRole("radio", { name: `SC ${PICK_CURRENT_LABEL}` })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    expect(screen.getByRole("radio", { name: "RX" })).toHaveAttribute("aria-checked", "false");
  });

  it("picks a value via mutate, merging one key and preserving the others", () => {
    profileState.data = makeProfile({ profileSelections: { [SCALE_AXIS_ID]: "M" } });

    render(<AthleteProfileView />);

    fireEvent.click(screen.getByRole("radio", { name: "RX" }));

    expect(updateMutateAsync).toHaveBeenCalledTimes(1);
    expect(updateMutateAsync).toHaveBeenCalledWith({
      profileSelections: { [SCALE_AXIS_ID]: "M", [LEVEL_AXIS_ID]: "RX" },
    });
  });

  it("clears a pick via mutate with the map minus that axisId key", () => {
    profileState.data = makeProfile({
      profileSelections: { [LEVEL_AXIS_ID]: "RX", [SCALE_AXIS_ID]: "M" },
    });

    render(<AthleteProfileView />);

    fireEvent.click(
      screen.getByRole("button", {
        name: `${CLEAR_PICK_ARIA_PREFIX}Level${CLEAR_PICK_ARIA_SUFFIX}`,
      }),
    );

    expect(updateMutateAsync).toHaveBeenCalledTimes(1);
    expect(updateMutateAsync).toHaveBeenCalledWith({
      profileSelections: { [SCALE_AXIS_ID]: "M" },
    });
  });

  it("clears the sole pick via mutate with an empty object, never null", () => {
    profileState.data = makeProfile({ profileSelections: { [LEVEL_AXIS_ID]: "RX" } });

    render(<AthleteProfileView />);

    fireEvent.click(
      screen.getByRole("button", {
        name: `${CLEAR_PICK_ARIA_PREFIX}Level${CLEAR_PICK_ARIA_SUFFIX}`,
      }),
    );

    expect(updateMutateAsync).toHaveBeenCalledTimes(1);
    expect(updateMutateAsync).toHaveBeenCalledWith({ profileSelections: {} });
  });

  it("renders the no-axes state when the catalog has no axes", () => {
    profileState.data = makeProfile({ profileSelections: null });
    axesState.data = [];

    render(<AthleteProfileView />);

    expect(screen.getByText(PROFILE_PICKS_NO_AXES)).toBeInTheDocument();
    expect(screen.queryByRole("radio", { name: "RX" })).toBeNull();
  });

  it("skips an orphan saved pick whose axis is absent from the catalog without crashing", () => {
    profileState.data = makeProfile({
      profileSelections: { clz00000000000000000orph1: "Deleted" },
    });

    render(<AthleteProfileView />);

    expect(screen.getByText("Level")).toBeInTheDocument();
    expect(screen.queryByText("Deleted")).toBeNull();
  });
});

describe("AthleteProfileView level switch", () => {
  it("keeps the previous pick Current while the tapped value is still applying", () => {
    profileState.data = makeProfile({
      gender: Gender.FEMALE,
      profileSelections: { [LEVEL_AXIS_ID]: "SC" },
    });
    holdPatchInFlight();

    render(<AthleteProfileView />);

    fireEvent.click(screen.getByRole("radio", { name: "RX" }));

    expect(screen.getByRole("radio", { name: `SC ${PICK_CURRENT_LABEL}` })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    expect(screen.getByRole("radio", { name: `RX ${PICK_APPLYING_LABEL}` })).toHaveAttribute(
      "aria-checked",
      "false",
    );
  });

  it("names the full resolved coordinates and marks the row Current once the patch resolves", async () => {
    profileState.data = makeProfile({
      gender: Gender.FEMALE,
      profileSelections: { [SCALE_AXIS_ID]: "M" },
    });
    commitPatchOnResolve();

    render(<AthleteProfileView />);

    fireEvent.click(screen.getByRole("radio", { name: "RX" }));

    const strip = await screen.findByRole("alert");

    expect(
      within(strip).getByText(
        "Applied — training weights everywhere now resolve as RX · M · Female.",
      ),
    ).toBeInTheDocument();
    expect(within(strip).queryByRole("button", { name: PICK_RETRY_LABEL })).not.toBeInTheDocument();
    expect(screen.getByRole("radio", { name: `RX ${PICK_CURRENT_LABEL}` })).toHaveAttribute(
      "aria-checked",
      "true",
    );
  });

  it("keeps the previous pick Current and offers Retry when the patch rejects", async () => {
    profileState.data = makeProfile({
      gender: Gender.FEMALE,
      profileSelections: { [LEVEL_AXIS_ID]: "SC" },
    });
    updateMutateAsync.mockRejectedValue(new Error("boom"));

    render(<AthleteProfileView />);

    fireEvent.click(screen.getByRole("radio", { name: "RX" }));

    const strip = await screen.findByRole("alert");

    expect(
      within(strip).getByText(
        "Couldn't apply. Your level is still SC · Female. Scale still not picked.",
      ),
    ).toBeInTheDocument();
    expect(within(strip).getByRole("button", { name: PICK_RETRY_LABEL })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: `SC ${PICK_CURRENT_LABEL}` })).toHaveAttribute(
      "aria-checked",
      "true",
    );
  });

  it("re-applies the failed value onto the current selections when Retry is pressed", async () => {
    profileState.data = makeProfile({
      gender: Gender.FEMALE,
      profileSelections: { [LEVEL_AXIS_ID]: "SC" },
    });
    updateMutateAsync.mockRejectedValue(new Error("boom"));

    render(<AthleteProfileView />);

    fireEvent.click(screen.getByRole("radio", { name: "RX" }));

    const strip = await screen.findByRole("alert");

    fireEvent.click(within(strip).getByRole("button", { name: PICK_RETRY_LABEL }));

    await waitFor(() => {
      expect(updateMutateAsync).toHaveBeenCalledTimes(2);
    });

    expect(updateMutateAsync).toHaveBeenLastCalledWith({
      profileSelections: { [LEVEL_AXIS_ID]: "RX" },
    });
  });

  it("dismisses the applied strip on its own while the axis chip keeps naming the value", async () => {
    vi.useFakeTimers();

    try {
      profileState.data = makeProfile({
        gender: Gender.FEMALE,
        profileSelections: { [SCALE_AXIS_ID]: "M" },
      });
      commitPatchOnResolve();

      render(<AthleteProfileView />);

      fireEvent.click(screen.getByRole("radio", { name: "RX" }));

      await flushTimers(0);

      expect(screen.getByRole("alert")).toBeInTheDocument();

      await flushTimers(PICK_OUTCOME_DISMISS_MS);
      await flushTimers(STRIP_EXIT_GRACE_MS);

      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
      expect(axisStateChip("Level")).toHaveTextContent("RX");
    } finally {
      vi.useRealTimers();
    }
  });
});

describe("AthleteProfileView identity card", () => {
  it("renders the session name and the Athlete badge", () => {
    render(<AthleteProfileView />);

    expect(screen.getByText("Aria Stone")).toBeInTheDocument();
    expect(screen.getByText(ROLE_BADGE_LABEL)).toBeInTheDocument();
  });

  it("renders the Athlete badge gracefully when the session has no name", () => {
    sessionUser.name = null;

    render(<AthleteProfileView />);

    expect(screen.getByText(ROLE_BADGE_LABEL)).toBeInTheDocument();
  });
});

const getAvatarFileInput = (): HTMLInputElement => {
  const input = document.querySelector<HTMLInputElement>('input[type="file"]');

  if (input === null) {
    throw new Error("avatar file input not found");
  }

  return input;
};

describe("AthleteProfileView avatar", () => {
  it("renders the add-avatar affordance and the initials when there is no image", () => {
    profileState.data = makeProfile({ image: null });

    render(<AthleteProfileView />);

    expect(screen.getByRole("button", { name: /add avatar/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /change avatar/i })).toBeNull();
    expect(screen.getByText("AS")).toBeInTheDocument();
    expect(screen.queryByRole("img")).toBeNull();
  });

  it("renders the uploaded image and the change-avatar affordance when an image is set", () => {
    const imageUrl = "https://blob/x.png";

    profileState.data = makeProfile({ image: imageUrl });

    render(<AthleteProfileView />);

    expect(screen.getByRole("img")).toHaveAttribute("src", imageUrl);
    expect(screen.getByRole("button", { name: /change avatar/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /add avatar/i })).toBeNull();
  });

  it("uploads the selected file with the avatar context and an onSuccess handler", () => {
    profileState.data = makeProfile({ image: null });

    render(<AthleteProfileView />);

    const file = new File(["binary"], "avatar.png", { type: "image/png" });

    fireEvent.change(getAvatarFileInput(), { target: { files: [file] } });

    expect(uploadMutate).toHaveBeenCalledTimes(1);
    expect(uploadMutate).toHaveBeenCalledWith(
      { file, context: "avatar" },
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    );
  });

  it("does not upload when no file is selected", () => {
    profileState.data = makeProfile({ image: null });

    render(<AthleteProfileView />);

    fireEvent.change(getAvatarFileInput(), { target: { files: [] } });

    expect(uploadMutate).not.toHaveBeenCalled();
  });
});

describe("AthleteProfileView details card", () => {
  it("renders the gender, health status, and health note controls", () => {
    profileState.data = makeProfile();

    render(<AthleteProfileView />);

    expect(screen.getByRole("combobox", { name: GENDER_FIELD_LABEL })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: HEALTH_STATUS_FIELD_LABEL })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: HEALTH_NOTE_FIELD_LABEL })).toBeInTheDocument();
  });

  it("keeps the height field out of the details card (it is its own stat card)", () => {
    profileState.data = makeProfile();

    render(<AthleteProfileView />);

    expect(screen.queryByRole("combobox", { name: /height/i })).toBeNull();
  });
});
