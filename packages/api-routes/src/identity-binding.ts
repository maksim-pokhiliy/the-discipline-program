import { getMonitoring } from "./monitoring";
import { updateContext } from "./request-context";

export const bindIdentity = (userId: string, role?: string): void => {
  updateContext({ userId, ...(role && { role }) });
  getMonitoring()?.setUser({ id: userId, ...(role && { role }) });
};

export const releaseIdentity = (): void => {
  getMonitoring()?.setUser(null);
};
