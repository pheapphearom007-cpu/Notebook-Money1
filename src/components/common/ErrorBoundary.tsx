import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';

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
    console.error('Uncaught error in component tree:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleClearAndReload = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {
      // ignore
    }
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#f7f5f1] dark:bg-[#121417] text-[#1c1917] dark:text-[#ece7e1] flex items-center justify-center p-6 font-sans">
          <div className="max-w-md w-full bg-[#fffcf8] dark:bg-[#1a1e23] border border-[#e7e0d4] dark:border-[#2c333c] rounded-3xl p-6 sm:p-8 shadow-xl text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-[#b42318]/10 dark:bg-[#f87171]/15 text-[#b42318] dark:text-[#f87171] mx-auto flex items-center justify-center">
              <AlertCircle className="w-8 h-8" />
            </div>

            <h2 className="text-xl font-black font-khmer">
              មានបញ្ហាក្នុងការដំណើរការកម្មវិធី
            </h2>

            <p className="text-xs text-[#57534e] dark:text-[#a8a29a] font-khmer leading-relaxed">
              ប្រព័ន្ធបានរកឃើញកំហុសបច្ចេកទេសមួយ។ សូមចុចប៊ូតុងខាងក្រោមដើម្បីផ្ទុកទំព័រឡើងវិញ។
            </p>

            {this.state.error && (
              <pre className="p-3 bg-[#efeae2] dark:bg-[#22272e] text-[11px] font-mono text-[#b42318] dark:text-[#f87171] rounded-xl overflow-x-auto text-left max-h-32">
                {this.state.error.message || String(this.state.error)}
              </pre>
            )}

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5">
              <button
                type="button"
                onClick={this.handleReload}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#1f3d5c] dark:bg-[#9ec5e8] text-[#f8fafc] dark:text-[#0f1720] font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>ផ្ទុកឡើងវិញ (Reload)</span>
              </button>

              <button
                type="button"
                onClick={this.handleClearAndReload}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-[#e7e0d4] dark:border-[#2c333c] text-xs font-semibold text-[#57534e] dark:text-[#a8a29a] hover:bg-[#efe8dc] dark:hover:bg-[#252a31] cursor-pointer"
              >
                សម្អាត Cache & ផ្ទុកឡើងវិញ
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
