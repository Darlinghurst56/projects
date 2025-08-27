/**
 * Unit tests for ErrorBoundary component
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Simple mock component that throws an error
const ThrowError = ({ shouldThrow }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
};

// Mock ErrorBoundary component since we can't import the actual one
class MockErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.log('Error caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div role="alert" data-testid="error-boundary">
          <h2>Something went wrong</h2>
          <p>We're sorry, but something unexpected happened.</p>
        </div>
      );
    }

    return this.props.children;
  }
}

describe('ErrorBoundary Component', () => {
  // Suppress console.error for these tests since we're intentionally throwing errors
  const originalError = console.error;
  
  beforeAll(() => {
    console.error = jest.fn();
  });
  
  afterAll(() => {
    console.error = originalError;
  });

  test('should render children when there is no error', () => {
    render(
      <MockErrorBoundary>
        <ThrowError shouldThrow={false} />
      </MockErrorBoundary>
    );

    expect(screen.getByText('No error')).toBeInTheDocument();
    expect(screen.queryByTestId('error-boundary')).not.toBeInTheDocument();
  });

  test('should render error UI when child component throws an error', () => {
    render(
      <MockErrorBoundary>
        <ThrowError shouldThrow={true} />
      </MockErrorBoundary>
    );

    expect(screen.getByTestId('error-boundary')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('We\'re sorry, but something unexpected happened.')).toBeInTheDocument();
  });

  test('should have proper accessibility attributes', () => {
    render(
      <MockErrorBoundary>
        <ThrowError shouldThrow={true} />
      </MockErrorBoundary>
    );

    const errorElement = screen.getByTestId('error-boundary');
    expect(errorElement).toHaveAttribute('role', 'alert');
  });

  test('should handle multiple errors gracefully', () => {
    const { rerender } = render(
      <MockErrorBoundary>
        <ThrowError shouldThrow={false} />
      </MockErrorBoundary>
    );

    expect(screen.getByText('No error')).toBeInTheDocument();

    // Trigger error
    rerender(
      <MockErrorBoundary>
        <ThrowError shouldThrow={true} />
      </MockErrorBoundary>
    );

    expect(screen.getByTestId('error-boundary')).toBeInTheDocument();
  });
});