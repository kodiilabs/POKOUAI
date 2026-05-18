import React from 'react';

interface Props {
  children: React.ReactNode;
  statusBarTint?: 'light' | 'dark';
}

export const PHONE_SCREEN_W = 360;
export const PHONE_SCREEN_H = 780;
const FRAME_PADDING = 14;

export const PhoneFrame: React.FC<Props> = ({ children, statusBarTint = 'dark' }) => {
  const fg = statusBarTint === 'light' ? '#fff' : '#1b1b1b';

  return (
    <div
      style={{
        width: PHONE_SCREEN_W + FRAME_PADDING * 2,
        height: PHONE_SCREEN_H + FRAME_PADDING * 2,
        backgroundColor: '#0a0a0a',
        borderRadius: 56,
        padding: FRAME_PADDING,
        boxShadow: '0 30px 80px rgba(0,0,0,0.45), inset 0 0 0 2px #222',
        position: 'relative',
      }}
    >
      <div
        style={{
          width: PHONE_SCREEN_W,
          height: PHONE_SCREEN_H,
          backgroundColor: '#fafafa',
          borderRadius: 44,
          overflow: 'hidden',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <StatusBar fg={fg} />
        <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>{children}</div>
      </div>
      <DynamicIsland />
    </div>
  );
};

const StatusBar: React.FC<{ fg: string }> = ({ fg }) => (
  <div
    style={{
      height: 44,
      paddingLeft: 28,
      paddingRight: 28,
      paddingTop: 14,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      color: fg,
      fontSize: 14,
      fontWeight: 600,
    }}
  >
    <span>9:41</span>
    <span style={{ fontSize: 12, letterSpacing: 1 }}>● ● ● ●</span>
  </div>
);

const DynamicIsland: React.FC = () => (
  <div
    style={{
      position: 'absolute',
      top: 24,
      left: '50%',
      transform: 'translateX(-50%)',
      width: 96,
      height: 28,
      backgroundColor: '#000',
      borderRadius: 14,
    }}
  />
);
