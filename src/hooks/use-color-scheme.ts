import { useColorScheme as useSystemColorScheme } from 'react-native';

import { useAppearancePreference } from '@/lib/appearance';

/** The phone's light or dark mode, unless the user picked one in Settings. */
export function useColorScheme() {
  const system = useSystemColorScheme();
  const preference = useAppearancePreference();
  return preference === 'system' ? system : preference;
}
