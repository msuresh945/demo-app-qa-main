# Test Execution Report

## 1. Overview

This report summarizes the test execution carried out for the three main application components: UI, BFF Service and Claims Service.

I started by running the existing test suites to understand their current status. During the initial execution, I came across a few issues in the UI and Claims Service tests. I investigated these issues, made the necessary changes to the affected test files and reran the test suites to verify the fixes.

## 2. Initial Test Execution Results

I first executed the existing test suites without making any changes to understand how they were performing.

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

## 4. Final Test Execution Results

After making the necessary changes, I reran the complete test suites to verify that the fixes worked as expected.

The final results were:

| Component | Total Tests | Passed | Failed | Errors | Skipped | Final Status |
|---|---:|---:|---:|---:|---:|---|
| UI | 266 | 266 | 0 | 0 | 0 | Passed |
| BFF Service | 213 | 213 | 0 | 0 | 0 | Passed |
| Claims Service | 197 | 197 | 0 | 0 | 0 | Passed |
| **Total** | **676** | **676** | **0** | **0** | **0** | **Passed** |

All three test suites passed successfully after the changes.

## 5. Conclusion

The initial test execution helped me identify a few issues in the existing UI and Claims Service tests. I investigated the failures, understood their root causes and updated the affected test implementations.

The BFF Service tests passed without requiring any changes.

After the fixes, all 676 tests across the three components passed successfully, with no failures or errors.

Only the affected test files were modified during this exercise. No production implementation files were changed.

With the existing test suites now passing, my next focus will be on reviewing the coverage reports and identifying scenarios that need additional testing, especially the complete claim submission and review workflow across the claimant and admin interfaces.