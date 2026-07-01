import { ImageResponse } from "next/og";

export const size = {
  width: 32,
  height: 32,
};

export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background: "#111111",
          border: "2px solid #f7f4ee",
          color: "#f7f4ee",
          display: "flex",
          height: "100%",
          justifyContent: "center",
          position: "relative",
          width: "100%",
        }}
      >
        <div
          style={{
            background: "#41c7ff",
            height: 4,
            left: 4,
            position: "absolute",
            top: 4,
            width: 14,
          }}
        />
        <div
          style={{
            background: "#1d4ed8",
            bottom: 4,
            height: 4,
            position: "absolute",
            right: 4,
            width: 14,
          }}
        />
        <div
          style={{
            fontFamily: "monospace",
            fontSize: 16,
            fontWeight: 900,
            letterSpacing: 0,
            lineHeight: 1,
          }}
        >
          B
        </div>
      </div>
    ),
    size,
  );
}
