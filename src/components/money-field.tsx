import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Props = Omit<TextInputProps, 'style'> & {
  label: string;
  /** Shown before the input, e.g. "$". */
  prefix?: string;
  /** Shown after the input, e.g. "hrs" or "%". */
  suffix?: string;
  hint?: string;
  error?: string | null;
};

/** A labeled number field sized for quick thumb entry. */
export function MoneyField({ label, prefix, suffix, hint, error, ...inputProps }: Props) {
  const theme = useTheme();

  return (
    <View style={styles.wrapper}>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
      <View
        style={[
          styles.box,
          { backgroundColor: theme.backgroundElement, borderColor: error ? theme.danger : 'transparent' },
        ]}>
        {prefix ? <ThemedText style={styles.affix}>{prefix}</ThemedText> : null}
        <TextInput
          inputMode="decimal"
          keyboardType="decimal-pad"
          placeholder="0"
          placeholderTextColor={theme.textSecondary}
          selectTextOnFocus
          accessibilityLabel={label}
          style={[styles.input, { color: theme.text }]}
          {...inputProps}
        />
        {suffix ? (
          <ThemedText type="small" themeColor="textSecondary">
            {suffix}
          </ThemedText>
        ) : null}
      </View>
      {error ? (
        <ThemedText type="small" style={{ color: theme.danger }}>
          {error}
        </ThemedText>
      ) : hint ? (
        <ThemedText type="small" themeColor="textSecondary">
          {hint}
        </ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    minWidth: 0, // lets two fields share a row; web inputs otherwise keep a ~270px intrinsic width
    gap: Spacing.one,
  },
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Spacing.three,
    borderWidth: 2,
    paddingHorizontal: Spacing.three,
    minHeight: 56,
    gap: Spacing.one,
  },
  affix: {
    fontSize: 22,
  },
  input: {
    flex: 1,
    minWidth: 0,
    fontSize: 22,
    fontWeight: 600,
    paddingVertical: Spacing.two,
  },
});
