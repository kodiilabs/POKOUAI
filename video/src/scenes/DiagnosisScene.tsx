import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { PhoneFrame } from '../phone/PhoneFrame';
import { MockResultScreen } from '../phone/MockResultScreen';

export const DiagnosisScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const captionFade = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: 'clamp' });
  const phoneIn = spring({ frame: frame - 8, fps, config: { damping: 18 } });

  // Cycle which level the badge reflects across the scene.
  const cycle = Math.floor(frame / 60) % 3;
  const level = (['novice', 'practitioner', 'expert'] as const)[cycle]!;

  return (
    <AbsoluteFill
      style={{
        background: 'linear-gradient(180deg, #1a1a1a 0%, #2c2c2c 100%)',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
        <div style={{ opacity: captionFade, textAlign: 'center', color: '#fff' }}>
          <div
            style={{
              fontSize: 18,
              color: '#9e9e9e',
              textTransform: 'uppercase',
              letterSpacing: 2,
            }}
          >
            Real diagnosis · hub-routed
          </div>
          <div
            style={{
              fontSize: 36,
              fontWeight: 700,
              marginTop: 4,
              letterSpacing: -1,
              maxWidth: 900,
            }}
          >
            Same flow. The Adapted-for badge follows the farmer.
          </div>
        </div>
        <div
          style={{
            transform: `translateY(${interpolate(phoneIn, [0, 1], [60, 0])}px) scale(${interpolate(phoneIn, [0, 1], [0.96, 1])})`,
            opacity: phoneIn,
          }}
        >
          <PhoneFrame statusBarTint="dark">
            <MockResultScreen level={level} />
          </PhoneFrame>
        </div>
      </div>
    </AbsoluteFill>
  );
};
