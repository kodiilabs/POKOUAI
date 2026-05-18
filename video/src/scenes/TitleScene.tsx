import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';

export const TitleScene: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 15, 90, 120], [0, 1, 1, 0], {
    extrapolateRight: 'clamp',
  });
  const slideY = interpolate(frame, [0, 20], [30, 0], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill
      style={{
        background: 'linear-gradient(180deg, #1b5e20 0%, #0a0a0a 100%)',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 80,
      }}
    >
      <div
        style={{
          opacity,
          transform: `translateY(${slideY}px)`,
          textAlign: 'center',
          color: '#fff',
          maxWidth: 900,
        }}
      >
        <div style={{ fontSize: 88, marginBottom: 24 }}>🌱</div>
        <div style={{ fontSize: 80, fontWeight: 700, letterSpacing: -2 }}>PokouAI</div>
        <div style={{ fontSize: 30, marginTop: 16, color: '#c8e6c9' }}>
          Offline AI cocoa disease advisor
        </div>
        <div
          style={{
            fontSize: 22,
            marginTop: 40,
            color: '#a5d6a7',
            lineHeight: 1.4,
          }}
        >
          Built for the 5 million smallholder farmers in Côte d'Ivoire who
          <br />
          can't always reach an agronomist or a 4G signal.
        </div>
      </div>
    </AbsoluteFill>
  );
};
