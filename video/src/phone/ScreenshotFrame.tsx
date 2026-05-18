import React from 'react';
import { AbsoluteFill } from 'remotion';
import { PhoneFrame } from './PhoneFrame';

interface Props {
  children: React.ReactNode;
  background?: string;
}

// Renders the phone frame centred on a 1080×1920 portrait canvas, scaled up
// to fill the height with a small margin. Used by gen-screenshots.mjs to
// produce single PNG stills.
export const ScreenshotFrame: React.FC<Props> = ({
  children,
  background = 'linear-gradient(180deg, #f1f8e9 0%, #c8e6c9 100%)',
}) => {
  return (
    <AbsoluteFill
      style={{
        background,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* PhoneFrame native size is 388×808. At 2.3x it's 892×1858 — fits in
          the 1920 portrait canvas with ~30 px breathing room top/bottom. */}
      <div style={{ transform: 'scale(2.3)', transformOrigin: 'center' }}>
        <PhoneFrame>{children}</PhoneFrame>
      </div>
    </AbsoluteFill>
  );
};
