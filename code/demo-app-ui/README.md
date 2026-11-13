This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Playwright automation

The Playwright suite uses page objects and authenticated claimant/admin fixtures.
It includes the two-context claim lifecycle test in `tests/e2e` and BFF contract
tests in `tests/api`.

Start the required BFF, claims service, infrastructure, and UI dependencies,
then run:

```bash
npx playwright install chromium
npx playwright test
```

The test configuration defaults to `http://localhost:3001` for the UI and
`http://localhost:8090` for the BFF. Override them with `BASE_URL` and
`BFF_API_URL`; `NEXT_PUBLIC_BFF_URL` must point to the same BFF so the browser
WebSocket connects to `/api/ws/claims`.

The lifecycle test deliberately verifies that the claimant page changes from
`Submitted` to `Under Review` without refresh or API substitution. If the
WebSocket is connected but the event broker/consumer is not delivering the
claim event, that test remains failed rather than masking the limitation.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
