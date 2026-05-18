import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';

export const ArchitectureScene: React.FC = () => {
  const frame = useCurrentFrame();
  const titleFade = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: 'clamp' });
  const tier1 = interpolate(frame, [15, 30], [0, 1], { extrapolateRight: 'clamp' });
  const tier2 = interpolate(frame, [45, 60], [0, 1], { extrapolateRight: 'clamp' });
  const tier3 = interpolate(frame, [75, 90], [0, 1], { extrapolateRight: 'clamp' });
  const noteFade = interpolate(frame, [105, 130], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#0a0a0a',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 80,
      }}
    >
      <div style={{ maxWidth: 950, color: '#fff' }}>
        <div
          style={{
            opacity: titleFade,
            fontSize: 32,
            color: '#bdbdbd',
            textAlign: 'center',
            marginBottom: 48,
          }}
        >
          Three-tier local-first inference
        </div>

        <Tier
          opacity={tier1}
          accent="#a5d6a7"
          name="📱 Phone"
          engine="Gemma 4 E2B · LiteRT-LM"
          note="Offline. PLE externalised so it fits 2–3 GB RAM."
        />
        <Connector />
        <Tier
          opacity={tier2}
          accent="#90caf9"
          name="🛰 Cooperative Hub"
          engine="Gemma 4 E2B / E4B / 27B · Ollama"
          note="LAN only. Bigger model. No internet."
        />
        <Connector />
        <Tier
          opacity={tier3}
          accent="#ce93d8"
          name="☁️ Cloud"
          engine="Gemma 4 27B"
          note="When internet is available. Optional."
        />

        <div
          style={{
            opacity: noteFade,
            marginTop: 36,
            fontSize: 18,
            color: '#9e9e9e',
            textAlign: 'center',
            lineHeight: 1.45,
          }}
        >
          One file (<code style={{ color: '#fff' }}>InferenceRouter.ts</code>) probes every tier in
          parallel, picks the highest available, falls back automatically on error.
        </div>
      </div>
    </AbsoluteFill>
  );
};

const Tier: React.FC<{
  opacity: number;
  accent: string;
  name: string;
  engine: string;
  note: string;
}> = ({ opacity, accent, name, engine, note }) => (
  <div
    style={{
      opacity,
      border: `2px solid ${accent}`,
      borderRadius: 16,
      padding: '20px 28px',
      display: 'flex',
      alignItems: 'center',
      gap: 24,
    }}
  >
    <div style={{ fontSize: 26, fontWeight: 700, color: accent, minWidth: 280 }}>{name}</div>
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 20, color: '#fff', fontWeight: 600 }}>{engine}</div>
      <div style={{ fontSize: 16, color: '#9e9e9e', marginTop: 4 }}>{note}</div>
    </div>
  </div>
);

const Connector: React.FC = () => (
  <div style={{ height: 16, borderLeft: '2px dashed #444', marginLeft: 50 }} />
);
