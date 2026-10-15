import React, { Component, useEffect, useState } from "react"
import { Mascot } from "page-mascot"

export interface BunnyMascotProps {
  /** Size in pixels (square). Default: 40 (within 36–44px specification) */
  size?: number
  /** Optional additional CSS class */
  className?: string
  /** Accessible label */
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
    console.warn("[BunnyMascot] Mascot rendering error caught:", error)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback
    }
    return this.props.children
  }
}

/**
 * Fallback mark rendered if sprite sheets or Mascot component encounter an issue.
 */
function MascotFallbackMark({ size = 40 }: { size?: number }) {
  return (
    <div
      className="brand-mark bunny-fallback"
      style={{
        width: size,
        height: size,
        display: "grid",
        placeItems: "center",
        borderRadius: "8px",
        background: "linear-gradient(135deg, rgba(255, 106, 0, 0.25), rgba(255, 138, 52, 0.1))",
        border: "1px solid rgba(255, 106, 0, 0.3)",
        flexShrink: 0,
      }}
      aria-label="TinyBunny mascot"
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
        <path d="M9 3c-.5 0-1 .5-.9 1.4l.7 5.6" />
        <path d="M15 3c.5 0 1 .5.9 1.4l-.7 5.6" />
        <circle cx="12" cy="14" r="7" />
        <circle cx="9.5" cy="13.5" r="1" fill="currentColor" />
        <circle cx="14.5" cy="13.5" r="1" fill="currentColor" />
        <path d="M11 16.5c.5.5 1.5.5 2 0" />
      </svg>
    </div>
  )
}

/**
 * BunnyMascot
 * Renders the animated TinyBunny mascot with gaze tracking and click reactions using `page-mascot`.
 * Uses `/mascots/bunny-directions.webp` and `/mascots/bunny-reactions.webp`.
 */
export function BunnyMascot({
  size = 40,
  className = "",
  label = "TinyBunny Mascot",
  directions = "/mascots/bunny-directions.webp",
  reactions = "/mascots/bunny-reactions.webp",
}: BunnyMascotProps) {
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
        className={`bunny-mascot-wrapper ${className}`}
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
          className="bunny-mascot-actor"
        />
      </div>
    </MascotErrorBoundary>
  )
}

export default BunnyMascot
