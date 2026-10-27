import { expect, type Locator, type Page } from '@playwright/test';

/** The tests run on a fixed day so their numbers are the same on any date: Tue Oct 27, 2026, 3 PM. */
export const TODAY = new Date(2026, 9, 27, 15, 0, 0);

export const visible = (page: Page, text: string | RegExp): Locator =>
  page.getByText(text).filter({ visible: true }).first();

/**
 * Opens the app on the fixed day with a fresh, empty database. Returns the page errors
 * seen so far; tests check it's empty at the end, so any crash or console error fails them.
 */
export async function openApp(page: Page): Promise<string[]> {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  page.on('dialog', (d) => d.accept());
  await page.clock.setFixedTime(TODAY);
  await page.goto('/');
  await visible(page, 'Know what you really make.').waitFor({ timeout: 120_000 });
  return errors;
}

/** Goes through onboarding (job, wage) and leaves the paywall on the free plan. */
export async function onboard(page: Page, { job = 'Olive & Vine', wage = '2.13' } = {}) {
  await page.getByRole('button', { name: 'Get started' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByPlaceholder('Restaurant or bar name').fill(job);
  await page.getByLabel('Hourly wage before tips').fill(wage);
  for (let i = 0; i < 3; i++) await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Not now' }).click();
  await visible(page, '$24.99/year').waitFor();
  await page.getByRole('button', { name: 'Close' }).click();
  // The longer-trial offer shows once per phone, so not after "Delete all data".
  const noThanks = page.getByRole('button', { name: 'No thanks, use the free plan' });
  await noThanks.or(visible(page, 'Recent shifts')).first().waitFor();
  if (await noThanks.isVisible()) await noThanks.click();
  await visible(page, 'Recent shifts').waitFor();
}

/** Waits for a modal screen to close, which the app does only after its save has finished. */
export async function waitToLeave(page: Page, path: string) {
  await page.waitForURL((url) => !url.pathname.startsWith(path));
}

/** Turns on Pro with the development switch in Settings (development builds only). */
export async function simulatePro(page: Page) {
  await page.goto('/settings');
  const toggle = page.getByRole('switch', { name: 'Developer: simulate Pro' });
  await toggle.click();
  await expect(visible(page, 'Tipbook Pro is active')).toBeVisible();
}

/** Logs a shift for today from Home and waits for the confirmation. */
export async function logShift(page: Page, { cash = '', card = '', hours = '' }: { cash?: string; card?: string; hours?: string }) {
  await page.getByRole('button', { name: 'Log shift' }).click();
  await page.getByLabel('Cash tips').fill(cash);
  await page.getByLabel('Card tips').fill(card);
  await page.getByLabel('Hours worked').fill(hours);
  await page.getByRole('button', { name: 'Save shift' }).click();
  await waitToLeave(page, '/log-shift');
}

/** Text of a "label … value" row, e.g. the value next to "Total earned", or null when it isn't shown. */
export async function valueAfter(page: Page, label: string): Promise<string | null> {
  const lines = (await page.locator('body').innerText()).split('\n').map((l) => l.trim()).filter(Boolean);
  const index = lines.indexOf(label);
  return index === -1 ? null : lines[index + 1];
}

/** Asserts the value next to `label`, waiting for the screen to catch up with the database. */
export async function expectValue(page: Page, label: string, value: string) {
  await expect.poll(() => valueAfter(page, label), { message: label }).toBe(value);
}
