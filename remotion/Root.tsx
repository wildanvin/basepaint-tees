import { Composition } from "remotion";
import { BasePaintTeesPromo } from "./BasePaintTeesPromo";

export const RemotionRoot = () => {
  return (
    <Composition
      id="BasePaintTeesPromo"
      component={BasePaintTeesPromo}
      durationInFrames={960}
      fps={30}
      width={1080}
      height={1920}
      defaultProps={{
        day: 1056,
        theme: "Ancient Cave Paintings II",
        productUrl: "basepaint-tees.com",
        frontMockupPath: "remotion/basepaint-1056/mockup-front.jpg",
        backMockupPath: "remotion/basepaint-1056/mockup-back.jpg",
        onBodyMockupPath: "remotion/basepaint-1056/mockup-on-body.jpg",
        duoMockupPath: "remotion/basepaint-1056/mockup-duo.jpg",
      }}
    />
  );
};
