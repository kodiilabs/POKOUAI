import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system/legacy';

/** Cap inference inputs at 1024px on the longest side. Gemma 4's vision
 *  encoder normalizes to 896×896 internally and emits a fixed 256 image
 *  tokens regardless of input resolution — feeding it a 12MP iPhone photo
 *  wastes RAM during JPEG decode without gaining accuracy.
 *
 *  Keeps the original file untouched: the resized copy goes to a cache
 *  directory and is returned as a new URI. */
const MAX_DIM = 1024;
const JPEG_QUALITY = 0.85;
/** Skip rework if file already small (~<350KB). Avoids re-encoding the
 *  resized output on retries. */
const SKIP_BYTES = 350_000;

export async function prepareForInference(uri: string): Promise<string> {
  try {
    const info = await FileSystem.getInfoAsync(uri);
    if (info.exists && info.size !== undefined && info.size < SKIP_BYTES) {
      return uri;
    }
    const out = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: MAX_DIM } }],
      { compress: JPEG_QUALITY, format: ImageManipulator.SaveFormat.JPEG },
    );
    const sizeKB = info.exists ? (info.size ?? 0) / 1024 | 0 : 0;
    console.log(`[imagePrep] ${sizeKB}KB → resized 1024w (${uri.slice(-30)})`);
    return out.uri;
  } catch (e) {
    console.warn('[imagePrep] resize failed, using original', e);
    return uri;
  }
}
