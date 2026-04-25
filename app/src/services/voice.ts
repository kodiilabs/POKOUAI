import { Audio } from 'expo-av';

let activeRecording: Audio.Recording | null = null;
let activeSound: Audio.Sound | null = null;

export interface RecordingHandle {
  stop: () => Promise<{ uri: string; durationMs: number }>;
  cancel: () => Promise<void>;
}

export async function ensureMicPermission(): Promise<boolean> {
  const { granted } = await Audio.requestPermissionsAsync();
  if (!granted) return false;
  await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
  return true;
}

export async function startRecording(): Promise<RecordingHandle> {
  if (activeRecording) throw new Error('recording already in progress');
  if (!(await ensureMicPermission())) throw new Error('microphone permission denied');

  const recording = new Audio.Recording();
  await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.LOW_QUALITY);
  await recording.startAsync();
  activeRecording = recording;

  return {
    stop: async () => {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      const status = await recording.getStatusAsync();
      activeRecording = null;
      if (!uri) throw new Error('no recording uri');
      return { uri, durationMs: status.durationMillis ?? 0 };
    },
    cancel: async () => {
      try {
        await recording.stopAndUnloadAsync();
      } catch {
        /* may already be unloaded */
      }
      activeRecording = null;
    },
  };
}

export async function play(uri: string): Promise<void> {
  await stopPlayback();
  const { sound } = await Audio.Sound.createAsync({ uri }, { shouldPlay: true });
  activeSound = sound;
  sound.setOnPlaybackStatusUpdate((s) => {
    if (s.isLoaded && s.didJustFinish) {
      sound.unloadAsync().catch(() => {});
      if (activeSound === sound) activeSound = null;
    }
  });
}

export async function stopPlayback(): Promise<void> {
  if (!activeSound) return;
  try {
    await activeSound.stopAsync();
    await activeSound.unloadAsync();
  } catch {
    /* already stopped */
  }
  activeSound = null;
}
