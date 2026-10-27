import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Film } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[iMovies ErrorBoundary] Caught an unhandled rendering error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  private handleGoMovies = () => {
    window.location.href = '/movies';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[60vh] flex items-center justify-center p-6">
          <div className="w-full max-w-xl bg-cinema-900 border border-cinema-750 rounded-3xl p-8 sm:p-10 shadow-2xl text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-crimson-600/15 border border-crimson-500/30 text-crimson-500 mx-auto flex items-center justify-center">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-black text-white tracking-tight">
                Something went wrong
              </h2>
              <p className="text-sm text-cinema-300 leading-relaxed max-w-md mx-auto">
                An unexpected display error occurred while rendering this cinematic view.
                Don't worry, your tickets and session are secure.
              </p>
            </div>

            {/* Error detail in development */}
            {this.state.error && (
              <div className="p-3 bg-cinema-950 rounded-xl border border-cinema-800 text-left overflow-x-auto text-[11px] text-cinema-400 font-mono">
                {this.state.error.message || String(this.state.error)}
              </div>
            )}

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                onClick={this.handleReset}
                className="flex items-center gap-2 px-5 py-2.5 bg-crimson-600 hover:bg-crimson-500 text-white font-bold rounded-xl text-xs transition shadow-glow-crimson-sm cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>

              <button
                onClick={this.handleGoMovies}
                className="flex items-center gap-2 px-5 py-2.5 bg-cinema-850 hover:bg-cinema-800 text-cinema-200 hover:text-white border border-cinema-750 rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                <Film className="w-4 h-4" />
                Browse Movies
              </button>

              <button
                onClick={this.handleGoHome}
                className="flex items-center gap-2 px-5 py-2.5 bg-cinema-850 hover:bg-cinema-800 text-cinema-200 hover:text-white border border-cinema-750 rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                <Home className="w-4 h-4" />
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
