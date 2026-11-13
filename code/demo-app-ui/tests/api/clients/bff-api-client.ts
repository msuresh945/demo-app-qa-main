import { expect, type APIRequestContext, type APIResponse } from '@playwright/test';
import type { ClaimTestData } from '../../data/claim-test-data';
import type { TestUser } from '../../config/test-config';

export interface ClaimResponse {
  claimId: string;
  status: string;
  userId: string;
  description: string;
}

export class BffApiClient {
  private csrfToken: string | null = null;

  constructor(
    private readonly request: APIRequestContext,
    private readonly baseUrl: string
  ) {}

  csrfHeaders(): Record<string, string> {
    return this.csrfToken ? { 'X-XSRF-TOKEN': this.csrfToken } : {};
  }

  async login(user: TestUser): Promise<void> {
    await this.refreshCsrfToken();

    const response = await this.request.post(`${this.baseUrl}/api/auth/login`, {
      data: { email: user.email, password: user.password },
      headers: this.csrfHeaders(),
    });
    await expect(response, `Login should succeed for ${user.role}`).toBeOK();
    await this.refreshCsrfToken();
  }

  private async refreshCsrfToken(): Promise<void> {
    const response = await this.request.get(`${this.baseUrl}/api/auth/csrf`);
    await expect(response).toBeOK();
    const body = (await response.json()) as { token: string };
    this.csrfToken = body.token;
  }

  async submitClaim(data: ClaimTestData): Promise<ClaimResponse> {
    const response = await this.request.post(`${this.baseUrl}/api/claims`, {
      data,
      headers: this.csrfHeaders(),
    });
    expect(response.status()).toBe(201);
    return response.json() as Promise<ClaimResponse>;
  }

  async listClaims(): Promise<ClaimResponse[]> {
    const response = await this.request.get(`${this.baseUrl}/api/claims`);
    await expect(response).toBeOK();
    return response.json() as Promise<ClaimResponse[]>;
  }

  async getClaim(claimId: string): Promise<ClaimResponse> {
    const response = await this.request.get(`${this.baseUrl}/api/claims/${claimId}`);
    await expect(response).toBeOK();
    return response.json() as Promise<ClaimResponse>;
  }

  async listAdminClaims(): Promise<ClaimResponse[]> {
    const response = await this.request.get(`${this.baseUrl}/api/admin/claims`);
    await expect(response).toBeOK();
    return response.json() as Promise<ClaimResponse[]>;
  }

  async listAdminClaimsResponse(): Promise<APIResponse> {
    return this.request.get(`${this.baseUrl}/api/admin/claims`);
  }

  async updateClaimStatus(claimId: string, newStatus: string): Promise<ClaimResponse> {
    const response = await this.updateClaimStatusResponse(claimId, newStatus);
    await expect(response).toBeOK();
    return response.json() as Promise<ClaimResponse>;
  }

  async updateClaimStatusResponse(
    claimId: string,
    newStatus: string
  ): Promise<APIResponse> {
    return this.request.patch(
      `${this.baseUrl}/api/admin/claims/${claimId}/status`,
      { data: { newStatus }, headers: this.csrfHeaders() }
    );
  }

  expectStatus(response: APIResponse, status: number): void {
    expect(response.status()).toBe(status);
  }
}
