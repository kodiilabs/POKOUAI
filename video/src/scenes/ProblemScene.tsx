import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';

export const ProblemScene: React.FC = () => {
  const frame = useCurrentFrame();
  const fade = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: 'clamp' });
  const stat1 = interpolate(frame, [10, 30], [0, 1], { extrapolateRight: 'clamp' });
  const stat2 = interpolate(frame, [40, 60], [0, 1], { extrapolateRight: 'clamp' });
  const stat3 = interpolate(frame, [70, 90], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#0a0a0a',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 80,
      }}
    >
      <div style={{ opacity: fade, textAlign: 'center', color: '#fff', maxWidth: 900 }}>
        <div style={{ fontSize: 32, fontWeight: 600, marginBottom: 50, color: '#bdbdbd' }}>
          The problem
        </div>
        <Stat opacity={stat1} number="30–40%" label="of harvest lost to preventable disease" />
        <Stat opacity={stat2} number="1 per 1,000" label="farmers reach an extension agent" />
        <Stat
          opacity={stat3}
          number="$50"
          label="Android with no internet — the real target device"
        />
      </div>
    </AbsoluteFill>
  );
};

const Stat: React.FC<{ opacity: number; number: string; label: string }> = ({
  opacity,
  number,
  label,
}) => (
  <div style={{ opacity, marginBottom: 32 }}>
    <div style={{ fontSize: 56, fontWeight: 700, color: '#a5d6a7', letterSpacing: -1 }}>
      {number}
    </div>
    <div style={{ fontSize: 22, color: '#9e9e9e', marginTop: 4 }}>{label}</div>
  </div>
);
