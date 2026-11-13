## 1. Application Overview

I started by exploring the application from both the claimant and admin perspectives to understand how the main features work and how the different parts of the application interact.

The application supports the insurance claim submission and review process. Claimants can submit new claims and track their status, while administrators can view submitted claims and update their status.

Based on my initial exploration, I identified claim submission, claim management, status updates and user access as the main areas that need to be covered during testing.

## 2. Environment Setup and Initial Application Assessment

### 2.1 Environment Setup

The application was downloaded and extracted from the assessment-provided ZIP package. I configured the development environment on Windows using VS Code and Docker Desktop.

The following activities were completed:

- Installed and started Docker Desktop.
- Opened the application repository in VS Code.
- Used the VS Code terminal to execute the application setup commands.
- Started the application infrastructure using Docker Compose.
- Built and started the UI container.
- Successfully logged in to the application using the provided admin credentials.

### 2.2 Initial Application Startup

During the initial application startup, the UI encountered a build-time error:

`Module not found: Can't resolve './generated'`

The error originated from:

`src/lib/api/bff-client.ts`

The file referenced generated API types that were not present in the workspace.

### 2.3 Root Cause Identified

During the investigation, I found the following:

- The frontend depends on TypeScript API client files generated from the backend OpenAPI specification.
- The OpenAPI specification is available at `code/bff-service/src/main/resources/openapi/bff-api.yml`.
- The generated API client is expected under `src/lib/api/generated`.
- The generated directory is excluded through `.gitignore`, so it is not available in a fresh checkout.
- The API generation command is configured in the frontend `package.json`.
- API generation is associated with the production build lifecycle, but the development startup command does not automatically generate the API client.
- The UI Docker build also starts the development server without generating the API client.

### 2.4 Resolution and Validation

I executed the following command from the `code/demo-app-ui` directory:

```bash
npm run generate:api
```

After generating the API client, I restarted the UI using:

```bash
npm run dev
```

The UI container was subsequently built and started using:

```bash
docker compose -f docker-compose.apps.yml up --build ui
```

**Validation outcome:** The application started successfully, and I was able to log in using the provided admin credentials.

**Testing implication:** A clean checkout or fresh development environment may encounter the same missing generated-client issue unless the API generation step is performed before starting the UI. This setup step should be included in the project setup instructions.

## 3. Application Architecture

While exploring the source code, I identified the following main components:

| Component | Purpose |
|---|---|
| UI | Provides separate interfaces for claimants and administrators |
| BFF Service | Handles frontend-facing requests and authentication |
| Claims Service | Manages claim creation, retrieval and status updates |
| PostgreSQL | Stores application and claim data |
| Kafka | Handles event communication between services |
| WebSocket | Supports real-time claim status updates |

The frontend source code uses Next.js and React, while the backend services are built using Spring Boot.

## 4. Application Exploration and Key Workflows

I explored the application by navigating through the claimant and admin interfaces and understanding the main user journeys.

### 4.1 Claim Submission

From the claimant side, I explored the claim submission process. It follows a three-step flow:

1. **Incident Details:** Enter the incident date, location and claim amount.
2. **Supporting Details:** Provide a description of what happened.
3. **Review and Submit:** Review the entered information and submit the claim.

After submission, the claim should be available for administrators to review.

### 4.2 Claim Management

From the admin dashboard, I explored the available claim management features, including:

- Viewing submitted claims.
- Searching and filtering claims.
- Opening individual claim details.
- Updating claim status.
- Viewing dashboard information.
- Managing users.

### 4.3 Claim Status Updates

I also explored the available claim status transitions to understand which updates are allowed.

| Current Status | Allowed Next Status |
|---|---|
| Submitted | Under Review, Rejected |
| Under Review | Submitted, Approved, Rejected |
| Approved | Closed |
| Rejected | Closed |
| Closed | No further transitions |

These transitions are important because invalid status updates should be prevented by the application.

### 4.4 Real-Time Updates

The application also supports real-time status updates through WebSocket communication.

This is an important area to test because when an administrator updates a claim, the claimant should receive the latest status without having to manually refresh the page.

## 5. Risk-Based Testing Approach

After exploring the application, I identified a few workflows that I consider more important from a business perspective.

My initial testing priorities are:

### Claim Submission

- Verify that claimants can submit valid claims.
- Check mandatory fields and input validation.
- Verify that submitted claim details are saved correctly.
- Check boundary values and invalid inputs.

### Claim Management

- Verify that administrators can view and search for claims.
- Check that claim details are displayed correctly.
- Verify that the available status transitions are followed.
- Check that invalid status updates are rejected.

### User Access and Permissions

- Verify that administrators can access claim management features and update claim statuses.
- Verify that claimants can submit and view their own claims.
- Check that claimants cannot view or modify claims belonging to other users.
- Verify that users cannot access protected functionality without logging in.
- Check that each role is restricted to the features intended for that role.

### Real-Time Updates

- Verify that status changes are reflected on the claimant side.
- Check how the application handles connection failures or delayed updates.
- Verify that the correct claim status is displayed after an update.

### Error Handling

- Check how the application responds to invalid inputs, failed requests and backend errors.
- Verify that meaningful error messages are displayed to users.
- Check how the application behaves when dependent services are unavailable.

I plan to give higher priority to scenarios that affect claim creation, data integrity, access control and claim status management.

## 6. Test Coverage Approach

I plan to approach testing at different levels rather than relying on a single type of testing.

### 6.1 Unit and Component Testing

The provided project already contains unit and component tests covering individual functions, stores, validation rules and UI components.

I started by reviewing and executing these tests to understand the existing coverage and identify any issues.

### 6.2 API and Integration Testing

I plan to focus on communication between the BFF and Claims Service, including:

- Claim creation, retrieval and status updates.
- Authentication and authorization.
- Request validation and error handling.
- Database persistence.
- Kafka event communication.

### 6.3 End-to-End Functional Testing

In addition to the existing tests, I plan to cover the main business workflows across the claimant and admin interfaces.

The primary end-to-end scenario will be:

**Claimant submits a claim → Admin views the claim → Admin updates the status → Claimant receives the updated status.**

This will help validate the complete workflow across the different application components.

## 7. Existing Test Suite Review and Execution

As part of the assessment, I reviewed and executed the existing test suites across the UI, BFF Service and Claims Service to understand the current test coverage and identify any issues.

The initial UI test execution identified two issues related to theme persistence and long-text input handling. I investigated both and updated the affected tests without making changes to the application code.

During BFF Service test execution, all existing tests passed successfully without any failures.

While executing the Claims Service tests, I identified a few issues in the existing test implementations. These were related to an outdated constructor, changes in Kafka event serialization and a configuration property that was not initialized in the Mockito test setup. I updated the affected tests to align with the current production implementation.

**Test execution summary:**

| Component | Tests Executed | Passed | Failed | Status |
|---|---:|---:|---:|---|
| UI | 266 | 266 | 0 | Passed |
| BFF Service | 213 | 213 | 0 | Passed |
| Claims Service | 197 | 197 | 0 | Passed |
| **Total** | **676** | **676** | **0** | **Passed** |

All three test suites completed successfully after the identified test issues were resolved.

The existing tests provide coverage for individual UI components, stores, validation rules, backend business logic and service-level integrations.

However, passing the existing test suites does not necessarily validate the complete business workflow across all application components. Additional testing is still needed to cover the claimant and admin journey end to end.