# Testing Guide

This document provides a comprehensive overview of the testing strategy for the Trello Clone frontend application.

## Testing Strategy

The application uses a multi-layered testing approach:

1. **Unit Tests** - Test individual components and functions in isolation
2. **Property-Based Tests** - Verify universal properties across all inputs
3. **Integration Tests** - Test API integration and workflow logic
4. **E2E Tests** - Test complete user workflows across browsers
5. **Performance Tests** - Verify performance requirements are met
6. **Cross-Browser Tests** - Ensure compatibility across browsers

## Test Structure

```
frontend/
├── src/test/                    # Unit and property tests
│   ├── setup.ts                # Test configuration
│   ├── *.unit.test.tsx         # Unit tests
│   ├── *.property.test.tsx     # Property-based tests
│   └── integration.test.tsx    # API integration tests
├── e2e/                        # End-to-end tests
│   ├── auth.spec.ts           # Authentication flows
│   ├── workspace.spec.ts      # Workspace management
│   ├── board.spec.ts          # Board and card operations
│   ├── dragdrop.spec.ts       # Drag and drop
│   ├── upload.spec.ts         # File uploads
│   ├── cross-browser.spec.ts  # Browser compatibility
│   └── performance.spec.ts    # Performance benchmarks
└── playwright.config.ts        # Playwright configuration
```

## Running Tests

### Unit and Property Tests

```bash
# Run all tests once
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui

# Run specific test file
npx vitest run auth.unit.test.tsx
```

### Integration Tests

```bash
# Run integration tests
npx vitest run integration.test.tsx
```

### E2E Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui

# Run on specific browser
npm run test:e2e:chrome
npm run test:e2e:firefox
npm run test:e2e:webkit

# Run specific test file
npx playwright test e2e/auth.spec.ts
```

## Test Coverage

### Unit Tests

Unit tests cover:
- Component rendering and behavior
- Form validation
- Event handlers
- State management
- Utility functions
- Error handling

Example test files:
- `auth.unit.test.tsx` - Authentication components
- `workspace.unit.test.tsx` - Workspace components
- `board.unit.test.tsx` - Board components
- `card.unit.test.tsx` - Card components
- `dragdrop.unit.test.tsx` - Drag and drop functionality
- `upload.unit.test.tsx` - File upload system
- `validation.unit.test.tsx` - Form validation

### Property-Based Tests

Property-based tests verify universal properties using fast-check:
- Authentication workflows
- Workspace operations
- Board management
- Card operations
- Drag and drop behavior
- Label management
- Comment system
- File uploads
- Error handling
- Real-time updates
- Accessibility features
- Performance characteristics

Example test files:
- `auth.property.test.tsx` - Auth properties
- `workspace.property.test.tsx` - Workspace properties
- `board.property.test.tsx` - Board properties
- `card.property.test.tsx` - Card properties
- `dragdrop.property.test.tsx` - Drag and drop properties
- `upload.property.test.tsx` - Upload properties
- `error.property.test.tsx` - Error handling properties
- `realtime.property.test.tsx` - Real-time update properties
- `accessibility.property.test.tsx` - Accessibility properties
- `performance.property.test.tsx` - Performance properties

### Integration Tests

Integration tests verify:
- API integration
- Authentication flow
- Workflow logic

See: `integration.test.tsx`

### E2E Tests

E2E tests cover complete user workflows:
- Registration and login
- Email verification
- Workspace creation and management
- Board creation and navigation
- Column management
- Card creation and editing
- Drag and drop operations
- File uploads with progress
- Member management
- Label management
- Comment system
- Cross-browser compatibility
- Performance benchmarks

See: `e2e/*.spec.ts`

## Writing Tests

### Unit Test Example

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('should render with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('should call onClick when clicked', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Click me</Button>);
    
    await userEvent.click(screen.getByText('Click me'));
    expect(onClick).toHaveBeenCalledOnce();
  });
});
```

### Property-Based Test Example

```typescript
import { describe, it } from 'vitest';
import * as fc from 'fast-check';

describe('Card Properties', () => {
  it('Property 30: Card creation adds at end position', () => {
    fc.assert(
      fc.property(
        fc.array(fc.record({ id: fc.integer(), position: fc.integer() })),
        fc.string(),
        (existingCards, title) => {
          const maxPosition = existingCards.length > 0
            ? Math.max(...existingCards.map(c => c.position))
            : -1;
          
          const newCard = createCard(title, existingCards);
          
          return newCard.position === maxPosition + 1;
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### E2E Test Example

```typescript
import { test, expect } from '@playwright/test';

test('should create a new workspace', async ({ page }) => {
  await page.goto('/workspaces');
  
  await page.click('button:has-text("Create Workspace")');
  await page.fill('input[name="name"]', 'Test Workspace');
  await page.click('button:has-text("Create")');
  
  await expect(page.locator('text=Test Workspace')).toBeVisible();
});
```

## Test Best Practices

### General Guidelines

1. **Test Behavior, Not Implementation**
   - Focus on what the component does, not how it does it
   - Avoid testing internal state or implementation details

2. **Use Descriptive Test Names**
   - Test names should clearly describe what is being tested
   - Use "should" statements: "should render with correct props"

3. **Arrange-Act-Assert Pattern**
   - Arrange: Set up test data and conditions
   - Act: Perform the action being tested
   - Assert: Verify the expected outcome

4. **Keep Tests Independent**
   - Each test should be able to run independently
   - Don't rely on test execution order
   - Clean up after each test

5. **Use Test Data Builders**
   - Create helper functions to generate test data
   - Makes tests more readable and maintainable

### Property-Based Testing Guidelines

1. **Choose Appropriate Generators**
   - Use generators that match your domain
   - Constrain generators to valid input space

2. **Run Sufficient Iterations**
   - Default: 100 iterations per property
   - Increase for critical properties

3. **Handle Shrinking**
   - fast-check automatically shrinks failing cases
   - Review shrunk examples to understand failures

4. **Document Properties**
   - Clearly state what property is being tested
   - Reference requirements being validated

### E2E Testing Guidelines

1. **Use Data Attributes**
   - Add `data-testid` attributes for reliable selectors
   - Avoid relying on text content or CSS classes

2. **Wait for Elements**
   - Use `waitFor` and `expect().toBeVisible()`
   - Don't use fixed timeouts

3. **Test User Flows**
   - Test complete workflows, not individual actions
   - Simulate real user behavior

4. **Handle Async Operations**
   - Wait for network requests to complete
   - Use `waitForLoadState('networkidle')`

## Continuous Integration

Tests are run automatically in CI/CD pipeline:

```yaml
# Example CI configuration
test:
  script:
    - npm install
    - npm test                    # Unit and property tests
    - npm run test:e2e:chrome    # E2E tests on Chrome
```

## Debugging Tests

### Unit Tests

```bash
# Run tests in debug mode
npx vitest --inspect-brk

# Use VS Code debugger
# Add breakpoints and run "Debug Test" from test file
```

### E2E Tests

```bash
# Run with headed browser
npx playwright test --headed

# Run with debug mode
npx playwright test --debug

# Generate trace
npx playwright test --trace on

# View trace
npx playwright show-trace trace.zip
```

## Test Maintenance

### When to Update Tests

- When requirements change
- When bugs are found
- When refactoring code
- When adding new features

### Keeping Tests Fast

- Mock external dependencies
- Use test databases
- Parallelize test execution
- Skip slow tests in development

### Handling Flaky Tests

- Identify root cause
- Add proper waits
- Increase timeouts if necessary
- Isolate test data
- Run tests multiple times to verify fix

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [Playwright Documentation](https://playwright.dev/)
- [fast-check Documentation](https://fast-check.dev/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

## Additional Documentation

- [Cross-Browser Testing Guide](./CROSS_BROWSER_TESTING.md)
- [Performance Testing Guide](./PERFORMANCE_TESTING.md)
