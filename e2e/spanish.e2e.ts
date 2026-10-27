import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { expect, test, type Page } from '@playwright/test';

import { expectValue, logShift, onboard, openApp, TODAY, visible, waitToLeave } from './helpers';

// The same $85 + $142.50, 6.5-hour shift as app.e2e.ts: $241.35 earned, $37.13 an hour.

test('switching to Spanish in Settings translates the app, and it stays after a restart', async ({ page }) => {
  const errors = await openApp(page);
  await onboard(page);
  await logShift(page, { cash: '85', card: '142.50', hours: '6.5' });

  await page.goto('/settings');
  await page.getByRole('button', { name: 'Language: Español' }).click();
  // The app redraws in Spanish and comes back to Settings.
  await expect(visible(page, 'Idioma')).toBeVisible();
  await expect(page).toHaveURL(/\/settings$/);
  await expect(visible(page, 'Trabajos y puestos')).toBeVisible();

  await page.getByRole('tab', { name: /Inicio/ }).click();
  await expect(visible(page, 'Propinas esta semana')).toBeVisible();
  await expectValue(page, 'Total ganado', '$241.35');
  await expectValue(page, 'Pago real por hora', '$37.13/h');
  await expect(page.getByRole('button', { name: /^Hoy, Server/ })).toBeVisible();

  await page.reload();
  await expect(visible(page, 'Propinas esta semana')).toBeVisible();

  await page.getByRole('button', { name: 'Registrar turno' }).click();
  await page.getByLabel('Propinas en efectivo').fill('20');
  await page.getByLabel('Horas trabajadas').fill('2');
  await page.getByRole('button', { name: 'Guardar turno' }).click();
  await waitToLeave(page, '/log-shift');
  await expectValue(page, 'Total ganado', '$265.61'); // + $20 and 2 × $2.13

  await page.goto('/settings');
  await page.getByRole('button', { name: 'Idioma: English' }).click();
  await expect(visible(page, 'Jobs & positions')).toBeVisible();
  await page.getByRole('tab', { name: /Home/ }).click();
  await expectValue(page, 'Total earned', '$265.61');

  expect(errors, 'page errors or console errors').toEqual([]);
});

test('restoring a backup made in Spanish brings the language back with it', async ({ page }) => {
  const errors = await openApp(page);
  await onboard(page);
  await logShift(page, { cash: '85', card: '142.50', hours: '6.5' });

  await page.goto('/settings');
  await page.getByRole('button', { name: 'Language: Español' }).click();
  await expect(visible(page, 'Idioma')).toBeVisible();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Hacer copia ahora' }).click();
  const backupPath = join(tmpdir(), `tipbook-e2e-spanish-backup-${Date.now()}.json`);
  await (await download).saveAs(backupPath);
  await expect(visible(page, /^Copia de seguridad de 1 turno lista\./)).toBeVisible();

  await page.getByRole('button', { name: 'Idioma: English' }).click();
  await expect(visible(page, 'Jobs & positions')).toBeVisible();
  const chooser = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: 'Restore from a backup' }).click();
  await (await chooser).setFiles(backupPath);

  // The app redraws in Spanish, back on Settings, with the shift still there.
  await expect(visible(page, 'Trabajos y puestos')).toBeVisible();
  await expect(page).toHaveURL(/\/settings$/);
  await page.getByRole('tab', { name: /Inicio/ }).click();
  await expectValue(page, 'Total ganado', '$241.35');

  expect(errors, 'page errors or console errors').toEqual([]);
});

test.describe('on a phone set to Spanish', () => {
  test.use({ locale: 'es-US' });

  test('onboarding is in Spanish and names the position in Spanish', async ({ page }) => {
    const errors = await openSpanishApp(page);
    await page.getByRole('button', { name: 'Empezar' }).click();
    await page.getByRole('button', { name: 'Continuar' }).click();
    await page.getByPlaceholder('Nombre del restaurante o bar').fill('Olive & Vine');
    await page.getByLabel('Salario por hora sin propinas').fill('2.13');
    for (let i = 0; i < 3; i++) await page.getByRole('button', { name: 'Continuar' }).click();
    await page.getByRole('button', { name: 'Ahora no' }).click();
    await expect(visible(page, '$24.99/año')).toBeVisible();
    await page.getByRole('button', { name: 'Cerrar' }).click();
    await page.getByRole('button', { name: 'No, gracias, usar el plan gratis' }).click();
    await expect(visible(page, 'Aún no hay turnos').first()).toBeVisible();

    await page.goto('/settings');
    await expect(visible(page, 'Mesero · Olive & Vine')).toBeVisible();
    await expect(visible(page, '$2.13/h')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Idioma: Automático' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Idioma: English' })).toBeVisible();

    expect(errors, 'page errors or console errors').toEqual([]);
  });
});

async function openSpanishApp(page: Page): Promise<string[]> {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  await page.clock.setFixedTime(TODAY);
  await page.goto('/');
  await visible(page, 'Descubre lo que de verdad ganas.').waitFor({ timeout: 120_000 });
  return errors;
}
