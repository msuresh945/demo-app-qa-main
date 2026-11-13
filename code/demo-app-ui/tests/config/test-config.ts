export interface TestUser {
  email: string;
  password: string;
  role: 'CLAIMANT' | 'ADMIN';
}

export const testConfig = {
  uiBaseUrl: process.env.BASE_URL ?? 'http://localhost:3001',
  bffBaseUrl: process.env.BFF_API_URL ?? 'http://localhost:8090',
  claimant: {
    email: process.env.CLAIMANT_EMAIL ?? 'claimant@demo.com',
    password: process.env.CLAIMANT_PASSWORD ?? 'Claimant123!',
    role: 'CLAIMANT',
  } satisfies TestUser,
  admin: {
    email: process.env.ADMIN_EMAIL ?? 'admin@demo.com',
    password: process.env.ADMIN_PASSWORD ?? 'Admin123!',
    role: 'ADMIN',
  } satisfies TestUser,
} as const;
