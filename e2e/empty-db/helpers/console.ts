import { expect, type Page } from "@playwright/test";

export const expectNoConsoleErrors = (page: Page): (() => void) => {
  const errors: string[] = [];

  page.on("console", (msg) => {
    if (msg.type() !== "error") return;
    const text = msg.text();
    if (text.startsWith("Failed to load resource")) return;
    errors.push(text);
  });

  page.on("pageerror", (err) => {
    errors.push(err.message);
  });

  page.on("response", (response) => {
    if (response.status() >= 400) {
      errors.push(`HTTP ${response.status()} ${response.url()}`);
    }
  });

  return () => {
    expect(errors, `browser console errors:\n${errors.join("\n")}`).toHaveLength(0);
  };
};
