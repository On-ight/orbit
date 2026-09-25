"use client";

import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  // What this boundary wraps, shown in the fallback message so it's obvious
  // which card/section broke rather than a blank gap in the page.
  label: string;
}

interface State {
  error: Error | null;
}

/**
 * React only has a class-component API for error boundaries (no hook
 * equivalent yet) — without this, a render-time throw inside a card just
 * silently unmounts it, which is exactly what made an earlier Reel-generation
 * bug undiagnosable: the card vanished with no console error and no trace.
 * This turns that into a visible message instead.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack?: string | null }) {
    console.error(`ErrorBoundary (${this.props.label}) caught:`, error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="rounded-xl border border-[var(--status-critical)] bg-[var(--status-critical-soft)] p-5 text-sm text-[var(--status-critical)]">
          <p className="font-medium">Something broke rendering {this.props.label}.</p>
          <p className="mt-1 text-xs opacity-80">{this.state.error.message}</p>
        </div>
      );
    }
    return this.props.children;
  }
}
