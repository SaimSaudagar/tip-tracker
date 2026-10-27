import type { ComponentRef, RefObject } from 'react';
import type { View } from 'react-native';

/** Whether a view can be shared as a picture here (the web version shares text instead). */
export const imageShareSupported = false;

export async function shareViewAsImage(
  _view: RefObject<ComponentRef<typeof View> | null>,
  _width: number,
  _height: number,
  _title: string,
) {
  throw new Error('Sharing pictures isn’t available in the browser.');
}
