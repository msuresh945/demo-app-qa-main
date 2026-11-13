# Test Strategy – Insurance Claims Application

I started by exploring the application from both the claimant and administrator perspectives to understand the main features, user journeys and how the different application components interact.

The application supports an insurance claim submission and review process. Claimants can submit new claims and track their claim status, while administrators can view submitted claims, search and filter claims, and update their status.

Based on my initial exploration, I identified the following as the main areas requiring testing:

- Claim submission and input validation.
- Claim retrieval and claim details.
- Claim status management and valid status transitions.
- Authentication and role-based access control.
- Data persistence and integrity.
- API communication between application components.
- Real-time claim status updates.
- Error handling and application stability.

My approach is to focus on the business-critical workflows first and then expand coverage across the different application layers.

## 2. Environment Setup and Initial Application Assessment

### 2.1 Environment Setup

I downloaded and extracted the application from the assessment-provided ZIP package and configured the development environment on Windows using VS Code and Docker Desktop.

The following activities were completed:

- Installed and started Docker Desktop.
- Opened the application repository in VS Code.
- Used the VS Code terminal to execute the application setup commands.
- Started the application infrastructure using Docker Compose.
- Generated the frontend API client.
- Built and started the UI container.
- Verified that the application was accessible and that I could log in using the provided admin credentials.

### 2.2 Initial Application Startup Issue

During the initial application startup, the UI encountered the following build-time error:

`Module not found: Can't resolve './generated'`

The error originated from:

`src/lib/api/bff-client.ts`

The frontend referenced generated API types that were not available in the fresh workspace.

### 2.3 Root Cause and Resolution

During the investigation, I found that:

- The frontend depends on TypeScript API client files generated from the backend OpenAPI specification.
- The OpenAPI specification is available at `code/bff-service/src/main/resources/openapi/bff-api.yml`.
- The generated API client is expected under `src/lib/api/generated`.
- The generated directory is excluded through `.gitignore`, so it is not available in a fresh checkout.
- The API generation command is configured in the frontend `package.json`.
- The development startup command does not automatically generate the API client.

I resolved this by executing the following command from the `code/demo-app-ui` directory:

```bash
npm run generate:api
```

I then restarted the UI using:

```bash
npm run dev
```

The UI container was also built and started using:

```bash
docker compose -f docker-compose.apps.yml up --build ui
```

**Validation outcome:** The application started successfully, and I was able to log in using the provided admin credentials.

**Testing implication:** A fresh checkout may encounter the same issue unless the API client generation step is performed before starting the UI. This should be included in the project setup instructions.

## 3. Application Architecture

While exploring the source code, I identified the following main components:

| Component | Purpose |
|---|---|
| UI | Provides separate interfaces for claimants and administrators |
| BFF Service | Handles frontend-facing requests and authentication |
| Claims Service | Manages claim creation, retrieval and status updates |
| PostgreSQL | Stores application and claim data |
| Kafka | Handles event communication between services |
| Debezium | Captures database changes for event communication |
| Redis | Supports caching |
| Keycloak | Handles authentication and identity management |
| WebSocket | Supports real-time claim status updates |

The frontend is built using Next.js and React, while the backend services use Spring Boot.

Understanding these components helped me identify where different types of testing would provide the most value. For example, UI tests validate user journeys, API tests validate request and response behaviour, and database integration tests validate persistence.

## 4. Application Exploration and Key Workflows

I explored the application by navigating through the claimant and administrator interfaces and understanding the main user journeys.

### 4.1 Claim Submission

From the claimant side, I explored the claim submission process. It follows a three-step flow:

1. **Incident Details:** Enter the incident date, location and claim amount.
2. **Supporting Details:** Provide a description of what happened.
3. **Review and Submit:** Review the entered information and submit the claim.

After successful submission, the claim should be available for administrators to review.

### 4.2 Claim Management

From the administrator dashboard, I explored the following features:

- Viewing submitted claims.
- Searching and filtering claims.
- Opening individual claim details.
- Updating claim status.
- Viewing dashboard information.
- Managing users.

### 4.3 Claim Status Transitions

I reviewed the available claim status transitions to understand which updates are allowed.

| Current Status | Allowed Next Status |
|---|---|
| Submitted | Under Review, Rejected |
| Under Review | Submitted, Approved, Rejected |
| Approved | Closed |
| Rejected | Closed |
| Closed | No further transitions |

These transitions are important from a business perspective. The application should allow valid transitions and reject invalid ones with an appropriate response.

### 4.4 Real-Time Updates

The application is designed to support real-time status updates through WebSocket communication.

When an administrator updates a claim, the claimant should see the updated status without manually refreshing the page.

I treated this as an important end-to-end scenario because it involves multiple components working together, including the database change event flow and WebSocket notification handling.

## 5. Risk-Based Testing Approach

After exploring the application, I prioritised testing based on business impact, data integrity and access control.

### 5.1 Claim Submission

- Verify that claimants can submit valid claims.
- Check mandatory fields and input validation.
- Validate incident date restrictions, including future dates.
- Check claim amount and description validation.
- Verify that submitted claim details are saved correctly.
- Check that entered data is retained when navigating between wizard steps.
- Verify appropriate behaviour for invalid submissions.

### 5.2 Claim Management

- Verify that administrators can view claims.
- Check claim search and filtering.
- Verify that claim details are displayed correctly.
- Check that administrators can update claim statuses.
- Verify valid and invalid status transitions.
- Confirm that updated statuses are reflected when claim details are retrieved again.

### 5.3 User Access and Permissions

- Verify that administrators can access claim management features.
- Verify that claimants can submit and view their claims.
- Check that claimants cannot access administrator-only functionality.
- Verify that unauthenticated users cannot access protected endpoints.
- Validate role-based access restrictions.
- Verify that users cannot access or modify claims belonging to other users.

### 5.4 Real-Time Updates

- Verify that claim status changes are reflected on the claimant interface.
- Check that updates are received without manually refreshing the page.
- Investigate the behaviour when event communication or WebSocket connections are unavailable.
- Verify that the correct claim is updated when multiple claims exist.

### 5.5 Data Integrity and Persistence

- Verify that claim details are persisted correctly.
- Validate claimant association and claim status persistence.
- Verify that status changes are retained when the claim is retrieved again.
- Check mandatory database relationships and constraints.
- Verify that data returned by the API is consistent with the stored data.

### 5.6 Error Handling

- Check how the application responds to invalid inputs.
- Verify appropriate HTTP status codes and error responses.
- Check how the application behaves when dependent services are unavailable.
- Verify that backend failures do not result in misleading success messages.
- Check that useful error information is returned without exposing unnecessary internal details.

I gave higher priority to scenarios that could affect claim creation, claim data integrity, access control and claim status management.

## 6. Test Coverage Approach

I approached testing at different levels rather than relying on a single type of testing.

### 6.1 Unit and Component Testing

The provided project already contained unit and component tests covering individual functions, stores, validation rules, UI components and backend business logic.

I reviewed and executed these tests to understand the existing coverage and identify issues in the test implementations.

Where I identified outdated test assumptions or missing test configuration, I updated the affected tests without changing the production implementation.

The main areas covered include:

- UI component behaviour and validation.
- State management and store behaviour.
- Backend business logic and use cases.
- Service-level event publishing behaviour.
- BFF controller and adapter behaviour.
- Authentication and authorisation logic.

### 6.2 API Testing

I added Playwright API tests to validate the main BFF endpoints independently of the UI.

The coverage includes:

- Authenticated claimant retrieving their claims.
- Invalid claim submission and validation response.
- Unauthenticated access to protected endpoints.
- Administrator updating claim status.
- Claimant attempting to access administrator-only claim data.
- Claimant attempting to update claim status.
- Administrator attempting an invalid status transition.

These tests help validate the API contract, authentication, authorisation and error handling.

### 6.3 Database Integration Testing

I reviewed the existing Claims Service database integration tests and strengthened the coverage around persistence.

The integration tests use `@DataJpaTest`, Testcontainers and PostgreSQL to validate repository behaviour against an actual database rather than relying only on mocked repositories.

The coverage includes:

- Saving and retrieving claims.
- Persisting claimant information and claim details.
- Validating incident date persistence.
- Verifying claim status and creation information.
- Checking ordering and status-based filtering.
- Validating database relationships and constraints.
- Checking that a claim status update can be retrieved again.

This provides additional confidence in the Claims Service persistence layer.

### 6.4 BFF Service Testing

I also reviewed the existing BFF test coverage.

The existing tests include:

- BFF adapter tests using mocked Claims Service API clients.
- Successful claim submission and retrieval scenarios.
- Handling downstream error responses such as 400, 403, 404 and 500.
- Service-account token refresh handling after an unauthorised response.
- Controller tests for claim submission, retrieval and authentication.
- Role-based access tests covering claimant, administrator and unauthenticated access.

These tests provide useful coverage of the BFF's controller, adapter and security behaviour.

One important distinction is that the existing adapter tests use mocked downstream clients. They validate the BFF's handling of downstream responses but do not constitute a full live HTTP integration test between the BFF and Claims Service. A dedicated service-to-service integration test remains a possible future improvement.

### 6.5 End-to-End Functional Testing

I added Playwright UI tests to cover the main business workflows across the claimant and administrator interfaces.

The primary end-to-end scenario is:

**Claimant submits a claim → Admin views the claim → Admin updates the status → Claimant receives the updated status.**

Additional UI scenarios cover:

- Claim wizard validation.
- Data retention when navigating between wizard steps.
- Claim details verification.
- Administrator claim filtering.

The real-time scenario is intentionally designed as a genuine end-to-end test. It should validate the claimant interface receiving an automatic status update, without relying on manual page refreshes or mocked notification events.

## 7. Test Automation Framework Approach

For the additional UI and API tests, I used Playwright with TypeScript.

The intention was to keep the tests maintainable and reusable rather than placing all interactions and assertions directly inside individual test cases.

The automation approach includes:

- Reusable page objects for claimant and administrator workflows.
- Shared fixtures for common setup and test dependencies.
- API client methods for reusable backend requests.
- Separation of test data and test configuration.
- Independent API and UI test coverage.
- Assertions based on expected business behaviour.
- HTML and JUnit reporting.
- Trace collection on the first retry to support failure investigation.

The Playwright configuration is set up to use Chromium locally and Firefox in CI. CI execution also uses retry and worker settings to improve execution stability.

The UI web server is started through the Playwright configuration. However, the backend services and required infrastructure must be available separately before running the complete tests.

The generated frontend API client must also be available before the UI starts.

## 8. Test Data and Environment Considerations

Test data plays an important role in validating the different user journeys, particularly where role-based access and data ownership are involved.

The current assessment environment provides preconfigured user accounts for testing the claimant and administrator workflows.

The following considerations are relevant to reliable test execution:

- Use separate claimant and administrator sessions when validating role-based workflows.
- Keep test data independent wherever possible to avoid dependencies between test cases.
- Use API-based setup where it is appropriate to prepare data for UI scenarios.
- Ensure test data is available before executing dependent scenarios.
- Validate that tests do not rely on previously created records unless that dependency is intentional.
- Use additional claimant accounts to validate data isolation between users.

The supplied environment has limited preconfigured claimant test data. Additional claimant accounts would be useful for expanding cross-user access and data-isolation coverage.

## 9. Test Execution and Reporting Approach

I maintained a separate test execution report to capture the actual execution results and observations from the different test suites.

The reporting approach covers:

- Test suite and scenario details.
- Execution status.
- Passed and failed test counts.
- Failure descriptions and observations.
- Defects and issues identified during testing.
- Supporting execution evidence where available.

I also maintained a separate test failure analysis document to record the investigation, root causes and recommended corrective actions for the issues identified during execution.

Keeping these documents separate allows the Test Strategy to remain focused on the overall testing approach, while the execution report and failure analysis provide the detailed results.

## 10. Risks and Dependencies

During the assessment, I identified a few dependencies that could affect test execution and the reliability of the results.

| Dependency / Risk | Testing Impact | Consideration |
|---|---|---|
| Generated frontend API client | UI may not start in a fresh checkout | Generate the API client before starting the UI |
| Backend services | UI and API tests depend on backend availability | Ensure required services are running |
| Keycloak authentication | Tests depend on valid user accounts and roles | Maintain suitable claimant and administrator credentials |
| PostgreSQL | Claim persistence depends on database availability | Ensure database and migrations are ready |
| Kafka and Debezium | Real-time event flow depends on CDC infrastructure | Validate connector configuration and event processing |
| WebSocket communication | Automatic status updates depend on notification delivery | Validate the complete event-to-client flow |
| Test data availability | Limits role and data-isolation scenarios | Provide additional claimant accounts and reusable test data |

These dependencies should be considered when executing the automation suite locally or as part of a CI pipeline.

## 11. Conclusion

I approached the assessment by first understanding the application and its business workflows, then reviewing the existing test suites and identifying areas where additional coverage would be useful.

The existing unit and component tests provided a good starting point. I also strengthened selected tests, added Playwright API and UI end-to-end coverage, and extended the Claims Service database integration tests.

The additional testing helped identify areas that require further attention, including incident date persistence, invalid status transition error handling and the CDC infrastructure configuration affecting real-time updates.

My focus throughout the exercise was not just to increase the number of tests, but to make sure that the tests validate meaningful business behaviour and provide useful feedback when something goes wrong.

The current implementation provides a foundation for further automation and regression coverage. The next priority should be to address the identified issues, validate the complete claim lifecycle including real-time notifications, and expand the test data and service integration coverage.

Detailed test execution results, including the number of tests executed, passed and failed, are documented separately in the Test Execution Report. The investigation and root-cause analysis of identified failures are captured in the Test Failure Analysis document.