import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

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
    console.error('Terminal runtime error caught by ErrorBoundary:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0b0f17] text-slate-100 flex items-center justify-center p-6 font-serif">
          <div className="max-w-xl w-full bg-slate-900 border border-rose-800/60 rounded-xl p-8 shadow-2xl space-y-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-rose-950/80 border border-rose-700/60 rounded-lg text-rose-400">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white tracking-tight">
                  ProfitPulse Terminal Exception
                </h1>
                <p className="text-xs text-slate-400 mt-1">
                  An unexpected execution error occurred in the browser runtime.
                </p>
              </div>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 font-mono text-xs text-rose-300 overflow-x-auto max-h-48">
              {this.state.error?.toString() || 'Unknown runtime error'}
              {this.state.errorInfo?.componentStack && (
                <div className="mt-2 pt-2 border-t border-slate-800 text-[10px] text-slate-500 whitespace-pre-wrap">
                  {this.state.errorInfo.componentStack}
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={this.handleReset}
                className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold rounded transition cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                Reload Terminal
              </button>
              <button
                onClick={() => {
                  window.location.href = window.location.pathname;
                }}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded transition cursor-pointer"
              >
                <Home className="w-4 h-4" />
                Reset View
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
