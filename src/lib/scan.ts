/**
 * Reads the text in a photo on the device (Apple Vision on iOS, ML Kit on Android); nothing
 * is uploaded. The text-recognition module only exists in Tipbook's own builds, not in
 * Expo Go or on the web, so `scanSupported` is false there and screens offer manual entry.
 */
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

type TextExtractor = { isSupported: boolean; extractTextFromImage: (uri: string) => Promise<string[]> };

let extractor: TextExtractor | null = null;
try {
  // Loading throws when the native module is missing, as it is in Expo Go.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  extractor = require('expo-text-extractor') as TextExtractor;
} catch {
  extractor = null;
}

export const scanSupported = extractor?.isSupported === true;

/** Recognized text, as lines or blocks of lines. Throws if scanning isn't available. */
export async function recognizeText(photoUri: string): Promise<string[]> {
  if (!extractor || !scanSupported) throw new Error('Scanning isn’t available in this version of the app.');
  // Re-render the photo first: camera photos are often stored sideways with a rotation flag,
  // which text recognition ignores, and a smaller image reads faster.
  const image = await ImageManipulator.manipulate(photoUri).resize({ width: 1600 }).renderAsync();
  const upright = await image.saveAsync({ format: SaveFormat.JPEG, compress: 0.9 });
  return extractor.extractTextFromImage(upright.uri);
}
