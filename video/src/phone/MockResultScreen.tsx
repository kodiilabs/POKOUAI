import React from 'react';

type Level = 'novice' | 'practitioner' | 'expert';

const LEVEL_LABEL: Record<Level, string> = {
  novice: 'Novice',
  practitioner: 'Practitioner',
  expert: 'Expert',
};

export const MockResultScreen: React.FC<{ level: Level }> = ({ level }) => {
  return (
    <div style={{ flex: 1, backgroundColor: '#fafafa', padding: 14, overflow: 'hidden' }}>
      <div
        style={{
          height: 200,
          backgroundColor: '#3e2723',
          borderRadius: 12,
          marginBottom: 12,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        <span style={{ fontSize: 92 }}>🍫</span>
        <span
          style={{
            position: 'absolute',
            bottom: 8,
            left: 8,
            backgroundColor: 'rgba(0,0,0,0.6)',
            color: '#fff',
            fontSize: 10,
            padding: '3px 7px',
            borderRadius: 5,
          }}
        >
          Cocoa pod · forest-edge plot
        </span>
      </div>

      <div style={{ fontSize: 20, fontWeight: 700, color: '#1b1b1b', marginBottom: 8 }}>
        Black pod
      </div>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
        <Pill bg="#2e7d32">Confidence: 91% · High</Pill>
        <Pill bg="#263238">🛰 Ollama · hub</Pill>
        <Pill bg="#6a1b9a">🧠 Adapted for {LEVEL_LABEL[level]}</Pill>
      </div>

      <Card>
        <CardTitle>Symptoms</CardTitle>
        <CardBullet>Dark brown patches spreading from the base of the pod</CardBullet>
        <CardBullet>Patch surface is firm, not soft or wet</CardBullet>
      </Card>

      <Card>
        <CardTitle>Treatment</CardTitle>
        <CardBullet>Remove the infected pod with a clean knife. Bury it away from the tree.</CardBullet>
        <CardBullet>Spray copper fungicide on the tree within 48 hours.</CardBullet>
      </Card>

      <Card>
        <CardTitle>🔬 Test your theory</CardTitle>
        <div style={{ fontSize: 11, color: '#1565c0' }}>
          What caused this? Tap a cause → we'll check back in 7 days.
        </div>
      </Card>
    </div>
  );
};

const Pill: React.FC<{ bg: string; children: React.ReactNode }> = ({ bg, children }) => (
  <div
    style={{
      backgroundColor: bg,
      color: '#fff',
      padding: '4px 10px',
      borderRadius: 8,
      fontSize: 10,
      fontWeight: 600,
    }}
  >
    {children}
  </div>
);

const Card: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div
    style={{
      backgroundColor: '#fff',
      borderRadius: 12,
      padding: 12,
      marginBottom: 8,
    }}
  >
    {children}
  </div>
);

const CardTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div
    style={{
      fontSize: 11,
      fontWeight: 700,
      color: '#1b5e20',
      textTransform: 'uppercase',
      marginBottom: 6,
      letterSpacing: 0.5,
    }}
  >
    {children}
  </div>
);

const CardBullet: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ fontSize: 12, color: '#222', marginBottom: 4, lineHeight: 1.4 }}>
    · {children}
  </div>
);
