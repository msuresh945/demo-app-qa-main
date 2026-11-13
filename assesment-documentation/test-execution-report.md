# Test Execution Report – Insurance Claims Application

This report summarises the testing activities carried out for the Insurance Claims Application.

I started by reviewing and executing the existing test suites across the UI, BFF Service and Claims Service. After understanding the current test coverage, I investigated the failures identified during the initial execution and updated the affected test implementations.

In addition to the existing tests, I implemented and executed Playwright API and UI end-to-end tests to cover important business workflows. I also reviewed and strengthened the Claims Service database integration tests.

The objective was not just to execute the available tests, but also to identify gaps in the existing coverage and understand how the application behaves across its different components.

## 2. Initial Test Execution Results

I first executed the existing test suites without making any changes to understand their current status.

The initial results were:

| Component | Tests Executed | Passed | Failed | Initial Status |
|---|---:|---:|---:|---|
| UI | 266 | 258 | 8 | Failed |
| BFF Service | 213 | 213 | 0 | Passed |
| Claims Service | 197 | 188 | 9 | Failed |

The initial execution identified failures in the UI and Claims Service test suites, while all BFF Service tests passed successfully.

## 3. Issues Identified and Fixes

### 3.1 UI

During the initial UI test execution, I found two issues in the existing tests.

**Theme Store Persistence Tests**

- The tests were checking `localStorage`, but the application store was actually using `sessionStorage`.
- I updated the affected test cases to use `sessionStorage`, matching the application implementation.

**Claim Wizard Step 2 Tests**

- One of the tests was timing out while entering a large amount of text into the description field.
- The issue was caused by `userEvent.type()` simulating every keystroke, which made the operation slower than necessary.
- I replaced it with `fireEvent.change()` to update the input value in a single event.

**Result:** Both issues were resolved, and the affected tests passed. No changes were made to the application code.

### 3.2 BFF Service

While running the BFF Service tests, I initially encountered an issue with the Maven wrapper because the repository was missing the `maven-wrapper.properties` configuration file.

Since Maven was already installed on my system, I used the locally installed Maven instead:

```bash
mvn clean test
```

The tests executed successfully without any failures or errors.

**Result:** All 213 BFF Service tests passed. No changes to the test files or production code were required.

### 3.3 Claims Service

During the initial Claims Service test execution, I encountered nine failures. On investigating them, I found three issues in the existing test implementations.

**UpdateClaimStatusUseCaseTest**

- The test was using an older constructor with three dependencies.
- The current production constructor requires an additional `ApplicationEventPublisher` dependency.
- I added a mock for `ApplicationEventPublisher` and updated the test to use the current constructor.

**KafkaDomainEventPublisherTest**

- The existing tests were mocking the previous event serialization behaviour.
- The current Kafka publisher creates an `ObjectNode` envelope before serializing the event.
- I updated the mocks to handle `ObjectNode` creation and serialization.

**CreateClaimUseCaseTest**

- The `cdcEnabled` property was not initialized in the Mockito test setup because Spring's `@Value` injection was not applied.
- This caused the property to default to `false`, resulting in domain events being cleared.
- I added the required event publisher mock and explicitly initialized `cdcEnabled` to the application's default value (`true`).

**Result:** The identified issues were resolved by updating the affected test files. No production implementation files were modified.

## 4. Final Existing Test Suite Results

After making the necessary changes, I reran the existing test suites to verify that the fixes worked as expected.

The final results were:

| Component | Total Tests | Passed | Failed | Errors | Skipped | Final Status |
|---|---:|---:|---:|---:|---:|---|
| UI | 266 | 266 | 0 | 0 | 0 | Passed |
| BFF Service | 213 | 213 | 0 | 0 | 0 | Passed |
| Claims Service | 197 | 197 | 0 | 0 | 0 | Passed |
| **Total** | **676** | **676** | **0** | **0** | **0** | **Passed** |

All three existing test suites passed after the identified test implementation issues were resolved.

## 5. Additional Playwright API Testing

After reviewing the existing test coverage, I added Playwright API tests to validate important BFF endpoints independently of the UI.

The intention was to verify not only successful API operations but also authentication, authorisation and error handling.

### 5.1 Scenarios Covered

The following scenarios were implemented:

1. Authenticated claimant retrieves their claims.
2. Invalid claim submission returns an appropriate validation response.
3. Unauthenticated users cannot retrieve protected claim information.
4. Administrator successfully updates a claim status.
5. Claimant cannot access the administrator claims list.
6. Claimant cannot update a claim status.
7. Administrator attempts an invalid status transition.

### 5.2 Execution Results

| Scenario | Expected Behaviour | Result |
|---|---|---|
| Claimant retrieves own claims | HTTP 200 | Passed |
| Invalid claim submission | HTTP 400 with validation response | Passed |
| Unauthenticated claim retrieval | HTTP 401 | Passed |
| Admin updates claim status | HTTP 200 with updated status | Passed |
| Claimant accesses admin claims list | HTTP 403 | Passed |
| Claimant updates claim status | HTTP 403 | Passed |
| Admin attempts invalid status transition | HTTP 400 with appropriate error response | Failed |

**Execution summary: 7 tests executed, 6 passed and 1 failed.**

### 5.3 Failure Investigation – Invalid Status Transition

The failed test exposed an issue in the application's error handling.

When an administrator attempts an invalid status transition, the Claims Service raises an `InvalidStatusTransitionException`. However, the exception is not explicitly handled by the `ClaimExceptionHandler`.

As a result, the API returns HTTP 500 instead of the expected HTTP 400 response.

The recommended fix is to add explicit exception handling and return an appropriate client error response.

I kept the test assertion unchanged because the test should validate the expected API behaviour rather than accept an incorrect response.

### 5.4 Test Data Limitation

I also identified a limitation while considering cross-claimant data isolation testing.

The supplied environment had only one preconfigured claimant account. Creating an additional claimant dynamically was blocked by the BFF-to-Keycloak admin authentication setup.

Because of this, I could not complete a dedicated scenario to verify that one claimant cannot access another claimant's claims.

This remains an area for additional testing once suitable claimant accounts and test data are available.

## 6. Additional Playwright UI End-to-End Testing

I added Playwright UI tests to cover the main claimant and administrator workflows.

The objective was to validate the application from a user's perspective and verify that the main operations work across the UI and backend.

### 6.1 Scenarios Covered

The following scenarios were implemented:

1. Claimant submits a claim, administrator updates its status, and the claimant receives the update in real time.
2. Claim wizard validation and data persistence when navigating between steps.
3. Claimant opens a submitted claim and verifies its details.
4. Administrator filters claims and verifies the expected claim is displayed.

### 6.2 Execution Results

| Scenario | Result |
|---|---|
| Claim lifecycle and real-time status update | Failed |
| Claim wizard validation and data persistence | Failed |
| Claim details verification | Passed |
| Administrator claim filtering | Passed |

**Execution summary: 4 tests executed, 2 passed and 2 failed.**

### 6.3 Failure Investigation – Real-Time Claim Status Update

The test successfully completed the main claim lifecycle steps, including claimant login, claim submission and the administrator updating the claim status.

The issue occurred during the real-time verification. The claimant interface did not automatically reflect the status change made by the administrator.

I reviewed the frontend implementation and confirmed that claim notifications and status updates are expected to be handled through WebSocket events.

As part of the investigation, I checked the Debezium and Kafka setup. The Debezium connector task was in a failed state, and the required PostgreSQL publication (`dbz_publication`) was missing. Kafka CDC offsets also remained unchanged, suggesting that new CDC events were not being generated.

I also checked the admin dashboard cache controls (`Load from Cache` and `Flush Cache & Reload`) to understand whether they were related to the issue. These controls manage dashboard statistics and do not refresh the admin claims list. Their behaviour appeared to be working as intended.

Based on these findings, the issue appears to be related to the CDC infrastructure configuration. The exact downstream point where the notification flow stops still needs to be confirmed.

I kept the E2E test assertions unchanged rather than introducing manual page refreshes, mocked events or other workarounds. This ensures that the test continues to validate the actual real-time behaviour of the application.

**Recommended next steps:**

- Configure the required PostgreSQL publication.
- Restart and verify the Debezium connector.
- Confirm that CDC events are reaching Kafka.
- Verify the BFF event handling and WebSocket notification flow.
- Rerun the real-time E2E test.

### 6.4 Failure Investigation – Claim Wizard Date Persistence

The claim wizard test identified an issue when navigating away from the incident details step and returning to it.

During investigation, I found that the date field uses `valueAsDate: true`, which converts the input value into a JavaScript `Date` object.

The form data is stored in Zustand, and the wizard step is unmounted when navigating to another step. When the user returns to the first step, the stored `Date` object is supplied as the default value.

However, the HTML date input expects a value in `YYYY-MM-DD` string format. This creates a mismatch between the stored value and the input's expected format, resulting in the incident date not being restored correctly.

The recommended fix is to normalise the date value at the form input boundary while preserving the intended date value. Care should also be taken to avoid timezone-related date shifts.

I kept the assertion strict because the incident date should be retained when navigating between wizard steps.

## 7. Claims Service Database Integration Testing

In addition to the unit tests, I reviewed the existing Claims Service database integration tests to understand how well the repository and persistence layer were covered.

The existing tests use `@DataJpaTest` and Testcontainers with PostgreSQL, allowing the repository behaviour to be validated against an actual database rather than relying only on mocked repositories.

During the review, I identified opportunities to strengthen the persistence checks, particularly around incident date storage and claim status updates.

I extended the existing integration test coverage to include:

- Verification of incident date persistence.
- Verification of claim status updates.
- Retrieval of a claim after its status has been updated.
- Additional checks around the stored claim and claimant information.

### 7.1 Execution Results

| Component | Tests Executed | Passed | Failed |
|---|---:|---:|---:|
| Claims Service DB Integration | 7 | 7 | 0 |

The database integration test suite completed successfully using Testcontainers PostgreSQL.

One additional improvement for the persistence round-trip assertions is to explicitly call `entityManager.flush()` and `entityManager.clear()` before retrieving the updated entity. This ensures that the test reloads the record from PostgreSQL instead of potentially returning the same entity from the JPA first-level persistence context.

This improvement should be applied and the integration test rerun before treating the database reload assertion as fully verified.

### 7.2 BFF Integration Testing – Current Coverage

I also reviewed the existing BFF tests to understand the level of integration coverage.

The existing adapter tests use mocked Claims Service API clients to validate successful responses, downstream errors and service-account token refresh behaviour.

These tests provide useful coverage of how the BFF handles downstream responses, but they do not validate a live HTTP interaction between the BFF and Claims Service.

A dedicated service-to-service integration test remains a recommended improvement.

## 8. Consolidated Test Execution Summary

The following table provides an overview of the separate test suites executed during the assessment.

| Test Suite | Tests Executed | Passed | Failed |
|---|---:|---:|---:|
| UI Unit Tests | 266 | 266 | 0 |
| BFF Unit Tests | 213 | 213 | 0 |
| Claims Service Unit Tests | 197 | 197 | 0 |
| Playwright API Tests | 7 | 6 | 1 |
| Playwright UI E2E Tests | 4 | 2 | 2 |
| Claims Service DB Integration Tests | 7 | 7 | 0 |

The suites were executed and reported separately. The results should not be interpreted as one combined end-to-end execution.

The existing unit and component tests passed after the identified test implementation issues were resolved. The additional API, UI and database testing provided further coverage and helped identify issues that were not exposed by the existing tests alone.

## 9. Conclusion

I started by reviewing the existing test suites and understanding how the application behaves across the UI, BFF Service and Claims Service.

During the initial execution, I identified issues in some of the existing UI and Claims Service test implementations. I investigated the root causes and updated the affected tests without modifying the production implementation.

After that, I added Playwright API and UI end-to-end coverage to validate important claimant and administrator workflows. I also strengthened the Claims Service database integration tests to cover additional persistence scenarios.

The additional testing helped identify a few areas that require further attention:

- Invalid status transitions are returning an unexpected HTTP 500 response.
- The claimant interface is not receiving the expected automatic status update, with an issue identified in the CDC infrastructure configuration.
- The incident date is not being restored correctly when navigating between claim wizard steps.
- Additional claimant test data is needed to validate cross-user data isolation.
- A live BFF-to-Claims Service integration test would provide additional confidence in service communication.

Overall, the exercise helped me go beyond simply running the existing tests. It gave me an opportunity to understand the application, improve the existing test implementations, add coverage for important business scenarios and investigate issues across different application layers.

The detailed root-cause analysis and recommended corrective actions for the identified failures are documented separately in `test-failure-analysis.md`.