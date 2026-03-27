import { Locator, Page } from '@playwright/test';

export class KendoGrid {
  private readonly page: Page;
  private readonly grid: Locator;

  constructor(page: Page, selector: string = 'div.k-grid') {
    this.page = page;
    this.grid = page.locator(selector);
  }

  /**
   * Clicks the filter icon for a specific column and fills the filter input.
   * @param columnName - The text of the column header to filter.
   * @param value - The value to filter by.
   */
  async filterByColumn(columnName: string, value: string) {
    const headerCell = this.grid.locator('th').filter({ hasText: columnName });
    const filterIcon = headerCell.locator('.k-grid-filter');
    
    await filterIcon.click({ delay: 200 });
    
    const filterMenu = this.page.locator('.k-filter-menu');
    await filterMenu.waitFor({ state: 'visible' });
    
    // Fill the first input in the filter menu
    await filterMenu.locator('input').first().fill(value);
    await this.page.waitForTimeout(500); // Small delay for filter processing
    
    await filterMenu.locator('button:has-text("Filtrar")').click({ force: true });
  }

  /**
   * Finds a row that contains specific text and returns it.
   * @param text - The text to look for in the row.
   */
  getRowByText(text: string): Locator {
    return this.grid.locator('tr').filter({ hasText: text }).first();
  }

  /**
   * Clicks the "Editar" link within a specific row.
   * @param row - The row locator.
   */
  async editRow(row: Locator) {
    await row.click();
    await this.page.getByRole('link', { name: 'Editar' }).click();
  }

  /**
   * Clicks the "Agregar" button within the grid (e.g., in the toolbar).
   */
  async clickAdd() {
    await this.grid.getByRole('link', { name: 'Agregar' }).click();
  }
}
