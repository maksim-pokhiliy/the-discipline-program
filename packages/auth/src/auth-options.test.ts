import type { Account, NextAuthOptions, Profile, Session } from "next-auth";
import type { JWT } from "next-auth/jwt";
import type { CredentialInput, CredentialsConfig } from "next-auth/providers/credentials";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { UserRole } from "@repo/contracts/iam/auth";
import { UnauthorizedError } from "@repo/errors";

import { type AuthServiceAdapter, createAuthOptions } from "./auth-options";

type JwtCallback = NonNullable<NonNullable<NextAuthOptions["callbacks"]>["jwt"]>;
type JwtCallbackArgs = Parameters<JwtCallback>[0];
type JwtCallbackUser = JwtCallbackArgs["user"];

type SessionCallback = NonNullable<NonNullable<NextAuthOptions["callbacks"]>["session"]>;
type SessionCallbackArgs = Parameters<SessionCallback>[0];

type CredentialsAuthorize = NonNullable<
  CredentialsConfig<Record<string, CredentialInput>>["options"]
>["authorize"];

const getAuthorize = (
  options: ReturnType<typeof createAuthOptions>,
): NonNullable<CredentialsAuthorize> => {
  const provider = options.providers[0] as CredentialsConfig<Record<string, CredentialInput>>;
  const authorize = provider.options?.authorize;

  if (!authorize) {
    throw new Error("expected authorize to be configured on the credentials provider");
  }

  return authorize;
};

const buildService = (): {
  service: AuthServiceAdapter;
  validateUser: ReturnType<typeof vi.fn>;
  getUserById: ReturnType<typeof vi.fn>;
} => {
  const validateUser = vi.fn();
  const getUserById = vi.fn();

  return {
    service: { validateUser, getUserById },
    validateUser,
    getUserById,
  };
};

const buildToken = (overrides: Partial<JWT> = {}): JWT => ({
  id: "user-1",
  email: "alice@example.com",
  name: "Alice",
  image: null,
  role: UserRole.COACH,
  tokenVersion: 1,
  ...overrides,
});

const dummyJwtArgs = {
  account: null as Account | null,
  profile: undefined as Profile | undefined,
  trigger: undefined as "signIn" | "signUp" | "update" | undefined,
  isNewUser: false,
  session: undefined,
};

describe("createAuthOptions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("authorize callback", () => {
    it("returns null when credentials are missing", async () => {
      const { service, validateUser } = buildService();
      const options = createAuthOptions(service);
      const authorize = getAuthorize(options);

      const result = await authorize(undefined, new Request("https://example.com"));

      expect(result).toBeNull();
      expect(validateUser).not.toHaveBeenCalled();
    });

    it("returns null when email is missing", async () => {
      const { service, validateUser } = buildService();
      const options = createAuthOptions(service);
      const authorize = getAuthorize(options);

      const result = await authorize(
        { email: "", password: "Sup3rsecret-pass" },
        new Request("https://example.com"),
      );

      expect(result).toBeNull();
      expect(validateUser).not.toHaveBeenCalled();
    });

    it("returns null when service.validateUser returns null", async () => {
      const { service, validateUser } = buildService();

      validateUser.mockResolvedValueOnce(null);

      const options = createAuthOptions(service);
      const authorize = getAuthorize(options);

      const result = await authorize(
        { email: "alice@example.com", password: "Sup3rsecret-pass" },
        new Request("https://example.com"),
      );

      expect(result).toBeNull();
      expect(validateUser).toHaveBeenCalledWith("alice@example.com", "Sup3rsecret-pass");
    });

    it("returns the authenticated user with role and tokenVersion when validation succeeds", async () => {
      const { service } = buildService();

      service.validateUser = vi.fn(async () => ({
        id: "user-7",
        email: "alice@example.com",
        name: "Alice",
        image: null,
        role: UserRole.HEAD_COACH,
        tokenVersion: 4,
      }));

      const options = createAuthOptions(service);
      const authorize = getAuthorize(options);

      const result = await authorize(
        { email: "alice@example.com", password: "Sup3rsecret-pass" },
        new Request("https://example.com"),
      );

      expect(result).toEqual({
        id: "user-7",
        email: "alice@example.com",
        name: "Alice",
        image: null,
        role: UserRole.HEAD_COACH,
        tokenVersion: 4,
      });
    });
  });

  describe("jwt callback", () => {
    const invokeJwt = (
      options: ReturnType<typeof createAuthOptions>,
      args: { token: JWT; user?: JwtCallbackUser },
    ): Promise<JWT> => {
      const jwt = options.callbacks?.jwt;

      if (!jwt) {
        throw new Error("expected jwt callback to be configured");
      }

      const baseArgs = {
        token: args.token,
        ...dummyJwtArgs,
      };
      const callbackArgs = (
        args.user === undefined ? baseArgs : { ...baseArgs, user: args.user }
      ) as JwtCallbackArgs;

      return Promise.resolve(jwt(callbackArgs));
    };

    it("enriches the token with userId, role, tokenVersion on first sign-in", async () => {
      const { service, getUserById } = buildService();
      const options = createAuthOptions(service);
      const seedToken: JWT = { id: "", role: null };
      const enriched = await invokeJwt(options, {
        token: seedToken,
        user: {
          id: "user-1",
          email: "alice@example.com",
          name: "Alice",
          image: null,
          role: UserRole.COACH,
          tokenVersion: 2,
        },
      });

      expect(enriched.id).toBe("user-1");
      expect(enriched.email).toBe("alice@example.com");
      expect(enriched.role).toBe(UserRole.COACH);
      expect(enriched.tokenVersion).toBe(2);
      expect(getUserById).not.toHaveBeenCalled();
    });

    it("re-fetches the user via service.getUserById on subsequent calls", async () => {
      const { service, getUserById } = buildService();

      getUserById.mockResolvedValueOnce({ role: UserRole.COACH, tokenVersion: 1 });

      const options = createAuthOptions(service);
      const result = await invokeJwt(options, { token: buildToken() });

      expect(getUserById).toHaveBeenCalledWith("user-1");
      expect(result.role).toBe(UserRole.COACH);
      expect(result.tokenVersion).toBe(1);
    });

    it("throws UnauthorizedError when the user no longer exists", async () => {
      const { service, getUserById } = buildService();

      getUserById.mockResolvedValueOnce(null);

      const options = createAuthOptions(service);

      await expect(invokeJwt(options, { token: buildToken() })).rejects.toBeInstanceOf(
        UnauthorizedError,
      );
    });

    it("throws UnauthorizedError when the tokenVersion does not match", async () => {
      const { service, getUserById } = buildService();

      getUserById.mockResolvedValueOnce({ role: UserRole.COACH, tokenVersion: 99 });

      const options = createAuthOptions(service);

      await expect(
        invokeJwt(options, { token: buildToken({ tokenVersion: 1 }) }),
      ).rejects.toBeInstanceOf(UnauthorizedError);
    });

    it("treats a missing tokenVersion as 0 when comparing against the database version", async () => {
      const { service, getUserById } = buildService();

      getUserById.mockResolvedValueOnce({ role: UserRole.COACH, tokenVersion: 0 });

      const options = createAuthOptions(service);
      const token = buildToken();

      delete token.tokenVersion;

      const result = await invokeJwt(options, { token });

      expect(result.tokenVersion).toBe(0);
      expect(result.role).toBe(UserRole.COACH);
    });

    it("rebinds the role to whatever the service returns (defends against stale-JWT widening)", async () => {
      const { service, getUserById } = buildService();

      getUserById.mockResolvedValueOnce({ role: UserRole.ATHLETE, tokenVersion: 1 });

      const options = createAuthOptions(service);
      const result = await invokeJwt(options, {
        token: buildToken({ role: UserRole.ADMIN }),
      });

      expect(result.role).toBe(UserRole.ATHLETE);
    });
  });

  describe("session callback", () => {
    const invokeSession = (options: ReturnType<typeof createAuthOptions>, token: JWT): Session => {
      const sessionCb = options.callbacks?.session;

      if (!sessionCb) {
        throw new Error("expected session callback to be configured");
      }

      const baseSession: Session = {
        user: { id: "", email: null, name: null, image: null, role: null },
        expires: new Date(Date.now() + 60_000).toISOString(),
      };

      const sessionArgs: SessionCallbackArgs = {
        session: baseSession,
        token,
        user: {
          id: "user-1",
          email: "alice@example.com",
          name: null,
          image: null,
          role: null,
          emailVerified: null,
        },
        newSession: undefined,
        trigger: "update",
      };
      const result = sessionCb(sessionArgs);

      if (!result || typeof result !== "object" || !("user" in result)) {
        throw new Error("expected session callback to return a Session");
      }

      return result as Session;
    };

    it("maps id, email, name, image, role from the JWT to the session", () => {
      const { service } = buildService();
      const options = createAuthOptions(service);
      const session = invokeSession(
        options,
        buildToken({
          id: "user-9",
          email: "carol@example.com",
          name: "Carol",
          image: "https://cdn/example.png",
          role: UserRole.ADMIN,
        }),
      );

      expect(session.user).toEqual({
        id: "user-9",
        email: "carol@example.com",
        name: "Carol",
        image: "https://cdn/example.png",
        role: UserRole.ADMIN,
      });
    });

    it("collapses missing email/name/image/role to null", () => {
      const { service } = buildService();
      const options = createAuthOptions(service);
      const token = buildToken({
        email: undefined,
        name: undefined,
        image: undefined,
        role: null,
      });

      const session = invokeSession(options, token);

      expect(session.user.email).toBeNull();
      expect(session.user.name).toBeNull();
      expect(session.user.image).toBeNull();
      expect(session.user.role).toBeNull();
      expect(session.user.id).toBe("user-1");
    });
  });

  describe("static configuration", () => {
    it("uses JWT session strategy with the contracts SESSION_MAX_AGE", () => {
      const { service } = buildService();
      const options = createAuthOptions(service);

      expect(options.session?.strategy).toBe("jwt");
      expect(options.session?.maxAge).toBe(7 * 24 * 60 * 60);
    });

    it("points signIn and error pages at the login route", () => {
      const { service } = buildService();
      const options = createAuthOptions(service);

      expect(options.pages?.signIn).toBe("/login");
      expect(options.pages?.error).toBe("/login");
    });
  });
});
