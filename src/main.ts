import { chromium, Browser, BrowserContext, Page } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { MatrixPage } from './pages/MatrixPage.js';
import { login } from './utils/auth.js';

dotenv.config();

// Para SCVO el valor suele ser diferente, lo tomamos del .env
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

  const browser: Browser = await chromium.launch({ 
    headless: false, 
    slowMo: 100 
  });
  const context: BrowserContext = await browser.newContext();
  const page: Page = await context.newPage();

  const failedCompanies: { company: string; reason: string }[] = [];
  const successfulCompanies: string[] = [];

  try {
    await login(page, ONVIO_USER!, ONVIO_PASS!);

    for (const company of companies) {
      console.log(`\n>>> PROCESANDO: ${company}`);
      
      try {
        await page.getByRole('link', { name: 'Menú' }).click();
        const page1Promise = page.waitForEvent('popup');
        await page.getByRole('link', { name: 'Sueldos y Jornales ' }).click();
        const page1 = await page1Promise;
        
        // Select company
        const searchInput = page1.getByRole('textbox', { name: 'Buscar por Código, Razón' });
        await page1.waitForLoadState('networkidle');
        await searchInput.waitFor({ state: 'visible', timeout: 60000 });
        await searchInput.fill(company);
        await page1.waitForTimeout(1000);
        await page1.getByText(company, { exact: false }).first().click();
        await page1.getByRole('button', { name: 'Aceptar' }).click();

        const matrixPage = new MatrixPage(page1);
        
        // Navigation and Filtering (AQUÍ CAMBIAMOS A SCVO)
        await matrixPage.navigateToMatrices();
        
        try {
          await matrixPage.filterMatrixByCode('SCVO');
          await matrixPage.editMatrix('SCVO');
        } catch (e) {
          throw new Error('No se encontró la matriz SCVO');
        }
        
        // Add Value
        await matrixPage.clickAddValue();
        
        const fechaActual = getTargetDate();
        await matrixPage.fillMatrixValue(fechaActual, MONTO_ACTUALIZAR!);
        
        // Confirm Modal
        await matrixPage.confirmModal();

        // Handle duplication errors
        const existed = await matrixPage.handleDuplicateError();
        if (existed) {
          console.log(`INFO: El valor para ${fechaActual} ya existía en ${company}.`);
        }

        // Finalize Matrix Update
        await matrixPage.confirmMainConfiguration();
        
        console.log(`ÉXITO: ${company} finalizada.`);
        successfulCompanies.push(company);
        await page1.close();
        await page.goto('https://onvio.com.ar/staff/#/?orderBy=currentDueDateExclusive%20asc');

      } catch (err: any) {
        console.error(`ERROR en ${company}:`, err.message);
        failedCompanies.push({ company, reason: err.message });
        try { await page.goto('https://onvio.com.ar/staff/#/'); } catch (e) {}
      }
    }

  } catch (error) {
    console.error('PROCESO DETENIDO POR ERROR CRÍTICO.');
  } finally {
    console.log('\n' + '='.repeat(50));
    console.log('RESUMEN DE EJECUCIÓN (SCVO)');
    console.log('='.repeat(50));
    console.log(`PROCESADAS CON ÉXITO: ${successfulCompanies.length}`);
    console.log(`FALLIDAS: ${failedCompanies.length}`);
    
    if (failedCompanies.length > 0) {
      console.log('\nLISTA DE EMPRESAS QUE FALLARON:');
      failedCompanies.forEach(f => {
        console.log(`- ${f.company}: ${f.reason}`);
      });
    }
    console.log('='.repeat(50));
    
    await browser.close();
  }
}

run();
