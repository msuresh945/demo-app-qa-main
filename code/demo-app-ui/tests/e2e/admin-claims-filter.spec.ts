import { test, expect } from './fixtures';
import { createClaimTestData } from '../data/claim-test-data';
import { BffApiClient } from '../api/clients/bff-api-client';
import { testConfig } from '../config/test-config';

test('administrator can filter claims by status', async ({
  request,
  adminSession,
}) => {
  const claimantClient = new BffApiClient(request, testConfig.bffBaseUrl);
  await claimantClient.login(testConfig.claimant);
  const claim = await claimantClient.submitClaim(createClaimTestData());

  const adminClient = new BffApiClient(request, testConfig.bffBaseUrl);
  await adminClient.login(testConfig.admin);
  await adminClient.updateClaimStatus(claim.claimId, 'UNDER_REVIEW');

  await adminSession.adminClaimsPage.open();
  await adminSession.adminClaimsPage.filterByStatus('UNDER_REVIEW');
  await expect(adminSession.adminClaimsPage.claimRow(claim.claimId)).toBeVisible();
  await expect(
    adminSession.adminClaimsPage
      .claimRow(claim.claimId)
      .getByRole('status', { name: 'Claim status: Under Review' })
  ).toBeVisible();

  await adminSession.adminClaimsPage.filterByStatus('SUBMITTED');
  await expect(adminSession.adminClaimsPage.claimRow(claim.claimId)).toHaveCount(0);
});
