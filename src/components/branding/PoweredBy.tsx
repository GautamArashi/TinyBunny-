import React from "react"

export interface PoweredByProps {
  /** Visual variant: 'pill' (compact glassmorphism badge), 'footer' (bottom attribution banner), or 'inline' */
  variant?: "pill" | "footer" | "inline"
  /** Optional additional CSS classes */
  className?: string
  /** Whether to make the partner names clickable external links */
  interactive?: boolean
}

/**
 * PoweredBy
 * Elegant branding attribution element displaying "Powered by TinyFish × TechnoJam".
 * Retains TinyBunny as primary product brand while acknowledging platform and community partners.
 */
export function PoweredBy({
  variant = "pill",
  className = "",
  interactive = true,
}: PoweredByProps) {
  if (variant === "footer") {
    return (
      <footer
        className={`dashboard-footer ${className}`}
        role="contentinfo"
        aria-label="Platform and community attribution"
      >
        <div className="footer-left">
          <span className="footer-brand">TinyBunny</span>
          <span className="footer-separator">•</span>
          <span className="footer-sub">Web Intelligence Studio</span>
        </div>

        <div className="powered-by-badge" aria-label="Powered by TinyFish and TechnoJam">
          <span className="powered-by-dot" aria-hidden="true" />
          <span className="powered-by-prefix">Powered by</span>
          {interactive ? (
            <a
              href="https://tinyfish.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="powered-by-partner tinyfish"
              title="TinyFish Web Intelligence Platform"
            >
              TinyFish
            </a>
          ) : (
            <span className="powered-by-partner tinyfish">TinyFish</span>
          )}
          <span className="powered-by-cross" aria-hidden="true">
            ×
          </span>
          {interactive ? (
            <a
              href="https://technojam.tech"
              target="_blank"
              rel="noopener noreferrer"
              className="powered-by-partner technojam"
              title="TechnoJam Technical Society"
            >
              TechnoJam
            </a>
          ) : (
            <span className="powered-by-partner technojam">TechnoJam</span>
          )}
        </div>
      </footer>
    )
  }

  if (variant === "inline") {
    return (
      <span
        className={`powered-by-inline ${className}`}
        aria-label="Powered by TinyFish and TechnoJam"
      >
        <span className="powered-by-prefix">Powered by</span>{" "}
        <span className="powered-by-partner tinyfish">TinyFish</span>{" "}
        <span className="powered-by-cross" aria-hidden="true">
          ×
        </span>{" "}
        <span className="powered-by-partner technojam">TechnoJam</span>
      </span>
    )
  }

  // Default: 'pill' variant
  return (
    <div
      className={`powered-by-badge ${className}`}
      role="region"
      aria-label="Powered by TinyFish and TechnoJam"
    >
      <span className="powered-by-dot" aria-hidden="true" />
      <span className="powered-by-prefix">Powered by</span>
      {interactive ? (
        <a
          href="https://tinyfish.ai"
          target="_blank"
          rel="noopener noreferrer"
          className="powered-by-partner tinyfish"
          title="TinyFish Web Intelligence Platform"
        >
          TinyFish
        </a>
      ) : (
        <span className="powered-by-partner tinyfish">TinyFish</span>
      )}
      <span className="powered-by-cross" aria-hidden="true">
        ×
      </span>
      {interactive ? (
        <a
          href="https://technojam.tech"
          target="_blank"
          rel="noopener noreferrer"
          className="powered-by-partner technojam"
          title="TechnoJam Technical Society"
        >
          TechnoJam
        </a>
      ) : (
        <span className="powered-by-partner technojam">TechnoJam</span>
      )}
    </div>
  )
}

export default PoweredBy
