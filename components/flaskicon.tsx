import React, { useEffect } from 'react';
import Svg, { Path, Circle } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const LabFlaskIcon = () => {
  // 🔴 Red Flask Bubble Y-offsets
  const red1Y = useSharedValue(0);
  const red2Y = useSharedValue(0);
  const red3Y = useSharedValue(0);

  // 🟡 Yellow Flask Outside Bubble Y-offsets
  const yellow1Y = useSharedValue(0);
  const yellow2Y = useSharedValue(0);

  // 🟡 Yellow Flask Inside Bubble Opacity/Float
  const yellowInside1Y = useSharedValue(0);
  const yellowInside2Y = useSharedValue(0);

  useEffect(() => {
    const animate = (val: any, offset: number, duration: number) => {
      val.value = withRepeat(
        withTiming(-offset, {
          duration,
          easing: Easing.inOut(Easing.ease),
        }),
        -1,
        true
      );
    };

    animate(red1Y, 12, 2000);
    animate(red2Y, 15, 1800);
    animate(red3Y, 18, 2200);

    animate(yellow1Y, 10, 2100);
    animate(yellow2Y, 13, 1900);

    animate(yellowInside1Y, 2, 3000);
    animate(yellowInside2Y, 1.5, 2500);
  }, []);

  const bubbleProps = (baseY: number, sharedVal: any) =>
    useAnimatedProps(() => ({
      cy: baseY + sharedVal.value,
    }));

  return (
    <Svg width={200} height={200} viewBox="0 -20 128 128" fill="none">
      {/* Yellow Flask */}
      <Path
        d="M40 20h10v35l-15 30a10 10 0 0 0 8.7 15h12.6a10 10 0 0 0 8.7-15l-15-30V20h10"
        fill="#FFCC00"
        stroke="#BFDFF6"
        strokeWidth={4}
      />

      {/* Red Flask */}
      <Path
        d="M75 15h10v25l10 20a15 15 0 0 1-13.5 22H78.5a15 15 0 0 1-13.5-22l10-20V15h10"
        fill="#EF4444"
        stroke="#BFDFF6"
        strokeWidth={4}
      />

      {/* Red Flask Outside Bubbles */}
      <AnimatedCircle cx={85} r={4} fill="#EF4444" animatedProps={bubbleProps(10, red1Y)} />
      <AnimatedCircle cx={83} r={3} fill="#EF4444" animatedProps={bubbleProps(5, red2Y)} />
      <AnimatedCircle cx={87} r={2.5} fill="#EF4444" animatedProps={bubbleProps(18, red3Y)} />

      {/* Yellow Flask Outside Bubbles */}
      <AnimatedCircle cx={45} r={3.5} fill="#FFCC00" animatedProps={bubbleProps(12, yellow1Y)} />
      <AnimatedCircle cx={50} r={2.5} fill="#FFCC00" animatedProps={bubbleProps(18, yellow2Y)} />

      {/* Yellow Flask Inside Bubbles */}
      <AnimatedCircle
        cx={50}
        r={2}
        fill="#fff7aa"
        animatedProps={bubbleProps(72, yellowInside1Y)}
      />
      <AnimatedCircle
        cx={47}
        r={1.5}
        fill="#fff7aa"
        animatedProps={bubbleProps(78, yellowInside2Y)}
      />
    </Svg>
  );
};

export default LabFlaskIcon;
