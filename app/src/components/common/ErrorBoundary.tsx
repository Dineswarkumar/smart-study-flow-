import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = (): void => {
    window.location.reload();
  };

  handleResetState = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    });
  };

  handleHardReset = (): void => {
    if (window.confirm('Clear cached app data and restart? Your notes and tasks in cloud sync will remain safe.')) {
      try {
        localStorage.clear();
      } catch (err) {
        console.warn('Failed to clear localStorage:', err);
      }
      window.location.reload();
    }
  };

  toggleDetails = (): void => {
    this.setState((prev) => ({ showDetails: !prev.showDetails }));
  };

  render(): ReactNode {
    if (this.state.hasError) {
      const { error, errorInfo, showDetails } = this.state;

      return (
        <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex items-center justify-center p-4 selection:bg-indigo-500/30">
          <div className="w-full max-w-lg bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden">
            {/* Ambient glow accent */}
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-rose-500/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-5 shadow-lg shadow-rose-500/10">
                <AlertTriangle className="w-8 h-8" />
              </div>

              <h1 className="text-2xl font-bold tracking-tight text-white mb-2 font-headline">
                Something went wrong
              </h1>
              <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                The application encountered an unexpected runtime error. You can refresh the view or restart safely.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 w-full mb-6">
                <button
                  type="button"
                  onClick={this.handleReload}
                  className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" />
                  Reload App
                </button>
                <button
                  type="button"
                  onClick={this.handleResetState}
                  className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  Try Again
                </button>
              </div>

              <button
                type="button"
                onClick={this.handleHardReset}
                className="text-xs text-rose-400/80 hover:text-rose-300 underline underline-offset-4 mb-4 transition-colors cursor-pointer"
              >
                Clear Local Cache &amp; Restart
              </button>

              {/* Collapsible Error Stack Details */}
              {error && (
                <div className="w-full text-left mt-2 border-t border-slate-800/80 pt-4">
                  <button
                    type="button"
                    onClick={this.toggleDetails}
                    className="flex items-center justify-between w-full text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors py-1 cursor-pointer"
                  >
                    <span>Technical Details</span>
                    {showDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>

                  {showDetails && (
                    <div className="mt-2 p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 font-mono text-[11px] text-rose-300 max-h-48 overflow-auto leading-relaxed">
                      <div className="font-bold text-rose-400 mb-1">{error.name}: {error.message}</div>
                      {error.stack && (
                        <pre className="text-slate-400 whitespace-pre-wrap text-[10px]">
                          {error.stack}
                        </pre>
                      )}
                      {errorInfo?.componentStack && (
                        <pre className="text-slate-500 whitespace-pre-wrap text-[10px] mt-2 border-t border-slate-800 pt-2">
                          {errorInfo.componentStack}
                        </pre>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
