# Testing Guide

## Running Tests

- To run all tests in the monorepo:

  ```sh
  npm test
  ```

- To run tests for a specific app:

  ```sh
  npm test -- --filter=houseai
  npm test -- --filter=family-dashboard
  npm test -- --filter=taskmaster-ai
  ```

## Writing Tests

- Place tests in the `__tests__` or `tests` folder in each app.
- Use Jest, Mocha, or your preferred test runner.
- See each app's README.md for details.
