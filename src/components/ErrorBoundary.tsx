import { Component, type ReactNode } from 'react'

type Props = { children: ReactNode }
type State = { hasError: boolean }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return <div className="rounded-2xl border border-rose-900/60 bg-rose-950/20 p-6 text-rose-100">A dashboard section failed to load.</div>
    }
    return this.props.children
  }
}
