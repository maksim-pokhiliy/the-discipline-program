"use client";

import type { CSSProperties } from "react";

const STYLES = {
  body: {
    margin: 0,
    backgroundColor: "#191919",
    color: "rgba(255, 255, 255, 0.87)",
    fontFamily: '"Barlow", sans-serif',
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100dvh",
  },
  heading: {
    fontSize: "2rem",
    fontWeight: 700,
    margin: 0,
  },
  message: {
    color: "rgba(255, 255, 255, 0.6)",
    marginTop: "0.5rem",
  },
  button: {
    marginTop: "1.5rem",
    padding: "0.75rem 2rem",
    backgroundColor: "#E07B35",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    fontSize: "0.875rem",
    fontWeight: 600,
    cursor: "pointer",
  },
} satisfies Record<string, CSSProperties>;

export type GlobalErrorPageContentProps = {
  reset: () => void;
};

export const GlobalErrorPageContent = ({ reset }: GlobalErrorPageContentProps) => (
  <html lang="en">
    <body style={STYLES.body}>
      <div style={{ textAlign: "center" }}>
        <h1 style={STYLES.heading}>Something went wrong</h1>

        <p style={STYLES.message}>A critical error occurred</p>

        <button onClick={reset} style={STYLES.button}>
          Try again
        </button>
      </div>
    </body>
  </html>
);
