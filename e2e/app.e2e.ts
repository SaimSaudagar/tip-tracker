import { readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { expect, test } from '@playwright/test';

import { expectValue, logShift, onboard, openApp, simulatePro, visible, waitToLeave } from './helpers';

// Every test starts from a fresh install (an empty browser profile) on Tue Oct 27, 2026.
// A shift of $85 cash + $142.50 card over 6.5 hours at $2.13/hr earns $227.50 in tips,
// $13.85 in wages (6.5 × $2.13, rounded) and $241.35 in all: $37.13 an hour.

let errors: string[];

test.beforeEach(async ({ page }) => {
  errors = await openApp(page);
});

test.afterEach(() => {
  expect(errors, 'page errors or console errors').toEqual([]);
});

test('onboarding leads to an empty Home on the free plan', async ({ page }) => {
  await onboard(page);
  await expect(visible(page, 'No shifts yet')).toBeVisible();
  await page.goto('/settings');
  await expect(visible(page, 'Server · Olive & Vine')).toBeVisible();
  await expect(visible(page, '$2.13/hr')).toBeVisible();
});

test('logs, edits and deletes a shift, and Home adds it up', async ({ page }) => {
  await onboard(page);
  await logShift(page, { cash: '85', card: '142.50', hours: '6.5' });

  await expect(visible(page, '$227.50').first()).toBeVisible();
  await expectValue(page, 'Total earned', '$241.35');
  await expectValue(page, 'Hours', '6h 30m');
  await expectValue(page, 'Real hourly', '$37.13/hr');

  await page.getByRole('button', { name: /^Today, Server/ }).click();
  await expect(page.getByLabel('Cash tips')).toHaveValue('85');
  await page.getByLabel('Cash tips').fill('100');
  await page.getByRole('button', { name: 'Save changes' }).click();
  await waitToLeave(page, '/log-shift');
  await expectValue(page, 'Total earned', '$256.35');

  await page.getByRole('button', { name: /^Today, Server/ }).click();
  await page.getByRole('button', { name: 'Delete shift' }).click();
  await expect(visible(page, 'No shifts yet')).toBeVisible();
});

test('the calendar shows each day and logs a shift on a past day', async ({ page }) => {
  await onboard(page);
  await logShift(page, { cash: '85', card: '142.50', hours: '6.5' });
  await page.getByRole('tab', { name: 'Calendar' }).click();
  await expect(page.getByRole('button', { name: 'Today, $227.50 in tips' })).toBeVisible();

  await page.getByRole('button', { name: 'Tue, Oct 20, no shifts' }).click();
  await page.getByRole('button', { name: 'Log a shift for Tue, Oct 20' }).click();
  await page.getByLabel('Cash tips').fill('50');
  await page.getByRole('button', { name: 'Save shift' }).click();
  await waitToLeave(page, '/log-shift');
  await expect(page.getByRole('button', { name: 'Tue, Oct 20, $50.00 in tips' })).toBeVisible();
  await expectValue(page, 'Tips', '$277.50'); // the month so far
});

test('Pro: the monthly report adds up and opens as a printable report', async ({ page }) => {
  await onboard(page);
  await simulatePro(page);
  await page.goto('/');
  await logShift(page, { cash: '85', card: '142.50', hours: '6.5' });

  await page.getByRole('tab', { name: 'Reports' }).click();
  await expect(visible(page, 'October 2026')).toBeVisible();
  await expectValue(page, 'Olive & Vine', '$227.50');
  await expectValue(page, 'Cash tips', '$85.00');
  await expectValue(page, 'Card tips', '$142.50');

  const popup = page.waitForEvent('popup');
  await page.getByRole('button', { name: 'Share PDF for your employer' }).click();
  const report = await (await popup).content();
  expect(report).toContain('Employee’s tip report – October 2026');
  expect(report).toContain('Olive &amp; Vine');
  expect(report).toContain('$227.50');
  expect(report).toContain('November 10, 2026');
});

test('free plan: a second job opens the paywall', async ({ page }) => {
  await onboard(page);
  await page.goto('/settings');
  await page.getByRole('button', { name: 'Add a position' }).click();
  await page.getByLabel('Position', { exact: true }).fill('Bartender');
  await page.getByLabel('Job / workplace', { exact: true }).fill('Harbor Bar');
  await page.getByLabel('Hourly wage', { exact: true }).fill('5');
  await page.getByRole('button', { name: 'Save position' }).click();
  await expect(visible(page, 'Track more than one job')).toBeVisible();
});

test('imports a CSV from another app, and importing it again adds nothing', async ({ page }) => {
  await onboard(page);
  const file = join(tmpdir(), `tipbook-e2e-${Date.now()}.csv`);
  writeFileSync(
    file,
    ['Date,Hours Worked,Cash Tips,Credit Tips,Tip Out', '10/23/2026,6.5,$64.00,$148.25,$22.00', '10/24/2026,7,88,201.60,31'].join('\n'),
  );
  const importFile = async () => {
    await page.goto('/import');
    const chooser = page.waitForEvent('filechooser');
    await page.getByRole('button', { name: 'Choose CSV file' }).click();
    await (await chooser).setFiles(file);
    await page.getByRole('button', { name: 'Import 2 shifts' }).click();
  };

  await importFile();
  await expect(visible(page, 'Imported 2 shifts')).toBeVisible();
  await page.getByRole('button', { name: 'Done', exact: true }).last().click();
  await page.goto('/');
  await expect(page.getByRole('button', { name: /^Sat, Oct 24, Server/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /^Fri, Oct 23, Server/ })).toBeVisible();

  await importFile();
  await expect(visible(page, 'Imported 0 shifts')).toBeVisible();
  await expect(visible(page, '2 were already in the app and skipped.')).toBeVisible();
});

test('backs up, deletes everything and restores the backup', async ({ page }) => {
  await onboard(page);
  await logShift(page, { cash: '85', card: '142.50', hours: '6.5' });

  await page.goto('/settings');
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Back up now' }).click();
  const backupPath = join(tmpdir(), `tipbook-e2e-backup-${Date.now()}.json`);
  await (await download).saveAs(backupPath);
  expect(JSON.parse(readFileSync(backupPath, 'utf8')).tables.shifts).toHaveLength(1);
  await expect(visible(page, /^Backed up 1 shift\./)).toBeVisible();

  await page.getByRole('button', { name: 'Delete all data' }).click();
  await visible(page, 'Know what you really make.').waitFor();
  await onboard(page);
  await expect(visible(page, 'No shifts yet')).toBeVisible();

  await page.goto('/settings');
  const chooser = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: 'Restore from a backup' }).click();
  await (await chooser).setFiles(backupPath);
  await expect(visible(page, /^Restored 1 shift from /)).toBeVisible();
  await page.goto('/');
  await expect(page.getByRole('button', { name: /^Today, Server/ })).toBeVisible();
  await expectValue(page, 'Total earned', '$241.35');
});

test('settings: weekly goal, week start and dark mode take effect', async ({ page }) => {
  await onboard(page);
  await logShift(page, { cash: '85', card: '142.50', hours: '6.5' });

  await page.goto('/settings');
  await page.getByLabel('Goal per week').fill('1200');
  await page.getByLabel('Goal per week').press('Enter');
  await page.getByRole('button', { name: 'Monday' }).click();
  await page.getByRole('button', { name: 'Dark' }).click();

  await page.getByRole('tab', { name: 'Home' }).click();
  await expect(page.getByRole('progressbar', { name: 'Weekly goal: 20% of $1,200' })).toBeVisible();
  await expect(visible(page, 'Oct 26 – Nov 1')).toBeVisible(); // Monday-to-Sunday week

  const darkScreen = await page.evaluate(() =>
    [...document.querySelectorAll('div')].some(
      (d) => getComputedStyle(d).backgroundColor === 'rgb(0, 0, 0)' && d.getBoundingClientRect().height > 600,
    ),
  );
  expect(darkScreen).toBe(true);
});

test('the tip pool puts my share into a new shift', async ({ page }) => {
  await onboard(page);
  await page.goto('/tip-pool');
  await page.getByLabel('Tip pool total').fill('300');
  await page.getByLabel('Hours for Me').fill('6');
  await page.getByLabel('Name 2').fill('Ana');
  await page.getByLabel('Hours for Ana').fill('4');
  await page.getByRole('button', { name: 'Log my $180.00 in a shift' }).click();
  await expect(page.getByLabel('Tips from coworkers')).toHaveValue('180');
  await page.getByRole('button', { name: 'Save shift' }).click();
  await waitToLeave(page, '/log-shift');
  await expect(page.getByRole('button', { name: /^Today, Server, \$180\.00 in tips/ })).toBeVisible();
});

test('California overtime adds time and a half and double time', async ({ page }) => {
  await onboard(page, { wage: '16.50' });
  await page.goto('/settings');
  await page.getByRole('button', { name: /^Server at Olive & Vine/ }).click();
  await page.getByRole('button', { name: 'California' }).click();
  await page.getByRole('button', { name: 'Save position' }).click();
  await waitToLeave(page, '/position');
  await page.getByRole('tab', { name: 'Home' }).click();
  await logShift(page, { cash: '100', hours: '14' });
  // $100 + 14 × $16.50 + 4 hours × $8.25 + 2 hours × $16.50
  await expectValue(page, 'Total earned', '$397.00');
  await expectValue(page, 'Real hourly', '$28.36/hr');
});

test('every screen opens without errors', async ({ page }) => {
  await onboard(page);
  await simulatePro(page);
  await page.getByRole('button', { name: 'Developer: add 12 weeks of sample shifts' }).click();
  await expect(visible(page, /^Added \d+ sample shifts/)).toBeVisible();
  const screens: [string, string | RegExp][] = [
    ['/', 'Recent shifts'],
    ['/calendar', 'Real hourly'],
    ['/insights', 'Best day'],
    ['/reports', 'Year-end summary'],
    ['/settings', 'Jobs & positions'],
    ['/log-shift', 'Hours worked'],
    ['/position?id=1', 'Overtime at Olive & Vine'],
    ['/paycheck', 'Take-home (net)'],
    ['/import', 'Choose CSV file'],
    ['/tip-pool', 'Tip pool total'],
    ['/scan', /checkout slip/i],
    ['/paywall?reason=settings', '$24.99/year'],
    ['/legal?doc=privacy', 'Privacy Policy'],
    ['/legal?doc=terms', 'Terms of Use'],
  ];
  for (const [route, text] of screens) {
    await page.goto(route);
    await expect(visible(page, text), route).toBeVisible();
  }
});
