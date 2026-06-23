import { type CSSProperties } from "react";

const BRAND = "#E07B35";
const BG = "#f6f9fc";
const CONTAINER = "#ffffff";
const TEXT = "#1f2937";
const MUTED = "#6b7280";
const BORDER = "#e5e7eb";

const RADIUS = "8px";
const MAX_WIDTH = "560px";
const FONT_STACK =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

const SPACE_XS = "4px";
const SPACE_SM = "8px";
const SPACE_MD = "16px";
const SPACE_LG = "24px";
const SPACE_XL = "32px";

export const emailFontStack = FONT_STACK;

export const greet = (recipientName?: string | null): string =>
  recipientName ? `Hi ${recipientName},` : "Hi,";

export const theme = {
  body: {
    backgroundColor: BG,
    fontFamily: FONT_STACK,
    margin: "0",
    padding: "0",
  },
  container: {
    backgroundColor: CONTAINER,
    margin: "40px auto",
    padding: `${SPACE_XL} ${SPACE_LG}`,
    maxWidth: MAX_WIDTH,
    borderRadius: RADIUS,
    border: `1px solid ${BORDER}`,
  },
  accentBar: {
    backgroundColor: BRAND,
    height: SPACE_XS,
    borderRadius: `${RADIUS} ${RADIUS} 0 0`,
    margin: "0",
    padding: "0",
    border: "none",
  },
  header: {
    paddingTop: SPACE_MD,
    paddingBottom: SPACE_LG,
  },
  wordmark: {
    color: BRAND,
    fontFamily: FONT_STACK,
    fontSize: "13px",
    fontWeight: 700,
    letterSpacing: "2px",
    textTransform: "uppercase",
    margin: "0",
  },
  heading: {
    color: TEXT,
    fontFamily: FONT_STACK,
    fontSize: "22px",
    fontWeight: 700,
    lineHeight: "28px",
    margin: `0 0 ${SPACE_MD}`,
  },
  text: {
    color: TEXT,
    fontFamily: FONT_STACK,
    fontSize: "15px",
    lineHeight: "24px",
    margin: `0 0 ${SPACE_MD}`,
  },
  mutedText: {
    color: MUTED,
    fontFamily: FONT_STACK,
    fontSize: "13px",
    lineHeight: "20px",
    margin: `${SPACE_MD} 0 0`,
  },
  label: {
    color: MUTED,
    fontWeight: 700,
  },
  infoRow: {
    color: TEXT,
    fontFamily: FONT_STACK,
    fontSize: "15px",
    lineHeight: "24px",
    margin: `0 0 ${SPACE_SM}`,
  },
  button: {
    backgroundColor: BRAND,
    color: CONTAINER,
    fontFamily: FONT_STACK,
    fontSize: "15px",
    fontWeight: 600,
    textDecoration: "none",
    textAlign: "center",
    borderRadius: RADIUS,
    padding: `${SPACE_SM} ${SPACE_LG}`,
    display: "inline-block",
  },
  link: {
    color: BRAND,
    fontFamily: FONT_STACK,
    fontSize: "13px",
    wordBreak: "break-all",
  },
  linkFallback: {
    margin: `${SPACE_SM} 0 0`,
  },
  hr: {
    borderColor: BORDER,
    margin: `${SPACE_LG} 0`,
  },
  footer: {
    color: MUTED,
    fontFamily: FONT_STACK,
    fontSize: "12px",
    lineHeight: "18px",
    margin: "0",
  },
} satisfies Record<string, CSSProperties>;
