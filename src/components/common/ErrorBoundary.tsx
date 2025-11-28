import { Component, ErrorInfo, ReactNode } from 'react';
import './ErrorBoundary.css';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(_error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  handleReload = (): void => {
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="error-boundary">
          <div className="error-boundary__content">
            <div className="error-boundary__icon">⚠️</div>
            <h1 className="error-boundary__title">Something went wrong</h1>
            <p className="error-boundary__message">
              We're sorry, but something unexpected happened. You can try one of the following options:
            </p>
            
            <div className="error-boundary__actions">
              <button
                className="error-boundary__button error-boundary__button--primary"
                onClick={this.handleReset}
              >
                Try Again
              </button>
              <button
                className="error-boundary__button error-boundary__button--secondary"
                onClick={this.handleReload}
              >
                Reload Page
              </button>
            </div>

            {import.meta.env.DEV && this.state.error && (
              <details className="error-boundary__details">
                <summary className="error-boundary__summary">Error Details</summary>
                <div className="error-boundary__error-info">
                  <p className="error-boundary__error-name">
                    <strong>{this.state.error.name}:</strong> {this.state.error.message}
                  </p>
                  {this.state.error.stack && (
                    <pre className="error-boundary__stack">
                      {this.state.error.stack}
                    </pre>
                  )}
                  {this.state.errorInfo && (
                    <pre className="error-boundary__component-stack">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  )}
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
