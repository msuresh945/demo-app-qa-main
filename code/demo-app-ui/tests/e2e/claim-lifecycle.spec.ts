import { test, expect } from './fixtures';
import { createClaimTestData } from '../data/claim-test-data';

test('claimant sees administrator status update in real time', async ({
  claimantSession,
  adminSession,
}) => {
  const claimData = createClaimTestData();

  await claimantSession.claimWizardPage.open();
  await claimantSession.claimWizardPage.completeIncidentDetails(claimData);
  await claimantSession.claimWizardPage.completeDescription(claimData);
  await claimantSession.claimWizardPage.expectReview(claimData);
  const claimId = await claimantSession.claimWizardPage.submit();

  await claimantSession.claimsPage.open();
  await claimantSession.claimsPage.expectClaimStatus(claimId, 'Submitted');

  await adminSession.adminClaimsPage.open();
  await adminSession.adminClaimsPage.expectClaimStatus(claimId, 'Submitted');
  await adminSession.adminClaimsPage.updateStatus(claimId, 'UNDER_REVIEW');
  await adminSession.adminClaimsPage.expectClaimStatus(claimId, 'Under Review');

  const claimantRow = claimantSession.claimsPage.claimRow(claimId);
  await expect(
    claimantRow.getByRole('status', { name: 'Claim status: Under Review' })
  ).toBeVisible({ timeout: 15_000 });
});
