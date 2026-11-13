import { expect, type Locator, type Page } from '@playwright/test';

export class ClaimsPage {
  constructor(private readonly page: Page) {}

  async open(): Promise<void> {
    await this.page.goto('/claims');
    await expect(this.page.getByRole('heading', { name: 'My Claims' })).toBeVisible();
  }

  claimRow(claimId: string): Locator {
    return this.page.locator('tbody tr').filter({ hasText: claimId.substring(0, 8) });
  }

  async expectClaimStatus(claimId: string, status: string): Promise<void> {
    const row = this.claimRow(claimId);
    await expect(row).toBeVisible();
    await expect(row.getByRole('status', { name: `Claim status: ${status}` })).toBeVisible();
  }

  async viewDetails(claimId: string): Promise<void> {
    await this.claimRow(claimId).getByTestId('view-details-button').click();
    await expect(this.page.getByRole('dialog', { name: 'Claim Details' })).toBeVisible();
  }

  async expectClaimDetails(claimId: string, description: string): Promise<void> {
    const dialog = this.page.getByRole('dialog', { name: 'Claim Details' });
    await expect(dialog.getByText(claimId, { exact: true })).toBeVisible();
    await expect(dialog.getByText(description, { exact: true })).toBeVisible();
  }
}
