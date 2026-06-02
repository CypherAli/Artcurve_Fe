'use client'

import { Component, ReactNode } from 'react'

interface Props   { children: ReactNode; fallback?: ReactNode }
interface State   { hasError: boolean; error?: Error }

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback
      return (
        <div className="flex items-center justify-center h-full min-h-[200px]"
          style={{ background: 'rgba(248,113,113,0.04)', border: '1px solid rgba(248,113,113,0.15)' }}>
          <div className="text-center p-6">
            <div className="font-mono text-[9px] tracking-widest uppercase mb-2" style={{ color: '#f87171' }}>
              Component Error
            </div>
            <div className="font-sans text-[11px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
              {this.state.error?.message ?? 'An unexpected error occurred'}
            </div>
            <button
              onClick={() => this.setState({ hasError: false })}
              className="mt-4 font-mono text-[9px] tracking-wider uppercase px-4 py-2"
              style={{ border: '1px solid rgba(248,113,113,0.2)', color: '#f87171' }}
            >
              Retry
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
