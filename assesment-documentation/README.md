# Chubb Claims Management – QA Assessment

This folder contains the QA assessment documentation for the Chubb Claims Management application.

I have organized the documents to separate the testing approach, actual execution results, failure investigation and AI-assisted development activities. This makes it easier to understand the work completed and the decisions made during the assessment.

## Recommended Reading Order

1. **[Test Strategy](./TEST-STRATEGY.md)**  
   Explains the application architecture, business workflows, risk-based priorities, testing approach, coverage areas and known limitations.

2. **[Test Execution Report](./TEST-EXECUTION-REPORT.md)**  
   Summarizes the executed UI, BFF, Claims Service, Playwright API, Playwright UI and database integration tests, including execution results.

3. **[Test Failure Analysis](./TEST-FAILURE-ANALYSIS.md)**  
   Documents the issues identified during testing, investigation findings, root causes where established, and recommended corrective actions.

4. **[AI Working Journal](./AI-WORKING-JOURNAL.md)**  
   Records how I used AI during application analysis, framework development, test implementation and debugging, including the decisions I made and how I validated the generated work.

## Implementation Summary

### Existing Test Suite Improvements

- Updated UI theme persistence tests to match the application's `sessionStorage` implementation.
- Improved the long-text input test in Claim Wizard Step 2 to avoid unnecessary typing overhead.
- Updated Claims Service test setup to align with the current constructor dependencies, configuration and Kafka event serialization behaviour.
- Kept the changes limited to the affected test implementations without modifying production code.

### Playwright Automation Framework

Implemented a reusable Playwright framework using TypeScript.

The framework includes:

- Page Object Model for claimant and administrator workflows.
- Reusable fixtures for common test setup.
- Separate test data and configuration.
- A reusable BFF API client with CSRF handling.
- HTML and JUnit reporting.
- Trace collection and failure evidence configuration.
- Separate API and UI end-to-end test suites.

### Playwright API Coverage

The API suite covers:

- Authenticated claimant claim retrieval.
- Invalid claim submission and validation.
- Unauthenticated access to protected endpoints.
- Administrator claim status updates.
- Claimant authorisation restrictions.
- Invalid claim status transitions.

### Playwright UI End-to-End Coverage

The UI suite covers:

- Claim submission and real-time status update workflow.
- Claim wizard validation and step-to-step data persistence.
- Claim details verification.
- Administrator claim filtering.

The real-time lifecycle scenario uses separate claimant and administrator browser contexts. The claimant page remains open while the administrator updates the claim, allowing the test to validate the actual automatic notification behaviour.

### Claims Service Database Integration Coverage

- Strengthened claim persistence verification, including incident date.
- Extended status update and retrieval coverage.
- Reused the existing `@DataJpaTest` and Testcontainers PostgreSQL setup.

## Current Limitations and Known Issues

The following issues and coverage limitations were identified during the assessment:

- **Invalid status transitions:** The API currently returns HTTP 500 instead of the expected HTTP 400 because the exception is not explicitly mapped by the Claims Service exception handler.
- **Claim wizard date persistence:** The incident date is not restored correctly into the HTML date input after the wizard step is unmounted and mounted again.
- **Real-time claim notifications:** The Debezium connector task fails because the expected PostgreSQL publication is missing. The complete downstream event-to-WebSocket notification flow still requires further validation.
- **Cross-claimant isolation:** Additional claimant accounts are required to complete dedicated data-isolation testing.
- **BFF integration:** Existing downstream adapter tests use mocked Claims Service clients. A live HTTP integration test against a running Claims Service remains a future improvement.

These issues are documented rather than hidden by weakening test assertions or introducing manual refreshes, mocked events or other workarounds.

## Running the Main Test Suites

### Prerequisites

Before running the tests:

- Ensure Docker Desktop is running.
- Start the required backend services and application infrastructure.
- Ensure the frontend API client has been generated.
- Make sure the application and test user credentials are configured.

### Playwright API Tests

From `code/demo-app-ui`:

```powershell
npx playwright test tests/api --project=chromium --workers=1
```

### Playwright UI End-to-End Tests

From `code/demo-app-ui`:

```powershell
npx playwright test tests/e2e --project=chromium --workers=1
```

### Claims Service Unit Tests

From `code/claims-service`:

```powershell
mvn test
```

### Claims Service Database Integration Tests

From `code/claims-service`:

```powershell
mvn '-Dtest=ClaimRepositoryIntegrationTest' '-Dsurefire.excludedGroups=' test
```

The database integration tests require Docker Desktop because Testcontainers starts a temporary PostgreSQL container.