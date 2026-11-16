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

type MockNavigation = { pathname: string; search: string };
type MockNavigationCalls = { push: string[]; replace: string[] };
type MockRouter = { push: (url: string) => void; replace: (url: string) => void };
type NextNavigationMock = {
  useRouter: () => MockRouter;
  usePathname: () => string;
  useSearchParams: () => URLSearchParams;
};

const DEFAULT_NAVIGATION: MockNavigation = { pathname: "/users", search: "" };
const navigation: MockNavigation = { ...DEFAULT_NAVIGATION };
const navigationCalls: MockNavigationCalls = { push: [], replace: [] };

export const setMockNavigation = (next: Partial<MockNavigation>): void => {
  Object.assign(navigation, next);
};

export const readMockNavigationCalls = (): MockNavigationCalls => ({
  push: [...navigationCalls.push],
  replace: [...navigationCalls.replace],
});

export const resetMockNavigation = (): void => {
  Object.assign(navigation, DEFAULT_NAVIGATION);
  navigationCalls.push.length = 0;
  navigationCalls.replace.length = 0;
};

export const buildNextNavigationMock = (): NextNavigationMock => ({
  useRouter: () => ({
    push: (url) => {
      navigationCalls.push.push(url);
    },
    replace: (url) => {
      navigationCalls.replace.push(url);
    },
  }),
  usePathname: () => navigation.pathname,
  useSearchParams: () => new URLSearchParams(navigation.search),
});
