import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';

export const OutroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const line1 = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: 'clamp' });
  const line2 = interpolate(frame, [25, 45], [0, 1], { extrapolateRight: 'clamp' });
  const line3 = interpolate(frame, [55, 80], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill
      style={{
        background: 'linear-gradient(180deg, #1b5e20 0%, #0a0a0a 100%)',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 80,
      }}
    >
      <div style={{ textAlign: 'center', color: '#fff', maxWidth: 1000 }}>
        <div style={{ opacity: line1, fontSize: 32, color: '#c8e6c9', marginBottom: 24 }}>
          Honest build. Real next step.
        </div>
        <div
          style={{
            opacity: line2,
            fontSize: 48,
            fontWeight: 700,
            letterSpacing: -1,
            lineHeight: 1.2,
            marginBottom: 32,
          }}
        >
          Partnering with Fair Trade Côte d'Ivoire.
          <br />
          First cooperative pilot starts next month.
        </div>
        <div
          style={{
            opacity: line3,
            fontSize: 22,
            color: '#a5d6a7',
            lineHeight: 1.5,
          }}
        >
          Field photos → better fine-tune → real Day-7 outcomes → the Farmer Agent's
          <br />
          behavioural skill model becomes the next milestone, not a slide.
        </div>
      </div>
    </AbsoluteFill>
  );
};
