import type { CSSProperties, ReactNode } from "react";
import {
  AbsoluteFill,
  Img,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

type BasePaintTeesPromoProps = {
  day: number;
  theme: string;
  productUrl: string;
  frontMockupPath: string;
  backMockupPath: string;
  onBodyMockupPath: string;
  duoMockupPath: string;
};

const colors = {
  bg: "#05070a",
  panel: "#0b1117",
  panel2: "#101a24",
  text: "#f7f8fb",
  muted: "#9aa8b6",
  line: "#283544",
  blue: "#41c7ff",
  deepBlue: "#1d4ed8",
};

const fontStack =
  'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace';

const fill: CSSProperties = {
  background: colors.bg,
  color: colors.text,
  fontFamily: fontStack,
};

const title: CSSProperties = {
  fontSize: 84,
  lineHeight: 0.95,
  letterSpacing: 0,
  fontWeight: 900,
  textTransform: "uppercase",
};

const eyebrow: CSSProperties = {
  color: colors.blue,
  fontSize: 28,
  fontWeight: 900,
  letterSpacing: 8,
  textTransform: "uppercase",
};

const body: CSSProperties = {
  color: colors.muted,
  fontSize: 32,
  lineHeight: 1.35,
  fontWeight: 700,
};

const scenePadding = 72;

const inOut = (frame: number, start: number, end: number) => {
  return interpolate(frame, [start, start + 18, end - 18, end], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
};

const usePop = (delay = 0) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return spring({
    frame: frame - delay,
    fps,
    config: {
      damping: 18,
      stiffness: 120,
    },
  });
};

const Shell = ({ children }: { children: ReactNode }) => {
  return (
    <AbsoluteFill style={fill}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at 40% 20%, rgba(65,199,255,0.14), transparent 36%), linear-gradient(180deg, rgba(29,78,216,0.28), transparent 34%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.2,
          backgroundImage:
            "linear-gradient(rgba(65,199,255,0.18) 1px, transparent 1px), linear-gradient(90deg, rgba(65,199,255,0.18) 1px, transparent 1px)",
          backgroundSize: "54px 54px",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 34,
          border: `3px solid ${colors.line}`,
          boxShadow: `18px 18px 0 ${colors.deepBlue}`,
        }}
      />
      {children}
    </AbsoluteFill>
  );
};

const Header = ({ day }: { day: number }) => {
  return (
    <div
      style={{
        position: "absolute",
        top: 60,
        left: scenePadding,
        right: scenePadding,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        zIndex: 10,
      }}
    >
      <div style={{ ...eyebrow, color: colors.text, letterSpacing: 7 }}>
        BasePaint Tees
      </div>
      <div
        style={{
          color: colors.blue,
          fontSize: 26,
          fontWeight: 900,
          letterSpacing: 4,
          textTransform: "uppercase",
        }}
      >
        Day #{day}
      </div>
    </div>
  );
};

const ProductFrame = ({
  src,
  label,
  delay = 0,
}: {
  src: string;
  label: string;
  delay?: number;
}) => {
  const pop = usePop(delay);

  return (
    <div
      style={{
        width: 850,
        height: 850,
        background: "#f7f4ee",
        border: `3px solid ${colors.line}`,
        boxShadow: `20px 20px 0 ${colors.blue}`,
        transform: `scale(${0.88 + pop * 0.12})`,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          height: 74,
          background: colors.panel,
          borderBottom: `2px solid ${colors.line}`,
          color: colors.text,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 28px",
          fontSize: 24,
          fontWeight: 900,
          letterSpacing: 4,
          textTransform: "uppercase",
        }}
      >
        <span>{label}</span>
        <span style={{ color: colors.blue }}>Mintable</span>
      </div>
      <Img
        src={staticFile(src)}
        style={{
          width: "100%",
          height: "calc(100% - 74px)",
          objectFit: "contain",
          display: "block",
        }}
      />
    </div>
  );
};

const HookScene = ({
  day,
  theme,
}: Pick<BasePaintTeesPromoProps, "day" | "theme">) => {
  const frame = useCurrentFrame();
  const opacity = inOut(frame, 0, 170);
  const y = interpolate(frame, [0, 40], [36, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <Sequence durationInFrames={170}>
      <AbsoluteFill
        style={{
          opacity,
          padding: scenePadding,
          justifyContent: "center",
          transform: `translateY(${y}px)`,
        }}
      >
        <div style={eyebrow}>One artwork every day</div>
        <div style={{ ...title, marginTop: 34 }}>
          Today&apos;s BasePaint becomes a tee.
        </div>
        <div style={{ ...body, marginTop: 42, maxWidth: 780 }}>
          Day #{day}: {theme}. Mint-window merch, generated from the real
          artwork.
        </div>
      </AbsoluteFill>
    </Sequence>
  );
};

const ProductScene = ({
  day,
  theme,
  backMockupPath,
}: Pick<BasePaintTeesPromoProps, "day" | "theme" | "backMockupPath">) => {
  const frame = useCurrentFrame();
  const opacity = inOut(frame, 150, 390);

  return (
    <Sequence from={150} durationInFrames={240}>
      <AbsoluteFill
        style={{
          opacity,
          padding: scenePadding,
          justifyContent: "center",
          alignItems: "center",
          gap: 48,
        }}
      >
        <ProductFrame src={backMockupPath} label="Back design" delay={10} />
        <div style={{ textAlign: "center" }}>
          <div style={eyebrow}>BasePaint #{day} Tee</div>
          <div style={{ ...body, color: colors.text, marginTop: 18 }}>
            {theme}
          </div>
        </div>
      </AbsoluteFill>
    </Sequence>
  );
};

const CheckoutScene = ({
  frontMockupPath,
}: Pick<BasePaintTeesPromoProps, "frontMockupPath">) => {
  const frame = useCurrentFrame();
  const opacity = inOut(frame, 370, 600);
  const rows = ["Choose size", "Enter shipping", "Pay exact ETH on Base"];

  return (
    <Sequence from={370} durationInFrames={230}>
      <AbsoluteFill
        style={{
          opacity,
          padding: scenePadding,
          justifyContent: "center",
        }}
      >
        <div style={eyebrow}>Checkout in one flow</div>
        <div style={{ ...title, fontSize: 72, marginTop: 24 }}>
          Buy with ETH on Base.
        </div>
        <div
          style={{
            marginTop: 54,
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 28,
            alignItems: "stretch",
          }}
        >
          <div
            style={{
              background: colors.panel,
              border: `3px solid ${colors.line}`,
              padding: 34,
              boxShadow: `14px 14px 0 ${colors.deepBlue}`,
            }}
          >
            {rows.map((row, index) => {
              const active = frame > 410 + index * 36;

              return (
                <div
                  key={row}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 20,
                    padding: "24px 0",
                    borderBottom:
                      index === rows.length - 1
                        ? undefined
                        : `2px solid ${colors.line}`,
                    color: active ? colors.text : colors.muted,
                    fontSize: 32,
                    fontWeight: 900,
                  }}
                >
                  <span
                    style={{
                      width: 42,
                      height: 42,
                      background: active ? colors.blue : colors.line,
                      color: colors.bg,
                      display: "grid",
                      placeItems: "center",
                    }}
                  >
                    {index + 1}
                  </span>
                  {row}
                </div>
              );
            })}
          </div>
          <div
            style={{
              background: "#f7f4ee",
              border: `3px solid ${colors.line}`,
              padding: 26,
              display: "grid",
              placeItems: "center",
            }}
          >
            <Img
              src={staticFile(frontMockupPath)}
              style={{
                width: "100%",
                height: 540,
                objectFit: "contain",
              }}
            />
          </div>
        </div>
      </AbsoluteFill>
    </Sequence>
  );
};

const AgentScene = ({
  onBodyMockupPath,
  duoMockupPath,
}: Pick<BasePaintTeesPromoProps, "onBodyMockupPath" | "duoMockupPath">) => {
  const frame = useCurrentFrame();
  const opacity = inOut(frame, 580, 790);
  const items = ["Fetch art", "Build print files", "Sync product", "Queue fulfillment"];

  return (
    <Sequence from={580} durationInFrames={210}>
      <AbsoluteFill
        style={{
          opacity,
          padding: scenePadding,
          justifyContent: "center",
        }}
      >
        <div style={eyebrow}>The operator runs daily</div>
        <div style={{ ...title, fontSize: 70, marginTop: 24 }}>
          Art, product, payment, fulfillment.
        </div>
        <div
          style={{
            marginTop: 54,
            display: "grid",
            gridTemplateColumns: "0.92fr 1.08fr",
            gap: 34,
          }}
        >
          <div
            style={{
              background: "#f7f4ee",
              border: `3px solid ${colors.line}`,
              padding: 28,
              display: "grid",
              placeItems: "center",
            }}
          >
            <div style={{ position: "relative", width: "100%", height: 560 }}>
              <Img
                src={staticFile(onBodyMockupPath)}
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  width: "74%",
                  height: 420,
                  objectFit: "cover",
                  border: `3px solid ${colors.line}`,
                  boxShadow: `12px 12px 0 ${colors.deepBlue}`,
                }}
              />
              <Img
                src={staticFile(duoMockupPath)}
                style={{
                  position: "absolute",
                  right: 0,
                  bottom: 0,
                  width: "62%",
                  height: 350,
                  objectFit: "cover",
                  border: `3px solid ${colors.line}`,
                  boxShadow: `12px 12px 0 ${colors.blue}`,
                }}
              />
            </div>
          </div>
          <div style={{ display: "grid", gap: 22 }}>
            {items.map((item, index) => {
              const active = frame > 622 + index * 28;

              return (
                <div
                  key={item}
                  style={{
                    background: active ? colors.panel2 : colors.panel,
                    border: `3px solid ${active ? colors.blue : colors.line}`,
                    padding: "32px 34px",
                    fontSize: 32,
                    fontWeight: 900,
                    color: active ? colors.text : colors.muted,
                    boxShadow: active ? `10px 10px 0 ${colors.blue}` : undefined,
                  }}
                >
                  {item}
                </div>
              );
            })}
          </div>
        </div>
      </AbsoluteFill>
    </Sequence>
  );
};

const CtaScene = ({
  day,
  productUrl,
  duoMockupPath,
}: Pick<BasePaintTeesPromoProps, "day" | "productUrl" | "duoMockupPath">) => {
  const frame = useCurrentFrame();
  const opacity = inOut(frame, 770, 960);
  const scale = interpolate(frame, [770, 900], [1.05, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <Sequence from={770} durationInFrames={190}>
      <AbsoluteFill
        style={{
          opacity,
          padding: scenePadding,
          justifyContent: "center",
          alignItems: "center",
          textAlign: "center",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 120,
            background: colors.panel,
            border: `3px solid ${colors.line}`,
            boxShadow: `18px 18px 0 ${colors.blue}`,
          }}
        />
        <Img
          src={staticFile(duoMockupPath)}
          style={{
            width: 690,
            height: 690,
            objectFit: "cover",
            transform: `scale(${scale})`,
            zIndex: 1,
            border: `3px solid ${colors.line}`,
          }}
        />
        <div style={{ ...eyebrow, marginTop: 34, zIndex: 1 }}>
          BasePaint #{day} Tee
        </div>
        <div style={{ ...title, fontSize: 74, marginTop: 20, zIndex: 1 }}>
          Order before the daily window closes.
        </div>
        <div
          style={{
            marginTop: 42,
            background: colors.blue,
            color: colors.bg,
            padding: "24px 34px",
            fontSize: 34,
            fontWeight: 900,
            letterSpacing: 3,
            textTransform: "uppercase",
            zIndex: 1,
          }}
        >
          {productUrl}
        </div>
      </AbsoluteFill>
    </Sequence>
  );
};

export const BasePaintTeesPromo = ({
  day,
  theme,
  productUrl,
  frontMockupPath,
  backMockupPath,
  onBodyMockupPath,
  duoMockupPath,
}: BasePaintTeesPromoProps) => {
  return (
    <Shell>
      <Header day={day} />
      <HookScene day={day} theme={theme} />
      <ProductScene day={day} theme={theme} backMockupPath={backMockupPath} />
      <CheckoutScene frontMockupPath={frontMockupPath} />
      <AgentScene onBodyMockupPath={onBodyMockupPath} duoMockupPath={duoMockupPath} />
      <CtaScene day={day} productUrl={productUrl} duoMockupPath={duoMockupPath} />
    </Shell>
  );
};
