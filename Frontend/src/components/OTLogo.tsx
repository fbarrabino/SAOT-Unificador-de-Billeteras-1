import React from 'react';
import Svg, { Path, Circle } from 'react-native-svg';

type Props = {
  size?: number;
  color?: string;
};

// Logo "OT" de la marca dibujado en SVG (escalable y con color configurable).
export function OTLogo({ size = 60, color = '#06121A' }: Props) {
  const height = size;
  const width = (size * 208) / 164;
  return (
    <Svg width={width} height={height} viewBox="170 148 208 164">
      <Path d="M323 156 L229 264 L276 228 Z" fill={color} />
      <Path d="M323 156 L372 241 L302 210 Z" fill={color} />
      <Circle cx={197} cy={283} r={18.5} fill="none" stroke={color} strokeWidth={9} />
      <Path d="M257 262 H306 V272 H286.5 V301 H276.5 V272 H257 Z" fill={color} />
    </Svg>
  );
}
