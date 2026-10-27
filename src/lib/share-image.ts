import type { ComponentRef, RefObject } from 'react';
import type { View } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';

/** Whether a view can be shared as a picture here (the web version shares text instead). */
export const imageShareSupported = true;

/** Saves `view` as a PNG of `width` × `height` pixels and opens the share sheet with it. */
export async function shareViewAsImage(
  view: RefObject<ComponentRef<typeof View> | null>,
  width: number,
  height: number,
  title: string,
) {
  const uri = await captureRef(view, { format: 'png', width, height, result: 'tmpfile' });
  await Sharing.shareAsync(uri, { mimeType: 'image/png', UTI: 'public.png', dialogTitle: title });
}
