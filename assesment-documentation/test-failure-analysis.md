# Test Failure Analysis and Defect Investigation

During the assessment, I executed the existing UI and backend unit tests and added Playwright API and end-to-end tests to validate the application's key business workflows.

During execution, I encountered a combination of test implementation issues, application defects and infrastructure-related issues.

I investigated the failures to understand their root causes, made the necessary corrections to the affected test cases and documented the application issues that require further attention.

This document captures the key findings, investigation details, corrective actions and testing decisions.

---

## 1. UI Unit Test Findings

### 1.1 Theme Store Persistence Tests

**File:** `tests/unit/use-theme-store.test.ts`

**What was the issue?**

Three persistence tests were checking `localStorage`, but the application was actually saving theme preferences in `sessionStorage`.

**What caused it?**

The test expectations did not match the storage mechanism used by the store.

**What I changed:**

Updated the three tests to use `sessionStorage` instead of `localStorage`. I also updated the test descriptions to reflect the change.

**Result:** All 11 theme store tests passed.

### 1.2 Wizard Step 2 Character Counter Test

**File:** `src/features/claims/components/wizard-step-2.test.tsx`

**What was the issue?**

The character counter test was timing out when entering a 950-character description.

**What caused it?**

The test was using `userEvent.type()` to enter 950 characters. This simulates typing each character individually. Since React Hook Form also performs validation on input changes, the test was taking longer than Vitest's default 5-second timeout.

**What I changed:**

Replaced `userEvent.type()` with `fireEvent.change()` for the long input test. This sets the entire description in a single change event while still allowing us to verify the character counter behaviour.

**Result:** All 22 Wizard Step 2 tests passed.

### 1.3 Overall Outcome

Both issues were related to the way the tests were written, rather than confirmed defects in the application.

After making these changes:

- All 11 theme store tests passed.
- All 22 Wizard Step 2 tests passed.
- The complete UI unit test suite passed during the subsequent execution.
- No changes were made to the production application code.

---

## 2. Claims Service Unit Test Findings

During the execution of the Claims Service test suite, I encountered failures in a few existing unit tests. On investigating them, I found that the tests were not fully aligned with the current production implementation.

### 2.1 Maven Wrapper Configuration

**File/Location:** Claims Service Maven wrapper

**Issue:**

The Maven wrapper could not start because the `.mvn/wrapper/maven-wrapper.properties` file was missing.

**Root cause:**

The repository did not contain the required Maven wrapper configuration.

**Resolution:**

Since Maven was already installed locally, I used the installed Maven to execute the tests:

```bash
mvn clean test
```

The Maven wrapper files were not modified.

### 2.2 UpdateClaimStatusUseCaseTest – Outdated Constructor

**File:** `UpdateClaimStatusUseCaseTest.java`

**Issue:**

The test was using an outdated constructor with three dependencies, whereas the current production implementation requires four dependencies.

**Root cause:**

`ApplicationEventPublisher` had been added as a constructor dependency in the production implementation, but the test had not been updated accordingly.

**Fix:**

Added a mock of `ApplicationEventPublisher` and updated the test to use the current constructor.

### 2.3 KafkaDomainEventPublisherTest – Outdated Serialization Mock

**File:** `KafkaDomainEventPublisherTest.java`

**Issue:**

The Kafka publisher tests were failing because they were mocking the previous event serialization behaviour.

**Root cause:**

The current `KafkaDomainEventPublisher` implementation creates an `ObjectNode` envelope before serializing the event. The existing tests were still mocking direct serialization of the original event, resulting in a null `ObjectNode`.

**Fix:**

Updated the test mocks to handle `createObjectNode()` and the serialization of `ObjectNode` instances, matching the current publisher implementation.

### 2.4 CreateClaimUseCaseTest – Missing Configuration Initialization

**File:** `CreateClaimUseCaseTest.java`

**Issue:**

The test assertion for domain events was failing because the expected events were being cleared during execution.

**Root cause:**

The `cdcEnabled` property is normally populated through Spring's `@Value` injection. Since the test uses Mockito without the Spring application context, this property was not initialized and defaulted to `false`.

As a result, the use case cleared the domain events.

**Fix:**

Added the required event publisher mock and explicitly initialized `cdcEnabled` to the application's default value (`true`) in the test.

### 2.5 Overall Outcome

The investigation identified three test implementation issues caused by changes in the production constructor, Kafka serialization behaviour and Spring configuration handling.

The affected test files were updated to match the current implementation.

Only test files were modified. No production implementation files were changed.

---

## 3. UI End-to-End Test Findings

Four Playwright UI end-to-end scenarios were implemented to validate the main claimant and administrator workflows.

### 3.1 Real-Time Claim Lifecycle – Notification Issue

**Test File:** `claim-lifecycle.spec.ts`

**Result:** Failed at the real-time claimant status assertion.

**Scenario:**

The test validates the complete claim lifecycle using separate browser contexts for the claimant and administrator.

The steps covered:

1. Log in as a claimant.
2. Open the claim submission wizard.
3. Enter incident details and supporting description.
4. Review and submit the claim.
5. Verify that the claim appears with `Submitted` status.
6. Keep the claimant page open.
7. Log in separately as an administrator.
8. Locate the same claim.
9. Update its status to `Under Review`.
10. Verify that the claimant interface automatically reflects the updated status without refreshing the page.

**Expected Behaviour:**

When an administrator updates a claim's status, the claimant should automatically see the updated status through the `CLAIM_STATUS_CHANGED` WebSocket event.

Similarly, newly submitted claims should automatically appear in the administrator's claims list through the `CLAIM_SUBMITTED` event.

**Actual Behaviour:**

The claimant login, claim submission, administrator login and status update operations completed successfully.

However, the claimant interface continued to display `Submitted` even after the administrator updated the claim to `Under Review`.

The updated status became visible only after manually refreshing the page.

**Investigation and Findings:**

I reviewed the frontend implementation to understand how real-time updates are expected to work.

The investigation confirmed that:

1. The admin claims list is expected to update automatically when it receives the `CLAIM_SUBMITTED` WebSocket event.
2. The claimant interface handles `CLAIM_STATUS_CHANGED` events and updates the Zustand store, so the new status should appear without refreshing the page.
3. The admin dashboard's `Load from Cache` and `Flush Cache & Reload` controls manage dashboard statistics stored in Redis. They do not refresh the admin claims list.
4. These cache controls are not intended to be used as a workaround for missing real-time notifications.

I then investigated the event delivery infrastructure and observed the following:

- The Debezium container was running and reported as healthy.
- However, the Debezium connector task was in a failed state.
- The expected PostgreSQL publication, `dbz_publication`, was missing.
- Kafka CDC offsets remained unchanged after performing claim operations.
- No new CDC events were observed during test execution.

Based on these observations, the missing CDC events appear to be a likely reason why real-time notifications are not reaching the frontend. However, the exact failure point in the downstream event delivery flow has not yet been independently confirmed.

**Impact:**

Administrators may not see newly submitted claims automatically, and claimants may continue to see outdated claim statuses until they refresh the application.

**Recommended Action:**

- Create the required PostgreSQL publication.
- Restart the Debezium connector task.
- Verify that CDC events are produced and consumed successfully through Kafka.
- Check the downstream BFF WebSocket notification flow.
- Rerun the real-time claim lifecycle E2E test after the infrastructure issue is resolved.

**Testing Decision:**

I retained the original real-time E2E assertions rather than introducing page refreshes, mocked WebSocket events or manual state updates just to make the test pass.

The admin dashboard cache controls were also reviewed and confirmed to be working as intended, so they are not considered part of this issue.

For now, I have documented this as an infrastructure/configuration issue that needs to be addressed before the real-time functionality can be fully validated.

### 3.2 Claim Validation and Wizard Persistence – Incident Date Defect

**Test File:** `claim-validation.spec.ts`

**Result:** Failed at the incident-date persistence assertion.

**Scenario:**

The test validates mandatory field checks and data persistence when navigating between the claim wizard steps.

The steps covered:

1. Log in as a claimant.
2. Open the new claim wizard.
3. Submit the first step without entering mandatory fields.
4. Verify validation messages for incident date, incident location and claim amount.
5. Enter valid incident details.
6. Navigate to Supporting Details.
7. Submit the description without entering a value.
8. Verify the description validation message.
9. Enter a valid description.
10. Navigate back to Incident Details.
11. Verify that previously entered values are retained.
12. Navigate forward and verify the description again.
13. Navigate to the review screen.
14. Verify the review data and submit the claim.

**Expected Behaviour:**

Previously entered incident details and supporting information should remain available when navigating between wizard steps.

**Actual Behaviour:**

The incident date appears blank when navigating back to the Incident Details step, even though the value is retained in the application state.

**Investigation and Findings:**

I traced the date value through the form implementation and identified the following:

1. The test supplies the date as a valid `YYYY-MM-DD` string.
2. React Hook Form uses `valueAsDate: true` for the date input.
3. The form therefore stores the date as a JavaScript `Date` object.
4. The Zustand wizard store retains this `Date` object.
5. Navigating between steps unmounts and remounts the step components.
6. When Step 1 remounts, the stored `Date` object is passed directly into the form's `defaultValues`.
7. The native HTML `input[type="date"]` expects a string formatted as `YYYY-MM-DD`, rather than a JavaScript `Date` object.

As a result, the previously entered date is not displayed when the user returns to the first step.

**Root Cause:**

A date type mismatch between the stored form state (`Date` object) and the value expected by the native HTML date input (`YYYY-MM-DD` string).

**Recommended Fix:**

Convert the stored date into the expected `YYYY-MM-DD` format when initializing the form.

The existing store and schema can continue using JavaScript `Date` objects. The `valueAsDate: true` behaviour can also remain unchanged.

The formatter should use local date components rather than relying directly on `toISOString()`, to avoid potential timezone-related date shifts.

**Additional Validation:**

Location and claim amount use compatible value types:

- `incidentLocation` is stored as a string.
- `claimAmount` uses `valueAsNumber: true` and is restored as a number-compatible value.

These fields should be independently verified using separate assertions or soft assertions so that their persistence results can be captured even when the date assertion fails.

**Testing Decision:**

The strict date persistence assertion has been retained. No production code changes were made as part of this assessment.

### 3.3 Claim Details – Successful Execution

**Test File:** `claim-details.spec.ts`

**Result:** Passed.

**Scenario:**

1. Log in as a claimant.
2. Submit a valid claim through the UI.
3. Navigate to My Claims.
4. Locate the newly submitted claim.
5. Open its details.
6. Verify the claim ID and description.

**Outcome:**

The claimant successfully submitted the claim and accessed its details. The claim ID and description were verified successfully.

No application issues were identified during this test execution.

### 3.4 Administrator Claim Filtering – Successful Execution

**Test File:** `admin-claims-filter.spec.ts`

**Result:** Passed.

**Scenario:**

1. Create a valid claim using the claimant API client as test setup.
2. Log in as an administrator.
3. Open the administrator claims page.
4. Filter claims by `Submitted`.
5. Verify the filter selection.
6. Verify that the submitted claim appears in the filtered list.

**Outcome:**

The administrator was able to filter claims by status and locate the newly created claim successfully.

No application issues were identified during this test execution.

### 3.5 Overall UI E2E Execution Result

| Test Scenario | Result |
|---|---|
| Claim lifecycle and real-time status update | Failed – Real-time notification not received |
| Claim validation and wizard persistence | Failed – Incident date not restored |
| Claim details | Passed |
| Administrator claim filtering | Passed |

**Total: 2 Passed, 2 Failed.**

The two failed scenarios exposed issues in the application's date persistence and real-time notification functionality. Both tests were retained with their original assertions.

---

## 4. API Test Findings

Seven Playwright API scenarios were implemented to validate claim retrieval, authentication, authorization, input validation and claim status management.

### 4.1 Invalid Claim Status Transition – Exception Handling Defect

**Scenario:**

An administrator attempts to update a claim directly from `SUBMITTED` to `APPROVED`.

**Expected Behaviour:**

The application should reject the invalid transition and return:

- HTTP 400 – Bad Request.
- A JSON error response explaining why the transition is invalid.

**Actual Behaviour:**

The API returns HTTP 500 instead of the expected HTTP 400 response.

**Investigation and Findings:**

I reviewed the status transition implementation and identified that the Claims Service domain layer correctly throws an `InvalidStatusTransitionException` when an invalid transition is attempted.

However, this exception is not explicitly handled in `ClaimExceptionHandler.java`.

As a result, the exception reaches the generic error handler and is returned as an HTTP 500 response instead of the expected client error.

**Root Cause:**

Missing exception handling for `InvalidStatusTransitionException` in the Claims Service exception handler.

**Impact:**

Invalid claim status transitions are rejected by the business logic, but the API reports them as internal server errors.

This results in an incorrect error response and makes it harder for API consumers to distinguish between business validation failures and genuine server errors.

**Recommended Fix:**

Add an exception handler for `InvalidStatusTransitionException` that returns HTTP 400 with a JSON error response containing a clear description of the invalid transition.

**Testing Decision:**

The API test has been retained with the expected HTTP 400 response. No production code changes were made as part of this assessment.

### 4.2 API Authorization and Validation Coverage

The following scenarios were implemented and executed successfully:

| Scenario | Expected Result | Status |
|---|---|---|
| Authenticated claimant retrieves own claims | HTTP 200 and array response | Passed |
| Invalid claim submission with short description | HTTP 400 JSON validation response | Passed |
| Unauthenticated user retrieves claims | HTTP 401 | Passed |
| Administrator updates a claim from `SUBMITTED` to `UNDER_REVIEW` | HTTP 200 with updated status | Passed |
| Claimant accesses administrator claim list | HTTP 403 | Passed |
| Claimant attempts to update claim status | HTTP 403 | Passed |
| Administrator attempts invalid transition from `SUBMITTED` to `APPROVED` | HTTP 400 JSON error | Failed |

**Execution Result: 6 Passed, 1 Failed.**


## 5. Overall Findings and Recommended Actions

The testing and investigation identified issues across test implementation, application behaviour and infrastructure configuration.

The following table summarizes the key findings and recommended actions.

| Area | Finding | Classification | Recommended Action |
|---|---|---|---|
| Theme store tests | Tests expected `localStorage` instead of `sessionStorage` | Test implementation issue | Updated test expectations |
| Wizard Step 2 test | Long input caused test timeout | Test implementation issue | Used `fireEvent.change()` |
| Claims Service tests | Existing tests were not aligned with constructor, serialization and configuration changes | Test implementation issues | Updated affected test mocks and setup |
| Maven wrapper | Required wrapper configuration was missing | Environment/setup issue | Used installed Maven |
| Real-time claim updates | Debezium connector task failed and PostgreSQL publication was missing | Infrastructure/configuration issue | Correct CDC setup and validate event delivery |
| Claim wizard date persistence | JavaScript `Date` object passed directly to native date input | Application defect | Normalize date at the form/input boundary |
| Invalid status transition | `InvalidStatusTransitionException` not explicitly handled | Application defect | Return HTTP 400 through an explicit exception handler |

### Final Testing Decision

Throughout the assessment, I retained the original assertions for the identified application and infrastructure issues rather than changing expected behaviour to make the tests pass.

No production application code was modified as part of the assessment.

The identified issues have been documented with their observed behaviour, investigation findings and recommended corrective actions.

Further validation is recommended after the date persistence fix, exception handling correction and CDC infrastructure configuration are addressed.