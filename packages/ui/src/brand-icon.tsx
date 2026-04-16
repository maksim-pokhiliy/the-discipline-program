import { ImageResponse } from "next/og";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export const BrandIcon = () =>
  new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
          fontWeight: 800,
          fontSize: 38,
          letterSpacing: -2.5,
          color: "#E07B35",
          background: "transparent",
        }}
      >
        TDP
      </div>
    ),
    size,
  );
