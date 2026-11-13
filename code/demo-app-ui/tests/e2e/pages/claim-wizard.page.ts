import { expect, type Page } from '@playwright/test';
import type { ClaimTestData } from '../../data/claim-test-data';

export class ClaimWizardPage {
  constructor(private readonly page: Page) {}

  async open(): Promise<void> {
    await this.page.goto('/claims/new');
    await expect(this.page.getByRole('heading', { name: 'Submit New Claim' })).toBeVisible();
  }

  async completeIncidentDetails(data: ClaimTestData): Promise<void> {
    await this.fillIncidentDetails(data);
    await this.page.getByTestId('wizard-step-1').getByRole('button', { name: 'Next' }).click();
  }

  async fillIncidentDetails(data: ClaimTestData): Promise<void> {
    await this.page.getByLabel(/When did the incident occur/i).fill(data.incidentDate);
    await this.page.getByLabel(/Where did the incident occur/i).fill(data.incidentLocation);
    await this.page.getByLabel(/Claim Amount/i).fill(String(data.claimAmount));
  }

  async submitEmptyIncidentDetails(): Promise<void> {
    await this.page.getByLabel(/When did the incident occur/i).fill('2026-01-01');
    await this.page.getByLabel(/Where did the incident occur/i).fill('Valid location');
    await this.page.getByLabel(/Claim Amount/i).fill('100');

    await this.page.getByLabel(/When did the incident occur/i).fill('');
    await this.page.getByLabel(/Where did the incident occur/i).fill('');
    await this.page.getByLabel(/Claim Amount/i).fill('');
  }

  async completeDescription(data: ClaimTestData): Promise<void> {
    await this.page.getByLabel(/Describe what happened/i).fill(data.description);
    await this.page.getByTestId('wizard-step-2').getByRole('button', { name: 'Next' }).click();
  }

  async submitEmptyDescription(): Promise<void> {
    await this.page.getByLabel(/Describe what happened/i).fill('Valid description');
    await this.page.getByLabel(/Describe what happened/i).fill('');
  }

  async goBack(): Promise<void> {
    await this.page.getByRole('button', { name: 'Back' }).click();
  }

  async expectIncidentDetails(data: ClaimTestData): Promise<void> {
    await expect(this.page.getByLabel(/When did the incident occur/i)).toHaveValue(data.incidentDate);
    await expect(this.page.getByLabel(/Where did the incident occur/i)).toHaveValue(data.incidentLocation);
    await expect(this.page.getByLabel(/Claim Amount/i)).toHaveValue(String(data.claimAmount));
  }

  async expectDescription(description: string): Promise<void> {
    await expect(this.page.getByLabel(/Describe what happened/i)).toHaveValue(description);
  }

  async expectReview(data: ClaimTestData): Promise<void> {
    await expect(this.page.getByRole('heading', { name: 'Review Your Claim' })).toBeVisible();
    await expect(this.page.getByText(data.incidentLocation)).toBeVisible();
    await expect(this.page.getByText(data.description)).toBeVisible();
  }

  async submit(): Promise<string> {
    await this.page.getByTestId('wizard-step-3').getByRole('button', { name: 'Submit Claim' }).click();
    const successToast = this.page.getByText(/Claim submitted successfully! Claim ID:/i);
    await expect(successToast).toBeVisible();
    const text = await successToast.textContent();
    const claimId = text?.match(/[0-9a-f]{8}-[0-9a-f-]{27}/i)?.[0];
    expect(claimId, 'Submission toast should contain a claim ID').toBeTruthy();
    return claimId!;
  }
}
