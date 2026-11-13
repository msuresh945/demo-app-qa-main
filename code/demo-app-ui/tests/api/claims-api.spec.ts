import { test, expect } from '@playwright/test';
import { BffApiClient } from './clients/bff-api-client';
import { testConfig } from '../config/test-config';
import { createClaimTestData } from '../data/claim-test-data';

test.describe('BFF claims API', () => {
  test('retrieves claims for an authenticated claimant', async ({ request }) => {
    const client = new BffApiClient(request, testConfig.bffBaseUrl);
    await client.login(testConfig.claimant);
    const claims = await client.listClaims();
    expect(Array.isArray(claims)).toBe(true);
  });

  test('rejects invalid claim submission', async ({ request }) => {
    const client = new BffApiClient(request, testConfig.bffBaseUrl);
    await client.login(testConfig.claimant);
    const response = await request.post(`${testConfig.bffBaseUrl}/api/claims`, {
      data: { ...createClaimTestData(), description: 'short' },
      headers: client.csrfHeaders(),
    });
    await client.expectStatus(response, 400);
    expect(response.headers()['content-type']).toMatch(/json/);
  });

  test('rejects unauthenticated claim retrieval', async ({ request }) => {
    const response = await request.get(`${testConfig.bffBaseUrl}/api/claims`);
    expect(response.status()).toBe(401);
  });

  test('admin can update a claim status', async ({ request }) => {
    const claimantClient = new BffApiClient(request, testConfig.bffBaseUrl);
    await claimantClient.login(testConfig.claimant);
    const claim = await claimantClient.submitClaim(createClaimTestData());

    const adminClient = new BffApiClient(request, testConfig.bffBaseUrl);
    await adminClient.login(testConfig.admin);
    const updated = await adminClient.updateClaimStatus(claim.claimId, 'UNDER_REVIEW');

    expect(updated.claimId).toBe(claim.claimId);
    expect(updated.status).toBe('UNDER_REVIEW');
  });

  test('rejects claimant access to administrator claims', async ({ request }) => {
    const client = new BffApiClient(request, testConfig.bffBaseUrl);
    await client.login(testConfig.claimant);

    const response = await client.listAdminClaimsResponse();

    expect(response.status()).toBe(403);
  });

  test('rejects claimant status updates', async ({ request }) => {
    const claimantClient = new BffApiClient(request, testConfig.bffBaseUrl);
    await claimantClient.login(testConfig.claimant);
    const claim = await claimantClient.submitClaim(createClaimTestData());

    const response = await claimantClient.updateClaimStatusResponse(
      claim.claimId,
      'UNDER_REVIEW'
    );

    expect(response.status()).toBe(403);
  });

  test('rejects an invalid claim status transition', async ({ request }) => {
    const claimantClient = new BffApiClient(request, testConfig.bffBaseUrl);
    await claimantClient.login(testConfig.claimant);
    const claim = await claimantClient.submitClaim(createClaimTestData());

    const adminClient = new BffApiClient(request, testConfig.bffBaseUrl);
    await adminClient.login(testConfig.admin);
    const response = await adminClient.updateClaimStatusResponse(
      claim.claimId,
      'APPROVED'
    );

    expect(response.status()).toBe(400);
    expect(response.headers()['content-type']).toMatch(/json/);
  });

});
