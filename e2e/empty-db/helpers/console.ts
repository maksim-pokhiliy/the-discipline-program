import { expect, type Page } from "@playwright/test";

export const expectNoConsoleErrors = (page: Page): (() => void) => {
  const errors: string[] = [];

  page.on("console", (msg) => {
    if (msg.type() === "error") {
      errors.push(msg.text());
    }
  });

  page.on("pageerror", (err) => {
    errors.push(err.message);
  });

  return () => {
    expect(errors, `browser console errors:\n${errors.join("\n")}`).toHaveLength(0);
  };
};
