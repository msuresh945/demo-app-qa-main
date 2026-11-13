import { expect, type Locator, type Page } from '@playwright/test';

export class AdminClaimsPage {
  constructor(private readonly page: Page) {}

  async open(): Promise<void> {
    await this.page.goto('/admin/claims');
    await expect(this.page.getByRole('heading', { name: 'Claims Management' })).toBeVisible();
  }

  claimRow(claimId: string): Locator {
    return this.page.locator('tbody tr').filter({ hasText: claimId.substring(0, 8) });
  }

  async expectClaimStatus(claimId: string, status: string): Promise<void> {
    const row = this.claimRow(claimId);
    await expect(row).toBeVisible();
    await expect(row.getByRole('status', { name: `Claim status: ${status}` })).toBeVisible();
  }

  async updateStatus(claimId: string, status: string): Promise<void> {
    const row = this.claimRow(claimId);
    await row.getByRole('combobox', { name: new RegExp(`Update status for claim ${claimId.substring(0, 8)}`) }).selectOption(status);
    await expect(this.page.getByRole('dialog', { name: 'Confirm Status Change' })).toBeVisible();
    await this.page.getByRole('button', { name: 'Confirm' }).click();
  }

  async filterByStatus(status: string): Promise<void> {
    await this.page.getByLabel('Filter claims by status').selectOption(status);
    await expect(this.page.getByLabel('Filter claims by status')).toHaveValue(status);
  }
}
