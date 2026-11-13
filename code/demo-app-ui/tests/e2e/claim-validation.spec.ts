import { test, expect } from './fixtures';
import { createClaimTestData } from '../data/claim-test-data';

test('claimant validates and preserves claim wizard details', async ({
  claimantSession,
}) => {
  const claimData = createClaimTestData();

  await claimantSession.claimWizardPage.open();
  await claimantSession.claimWizardPage.submitEmptyIncidentDetails();

  await expect(
    claimantSession.page.getByText('Incident date is required', { exact: true })
  ).toBeVisible();
  await expect(
    claimantSession.page.getByText('Location must be at least 5 characters', {
      exact: true,
    })
  ).toBeVisible();
  await expect(
    claimantSession.page.getByText('Claim amount is required', { exact: true })
  ).toBeVisible();

  await claimantSession.claimWizardPage.fillIncidentDetails(claimData);
  await claimantSession.page.getByTestId('wizard-step-1').getByRole('button', { name: 'Next' }).click();
  await expect(
    claimantSession.page.getByRole('heading', { name: 'Supporting Details' })
  ).toBeVisible();

  await claimantSession.claimWizardPage.submitEmptyDescription();
  await expect(
    claimantSession.page.getByText('Description must be at least 10 characters', {
      exact: true,
    })
  ).toBeVisible();

  await claimantSession.claimWizardPage.completeDescription(claimData);
  await claimantSession.claimWizardPage.goBack();
  await claimantSession.claimWizardPage.expectDescription(claimData.description);
  await claimantSession.claimWizardPage.goBack();
  await claimantSession.claimWizardPage.expectIncidentDetails(claimData);

  await claimantSession.page.getByTestId('wizard-step-1').getByRole('button', { name: 'Next' }).click();
  await claimantSession.claimWizardPage.expectDescription(claimData.description);
  await claimantSession.page.getByTestId('wizard-step-2').getByRole('button', { name: 'Next' }).click();
  await claimantSession.claimWizardPage.expectReview(claimData);
  await claimantSession.claimWizardPage.submit();
});
