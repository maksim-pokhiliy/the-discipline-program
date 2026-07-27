import { UserRole } from "@repo/contracts/iam/auth";

export const MOCK_VIEWER_ID = "clz00000000000000000view";

type MockSessionUser = {
  id: string;
  role: UserRole;
};

const sessionUser: MockSessionUser = { id: MOCK_VIEWER_ID, role: UserRole.ADMIN };

export const setMockSession = (role: UserRole, id: string = MOCK_VIEWER_ID): void => {
  sessionUser.id = id;
  sessionUser.role = role;
};

export const buildNextAuthMock = () => ({
  getSession: async () => null,
  signIn: async () => undefined,
  signOut: async () => undefined,
  useSession: () => ({ data: { user: { ...sessionUser } } }),
});

export const buildNextNavigationMock = () => ({
  useRouter: () => ({ push: () => undefined, replace: () => undefined }),
  usePathname: () => "/users",
  useSearchParams: () => new URLSearchParams(),
});
