"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
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
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // You can also log the error to an error reporting service
    console.error("Uncaught error in ErrorBoundary:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center p-8 bg-[#1E293B] border border-white/10 rounded-2xl shadow-xl w-full my-4">
          <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mb-4 border border-red-500/20">
            <AlertCircle className="w-6 h-6 text-red-500 mb-0" />
          </div>
          <h2 className="text-lg font-bold text-white mb-2 text-center">
            Algo no salió como esperábamos
          </h2>
          <p className="text-slate-400 text-sm text-center mb-6 max-w-sm">
            Ha ocurrido un error inesperado al cargar esta sección. Por favor, intenta de nuevo.
          </p>
          <Button
            onClick={this.handleReset}
            className="bg-[#00E676] text-[#0F172A] hover:bg-white font-bold px-6 rounded-full transition-transform hover:scale-105"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Reintentar
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
