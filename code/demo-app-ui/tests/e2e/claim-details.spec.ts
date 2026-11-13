import { test } from './fixtures';
import { createClaimTestData } from '../data/claim-test-data';

test('claimant can view details of a submitted claim', async ({
  claimantSession,
}) => {
  const claimData = createClaimTestData();

  await claimantSession.claimWizardPage.open();
  await claimantSession.claimWizardPage.completeIncidentDetails(claimData);
  await claimantSession.claimWizardPage.completeDescription(claimData);
  await claimantSession.claimWizardPage.expectReview(claimData);
  const claimId = await claimantSession.claimWizardPage.submit();

  await claimantSession.claimsPage.open();
  await claimantSession.claimsPage.viewDetails(claimId);
  await claimantSession.claimsPage.expectClaimDetails(claimId, claimData.description);
});
