import { Page } from '@playwright/test';

/**
 * Handles the Onvio login process.
 * @param page - The Playwright Page object.
 * @param user - Onvio username/email.
 * @param pass - Onvio password.
 */
export async function login(page: Page, user: string, pass: string) {
  console.log('--- INICIANDO LOGIN EN ONVIO ---');
  await page.goto('https://onvio.com.ar/#/');
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  await page.getByRole('textbox', { name: 'Correo electrónico' }).fill(user);
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  await page.getByRole('textbox', { name: 'Contraseña' }).fill(pass);
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();

  await page.waitForURL(/.*onvio.com.ar\/staff.*/);
  console.log('Login exitoso.');
}
