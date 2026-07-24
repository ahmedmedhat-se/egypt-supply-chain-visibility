import { Component, type ReactNode, type ErrorInfo } from 'react';
import { cn } from '../../lib/utils';
import { FaExclamationTriangle, FaRedo, FaHome } from 'react-icons/fa';

interface ErrorBoundaryProps {
  children: ReactNode;
  /** Optional fallback UI to render instead of the default one */
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  resetKey: number;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null, resetKey: 0 };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    // Log to console in development
    if (import.meta.env.DEV) {
      console.error('[ErrorBoundary] Caught error:', error, errorInfo);
    }
    // TODO: Send to error reporting service in production
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null, resetKey: Date.now() });
  };

  handleReload = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#E8F0F8] to-[#F8FAFC] dark:from-[#0A2E4A] dark:to-[#122A44] p-4">
          <div className="w-full max-w-md animate-in fade-in zoom-in duration-300">
            {/* Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 rounded-full bg-[#FEE2E2] dark:bg-[#991B1B]/30 flex items-center justify-center">
                <FaExclamationTriangle className="w-10 h-10 text-[#DC2626]" />
              </div>
            </div>

            {/* Title */}
            <h1 className="text-2xl font-bold text-center text-[#0A2E4A] dark:text-white mb-2">
              Something went wrong
            </h1>

            {/* Description */}
            <p className="text-center text-[#94A3B8] mb-8 max-w-sm mx-auto">
              An unexpected error occurred. Please try again or return to the homepage.
            </p>

            {/* Actions */}
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={this.handleReset}
                className={cn(
                  'inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium',
                  'bg-[#0A2E4A] text-white hover:bg-[#0F3D60]',
                  'transition-all duration-200 shadow-sm hover:shadow',
                  'focus:outline-none focus:ring-2 focus:ring-[#0A2E4A] focus:ring-offset-2',
                )}
              >
                <FaRedo className="w-4 h-4" />
                Try again
              </button>
              <button
                onClick={this.handleReload}
                className={cn(
                  'inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium',
                  'border-2 border-[#0A2E4A] text-[#0A2E4A]',
                  'dark:border-[#94A3B8] dark:text-[#E2E8F0]',
                  'hover:bg-[#0A2E4A] hover:text-white dark:hover:bg-[#1A3D5A]',
                  'transition-all duration-200',
                  'focus:outline-none focus:ring-2 focus:ring-[#0A2E4A] focus:ring-offset-2',
                )}
              >
                <FaHome className="w-4 h-4" />
                Go home
              </button>
            </div>

            {/* Error details (dev only) */}
            {import.meta.env.DEV && this.state.error && (
              <details className="mt-8 text-left">
                <summary className="text-sm text-[#94A3B8] cursor-pointer hover:text-[#64748B] select-none">
                  Error details
                </summary>
                <pre className="mt-2 p-4 rounded-lg bg-[#F1F4F8] dark:bg-[#1A3D5A] text-xs text-[#DC2626] overflow-auto max-h-48">
                  {this.state.error.name}: {this.state.error.message}
                  {'\n\n'}
                  {this.state.errorInfo?.componentStack || 'No component stack available'}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return <div key={this.state.resetKey}>{this.props.children}</div>;
  }
}
