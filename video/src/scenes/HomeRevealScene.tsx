import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { PhoneFrame } from '../phone/PhoneFrame';
import { MockHomeScreen } from '../phone/MockHomeScreen';

export const HomeRevealScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const phoneIn = spring({ frame, fps, config: { damping: 18 } });
  const captionOpacity = interpolate(frame, [30, 50], [0, 1], { extrapolateRight: 'clamp' });
  const highlight = frame > 90;

  return (
    <AbsoluteFill
      style={{
        background: 'linear-gradient(180deg, #1a1a1a 0%, #2c2c2c 100%)',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          opacity: captionOpacity,
          color: '#fff',
          fontSize: 40,
          fontWeight: 700,
          marginBottom: 24,
          textAlign: 'center',
          maxWidth: 900,
          letterSpacing: -1,
        }}
      >
        Same app, three different farmers.
      </div>
      <div
        style={{
          transform: `translateY(${interpolate(phoneIn, [0, 1], [60, 0])}px) scale(${interpolate(phoneIn, [0, 1], [0.95, 1])})`,
          opacity: phoneIn,
        }}
      >
        <PhoneFrame statusBarTint="dark">
          <MockHomeScreen highlightFarmerAgent={highlight} />
        </PhoneFrame>
      </div>
    </AbsoluteFill>
  );
};
