import type { ComponentRef, Ref } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { NumberFont } from '@/constants/theme';
import { t } from '@/i18n';
import type { WeekCard as Card } from '@/lib/week-card';

/** Width and height of the card on screen; it's saved at 3x for a 1080 × 1350 picture (Instagram's 4:5). */
export const WEEK_CARD_SIZE = { width: 360, height: 450 } as const;

// Fixed brand colors: the picture looks the same whatever the phone's light or dark setting.
const GREEN = '#0B7A4B';
const DEEP = '#075C38';
const MINT = '#CFEFDF';

/** The "my week" picture people share. It draws its own background, so it reads well anywhere it's posted. */
export function WeekCard({ card, ref }: { card: Card; ref?: Ref<ComponentRef<typeof View>> }) {
  return (
    <View
      ref={ref}
      collapsable={false}
      style={styles.card}
      accessible
      accessibilityLabel={t('Picture to share: {text}', { text: card.text })}>
      <View style={styles.header}>
        <Text style={styles.kicker} maxFontSizeMultiplier={1}>
          {t('MY WEEK')}
        </Text>
        <Text style={styles.range} maxFontSizeMultiplier={1}>
          {card.range}
        </Text>
      </View>

      <View>
        <Text style={styles.label} maxFontSizeMultiplier={1}>
          {t('Tips')}
        </Text>
        <Text style={styles.big} maxFontSizeMultiplier={1} adjustsFontSizeToFit numberOfLines={1}>
          {card.tips}
        </Text>
      </View>

      <View style={styles.stats}>
        <Stat label={t('Earned')} value={card.earned} />
        <Stat label={t('Hours')} value={card.hours} />
        <Stat label={t('Real hourly')} value={card.hourly ?? '—'} />
      </View>

      <View style={styles.chart}>
        {card.bars.map((bar, i) => (
          <View key={i} style={styles.column}>
            <View style={styles.track}>
              <View
                style={[
                  styles.bar,
                  { height: `${Math.max(bar.share > 0 ? 6 : 0, Math.round(bar.share * 100))}%`, opacity: bar.best ? 1 : 0.55 },
                ]}
              />
            </View>
            <Text style={styles.day} maxFontSizeMultiplier={1}>
              {bar.label}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.footer}>
        <Text style={styles.best} maxFontSizeMultiplier={1} numberOfLines={1}>
          {card.bestDay
            ? t('Best day: {day} · {amount}', { day: card.bestDay.day, amount: card.bestDay.amount })
            : t('{count} shifts', { count: card.shifts })}
        </Text>
        <Text style={styles.brand} maxFontSizeMultiplier={1}>
          Tipbook
        </Text>
      </View>
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.label} maxFontSizeMultiplier={1}>
        {label}
      </Text>
      <Text style={styles.statValue} maxFontSizeMultiplier={1} adjustsFontSizeToFit numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: WEEK_CARD_SIZE.width,
    height: WEEK_CARD_SIZE.height,
    padding: 24,
    borderRadius: 28,
    borderCurve: 'continuous',
    overflow: 'hidden',
    justifyContent: 'space-between',
    backgroundColor: GREEN,
    experimental_backgroundImage: `linear-gradient(160deg, #16A56E 0%, ${GREEN} 55%, ${DEEP} 100%)`,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  kicker: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 800,
    letterSpacing: 1.5,
  },
  range: {
    color: MINT,
    fontSize: 13,
    fontWeight: 600,
  },
  label: {
    color: MINT,
    fontSize: 12,
    fontWeight: 600,
  },
  big: {
    ...NumberFont,
    color: '#fff',
    fontSize: 54,
    lineHeight: 62,
    fontWeight: 800,
  },
  stats: {
    flexDirection: 'row',
    // Values line up even when a label wraps (longer in Spanish).
    alignItems: 'flex-end',
    gap: 12,
  },
  stat: {
    flex: 1,
    gap: 2,
  },
  statValue: {
    ...NumberFont,
    color: '#fff',
    fontSize: 17,
    fontWeight: 700,
  },
  chart: {
    height: 110,
    flexDirection: 'row',
    gap: 10,
  },
  column: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  track: {
    flex: 1,
    width: '100%',
    justifyContent: 'flex-end',
  },
  bar: {
    width: '100%',
    borderRadius: 6,
    backgroundColor: '#fff',
  },
  day: {
    color: MINT,
    fontSize: 11,
    fontWeight: 700,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  best: {
    flex: 1,
    color: '#fff',
    fontSize: 13,
    fontWeight: 600,
  },
  brand: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 800,
    letterSpacing: -0.3,
  },
});
