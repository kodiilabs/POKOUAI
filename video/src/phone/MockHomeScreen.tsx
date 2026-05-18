import React from 'react';

export const MockHomeScreen: React.FC<{ highlightFarmerAgent?: boolean }> = ({
  highlightFarmerAgent = false,
}) => {
  return (
    <div style={{ flex: 1, backgroundColor: '#f1f8e9', padding: 14 }}>
      <div
        style={{
          display: 'flex',
          gap: 6,
          justifyContent: 'flex-end',
          marginBottom: 12,
        }}
      >
        <Badge label="📱 Local" color="#1b5e20" />
        <Badge label="☁️ Online" color="#1565c0" />
      </div>

      <PrimaryTile icon="📷" title="Take photo" color="#1b5e20" />
      <PrimaryTile icon="🖼️" title="Choose photo" color="#33691e" />

      <SectionLabel>Recent</SectionLabel>
      <RecentRow disease="Black pod" confidence="91%" tier="🛰 hub" />

      <SectionLabel>Learn</SectionLabel>
      <Row>
        <SmallTile icon="📅" label="Calendar" />
        <SmallTile icon="🧠" label="Quiz" />
      </Row>

      <IntelTile />
      <GroupTile />
      <FarmerAgentTile highlighted={highlightFarmerAgent} />

      <Row>
        <SmallTile icon="📘" label="Log" />
        <SmallTile icon="⚙️" label="Settings" />
      </Row>
    </div>
  );
};

const Badge: React.FC<{ label: string; color: string }> = ({ label, color }) => (
  <div
    style={{
      backgroundColor: color,
      color: '#fff',
      padding: '3px 8px',
      borderRadius: 8,
      fontSize: 10,
      fontWeight: 600,
    }}
  >
    {label}
  </div>
);

const PrimaryTile: React.FC<{ icon: string; title: string; color: string }> = ({
  icon,
  title,
  color,
}) => (
  <div
    style={{
      backgroundColor: color,
      borderRadius: 14,
      padding: 18,
      marginBottom: 8,
      color: '#fff',
      fontWeight: 700,
      fontSize: 18,
      display: 'flex',
      alignItems: 'center',
      gap: 10,
    }}
  >
    <span style={{ fontSize: 26 }}>{icon}</span>
    {title}
  </div>
);

const SectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div
    style={{
      fontSize: 11,
      fontWeight: 700,
      color: '#1b5e20',
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginTop: 14,
      marginBottom: 6,
    }}
  >
    {children}
  </div>
);

const RecentRow: React.FC<{ disease: string; confidence: string; tier: string }> = ({
  disease,
  confidence,
  tier,
}) => (
  <div
    style={{
      backgroundColor: '#fff',
      borderRadius: 10,
      padding: 12,
      display: 'flex',
      gap: 10,
      alignItems: 'center',
    }}
  >
    <div
      style={{
        width: 40,
        height: 40,
        backgroundColor: '#3e2723',
        borderRadius: 8,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 22,
      }}
    >
      🍫
    </div>
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: '#1b1b1b' }}>{disease}</div>
      <div style={{ fontSize: 11, color: '#666' }}>
        {confidence} · {tier}
      </div>
    </div>
  </div>
);

const Row: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>{children}</div>
);

const SmallTile: React.FC<{ icon: string; label: string }> = ({ icon, label }) => (
  <div
    style={{
      flex: 1,
      backgroundColor: '#fff',
      padding: 14,
      borderRadius: 12,
      textAlign: 'center',
      color: '#1b5e20',
      fontWeight: 600,
      fontSize: 13,
    }}
  >
    <div style={{ fontSize: 22, marginBottom: 4 }}>{icon}</div>
    {label}
  </div>
);

const IntelTile: React.FC = () => (
  <div
    style={{
      backgroundColor: '#1565c0',
      borderRadius: 14,
      padding: 14,
      marginTop: 12,
      color: '#fff',
    }}
  >
    <div style={{ fontWeight: 700, fontSize: 14 }}>🔬 My farm intelligence</div>
    <div style={{ fontSize: 11, color: '#bbdefb', marginTop: 2 }}>
      Hypothesis, follow-ups, lessons
    </div>
  </div>
);

const GroupTile: React.FC = () => (
  <div
    style={{
      backgroundColor: '#00838f',
      borderRadius: 14,
      padding: 14,
      marginTop: 8,
      color: '#fff',
    }}
  >
    <div style={{ fontWeight: 700, fontSize: 14 }}>👥 Group mode</div>
    <div style={{ fontSize: 11, color: '#b2ebf2', marginTop: 2 }}>For extension workers</div>
  </div>
);

const FarmerAgentTile: React.FC<{ highlighted: boolean }> = ({ highlighted }) => (
  <div
    style={{
      backgroundColor: '#6a1b9a',
      borderRadius: 14,
      padding: 14,
      marginTop: 8,
      color: '#fff',
      boxShadow: highlighted ? '0 0 0 4px #ce93d8' : 'none',
      transition: 'box-shadow 200ms',
    }}
  >
    <div style={{ fontWeight: 700, fontSize: 14 }}>🧠 Farmer Agent</div>
    <div style={{ fontSize: 11, color: '#e1bee7', marginTop: 2 }}>
      How the app adapts to each farmer
    </div>
  </div>
);
