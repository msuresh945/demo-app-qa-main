import { faker } from '@faker-js/faker';

export interface ClaimTestData {
  incidentDate: string;
  incidentLocation: string;
  description: string;
  claimAmount: number;
}

export function createClaimTestData(): ClaimTestData {
  return {
    incidentDate: faker.date
      .recent({ days: 30 })
      .toISOString()
      .split('T')[0],
    incidentLocation: `${faker.location.streetAddress()}, ${faker.location.city()}`,
    description: `QA automation claim ${faker.string.uuid()} for water damage assessment`,
    claimAmount: faker.number.float({ min: 100, max: 10000, fractionDigits: 2 }),
  };
}
