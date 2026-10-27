import { StyleSheet, type StyleProp, type TextStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';

type Props = { children: string; style?: StyleProp<TextStyle> };

/**
 * The small all-caps label above a group. Screen readers get it as a heading, so it can be
 * jumped to, and hear it in normal case: all-caps text can be spelled out letter by letter.
 */
export function SectionTitle({ children, style }: Props) {
  return (
    <ThemedText
      type="smallBold"
      themeColor="textSecondary"
      accessibilityRole="header"
      accessibilityLabel={children}
      style={[styles.title, style]}>
      {children}
    </ThemedText>
  );
}

const styles = StyleSheet.create({
  title: {
    textTransform: 'uppercase',
  },
});
