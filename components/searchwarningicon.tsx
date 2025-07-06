import React, { useEffect } from 'react';
import { View } from 'react-native';
import Svg, { Rect, Path, Circle, Polygon, G } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';

const AnimatedG = Animated.createAnimatedComponent(G);

const SearchWarningIcon = () => {
   const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(15, {
        duration: 1000,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true
    );
  }, []);

  const animatedProps = useAnimatedProps(() => ({
    transform: [
      {
        rotate: `${rotation.value}deg`,
      },
    ],
    originX: 85,
    originY: 85,
  }));

  return (
    <View>
      <Svg width={128} height={128} viewBox="0 0 128 128" fill="none">
        {/* 📱 Phone Body */}
        <Rect
          x={20}
          y={5}
          rx={12}
          ry={12}
          width={70}
          height={110}
          fill="#D9D9D9"
          stroke="#2F4858"
          strokeWidth={4}
        />
        {/* Speaker */}
        <Rect x={45} y={12} width={20} height={4} rx={2} fill="#2F4858" />

        {/* Animated Magnifying Glass */}
        <AnimatedG animatedProps={animatedProps}>
          {/* Handle */}
          <Path
            d="M92 92 L105 105"
            stroke="#2F4858"
            strokeWidth={6}
            strokeLinecap="round"
          />
          {/* Lens */}
          <Circle
            cx={85}
            cy={85}
            r={20}
            fill="#FFFFFF"
            stroke="#2F4858"
            strokeWidth={4}
          />
          {/* ⚠️ Warning Symbol */}
          <Polygon points="85,67 98,95 72,95" fill="#FF3B30" />
          <Rect x={83} y={74} width={4} height={10} rx={1} fill="white" />
          <Circle cx={85} cy={88} r={2} fill="white" />
        </AnimatedG>
      </Svg>
    </View>
  );
};

export default SearchWarningIcon;

