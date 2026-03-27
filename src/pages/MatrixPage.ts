import { Page, Locator } from '@playwright/test';
import { KendoGrid } from '../components/KendoGrid';

export class MatrixPage {
  private readonly page: Page;
  private readonly grid: KendoGrid;

  constructor(page: Page) {
    this.page = page;
    this.grid = new KendoGrid(page);
  }

  /**
   * Navigates to the Matrix configuration section.
   */
  async navigateToMatrices() {
    await this.page.getByRole('heading', { name: ' Configuración' }).click();
    await this.page.getByRole('link', { name: 'Matrices', exact: true }).click();
  }

  /**
   * Finds and filters a matrix by its code.
   * @param code - The matrix code (e.g., 'ARTFIJA' or 'SCVO').
   */
  async filterMatrixByCode(code: string) {
    console.log(`Filtrando matriz: ${code}...`);
    await this.grid.filterByColumn('Código', code);
  }

  /**
   * Initiates the editing process for a specific matrix.
   * @param code - The matrix code.
   */
  async editMatrix(code: string) {
    const row = this.grid.getRowByText(code);
    await row.waitFor({ state: 'visible', timeout: 10000 });
    await this.grid.editRow(row);
  }

  /**
   * Espera a que los elementos de carga (spinners/overlays) desaparezcan.
   */
  async waitForLoading() {
    const loading = this.page.locator('#cargando, .k-loading-mask, .ui-widget-overlay');
    await loading.waitFor({ state: 'hidden', timeout: 30000 }).catch(() => {});
    await this.page.waitForTimeout(500); // Pequeño respiro extra
  }

  /**
   * Clicks the "Agregar" button within the matrix context.
   */
  async clickAddValue() {
    await this.waitForLoading();
    console.log('Agregando nuevo valor...');
    // Usamos un selector más específico para evitar ambigüedad con el botón de la grilla principal
    await this.page.getByLabel('Matriz', { exact: true }).getByRole('link', { name: 'Agregar' }).click();
  }

  /**
   * Fills the "Fecha" and "Valor" fields in the "Valor de la Matriz" modal.
   * @param date - The target date.
   * @param value - The new value.
   */
  async fillMatrixValue(date: string, value: string) {
    await this.page.getByText('Valor de la Matriz', { exact: true }).waitFor({ state: 'visible' });
    
    console.log(`Escribiendo Fecha: ${date}`);
    const fechaInput = this.page.getByLabel('Fecha:');
    await fechaInput.click();
    await fechaInput.pressSequentially(date, { delay: 100 });
    await this.page.waitForTimeout(300);
    
    console.log(`Escribiendo Valor: ${value}`);
    const valorInput = this.page.getByRole('textbox', { name: 'Valor:*' });
    await valorInput.click();
    await valorInput.pressSequentially(value, { delay: 100 });
    await this.page.waitForTimeout(300);
  }

  /**
   * Confirms the matrix value update in the modal.
   */
  async confirmModal() {
    await this.waitForLoading();
    console.log('Confirmando modal...');
    await this.page.getByLabel('Valor de la Matriz').getByRole('button', { name: 'Aceptar' }).click();
  }

  /**
   * Handles duplicate entry errors by canceling the modal if needed.
   * Returns true if a duplicate was handled.
   */
  async handleDuplicateError(): Promise<boolean> {
    const errorMsg = this.page.getByText('La fecha y el tope estan repetidos para la matriz');
    await this.page.waitForTimeout(500);
    if (await errorMsg.isVisible()) {
      console.log('AVISO: El registro ya existe. Cancelando modal.');
      await this.page.getByLabel('Valor de la Matriz').getByRole('button', { name: 'Cancelar' }).click();
      return true;
    }
    return false;
  }

  /**
   * Confirms the overall matrix configuration update.
   */
  async confirmMainConfiguration() {
    console.log('Guardando configuración de la matriz principal...');
    await this.page.getByLabel('Matriz', { exact: true }).getByRole('button', { name: 'Aceptar' }).click();
  }
}
