import { useWindowDimensions } from 'react-native';

/** Window width from which dashboards use two columns: iPad landscape, the 13" iPad and big Split View panes. */
export const WIDE_LAYOUT_MIN_WIDTH = 900;

/** True when the window is wide enough for two columns. Follows Split View and Stage Manager resizes. */
export function useWideLayout(): boolean {
  return useWindowDimensions().width >= WIDE_LAYOUT_MIN_WIDTH;
}
