import React, { Component, useEffect, useState } from "react"
import { Mascot } from "page-mascot"

export interface ScoutMascotProps {
  /** Size in pixels (square). Default: 32 */
  size?: number
  /** Additional CSS class name */
  className?: string
  /** Accessible screen reader label */
  label?: string
  /** Path to 3x3 directions sprite sheet */
  directions?: string
  /** Path to 3x3 reactions sprite sheet */
  reactions?: string
}

interface MascotErrorBoundaryProps {
  fallback: React.ReactNode
  children: React.ReactNode
}

interface MascotErrorBoundaryState {
  hasError: boolean
}

class MascotErrorBoundary extends Component<
  MascotErrorBoundaryProps,
  MascotErrorBoundaryState
> {
  constructor(props: MascotErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): MascotErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: any) {
    console.warn("[ScoutMascot] Mascot rendering error caught:", error)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback
    }
    return this.props.children
  }
}

/**
 * Fallback robot mark rendered if sprite sheets or Mascot component encounter an issue.
 */
function MascotFallbackMark({ size = 32 }: { size?: number }) {
  return (
    <div
      className="brand-mark scout-fallback"
      style={{
        width: size,
        height: size,
        display: "grid",
        placeItems: "center",
        borderRadius: "8px",
        background: "linear-gradient(135deg, rgba(255, 106, 0, 0.25), rgba(255, 138, 52, 0.1))",
        border: "1px solid rgba(255, 106, 0, 0.3)",
      }}
      aria-label="Scout robot mascot"
    >
      <svg
        width={Math.round(size * 0.65)}
        height={Math.round(size * 0.65)}
        viewBox="0 0 24 24"
        fill="none"
        stroke="var(--orange, #ff6a00)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="11" width="18" height="10" rx="2" />
        <circle cx="12" cy="5" r="2" />
        <path d="M12 7v4" />
        <line x1="8" y1="16" x2="8" y2="16" />
        <line x1="16" y1="16" x2="16" y2="16" />
      </svg>
    </div>
  )
}

/**
 * ScoutMascot
 * Renders the Scout robot mascot with gaze tracking and click reactions using `page-mascot`.
 * Gracefully falls back to a stylized robot mark if assets or runtime fail.
 */
export function ScoutMascot({
  size = 32,
  className = "",
  label = "Scout the Robot Mascot",
  directions = "/mascots/scout-directions.webp",
  reactions = "/mascots/scout-reactions.webp",
}: ScoutMascotProps) {
  const [assetStatus, setAssetStatus] = useState<"loading" | "ready" | "failed">("loading")

  useEffect(() => {
    let active = true

    // Pre-verify that both sprite sheets exist and load cleanly
    const checkImage = (src: string): Promise<void> =>
      new Promise((resolve, reject) => {
        const img = new Image()
        img.onload = () => resolve()
        img.onerror = () => reject()
        img.src = src
      })

    Promise.all([checkImage(directions), checkImage(reactions)])
      .then(() => {
        if (active) setAssetStatus("ready")
      })
      .catch(() => {
        if (active) setAssetStatus("failed")
      })

    return () => {
      active = false
    }
  }, [directions, reactions])

  if (assetStatus === "failed") {
    return <MascotFallbackMark size={size} />
  }

  return (
    <MascotErrorBoundary fallback={<MascotFallbackMark size={size} />}>
      <div
        className={`scout-mascot-wrapper ${className}`}
        style={{
          width: size,
          height: size,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "visible",
        }}
      >
        <Mascot
          directions={directions}
          reactions={reactions}
          size={size}
          label={label}
          className="scout-mascot-actor"
        />
      </div>
    </MascotErrorBoundary>
  )
}

export default ScoutMascot
