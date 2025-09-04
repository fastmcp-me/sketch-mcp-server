// Global test setup
beforeAll(() => {
  // Set up any global test configuration
  process.env.NODE_ENV = 'test';
});

afterAll(() => {
  // Clean up any global test resources
});

// Increase timeout for integration tests
jest.setTimeout(10000);
