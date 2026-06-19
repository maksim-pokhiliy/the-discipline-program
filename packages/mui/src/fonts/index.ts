import { Barlow, Barlow_Condensed } from "next/font/google";

export const fontBase = Barlow({
  subsets: ["latin", "latin-ext"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
  variable: "--font-base",
});

export const fontDisplay = Barlow_Condensed({
  subsets: ["latin", "latin-ext"],
  weight: ["600", "700", "800"],
  display: "swap",
  variable: "--font-display",
});

export const fontVariables = `${fontBase.variable} ${fontDisplay.variable}`;
