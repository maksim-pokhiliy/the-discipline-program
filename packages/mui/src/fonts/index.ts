import localFont from "next/font/local";

export const fontBase = localFont({
  src: [
    { path: "./files/barlow-v13-latin_latin-ext-300.woff2", weight: "300", style: "normal" },
    { path: "./files/barlow-v13-latin_latin-ext-regular.woff2", weight: "400", style: "normal" },
    { path: "./files/barlow-v13-latin_latin-ext-500.woff2", weight: "500", style: "normal" },
    { path: "./files/barlow-v13-latin_latin-ext-600.woff2", weight: "600", style: "normal" },
    { path: "./files/barlow-v13-latin_latin-ext-700.woff2", weight: "700", style: "normal" },
  ],
  display: "swap",
  variable: "--font-base",
});

export const fontDisplay = localFont({
  src: [
    { path: "./files/barlow-condensed-v13-latin_latin-ext-600.woff2", weight: "600", style: "normal" },
    { path: "./files/barlow-condensed-v13-latin_latin-ext-700.woff2", weight: "700", style: "normal" },
    { path: "./files/barlow-condensed-v13-latin_latin-ext-800.woff2", weight: "800", style: "normal" },
  ],
  display: "swap",
  variable: "--font-display",
});

export const fontVariables = `${fontBase.variable} ${fontDisplay.variable}`;
