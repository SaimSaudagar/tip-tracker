import { Stack, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { PRIVACY_POLICY, TERMS } from '@/constants/legal';
import { MaxContentWidth, Spacing } from '@/constants/theme';

export default function LegalScreen() {
  const { doc } = useLocalSearchParams<{ doc?: string }>();
  const content = doc === 'terms' ? TERMS : PRIVACY_POLICY;

  return (
    <ThemedView style={styles.screen}>
      <Stack.Screen options={{ title: content.title }} />
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content}>
        <ThemedText type="small" themeColor="textSecondary">
          Last updated {content.updated}
        </ThemedText>
        {content.sections.map((s) => (
          <View key={s.heading} style={styles.section}>
            <ThemedText type="smallBold" accessibilityRole="header">
              {s.heading}
            </ThemedText>
            <ThemedText type="small">{s.body}</ThemedText>
          </View>
        ))}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    padding: Spacing.three,
    paddingBottom: Spacing.six,
    gap: Spacing.three,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  section: {
    gap: Spacing.one,
  },
});
