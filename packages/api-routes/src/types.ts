export type RouteContext = { params: Promise<Record<string, string> | undefined> };
export type RouteHandler = (request: Request, context: RouteContext) => Promise<Response>;
export type AuthenticatedHandler = (
  request: Request,
  context: RouteContext,
  userId: string,
) => Promise<Response>;
