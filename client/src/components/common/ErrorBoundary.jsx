import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an unhandled error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="min-h-screen flex items-center justify-center p-4"
          style={{
            backgroundColor: '#0b0b12',
            color: '#f8f9fa',
            fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
          }}
        >
          <div
            className="card border-0 shadow-2xl p-4 p-md-5 text-center max-w-xl w-100"
            style={{
              backgroundColor: '#13131f',
              borderRadius: '16px',
              border: '1px solid rgba(229, 9, 20, 0.2)',
            }}
          >
            <div
              className="d-inline-flex align-items-center justify-center rounded-circle mx-auto mb-4"
              style={{
                width: '80px',
                height: '80px',
                backgroundColor: 'rgba(229, 9, 20, 0.12)',
                color: '#e50914',
              }}
            >
              <AlertTriangle size={42} strokeWidth={2.2} />
            </div>

            <h2 className="fw-bold mb-2 text-white">Something Went Wrong</h2>
            <p className="text-secondary mb-4">
              An unexpected error occurred while rendering this page. You can reload the page or return to the homepage.
            </p>

            {this.state.error && (
              <div
                className="text-start p-3 rounded mb-4 text-break"
                style={{
                  backgroundColor: 'rgba(0, 0, 0, 0.45)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  fontSize: '0.85rem',
                  fontFamily: 'SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                }}
              >
                <div className="text-danger fw-semibold mb-1">
                  {this.state.error.name || 'Error'}: {this.state.error.message || 'Unknown runtime error'}
                </div>
                {this.state.errorInfo?.componentStack && (
                  <div className="text-muted small mt-2 overflow-auto" style={{ maxHeight: '120px' }}>
                    {this.state.errorInfo.componentStack}
                  </div>
                )}
              </div>
            )}

            <div className="d-flex flex-wrap gap-3 justify-content-center">
              <button
                type="button"
                onClick={this.handleReload}
                className="btn d-inline-flex align-items-center gap-2 px-4 py-2 fw-semibold"
                style={{
                  backgroundColor: '#e50914',
                  borderColor: '#e50914',
                  color: '#ffffff',
                  borderRadius: '8px',
                }}
              >
                <RefreshCw size={18} />
                Reload Page
              </button>

              <button
                type="button"
                onClick={this.handleGoHome}
                className="btn btn-outline-light d-inline-flex align-items-center gap-2 px-4 py-2 fw-semibold"
                style={{
                  borderRadius: '8px',
                  borderColor: 'rgba(255, 255, 255, 0.2)',
                }}
              >
                <Home size={18} />
                Back to Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
