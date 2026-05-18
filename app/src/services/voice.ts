import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
} from 'expo-audio';
import type { AudioPlayer, AudioRecorder } from 'expo-audio';

// expo-audio 55 exports AudioRecorder/AudioPlayer as type-only from its root
// (`export type * from './AudioModule.types'`). The runtime classes live on
// AudioModule — the same path the library uses internally, see ExpoAudio.js
// where it calls `AudioModule.AudioPlayer.prototype.replace`, etc.
// Using the top-level imports as values throws "not a constructor" at runtime.
const AudioRecorderCtor = (
  AudioModule as unknown as {
    AudioRecorder: new (preset: unknown) => AudioRecorder;
  }
).AudioRecorder;
const AudioPlayerCtor = (
  AudioModule as unknown as {
    AudioPlayer: new (source: { uri: string }) => AudioPlayer;
  }
).AudioPlayer;

let activeRecorder: AudioRecorder | null = null;
let activePlayer: AudioPlayer | null = null;

export interface RecordingHandle {
  stop: () => Promise<{ uri: string; durationMs: number }>;
  cancel: () => Promise<void>;
}

export async function ensureMicPermission(): Promise<boolean> {
  try {
    const { granted } = await AudioModule.requestRecordingPermissionsAsync();
    console.log('[voice] mic permission granted:', granted);
    if (!granted) return false;
    await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
    return true;
  } catch (e) {
    console.error('[voice] permission/mode error:', e);
    return false;
  }
}

export async function startRecording(): Promise<RecordingHandle> {
  if (activeRecorder) throw new Error('recording already in progress');
  if (!(await ensureMicPermission())) throw new Error('microphone permission denied');

  console.log('[voice] startRecording');
  const recorder = new AudioRecorderCtor(RecordingPresets.LOW_QUALITY);
  await recorder.prepareToRecordAsync();
  recorder.record();
  activeRecorder = recorder;
  const startedAt = Date.now();

  return {
    stop: async () => {
      await recorder.stop();
      const uri = recorder.uri;
      activeRecorder = null;
      if (!uri) throw new Error('no recording uri');
      return { uri, durationMs: Date.now() - startedAt };
    },
    cancel: async () => {
      try {
        await recorder.stop();
      } catch {
        /* may already be stopped */
      }
      activeRecorder = null;
    },
  };
}

export async function play(uri: string): Promise<void> {
  await stopPlayback();
  const player = new AudioPlayerCtor({ uri });
  activePlayer = player;
  player.addListener('playbackStatusUpdate', (status) => {
    if (status.didJustFinish) {
      try {
        player.release();
      } catch {
        /* already released */
      }
      if (activePlayer === player) activePlayer = null;
    }
  });
  player.play();
}

export async function stopPlayback(): Promise<void> {
  if (!activePlayer) return;
  try {
    activePlayer.pause();
    activePlayer.release();
  } catch {
    /* already released */
  }
  activePlayer = null;
}
