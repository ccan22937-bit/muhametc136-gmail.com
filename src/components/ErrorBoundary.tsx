import React, { Component, ErrorInfo, ReactNode } from 'react';
import { RefreshCw, AlertTriangle } from 'lucide-react';

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
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.warn('Sensei App caught error in ErrorBoundary:', error, errorInfo);
  }

  private handleReload = () => {
    try {
      sessionStorage.clear();
    } catch {}
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0D0814] text-white flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#00F0FF] to-[#7928CA] p-0.5 mb-4 shadow-[0_0_30px_rgba(0,240,255,0.4)]">
            <div className="w-full h-full bg-[#140D24] rounded-[14px] flex items-center justify-center text-amber-400">
              <AlertTriangle size={32} />
            </div>
          </div>

          <h2 className="text-xl font-black text-white mb-2">
            Sensei Başlatılırken Bir Aksamla Karşılaşıldı
          </h2>
          <p className="text-xs text-gray-400 max-w-sm mb-6 leading-relaxed">
            Tarayıcı önbelleği veya oturum yenileniyor. Uygulamayı yeniden başlatmak için aşağıdaki butona dokunabilirsiniz.
          </p>

          <button
            onClick={this.handleReload}
            className="px-6 py-3 bg-gradient-to-r from-[#00F0FF] to-[#00A3FF] text-black font-extrabold text-sm rounded-xl flex items-center gap-2 active:scale-95 transition shadow-[0_0_20px_rgba(0,240,255,0.4)] cursor-pointer"
          >
            <RefreshCw size={16} />
            <span>Uygulamayı Yeniden Başlat</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
