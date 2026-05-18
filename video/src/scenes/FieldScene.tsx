import React from 'react';
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from 'remotion';

const FPS = 30;
export const FIELD_SCENE_FRAMES = 15 * FPS; // 15 s

interface Photo {
  src: string;
  credit: string;
  caption: string;
}

const PHOTOS: Photo[] = [
  {
    src: 'images/farmers_group.jpg',
    credit: '© KokoDZ · CC BY-SA 4.0',
    caption: 'Cocoa farmers, Côte d’Ivoire',
  },
  {
    src: 'images/farmer_field.jpg',
    credit: '© KokoDZ · CC BY-SA 4.0',
    caption: 'On a smallholder cocoa plot',
  },
  {
    src: 'images/woman_harvest.jpg',
    credit: '© SYLLA Cheick 225 · CC BY-SA 4.0',
    caption: 'Women carry the harvest',
  },
  {
    src: 'images/cocoa_worker.jpg',
    credit: '© Aman ADO · CC BY-SA 4.0',
    caption: 'Where PokouAI deploys next month',
  },
];

const PHOTO_FRAMES = FIELD_SCENE_FRAMES / PHOTOS.length; // 112.5 → 112
const CROSSFADE = 18;

export const FieldScene: React.FC = () => {
  const frame = useCurrentFrame();
  const headlineOpacity = interpolate(frame, [0, 18, FIELD_SCENE_FRAMES - 18, FIELD_SCENE_FRAMES], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      {PHOTOS.map((photo, i) => {
        const start = Math.round(i * PHOTO_FRAMES);
        const end = Math.round((i + 1) * PHOTO_FRAMES);
        const fadeIn = interpolate(frame, [start, start + CROSSFADE], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });
        const fadeOut = interpolate(frame, [end - CROSSFADE, end], [1, 0], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });
        const opacity = Math.min(fadeIn, fadeOut);
        const t = (frame - start) / (end - start);
        // Subtle Ken Burns — slow zoom from 1.0 to 1.08, slight horizontal pan
        const scale = 1 + 0.08 * Math.max(0, Math.min(1, t));
        const translateX = (i % 2 === 0 ? 1 : -1) * 18 * Math.max(0, Math.min(1, t));

        return (
          <AbsoluteFill key={photo.src} style={{ opacity }}>
            <Img
              src={staticFile(photo.src)}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transform: `scale(${scale}) translateX(${translateX}px)`,
              }}
            />
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background:
                  'linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0) 30%, rgba(0,0,0,0) 60%, rgba(0,0,0,0.75) 100%)',
              }}
            />
            <div
              style={{
                position: 'absolute',
                left: 60,
                right: 60,
                bottom: 120,
                color: '#fff',
                fontSize: 42,
                fontWeight: 700,
                lineHeight: 1.2,
                letterSpacing: -0.5,
                textShadow: '0 2px 10px rgba(0,0,0,0.7)',
              }}
            >
              {photo.caption}
            </div>
            <div
              style={{
                position: 'absolute',
                left: 60,
                bottom: 60,
                color: '#cfd8dc',
                fontSize: 18,
                fontWeight: 500,
                opacity: 0.85,
                letterSpacing: 0.3,
              }}
            >
              {photo.credit}
            </div>
          </AbsoluteFill>
        );
      })}

      <div
        style={{
          position: 'absolute',
          top: 80,
          left: 60,
          right: 60,
          opacity: headlineOpacity,
        }}
      >
        <div
          style={{
            fontSize: 28,
            fontWeight: 600,
            color: '#c8e6c9',
            letterSpacing: 2,
            textTransform: 'uppercase',
            marginBottom: 14,
            textShadow: '0 2px 8px rgba(0,0,0,0.7)',
          }}
        >
          Where this lands
        </div>
        <div
          style={{
            fontSize: 52,
            fontWeight: 700,
            color: '#fff',
            lineHeight: 1.15,
            letterSpacing: -0.5,
            textShadow: '0 2px 12px rgba(0,0,0,0.8)',
          }}
        >
          Partnering with Fair Trade
          <br />
          Côte d&rsquo;Ivoire.
        </div>
      </div>
    </AbsoluteFill>
  );
};
