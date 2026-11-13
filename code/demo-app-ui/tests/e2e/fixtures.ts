import { test as base, expect, type Browser, type BrowserContext, type Page } from '@playwright/test';
import { testConfig, type TestUser } from '../config/test-config';
import { AdminClaimsPage } from './pages/admin-claims.page';
import { ClaimWizardPage } from './pages/claim-wizard.page';
import { ClaimsPage } from './pages/claims.page';
import { LoginPage } from './pages/login.page';

export interface AuthenticatedSession {
  context: BrowserContext;
  page: Page;
  loginPage: LoginPage;
  claimsPage: ClaimsPage;
  claimWizardPage: ClaimWizardPage;
  adminClaimsPage: AdminClaimsPage;
}

async function createSession(
  browser: Browser,
  user: TestUser
): Promise<AuthenticatedSession> {
  const context = await browser.newContext();
  const page = await context.newPage();
  const loginPage = new LoginPage(page);
  await loginPage.open();
  await loginPage.login(user);
  await loginPage.expectAuthenticatedAs(user);

  return {
    context,
    page,
    loginPage,
    claimsPage: new ClaimsPage(page),
    claimWizardPage: new ClaimWizardPage(page),
    adminClaimsPage: new AdminClaimsPage(page),
  };
}

type Fixtures = {
  claimantSession: AuthenticatedSession;
  adminSession: AuthenticatedSession;
};

export const test = base.extend<Fixtures>({
  claimantSession: async ({ browser }, provideFixture) => {
    const session = await createSession(browser, testConfig.claimant);
    await provideFixture(session);
    await session.context.close();
  },
  adminSession: async ({ browser }, provideFixture) => {
    const session = await createSession(browser, testConfig.admin);
    await provideFixture(session);
    await session.context.close();
  },
});

export { expect };
