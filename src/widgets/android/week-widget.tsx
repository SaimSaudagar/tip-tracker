import { FlexWidget, TextWidget, type ColorProp } from 'react-native-android-widget';

import { LOG_SHIFT_URL } from '@/constants/app';
import { t } from '@/i18n';
import { todayISO } from '@/lib/dates';
import type { WidgetSnapshot } from '@/lib/widget-snapshot';

const PALETTE = {
  light: { background: '#0B7A4B', text: '#FFFFFF', muted: '#D7F0E3', track: '#2E8F64', bar: '#FFFFFF' },
  dark: { background: '#0F2E22', text: '#E3F4EB', muted: '#9FD8BC', track: '#1E4A38', bar: '#34D399' },
} satisfies Record<string, Record<string, ColorProp>>;

/** This week's tips and real hourly; tapping it opens Log shift. Drawn in both light and dark. */
export function renderWeekWidget(snapshot: WidgetSnapshot) {
  return { light: <WeekWidget snapshot={snapshot} scheme="light" />, dark: <WeekWidget snapshot={snapshot} scheme="dark" /> };
}

function WeekWidget({ snapshot, scheme }: { snapshot: WidgetSnapshot; scheme: keyof typeof PALETTE }) {
  const c = PALETTE[scheme];
  // After the week ends, show an empty new week until the app refreshes the numbers.
  const stale = todayISO() > snapshot.weekEnd;
  const tips = stale ? '$0.00' : snapshot.tips;
  const detail = stale
    ? t('Open Tipbook to update')
    : t('{earned} earned · {hourly}', { earned: snapshot.earned, hourly: snapshot.hourly });
  return (
    <FlexWidget
      clickAction="OPEN_URI"
      clickActionData={{ uri: LOG_SHIFT_URL }}
      accessibilityLabel={t('Tipbook. Tips this week {tips}. {detail}. Tap to log a shift.', { tips, detail })}
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: c.background,
        borderRadius: 24,
        padding: 16,
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}>
      <FlexWidget style={{ flexDirection: 'row', justifyContent: 'space-between', width: 'match_parent' }}>
        <TextWidget
          text={t('Tips this week').toLocaleUpperCase()}
          style={{ fontSize: 12, fontWeight: '700', color: c.muted, letterSpacing: 0.05 }}
        />
        <TextWidget text={stale ? '' : snapshot.weekLabel} style={{ fontSize: 12, color: c.muted }} />
      </FlexWidget>
      <TextWidget text={tips} style={{ fontSize: 32, fontWeight: '700', color: c.text }} maxLines={1} />
      {!stale && snapshot.goalPercent >= 0 ? (
        <FlexWidget style={{ width: 'match_parent', height: 6, backgroundColor: c.track, borderRadius: 3, flexDirection: 'row' }}>
          <FlexWidget style={{ flex: Math.max(snapshot.goalPercent, 1), height: 6, backgroundColor: c.bar, borderRadius: 3 }} />
          <FlexWidget style={{ flex: Math.max(100 - snapshot.goalPercent, 0), height: 6 }} />
        </FlexWidget>
      ) : null}
      <FlexWidget style={{ flexDirection: 'row', justifyContent: 'space-between', width: 'match_parent' }}>
        <TextWidget text={detail} style={{ fontSize: 13, color: c.muted }} maxLines={1} />
        <TextWidget text={t('+ Log')} style={{ fontSize: 13, fontWeight: '700', color: c.text }} />
      </FlexWidget>
    </FlexWidget>
  );
}
