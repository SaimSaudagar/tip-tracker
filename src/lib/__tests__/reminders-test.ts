import { DEFAULT_REMINDERS, employerReportDueDate, formatTime, planReminders, trialEndDate } from '@/lib/reminders-plan';

// Mon Oct 26, 2026, 3:00 PM local
const now = new Date(2026, 9, 26, 15, 0);
const on = { ...DEFAULT_REMINDERS, enabled: true };

describe('shift reminders', () => {
  it('plans one reminder per day for two weeks, starting tonight', () => {
    const plans = planReminders({ now, settings: on, loggedDates: new Set() });
    expect(plans).toHaveLength(14);
    expect(plans[0].id).toBe('shift-2026-10-26');
    expect(plans[0].fireAt).toEqual(new Date(2026, 9, 26, 23, 0));
    expect(plans[0].url).toBe('/log-shift?date=2026-10-26');
  });

  it('skips days that already have a shift and days you don’t work', () => {
    const plans = planReminders({
      now,
      settings: { ...on, days: [1, 5, 6] }, // Mon, Fri, Sat
      loggedDates: new Set(['2026-10-26']),
    });
    expect(plans.map((p) => p.id)).toEqual([
      'shift-2026-10-30',
      'shift-2026-10-31',
      'shift-2026-11-02',
      'shift-2026-11-06',
      'shift-2026-11-07',
    ]);
  });

  it('fires after-midnight reminders the morning after the shift', () => {
    const plans = planReminders({ now, settings: { ...on, time: '01:30' }, loggedDates: new Set() });
    // Sunday's shift (yesterday) already had its 1:30 AM reminder this morning, so tonight's comes first.
    expect(plans[0].id).toBe('shift-2026-10-26');
    expect(plans[0].fireAt).toEqual(new Date(2026, 9, 27, 1, 30));
  });

  it('includes yesterday’s shift when its after-midnight reminder is still ahead', () => {
    const justAfterMidnight = new Date(2026, 9, 27, 0, 15);
    const plans = planReminders({ now: justAfterMidnight, settings: { ...on, time: '01:30' }, loggedDates: new Set() });
    expect(plans[0].id).toBe('shift-2026-10-26');
  });

  it('plans nothing when reminders are off or the time is invalid', () => {
    expect(planReminders({ now, settings: DEFAULT_REMINDERS, loggedDates: new Set() })).toEqual([]);
    expect(planReminders({ now, settings: { ...on, time: '25:00' }, loggedDates: new Set() })).toEqual([]);
  });
});

describe('report reminders', () => {
  it('reminds on the 8th about last month, with the due date', () => {
    const plans = planReminders({ now, settings: { ...DEFAULT_REMINDERS, reportReminder: true }, loggedDates: new Set() });
    expect(plans).toHaveLength(1); // Oct 8 has passed; Nov 8 is next
    expect(plans[0]).toMatchObject({
      id: 'report-2026-10',
      title: 'Your October tip report is ready',
      body: 'Tips of $20 or more a month must be reported to your employer by Nov 10.',
      url: '/reports?month=2026-10-01',
    });
    expect(plans[0].fireAt).toEqual(new Date(2026, 10, 8, 10, 0));
  });

  it('moves weekend due dates to Monday', () => {
    expect(employerReportDueDate('2026-10-01')).toBe('2026-11-10'); // Tuesday
    expect(employerReportDueDate('2026-09-01')).toBe('2026-10-12'); // Oct 10 is a Saturday
    expect(employerReportDueDate('2026-04-01')).toBe('2026-05-11'); // May 10 is a Sunday
    expect(employerReportDueDate('2026-12-01')).toBe('2027-01-11'); // Jan 10, 2027 is a Sunday
  });
});

describe('trial reminder', () => {
  it('reminds two days before the trial ends, even with other reminders off', () => {
    const plans = planReminders({ now, settings: DEFAULT_REMINDERS, loggedDates: new Set(), trialEndsOn: '2026-11-09' });
    expect(plans).toHaveLength(1);
    expect(plans[0]).toMatchObject({ id: 'trial-2026-11-09', title: 'Your free trial ends Nov 9', url: '/settings' });
    expect(plans[0].fireAt).toEqual(new Date(2026, 10, 7, 10, 0));
  });

  it('skips a reminder that would already be in the past', () => {
    expect(planReminders({ now, settings: DEFAULT_REMINDERS, loggedDates: new Set(), trialEndsOn: '2026-10-28' })).toEqual([]);
  });

  it('works out when a trial started today ends', () => {
    expect(trialEndDate('2026-10-26', 'annual')).toBe('2026-11-09');
    expect(trialEndDate('2026-10-26', 'annual_month_trial')).toBe('2026-11-25');
    expect(trialEndDate('2026-10-26', 'monthly')).toBeNull();
    expect(trialEndDate('2026-10-26', 'lifetime')).toBeNull();
  });
});

describe('formatTime', () => {
  it.each([
    ['23:00', '11 PM'],
    ['00:00', '12 AM'],
    ['12:00', '12 PM'],
    ['01:30', '1:30 AM'],
  ])('formats %s as %s', (time, label) => {
    expect(formatTime(time)).toBe(label);
  });
});
