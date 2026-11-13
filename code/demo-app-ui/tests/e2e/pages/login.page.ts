import { expect, type Page } from '@playwright/test';
import type { TestUser } from '../../config/test-config';

export class LoginPage {
  constructor(private readonly page: Page) {}

  async open(): Promise<void> {
    await this.page.goto('/login');
  }

  async login(user: TestUser): Promise<void> {
    await this.page.getByLabel('Email').fill(user.email);
    await this.page.getByRole('textbox', { name: 'Password' }).fill(user.password);
    await this.page.getByRole('button', { name: 'Log In' }).click();
  }

  async expectAuthenticatedAs(user: TestUser): Promise<void> {
    await expect(this.page.getByText(`Welcome,`)).toBeVisible();
    if (user.role === 'ADMIN') {
      await expect(this.page.getByRole('button', { name: 'Claims' })).toBeVisible();
    } else {
      await expect(this.page.getByRole('button', { name: 'My Claims' })).toBeVisible();
    }
  }
}
