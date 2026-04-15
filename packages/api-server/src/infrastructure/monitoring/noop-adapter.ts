import type { MonitoringPort } from "./port";

export const createNoopAdapter = (): MonitoringPort => ({
  captureException: () => "",
  captureMessage: () => "",
  setUser: () => {},
  setContext: () => {},
  flush: () => Promise.resolve(true),
});
