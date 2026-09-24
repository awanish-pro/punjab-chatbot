import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetChat = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 z-[9999] font-sans">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 max-w-sm w-full text-center flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <h3 className="text-base font-semibold text-slate-800">Something went wrong</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              An unexpected issue occurred while rendering the municipal assistant. Your session data is safely preserved.
            </p>
            <div className="flex gap-2 w-full mt-2">
              <button
                type="button"
                onClick={this.handleResetChat}
                style={{ fontWeight: 500 }}
                className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-xl transition-all cursor-pointer"
              >
                Dismiss & Retry
              </button>
              <button
                type="button"
                onClick={this.handleReload}
                style={{ fontWeight: 500 }}
                className="flex-1 py-2 px-3 bg-[#2563EB] hover:bg-[#1d4ed8] text-white text-xs font-medium rounded-xl transition-all cursor-pointer shadow-xs"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
