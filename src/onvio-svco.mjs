import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const { ONVIO_USER, ONVIO_PASS, MONTO_ACTUALIZAR = '424,62' } = process.env;

function getTargetDate() {
  return '01/03/2026';
}

async function run() {
  const companiesPath = path.join(process.cwd(), 'companies.txt');
  if (!fs.existsSync(companiesPath)) {
    console.error('Error: No se encontró companies.txt');
    return;
  }

  const companies = fs.readFileSync(companiesPath, 'utf8')
    .split('\n')
    .map(c => c.trim())
    .filter(line => line !== '');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('--- INICIANDO LOGIN EN ONVIO ---');
    await page.goto('https://onvio.com.ar/#/');
    await page.getByRole('button', { name: 'Iniciar sesión' }).click();
    await page.getByRole('textbox', { name: 'Correo electrónico' }).fill(ONVIO_USER);
    await page.getByRole('button', { name: 'Iniciar sesión' }).click();
    await page.getByRole('textbox', { name: 'Contraseña' }).fill(ONVIO_PASS);
    await page.getByRole('button', { name: 'Iniciar sesión' }).click();

    await page.waitForURL(/.*onvio.com.ar\/staff.*/);
    console.log('Login exitoso.');

    for (const company of companies) {
      console.log(`\n>>> PROCESANDO: ${company}`);
      
      try {
        await page.getByRole('link', { name: 'Menú' }).click();
        const page1Promise = page.waitForEvent('popup');
        await page.getByRole('link', { name: 'Sueldos y Jornales ' }).click();
        const page1 = await page1Promise;
        
        await page1.getByRole('textbox', { name: 'Buscar por Código, Razón' }).fill(company);
        await page1.getByText(company, { exact: false }).first().click();
        await page1.getByRole('button', { name: 'Aceptar' }).click();

        await page1.getByRole('heading', { name: ' Configuración' }).click();
        await page1.getByRole('link', { name: 'Matrices', exact: true }).click();
        
        console.log('Filtrando matriz SCVO...');
        const filterIcon = page1.locator('th:has-text("Código")').locator('.k-grid-filter');
        await filterIcon.click({ delay: 200 });
        
        const filterMenu = page1.locator('.k-filter-menu');
        await filterMenu.waitFor({ state: 'visible' });
        await filterMenu.locator('input').first().fill('SCVO');
        await page1.waitForTimeout(500);
        await filterMenu.locator('button:has-text("Filtrar")').click({ force: true });
        
        const scvoRow = page1.locator('tr:has-text("SCVO")').first();
        await scvoRow.waitFor({ state: 'visible', timeout: 10000 });
        await scvoRow.click();
        await page1.getByRole('link', { name: 'Editar' }).click();
        
        console.log('Agregando nuevo valor...');
        await page1.getByLabel('Matriz', { exact: true }).getByRole('link', { name: 'Agregar' }).click();
        
        await page1.getByText('Valor de la Matriz', { exact: true }).waitFor({ state: 'visible' });
        
        const fechaActual = getTargetDate();
        console.log(`Llenando Fecha: ${fechaActual}`);
        await page1.getByLabel('Fecha:').fill(fechaActual);
        
        console.log(`Llenando Valor: ${MONTO_ACTUALIZAR}`);
        const valorInput = page1.getByRole('textbox', { name: 'Valor:*' });
        await valorInput.click();
        await valorInput.fill(MONTO_ACTUALIZAR);
        
        console.log('Guardando valor del modal...');
        await page1.getByLabel('Valor de la Matriz').getByRole('button', { name: 'Aceptar' }).click();

        // Manejar duplicados
        const errorMsg = page1.getByText('La fecha y el tope estan repetidos para la matriz');
        await page1.waitForTimeout(500);
        if (await errorMsg.isVisible()) {
          console.log(`AVISO: El registro ya existe. Cancelando modal.`);
          await page1.getByLabel('Valor de la Matriz').getByRole('button', { name: 'Cancelar' }).click();
        }

        console.log('Guardando configuración de la matriz principal...');
        await page1.getByLabel('Matriz', { exact: true }).getByRole('button', { name: 'Aceptar' }).click();
        
        console.log(`ÉXITO: ${company} finalizada.`);
        await page1.close();
        await page.goto('https://onvio.com.ar/staff/#/?orderBy=currentDueDateExclusive%20asc');

      } catch (err) {
        console.error(`ERROR en ${company}:`, err.message);
        try { await page.goto('https://onvio.com.ar/staff/#/'); } catch (e) {}
      }
    }

  } catch (error) {
    console.error('PROCESO DETENIDO POR ERROR CRÍTICO.');
  } finally {
    console.log('\n--- PROCESO TERMINADO ---');
    await browser.close();
  }
}

run();
