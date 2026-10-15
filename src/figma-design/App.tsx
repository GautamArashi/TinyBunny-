import React, { useEffect, useMemo, useRef, useState } from "react"
import {
  searchTinyFish,
  fetchPages,
  streamAgentRun,
  checkBackendHealth,
  API_BASE_URL,
} from "../services/api.js"
import { Mascot } from "page-mascot"
import { normalizeSearchResults } from "../utils/normalizeSearchResults.js"
import {
  createRecord,
  updateRecord,
  deleteRecord,
  getHistory,
  clearHistory,
  exportHistoryJson,
  getHistoryStats,
  cleanStaleRunningRecords,
  extractNumOfSteps,
  getStorageUsage,
} from "../services/runHistory.js"

type Route = "dashboard" | "search" | "fetch" | "agent" | "history" | "settings"
type Tone = "neutral" | "success" | "warning" | "danger" | "info" | "accent"

const navItems: { id: Route; label: string; icon: IconName }[] = [
  { id: "dashboard", label: "Dashboard", icon: "grid" },
  { id: "search", label: "Search Lab", icon: "search" },
  { id: "fetch", label: "Fetch Lab", icon: "download" },
  { id: "agent", label: "Agent Lab", icon: "spark" },
  { id: "history", label: "Run History", icon: "history" },
  { id: "settings", label: "Settings", icon: "settings" },
]

type IconName =
  | "grid"
  | "search"
  | "download"
  | "spark"
  | "history"
  | "settings"
  | "chevron"
  | "arrow"
  | "copy"
  | "check"
  | "play"
  | "link"
  | "menu"
  | "close"
  | "trash"
  | "export"
  | "refresh"
  | "code"
  | "clock"
  | "shield"
  | "wallet"
  | "more"
  | "filter"
  | "terminal"

const iconPaths: Record<IconName, React.ReactNode> = {
  grid: <><rect x="3" y="3" width="7" height="7" rx="2" /><rect x="14" y="3" width="7" height="7" rx="2" /><rect x="3" y="14" width="7" height="7" rx="2" /><rect x="14" y="14" width="7" height="7" rx="2" /></>,
  search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
  download: <><path d="M12 3v12m0 0 4-4m-4 4-4-4" /><path d="M4 19h16" /></>,
  spark: <><path d="m12 3 1.4 4.1L17.5 8.5l-4.1 1.4L12 14l-1.4-4.1-4.1-1.4 4.1-1.4L12 3Z" /><path d="m19 14 .7 2.3L22 17l-2.3.7L19 20l-.7-2.3L16 17l2.3-.7L19 14Z" /></>,
  history: <><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5M12 7v5l3 2" /></>,
  settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3A1.7 1.7 0 0 0 10 3V2.8h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z" /></>,
  chevron: <path d="m9 18 6-6-6-6" />,
  arrow: <><path d="M5 12h14m-5-5 5 5-5 5" /></>,
  copy: <><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" /></>,
  check: <path d="m5 12 4 4L19 6" />,
  play: <path d="m8 5 11 7-11 7V5Z" />,
  link: <><path d="M15 4h5v5M13 11l7-7" /><path d="M18 13v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h5" /></>,
  menu: <><path d="M4 7h16M4 12h16M4 17h16" /></>,
  close: <><path d="m6 6 12 12M18 6 6 18" /></>,
  trash: <><path d="M4 7h16M9 7V4h6v3m3 0-1 14H7L6 7M10 11v6M14 11v6" /></>,
  export: <><path d="M12 3v12m0-12 4 4m-4-4L8 7" /><path d="M5 13v7h14v-7" /></>,
  refresh: <><path d="M20 7v5h-5M4 17v-5h5" /><path d="M6.1 8a7 7 0 0 1 11.7-2L20 8M4 16l2.2 2a7 7 0 0 0 11.7-2" /></>,
  code: <><path d="m8 9-3 3 3 3m8-6 3 3-3 3M14 5l-4 14" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  shield: <><path d="M12 3 5 6v5c0 4.5 2.8 8 7 10 4.2-2 7-5.5 7-10V6l-7-3Z" /><path d="m9 12 2 2 4-4" /></>,
  wallet: <><path d="M4 6h14v14H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h12" /><path d="M14 10h8v6h-8a3 3 0 0 1 0-6Z" /></>,
  more: <><circle cx="5" cy="12" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /></>,
  filter: <path d="M4 5h16l-6 7v5l-4 2v-7L4 5Z" />,
  terminal: <><path d="m5 7 4 4-4 4M11 17h8" /></>,
}

function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {iconPaths[name]}
    </svg>
  )
}

function Brand() {
  return (
    <div className="brand">
      <div className="brand-mascot-container">
        <Mascot
          directions="/mascots/bunny-directions.webp"
          reactions="/mascots/bunny-reactions.webp"
          size={40}
          label="TinyBunny mascot"
          className="bunny-mascot-actor"
        />
      </div>
      <div className="brand-copy">
        <strong>TinyBunny</strong>
        <span>WEB INTELLIGENCE STUDIO</span>
      </div>
    </div>
  )
}

function StatusBadge({ children, tone = "neutral", dot = true }: { children: React.ReactNode; tone?: Tone; dot?: boolean }) {
  return <span className={`status status-${tone}`}>{dot && <i />}{children}</span>
}

function Button({
  children,
  variant = "secondary",
  icon,
  onClick,
  disabled,
  className = "",
}: {
  children: React.ReactNode
  variant?: "primary" | "secondary" | "ghost" | "danger"
  icon?: IconName
  onClick?: () => void
  disabled?: boolean
  className?: string
}) {
  return (
    <button className={`button button-${variant} ${className}`} onClick={onClick} disabled={disabled}>
      {icon && <Icon name={icon} size={16} />}
      <span>{children}</span>
    </button>
  )
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`card ${className}`}>{children}</section>
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      {children}
      {hint && <span className="field-hint">{hint}</span>}
    </label>
  )
}

function PageIntro({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string
  title: string
  description: string
  actions?: React.ReactNode
}) {
  return (
    <div className="page-intro">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="page-description">{description}</p>
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </div>
  )
}

function EmptyState({ icon, title, text }: { icon: IconName; title: string; text: string }) {
  return (
    <div className="empty-state">
      <div className="empty-icon"><Icon name={icon} size={22} /></div>
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  )
}

function Metric({
  label,
  value,
  meta,
  tone = "neutral",
}: {
  label: string
  value: string
  meta: string
  tone?: Tone
}) {
  return (
    <Card className="metric-card">
      <div className="metric-top">
        <span>{label}</span>
        <span className={`metric-orb metric-${tone}`} />
      </div>
      <strong>{value}</strong>
      <small>{meta}</small>
    </Card>
  )
}

/**
 * Validates that an agent streaming URL is strictly an HTTPS URL on a TinyFish-controlled domain.
 */
function isValidStreamingUrl(urlStr: string | null | undefined): boolean {
  if (!urlStr || typeof urlStr !== "string") return false
  try {
    const parsed = new URL(urlStr)
    if (parsed.protocol !== "https:") return false
    const host = parsed.hostname.toLowerCase()
    return host === "tinyfish.ai" || host.endsWith(".tinyfish.ai")
  } catch {
    return false
  }
}

/**
 * Safely extracts hostname for display without throwing on un-prefixed or malformed URLs.
 */
function safeHostname(urlStr: string | null | undefined): string {
  if (!urlStr || typeof urlStr !== "string" || !urlStr.trim()) return "No preview session"
  try {
    const candidate = urlStr.startsWith("http://") || urlStr.startsWith("https://") ? urlStr : `https://${urlStr}`
    return new URL(candidate).hostname || urlStr
  } catch {
    return urlStr
  }
}

/* ========================================================================== */
/* SECTION: DASHBOARD                                                        */
/* ========================================================================== */
function Dashboard({ navigate }: { navigate: (route: Route) => void }) {
  const [stats, setStats] = useState({ total: 0, completed: 0, failed: 0, partial: 0, running: 0 })
  const [recentRuns, setRecentRuns] = useState<any[]>([])
  const [backendHealth, setBackendHealth] = useState<{ checked: boolean; online: boolean; keyConfigured: boolean }>({
    checked: false,
    online: false,
    keyConfigured: false,
  })

  useEffect(() => {
    cleanStaleRunningRecords()
    setStats(getHistoryStats())
    const history = getHistory()
    setRecentRuns(history.slice(0, 5))

    checkBackendHealth()
      .then((data) => {
        setBackendHealth({
          checked: true,
          online: true,
          keyConfigured: Boolean(data?.services?.tinyfishConfigured),
        })
      })
      .catch(() => {
        setBackendHealth({ checked: true, online: false, keyConfigured: false })
      })
  }, [])

  const features: { route: Route; title: string; text: string; icon: IconName; meta: string }[] = [
    { route: "search", title: "Search Lab", text: "Discover precise information across the open web.", icon: "search", meta: "RESEARCH" },
    { route: "fetch", title: "Fetch Lab", text: "Extract clean, structured content from any webpage.", icon: "download", meta: "EXTRACT" },
    { route: "agent", title: "Agent Lab", text: "Execute goal-oriented browser automation safely.", icon: "spark", meta: "AUTOMATE" },
  ]

  const systemTone: Tone = !backendHealth.checked
    ? "neutral"
    : backendHealth.online && backendHealth.keyConfigured
    ? "success"
    : backendHealth.online
    ? "warning"
    : "danger"

  const systemStatusLabel = !backendHealth.checked
    ? "Checking..."
    : backendHealth.online && backendHealth.keyConfigured
    ? "Backend Ready"
    : backendHealth.online
    ? "Key Required"
    : "Offline"

  return (
    <>
      <div className="hero">
        <div className="hero-copy">
          <p className="eyebrow">GOOD MORNING, OPERATOR</p>
          <h1>Web intelligence,<br /><em>orchestrated.</em></h1>
          <p>Search, extract, and automate the web from one focused workspace built for precise intelligence operations.</p>
          <div className="hero-actions">
            <Button variant="primary" icon="spark" onClick={() => navigate("agent")}>Start an agent run</Button>
            <Button icon="search" onClick={() => navigate("search")}>Open Search Lab</Button>
          </div>
        </div>
        <div className="hero-visual" aria-hidden="true">
          <div className="orbit orbit-one" /><div className="orbit orbit-two" />
          <div className="core">
            <Mascot
              directions="/mascots/bunny-directions.webp"
              reactions="/mascots/bunny-reactions.webp"
              size={60}
              label="TinyBunny dashboard mascot"
            />
          </div>
          <div className="signal-card signal-a"><span>SEARCH</span><strong>Web discovery</strong></div>
          <div className="signal-card signal-b"><span>AGENT</span><strong>Ready to run</strong></div>
        </div>
      </div>

      <div className="section-heading">
        <div><span className="section-kicker">WORKSPACES</span><h2>Choose your instrument</h2></div>
        <span className="section-note">3 tools available</span>
      </div>
      <div className="feature-grid">
        {features.map((feature, index) => (
          <button key={feature.title} className="feature-card" onClick={() => navigate(feature.route)}>
            <div className="feature-card-top">
              <span className="feature-index">0{index + 1}</span>
              <span className="feature-icon"><Icon name={feature.icon} size={20} /></span>
            </div>
            <div>
              <span className="feature-meta">{feature.meta}</span>
              <h3>{feature.title}</h3>
              <p>{feature.text}</p>
            </div>
            <div className="feature-link">Enter workspace <Icon name="arrow" size={16} /></div>
          </button>
        ))}
      </div>

      <div className="section-heading compact">
        <div><span className="section-kicker">OVERVIEW</span><h2>Execution telemetry</h2></div>
        <span className="section-note">Local activity</span>
      </div>
      <div className="metric-grid">
        <Metric label="Total runs" value={String(stats.total)} meta="Saved in this browser" />
        <Metric label="Successful" value={String(stats.completed)} meta="Completed local runs" tone="success" />
        <Metric label="Failed / Partial" value={String(stats.failed + stats.partial)} meta="Needs attention" tone="danger" />
        <Card className="metric-card wallet-metric">
          <div className="metric-top"><span>Wallet status</span><Icon name="wallet" size={16} /></div>
          <strong className="metric-status">Not connected</strong>
          <Button variant="ghost" onClick={() => navigate("settings")}>
            Review setup <Icon name="arrow" size={14} />
          </Button>
        </Card>
      </div>

      <div className="dashboard-bottom">
        <Card>
          <div className="card-header">
            <div><span className="section-kicker">ACTIVITY</span><h3>Recent executions</h3></div>
            <Button variant="ghost" onClick={() => navigate("history")}>View history <Icon name="arrow" size={14} /></Button>
          </div>
          {recentRuns.length === 0 ? (
            <EmptyState icon="history" title="Your workspace is quiet" text="Completed Search, Fetch, and Agent runs will appear here." />
          ) : (
            <div className="system-list">
              {recentRuns.map((run) => (
                <div key={run.id} onClick={() => navigate("history")} style={{ cursor: "pointer" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <Icon name={run.type === "agent" ? "spark" : run.type === "fetch" ? "download" : "search"} size={16} />
                    <strong style={{ fontSize: "12px", color: "var(--text)" }}>{run.title}</strong>
                  </span>
                  <StatusBadge
                    tone={run.status === "completed" ? "success" : run.status === "partial" ? "warning" : "danger"}
                    dot={false}
                  >
                    {run.status}
                  </StatusBadge>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="system-card">
          <div className="card-header">
            <div><span className="section-kicker">SYSTEM</span><h3>Connection overview</h3></div>
            <StatusBadge tone={systemTone}>{systemStatusLabel}</StatusBadge>
          </div>
          <div className="system-list">
            <div>
              <span><Icon name="search" size={16} />Search API</span>
              <StatusBadge dot={false} tone={systemTone}>{systemStatusLabel}</StatusBadge>
            </div>
            <div>
              <span><Icon name="download" size={16} />Fetch API</span>
              <StatusBadge dot={false} tone={systemTone}>{systemStatusLabel}</StatusBadge>
            </div>
            <div>
              <span><Icon name="spark" size={16} />Agent API</span>
              <StatusBadge dot={false} tone={systemTone}>{systemStatusLabel}</StatusBadge>
            </div>
          </div>
          <Button onClick={() => navigate("settings")} className="full">Review configuration</Button>
        </Card>
      </div>
    </>
  )
}

/* ========================================================================== */
/* SECTION: SEARCH LAB                                                       */
/* ========================================================================== */
function SearchLab() {
  const [query, setQuery] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "empty" | "error">("idle")
  const [results, setResults] = useState<any[]>([])
  const [displayLimit, setDisplayLimit] = useState<number>(10)
  const [error, setError] = useState("")
  const [backendHealth, setBackendHealth] = useState({ checked: false, online: false, keyConfigured: false })

  useEffect(() => {
    checkBackendHealth()
      .then((data) => {
        setBackendHealth({
          checked: true,
          online: true,
          keyConfigured: Boolean(data?.services?.tinyfishConfigured),
        })
      })
      .catch(() => {
        setBackendHealth({ checked: true, online: false, keyConfigured: false })
      })
  }, [])

  const runSearch = async () => {
    if (!query.trim() || status === "loading") return
    setStatus("loading")
    setError("")
    const startedAt = Date.now()
    const record = createRecord({
      type: "search",
      title: `Search: ${query.slice(0, 60)}`,
      input: { query },
      status: "running",
    })

    try {
      const response = await searchTinyFish({ query })
      const normalized = normalizeSearchResults(response)
      setResults(normalized)
      setStatus(normalized.length ? "success" : "empty")
      updateRecord(record.id, {
        status: "completed",
        completedAt: new Date().toISOString(),
        durationMs: Date.now() - startedAt,
        resultSummary: `Found ${normalized.length} search results.`,
        resultPayload: { results: normalized.slice(0, 10) },
      })
    } catch (err: any) {
      setStatus("error")
      setError(err?.message || "Search request failed.")
      updateRecord(record.id, {
        status: "failed",
        completedAt: new Date().toISOString(),
        durationMs: Date.now() - startedAt,
        errorMessage: err?.message || "Search request failed.",
      })
    }
  }

  const visibleResults = results.slice(0, displayLimit)

  return (
    <>
      <PageIntro
        eyebrow="RESEARCH WORKSPACE"
        title="Search Lab"
        description="Discover relevant sources across the web with a clean, focused research interface."
        actions={
          <StatusBadge
            tone={
              status === "error"
                ? "danger"
                : backendHealth.online && backendHealth.keyConfigured
                ? "success"
                : backendHealth.online
                ? "warning"
                : "neutral"
            }
          >
            {status === "error"
              ? "Request failed"
              : backendHealth.online && backendHealth.keyConfigured
              ? "Backend Ready"
              : backendHealth.online
              ? "Key Needed"
              : "Backend Offline"}
          </StatusBadge>
        }
      />
      <Card className="search-panel">
        <div className="search-panel-label"><Icon name="search" size={16} /><span>WEB SEARCH</span><kbd>⌘ K</kbd></div>
        <div className="search-box">
          <Icon name="search" size={22} />
          <input
            aria-label="Search the web"
            placeholder="What do you want to investigate?"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && runSearch()}
          />
          {query && (
            <button
              className="icon-button"
              aria-label="Clear search"
              onClick={() => { setQuery(""); setStatus("idle"); setResults([]) }}
            >
              <Icon name="close" size={16} />
            </button>
          )}
          <Button variant="primary" onClick={runSearch} disabled={!query.trim() || status === "loading"}>
            {status === "loading" ? "Searching…" : "Search web"}
          </Button>
        </div>
        <div className="search-options">
          <div className="chips">
            <span>Try</span>
            {["AI browser agents", "Structured web extraction", "TinyFish API docs"].map((item) => (
              <button key={item} onClick={() => setQuery(item)}>{item}</button>
            ))}
          </div>
          <label className="inline-select">
            <span>Show</span>
            <select value={displayLimit} onChange={(e) => setDisplayLimit(Number(e.target.value))}>
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
            </select>
            <span>results</span>
          </label>
        </div>
      </Card>

      {status === "loading" ? (
        <div className="results-area">
          <div className="results-meta"><span>SEARCHING THE WEB…</span></div>
          {[1, 2, 3].map((i) => <Card key={i} className="result-card skeleton"><div /><div /><div /></Card>)}
        </div>
      ) : status === "error" ? (
        <Card className="lab-empty"><EmptyState icon="search" title="Search failed" text={error} /></Card>
      ) : status === "idle" ? (
        <Card className="lab-empty"><EmptyState icon="search" title="Start with a precise question" text="Search results will be organized here by source, relevance, and content." /></Card>
      ) : status === "empty" ? (
        <Card className="lab-empty"><EmptyState icon="search" title="No results found" text="Try a broader research question or verify your search terms." /></Card>
      ) : (
        <div className="results-area">
          <div className="results-meta">
            <span>SHOWING {visibleResults.length} OF {results.length} RESULTS</span>
            <span>Live TinyFish response</span>
          </div>
          {visibleResults.map((result, i) => (
            <Card className="result-card" key={result.id || result.url || i}>
              <div className="result-number">{String(i + 1).padStart(2, "0")}</div>
              <div className="result-content">
                <div className="result-domain">
                  <span className="favicon">{String(result.domain || result.url || "W")[0].toUpperCase()}</span>
                  <span>{result.domain || result.url || "Web source"}</span>
                  <span className="result-tag">Verified</span>
                </div>
                <h3>{result.title || "Untitled result"}</h3>
                <p>{result.snippet || result.description || ""}</p>
              </div>
              {result.url && (
                <a
                  className="result-link"
                  href={result.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Open ${result.title || "result"}`}
                >
                  <Icon name="link" size={17} />
                </a>
              )}
            </Card>
          ))}
        </div>
      )}
    </>
  )
}

/* ========================================================================== */
/* SECTION: FETCH LAB                                                        */
/* ========================================================================== */
function FetchLab() {
  const [urls, setUrls] = useState("")
  const [format, setFormat] = useState("Markdown")
  const [purpose, setPurpose] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState("")
  const [copied, setCopied] = useState(false)
  const [backendHealth, setBackendHealth] = useState({ checked: false, online: false, keyConfigured: false })

  useEffect(() => {
    checkBackendHealth()
      .then((data) => {
        setBackendHealth({
          checked: true,
          online: true,
          keyConfigured: Boolean(data?.services?.tinyfishConfigured),
        })
      })
      .catch(() => {
        setBackendHealth({ checked: true, online: false, keyConfigured: false })
      })
  }, [])

  const count = urls.split("\n").filter(Boolean).length

  const runFetch = async () => {
    const targets = urls.split("\n").map((item) => item.trim()).filter(Boolean)
    if (!targets.length || status === "loading") return

    if (targets.length > 10) {
      setError("Cannot fetch more than 10 URLs per request.")
      setStatus("error")
      return
    }

    setStatus("loading")
    setError("")
    const startedAt = Date.now()
    const record = createRecord({
      type: "fetch",
      title: `Fetch: ${targets[0]}${targets.length > 1 ? ` (+${targets.length - 1} more)` : ""}`,
      input: { urls: targets, format, purpose },
      status: "running",
    })

    try {
      const response = await fetchPages({ urls: targets, format: format.toLowerCase(), purpose })
      setResult(response)
      setStatus("success")
      updateRecord(record.id, {
        status: response?.errors?.length ? (response?.results?.length ? "partial" : "failed") : "completed",
        completedAt: new Date().toISOString(),
        durationMs: Date.now() - startedAt,
        resultSummary: `Extracted ${response?.results?.length || 0} of ${targets.length} pages.`,
        resultPayload: response,
      })
    } catch (err: any) {
      setStatus("error")
      setError(err?.message || "Fetch request failed.")
      updateRecord(record.id, {
        status: "failed",
        completedAt: new Date().toISOString(),
        durationMs: Date.now() - startedAt,
        errorMessage: err?.message || "Fetch request failed.",
      })
    }
  }

  return (
    <>
      <PageIntro
        eyebrow="EXTRACTION WORKSPACE"
        title="Fetch Lab"
        description="Turn webpages into clean, structured content ready for analysis or downstream workflows."
        actions={
          <StatusBadge
            tone={
              status === "error"
                ? "danger"
                : backendHealth.online && backendHealth.keyConfigured
                ? "success"
                : backendHealth.online
                ? "warning"
                : "neutral"
            }
          >
            {backendHealth.online && backendHealth.keyConfigured
              ? "Backend Ready"
              : backendHealth.online
              ? "Key Needed"
              : "Offline"}
          </StatusBadge>
        }
      />
      <div className="two-column">
        <Card className="form-card">
          <div className="card-header">
            <div><span className="section-kicker">INPUT</span><h3>Extraction request</h3></div>
            <span className="counter">{count} / 10 URLs</span>
          </div>
          <Field label="Target URLs" hint="One complete URL per line. Up to 10 URLs per batch.">
            <textarea
              rows={7}
              placeholder={"https://example.com/article\nhttps://example.com/docs"}
              value={urls}
              onChange={(e) => setUrls(e.target.value)}
            />
          </Field>
          <Field label="Output format">
            <div className="segmented">
              {["Markdown", "HTML", "JSON"].map((item) => (
                <button
                  type="button"
                  className={format === item ? "active" : ""}
                  onClick={() => setFormat(item)}
                  key={item}
                >
                  {item}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Extraction purpose" hint="Optional context can improve content selection.">
            <input
              placeholder="e.g. Extract product specifications and pricing"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
            />
          </Field>
          <div className="allowance">
            <Icon name="shield" size={18} />
            <div>
              <strong>Daily free allowance</strong>
              <span>Availability is confirmed by the provider when you run a request.</span>
            </div>
          </div>
          <Button
            variant="primary"
            icon="download"
            className="full"
            onClick={runFetch}
            disabled={!urls.trim() || status === "loading"}
          >
            {status === "loading" ? "Fetching…" : "Fetch content"}
          </Button>
        </Card>

        <Card className="inspector-card">
          <div className="card-header">
            <div><span className="section-kicker">OUTPUT</span><h3>Content inspector</h3></div>
            {status === "success" && (
              <StatusBadge tone={result?.errors?.length ? "warning" : "success"}>
                {result?.errors?.length ? "Partial" : "Extracted"}
              </StatusBadge>
            )}
            {status === "error" && <StatusBadge tone="danger">Failed</StatusBadge>}
          </div>

          {status === "success" ? (
            <div className="content-result">
              <div className="content-meta">
                <div>
                  <span className="favicon">T</span>
                  <div>
                    <strong>{result?.results?.[0]?.url || urls.split("\n")[0]}</strong>
                    <span>{result?.results?.length || 0} source(s) processed</span>
                  </div>
                </div>
              </div>
              <div className="document-head">
                <span>{format.toUpperCase()} PREVIEW</span>
                <Button
                  variant="ghost"
                  icon={copied ? "check" : "copy"}
                  onClick={() => {
                    const textToCopy =
                      result?.results?.[0]?.content || JSON.stringify(result, null, 2)
                    navigator.clipboard?.writeText(textToCopy)
                    setCopied(true)
                    window.setTimeout(() => setCopied(false), 1500)
                  }}
                >
                  {copied ? "Copied" : "Copy"}
                </Button>
              </div>
              <pre>
                <code>
                  {result?.results?.[0]?.content
                    ? result.results[0].content
                    : JSON.stringify(result, null, 2)}
                </code>
              </pre>
              <div className="content-footer">
                <span><Icon name="clock" size={14} /> Extracted just now</span>
                <span>{result?.errors?.length || 0} errors</span>
              </div>
            </div>
          ) : status === "error" ? (
            <EmptyState icon="code" title="Fetch failed" text={error} />
          ) : (
            <EmptyState icon="code" title="Content will appear here" text="Enter at least one target URL and choose an output format to begin." />
          )}
        </Card>
      </div>
    </>
  )
}

/* ========================================================================== */
/* SECTION: AGENT LAB                                                        */
/* ========================================================================== */
function AgentLab() {
  const [goal, setGoal] = useState("")
  const [url, setUrl] = useState("")
  const [maxDuration, setMaxDuration] = useState(5)
  const [modal, setModal] = useState(false)
  const [running, setRunning] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [events, setEvents] = useState<any[]>([])
  const [finalResult, setFinalResult] = useState<any>(null)
  const [runId, setRunId] = useState<string | null>(null)
  const [streamingUrl, setStreamingUrl] = useState<string | null>(null)
  const [activeRecordId, setActiveRecordId] = useState<string | null>(null)
  const [startTimeMs, setStartTimeMs] = useState<number | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    return () => {
      abortRef.current?.abort()
    }
  }, [])

  const start = async () => {
    if (running) return
    setModal(false)
    setRunning(true)
    setCompleted(false)
    setEvents([])
    setFinalResult(null)
    setRunId(null)
    setStreamingUrl(null)

    const started = Date.now()
    setStartTimeMs(started)
    abortRef.current = new AbortController()

    const record = createRecord({
      type: "agent",
      title: `Agent: ${goal.slice(0, 60)}`,
      input: { url, goal },
      status: "running",
    })
    setActiveRecordId(record.id)

    await streamAgentRun(
      { url, goal, max_duration_seconds: maxDuration * 60 },
      {
        signal: abortRef.current.signal,
        onEvent: ({ event, data }: any) => {
          const timestamp = new Date().toLocaleTimeString()
          setEvents((previous) => [...previous, { event, data, timestamp }])

          // Handle STARTED
          if (event === "STARTED" || data?.type === "STARTED") {
            const providerId = data?.run_id || null
            if (providerId) {
              setRunId(providerId)
              updateRecord(record.id, { providerRunId: providerId })
            }
          }

          // Handle STREAMING_URL
          if (event === "STREAMING_URL" || data?.type === "STREAMING_URL") {
            if (data?.url && typeof data.url === "string") {
              setStreamingUrl(data.url)
            }
          }

          // Handle COMPLETE
          if (event === "COMPLETE" || data?.type === "COMPLETE") {
            const steps = extractNumOfSteps(data)
            const infraStatus = data?.status || "COMPLETED"

            // Goal success vs failure evaluation
            let isGoalSuccess = true
            let goalFailureReason: string | null = null

            if (infraStatus === "FAILED" || data?.error) {
              isGoalSuccess = false
              goalFailureReason =
                typeof data.error === "string" ? data.error : data.error?.message || "Execution infrastructure failed."
            } else if (data?.result?.success === false || data?.result?.error) {
              isGoalSuccess = false
              goalFailureReason = data.result.error || data.result.message || "Goal requirements could not be fulfilled."
            } else if (typeof data?.result === "string" && /could not find|unable to find|failed to|not found/i.test(data.result)) {
              isGoalSuccess = false
              goalFailureReason = data.result
            }

            const elapsed = Date.now() - started
            setFinalResult({
              ...data,
              isGoalSuccess,
              goalFailureReason,
              infraStatus,
              durationMs: elapsed,
            })
            setRunning(false)
            setCompleted(true)

            updateRecord(record.id, {
              status: isGoalSuccess ? "completed" : "failed",
              completedAt: new Date().toISOString(),
              durationMs: elapsed,
              providerRunId: data?.run_id || runId,
              numOfSteps: steps,
              resultPayload: data,
              resultSummary: isGoalSuccess
                ? "Goal accomplished successfully."
                : (goalFailureReason || "Goal requirements were not fulfilled."),
              errorMessage: isGoalSuccess ? null : (goalFailureReason || "Goal failed"),
            })
          }
        },
        onError: (err: any) => {
          setRunning(false)
          setCompleted(false)
          const elapsed = Date.now() - started
          setEvents((previous) => [
            ...previous,
            { event: "ERROR", data: { message: err.message }, timestamp: new Date().toLocaleTimeString() },
          ])
          updateRecord(record.id, {
            status: "failed",
            completedAt: new Date().toISOString(),
            durationMs: elapsed,
            errorMessage: err.message,
          })
        },
      }
    )
  }

  const cancelRun = () => {
    if (abortRef.current) {
      abortRef.current.abort()
      setRunning(false)
      const elapsed = startTimeMs ? Date.now() - startTimeMs : 0
      setEvents((prev) => [
        ...prev,
        {
          event: "CANCELLED",
          data: { message: "Agent execution cancelled by operator." },
          timestamp: new Date().toLocaleTimeString(),
        },
      ])
      if (activeRecordId) {
        updateRecord(activeRecordId, {
          status: "cancelled",
          completedAt: new Date().toISOString(),
          durationMs: elapsed,
          resultSummary: "Cancelled by operator.",
          errorMessage: "User aborted the active agent session.",
        })
      }
    }
  }

  const isGoalSuccess = finalResult?.isGoalSuccess ?? true
  const stateLabel = running
    ? "Running"
    : completed
    ? isGoalSuccess
      ? "Goal Completed"
      : "Goal Failed"
    : "Ready"

  const stateTone: Tone = running
    ? "accent"
    : completed
    ? isGoalSuccess
      ? "success"
      : "danger"
    : "neutral"

  return (
    <>
      <PageIntro
        eyebrow="AUTOMATION WORKSPACE"
        title="Agent Lab"
        description="Direct a browser agent through complex web tasks with live, inspectable execution."
        actions={<StatusBadge tone={stateTone}>{stateLabel}</StatusBadge>}
      />

      {!running && !completed ? (
        <div className="agent-setup">
          <Card className="agent-form">
            <div className="agent-form-head">
              <span className="agent-step">01</span>
              <div>
                <span className="section-kicker">MISSION CONTROL</span>
                <h2>Define the objective</h2>
                <p>Tell the agent where to begin and what successful completion looks like.</p>
              </div>
            </div>
            <Field label="Starting website URL">
              <div className="input-with-icon">
                <Icon name="link" size={17} />
                <input
                  placeholder="https://example.com"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                />
              </div>
            </Field>
            <Field label="Task goal" hint="Be specific about the desired output. Avoid entering private credentials.">
              <textarea
                rows={6}
                placeholder="Navigate the site, find the latest pricing information, and return each plan as structured JSON."
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
              />
            </Field>
            <div className="template-block">
              <span>SAFE STARTER TEMPLATES</span>
              <div className="template-chips">
                {[
                  "Compare public pricing plans",
                  "Find store opening hours",
                  "Collect public product details",
                ].map((item) => (
                  <button key={item} type="button" onClick={() => setGoal(item)}>
                    {item}<Icon name="arrow" size={13} />
                  </button>
                ))}
              </div>
            </div>
            <div className="agent-options">
              <Field label="Maximum duration">
                <select value={maxDuration} onChange={(e) => setMaxDuration(Number(e.target.value))}>
                  <option value={2}>2 minutes</option>
                  <option value={5}>5 minutes</option>
                  <option value={10}>10 minutes</option>
                </select>
              </Field>
              <div className="pricing-note">
                <span>Published usage price</span>
                <strong>$0.016 USD per step</strong>
                <small>Requires explicit confirmation before launch.</small>
              </div>
            </div>
            <Button
              variant="primary"
              icon="play"
              className="full prominent"
              disabled={!url.trim() || !goal.trim()}
              onClick={() => setModal(true)}
            >
              Review and confirm run
            </Button>
          </Card>
          <aside className="agent-aside">
            <div className="agent-orb">
              <div className="orb-ring" /><div className="orb-center"><Icon name="spark" size={28} /></div>
            </div>
            <span className="section-kicker">HOW IT WORKS</span>
            <h3>Observe every decision.</h3>
            <p>Live server-sent events expose the agent’s progress while structured results keep every run auditable.</p>
            <ol>
              <li><span>01</span>Review the task scope</li>
              <li><span>02</span>Confirm paid execution</li>
              <li><span>03</span>Watch the live run</li>
            </ol>
          </aside>
        </div>
      ) : (
        <ExecutionWorkspace
          running={running}
          completed={completed}
          events={events}
          result={finalResult}
          runId={runId}
          streamingUrl={streamingUrl}
          targetUrl={url}
          onCancel={cancelRun}
          onReset={() => {
            abortRef.current?.abort()
            setRunning(false)
            setCompleted(false)
            setEvents([])
            setFinalResult(null)
          }}
        />
      )}

      {modal && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setModal(false)}>
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="modal-icon"><Icon name="shield" size={24} /></div>
            <span className="section-kicker">PAID EXECUTION</span>
            <h2 id="confirm-title">Confirm agent run</h2>
            <p>This task will start a live browser session and may incur usage charges based on the provider’s published per-step pricing ($0.016/step).</p>
            <div className="review-list">
              <div><span>Starting URL</span><strong>{url}</strong></div>
              <div><span>Task objective</span><strong>{goal}</strong></div>
              <div><span>Pricing Rate</span><strong>$0.016 USD / step</strong></div>
            </div>
            <div className="modal-warning">
              <Icon name="shield" size={17} />
              <span>You are responsible for reviewing the task and any provider usage charges before continuing. No automated retries will occur.</span>
            </div>
            <div className="modal-actions">
              <Button onClick={() => setModal(false)}>Cancel</Button>
              <Button variant="primary" icon="play" onClick={start}>Confirm paid run</Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function ExecutionWorkspace({
  running,
  completed,
  events,
  result,
  runId,
  streamingUrl,
  targetUrl,
  onCancel,
  onReset,
}: {
  running: boolean
  completed: boolean
  events: any[]
  result: any
  runId: string | null
  streamingUrl: string | null
  targetUrl: string
  onCancel: () => void
  onReset: () => void
}) {
  const [copiedResult, setCopiedResult] = useState(false)
  const isStreamingSafe = isValidStreamingUrl(streamingUrl)

  const streamEvents = events.length
    ? events
    : [{ timestamp: "", event: "CONNECTING", data: { message: "Connecting to TinyFish agent stream…" } }]

  const isGoalSuccess = result?.isGoalSuccess ?? true
  const goalFailureReason = result?.goalFailureReason
  const steps = result ? extractNumOfSteps(result) : null

  return (
    <div className="execution">
      <div className="execution-bar">
        <div>
          <span className={`pulse ${running ? "" : "done"}`} />
          <strong>
            {running
              ? "Agent is working"
              : completed
              ? isGoalSuccess
                ? "Goal accomplished"
                : `Goal unsuccessful${goalFailureReason ? `: ${goalFailureReason}` : ""}`
              : "Agent stopped"}
          </strong>
          <span className="run-id">{runId || "Awaiting run ID"}</span>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <StatusBadge tone={running ? "accent" : completed ? (isGoalSuccess ? "success" : "danger") : "danger"}>
            {running ? "Live" : completed ? (isGoalSuccess ? "Success" : "Failed") : "Stopped"}
          </StatusBadge>
          {running ? (
            <Button variant="danger" icon="close" onClick={onCancel}>Abort run</Button>
          ) : (
            <Button variant="ghost" onClick={onReset}>New run</Button>
          )}
        </div>
      </div>

      <div className="execution-grid">
        {/* Real SSE Execution Console */}
        <Card className="console">
          <div className="panel-title">
            <div><Icon name="terminal" size={16} /><span>Execution console</span></div>
            <span>{running ? "SSE STREAMING" : "STREAM CLOSED"}</span>
          </div>
          <div className="event-stream">
            {streamEvents.map((item, index) => {
              // Extract real event type
              const eventType =
                item.data?.type || (item.event !== "message" ? item.event : item.data?.event) || "PROGRESS"

              // Extract real meaningful event message without repeating 'message: message'
              let messageText = ""
              if (typeof item.data === "string") {
                messageText = item.data
              } else if (item.data?.message && item.data.message !== "message") {
                messageText = item.data.message
              } else if (item.data?.text) {
                messageText = item.data.text
              } else if (eventType === "STARTED") {
                messageText = `Agent session started${item.data?.run_id ? ` (ID: ${item.data.run_id})` : ""}`
              } else if (eventType === "STREAMING_URL") {
                messageText = `Live browser stream ready: ${item.data?.url || ""}`
              } else if (eventType === "HEARTBEAT") {
                messageText = "Heartbeat received — agent session active"
              } else if (eventType === "COMPLETE") {
                messageText = `Execution completed — status: ${item.data?.status || "COMPLETED"}`
              } else if (eventType === "CANCELLED") {
                messageText = "Execution cancelled by operator"
              } else if (eventType === "ERROR") {
                messageText = item.data?.error || item.data?.message || "Execution error"
              } else if (item.data) {
                messageText = JSON.stringify(item.data)
              } else {
                messageText = eventType
              }

              const isComplete = eventType === "COMPLETE"
              const isError = eventType === "ERROR" || item.data?.status === "FAILED"
              const isPending = running && index === streamEvents.length - 1

              return (
                <div
                  className={`event ${isComplete ? "event-success" : isError ? "event-danger" : isPending ? "event-active" : "event-pending"}`}
                  key={`${eventType}-${index}`}
                >
                  <span className="event-time">{item.timestamp || "—"}</span>
                  <span className="event-mark">{isComplete ? "✓" : isError ? "✕" : "→"}</span>
                  <span><strong>{eventType}</strong>: {messageText}</span>
                </div>
              )
            })}
          </div>
          <div className="console-footer">
            <span>Run ID</span>
            <code>{runId || "Pending"}</code>
            <button
              aria-label="Copy run ID"
              onClick={() => runId && navigator.clipboard?.writeText(runId)}
            >
              <Icon name="copy" size={14} />
            </button>
          </div>
        </Card>

        {/* Live Browser Preview */}
        <div className="execution-right">
          <Card className="browser">
            <div className="browser-bar">
              <div className="browser-dots"><i /><i /><i /></div>
              <div className="browser-url">
                <Icon name="shield" size={12} />
                <span>{isStreamingSafe ? "live.streaming.tinyfish.ai" : safeHostname(targetUrl)}</span>
              </div>
              {isStreamingSafe && streamingUrl && (
                <a
                  href={streamingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Open live session in new tab"
                  style={{ color: "var(--orange)", display: "flex", alignItems: "center" }}
                >
                  <Icon name="link" size={15} />
                </a>
              )}
            </div>

            <div className="browser-view" style={{ minHeight: "280px", position: "relative" }}>
              {isStreamingSafe && streamingUrl ? (
                <iframe
                  src={streamingUrl}
                  title="Live Agent Browser Session"
                  style={{ width: "100%", height: "100%", border: 0, minHeight: "280px" }}
                  sandbox="allow-scripts allow-same-origin"
                />
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "100%",
                    minHeight: "240px",
                    color: "#6c6e75",
                    textAlign: "center",
                    padding: "20px",
                  }}
                >
                  <Icon name="spark" size={24} />
                  <p style={{ marginTop: "10px", fontSize: "11px", maxWidth: "260px", lineHeight: "1.5" }}>
                    {running
                      ? "Awaiting live streaming browser URL from TinyFish…"
                      : "Live browser streaming will appear when the provider activates the stream."}
                  </p>
                </div>
              )}
            </div>
          </Card>

          {/* Result Panel */}
          <Card className="result-panel">
            <div className="card-header">
              <div>
                <span className="section-kicker">RESULT</span>
                <h3>{completed ? (isGoalSuccess ? "Structured output" : "Unsuccessful Goal Output") : "Waiting for result"}</h3>
              </div>
              {completed && (
                <Button
                  variant="ghost"
                  icon={copiedResult ? "check" : "copy"}
                  onClick={() => {
                    navigator.clipboard?.writeText(JSON.stringify(result, null, 2))
                    setCopiedResult(true)
                    setTimeout(() => setCopiedResult(false), 1500)
                  }}
                >
                  {copiedResult ? "Copied" : "Copy JSON"}
                </Button>
              )}
            </div>
            {completed ? (
              <>
                <pre><code>{JSON.stringify(result || {}, null, 2)}</code></pre>
                <div className="run-stats">
                  <div>
                    <span>Duration</span>
                    <strong>{result?.durationMs ? `${(result.durationMs / 1000).toFixed(1)}s` : "—"}</strong>
                  </div>
                  <div>
                    <span>Steps</span>
                    <strong>{steps ?? "—"}</strong>
                  </div>
                  <div>
                    <span>Est. cost</span>
                    <strong>{typeof steps === "number" ? `$${(steps * 0.016).toFixed(4)} USD` : "Cost unavailable"}</strong>
                  </div>
                </div>
              </>
            ) : (
              <div className="result-waiting">
                <span className="loader" />
                <p>Results will appear when the agent completes its goal.</p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}

/* ========================================================================== */
/* SECTION: RUN HISTORY                                                      */
/* ========================================================================== */
function RunHistory() {
  const [type, setType] = useState("All")
  const [statusFilter, setStatusFilter] = useState("all")
  const [query, setQuery] = useState("")
  const [selected, setSelected] = useState<any | null>(null)
  const [clearModal, setClearModal] = useState(false)
  const [records, setRecords] = useState<any[]>([])
  const [copiedPayload, setCopiedPayload] = useState(false)

  const reloadRecords = () => {
    cleanStaleRunningRecords()
    setRecords(getHistory())
  }

  useEffect(() => {
    reloadRecords()
  }, [])

  const viewRecords = records.map((r) => ({
    ...r,
    typeLabel: String(r.type || "search").replace(/^./, (c) => c.toUpperCase()),
    statusLabel: String(r.status || "unknown").replace(/^./, (c) => c.toUpperCase()),
    duration: r.durationMs ? `${(r.durationMs / 1000).toFixed(1)}s` : "—",
    time: r.startedAt ? new Date(r.startedAt).toLocaleString() : "—",
    steps: r.numOfSteps ?? "—",
    cost: typeof r.estimatedCostUsd === "number" ? `$${r.estimatedCostUsd.toFixed(4)}` : "—",
  }))

  const filtered = useMemo(() => {
    return viewRecords.filter((r) => {
      if (type !== "All" && r.typeLabel !== type) return false
      if (statusFilter !== "all" && r.status !== statusFilter) return false
      if (query.trim()) {
        const q = query.toLowerCase()
        const matchesTitle = String(r.title || "").toLowerCase().includes(q)
        const matchesSummary = String(r.resultSummary || "").toLowerCase().includes(q)
        const matchesId = String(r.id || "").toLowerCase().includes(q)
        return matchesTitle || matchesSummary || matchesId
      }
      return true
    })
  }, [viewRecords, type, statusFilter, query])

  return (
    <>
      <PageIntro
        eyebrow="LOCAL AUDIT LOG"
        title="Run History"
        description="Review and manage task activity saved locally in this browser."
        actions={
          <>
            <Button
              icon="export"
              onClick={() => {
                const blob = new Blob([exportHistoryJson()], { type: "application/json" })
                const link = document.createElement("a")
                link.href = URL.createObjectURL(blob)
                link.download = `tinyfish-run-history-${new Date().toISOString().slice(0, 10)}.json`
                link.click()
                URL.revokeObjectURL(link.href)
              }}
            >
              Export JSON
            </Button>
            <Button variant="danger" icon="trash" onClick={() => setClearModal(true)}>
              Clear history
            </Button>
          </>
        }
      />
      <div className="history-note">
        <Icon name="shield" size={17} />
        <span>Local history is stored strictly in browser localStorage and is independent of your TinyFish provider account usage.</span>
      </div>
      <div className="metric-grid three">
        <Metric label="Total records" value={String(records.length)} meta="Saved in this browser" />
        <Metric label="Completed" value={String(getHistoryStats().completed)} meta="Across all task types" tone="success" />
        <Metric label="Needs attention" value={String(getHistoryStats().failed + getHistoryStats().partial)} meta="Partial or failed runs" tone="warning" />
      </div>

      <Card className="table-card">
        <div className="toolbar">
          <div className="toolbar-search">
            <Icon name="search" size={17} />
            <input
              aria-label="Search history"
              placeholder="Search task history…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="filter-tabs">
            {["All", "Search", "Fetch", "Agent"].map((item) => (
              <button
                key={item}
                className={type === item ? "active" : ""}
                onClick={() => setType(item)}
              >
                {item}
              </button>
            ))}
          </div>
          <div className="inline-select" style={{ marginLeft: "auto" }}>
            <span>Status</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ background: "transparent", color: "var(--text)", border: "1px solid var(--border)", borderRadius: "6px", padding: "4px 8px" }}
            >
              <option value="all">All</option>
              <option value="completed">Completed</option>
              <option value="partial">Partial</option>
              <option value="failed">Failed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {filtered.length ? (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Task</th>
                  <th>Status</th>
                  <th>Duration</th>
                  <th>Steps</th>
                  <th>Est. cost</th>
                  <th>Timestamp</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <button className="task-cell" onClick={() => setSelected(row)}>
                        <span className={`task-icon type-${row.typeLabel.toLowerCase()}`}>
                          <Icon
                            name={
                              row.typeLabel === "Agent" ? "spark" : row.typeLabel === "Fetch" ? "download" : "search"
                            }
                            size={15}
                          />
                        </span>
                        <span>
                          <strong>{row.title}</strong>
                          <small>{row.typeLabel} · {row.id}</small>
                        </span>
                      </button>
                    </td>
                    <td>
                      <StatusBadge
                        tone={
                          row.statusLabel === "Completed"
                            ? "success"
                            : row.statusLabel === "Partial"
                            ? "warning"
                            : "danger"
                        }
                      >
                        {row.statusLabel}
                      </StatusBadge>
                    </td>
                    <td className="mono">{row.duration}</td>
                    <td className="mono">{row.steps}</td>
                    <td>{row.cost}</td>
                    <td>{row.time}</td>
                    <td>
                      <button
                        className="icon-button"
                        aria-label="Delete record"
                        title="Delete record"
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteRecord(row.id)
                          reloadRecords()
                        }}
                      >
                        <Icon name="trash" size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState icon="filter" title="No matching records" text="Try adjusting your filters or search query." />
        )}
      </Card>

      {/* Slide-over Drawer for Details */}
      {selected && (
        <div className="drawer-backdrop" onMouseDown={() => setSelected(null)}>
          <aside className="details-drawer" onMouseDown={(e) => e.stopPropagation()}>
            <div className="drawer-head">
              <div>
                <span className="section-kicker">RECORD DETAILS</span>
                <h2>{selected.title}</h2>
              </div>
              <button className="icon-button" onClick={() => setSelected(null)} aria-label="Close details">
                <Icon name="close" />
              </button>
            </div>
            <StatusBadge tone={selected.status === "completed" ? "success" : "danger"}>
              {selected.statusLabel}
            </StatusBadge>

            <div className="details-list" style={{ marginTop: "14px" }}>
              <div><span>Task ID</span><strong>{selected.id}</strong></div>
              {selected.providerRunId && <div><span>Provider Run ID</span><strong>{selected.providerRunId}</strong></div>}
              <div><span>Type</span><strong>{selected.typeLabel}</strong></div>
              <div><span>Duration</span><strong>{selected.duration}</strong></div>
              <div><span>Steps</span><strong>{selected.steps}</strong></div>
              <div><span>Estimated Cost</span><strong>{selected.cost}</strong></div>
              <div><span>Started At</span><strong>{selected.time}</strong></div>
              {selected.resultSummary && <div><span>Summary</span><strong>{selected.resultSummary}</strong></div>}
              {selected.errorMessage && <div style={{ color: "var(--red)" }}><span>Error</span><strong>{selected.errorMessage}</strong></div>}
            </div>

            <div style={{ marginTop: "16px", marginBottom: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span className="section-kicker">RESULT PAYLOAD</span>
              <Button
                variant="ghost"
                icon={copiedPayload ? "check" : "copy"}
                onClick={() => {
                  navigator.clipboard?.writeText(
                    JSON.stringify(selected.resultPayload || selected.input || selected, null, 2)
                  )
                  setCopiedPayload(true)
                  setTimeout(() => setCopiedPayload(false), 1500)
                }}
              >
                {copiedPayload ? "Copied" : "Copy"}
              </Button>
            </div>
            <pre style={{ maxHeight: "240px", overflowY: "auto" }}>
              <code>
                {JSON.stringify(selected.resultPayload || selected.input || selected, null, 2)}
              </code>
            </pre>

            <div className="drawer-actions">
              <Button
                variant="danger"
                icon="trash"
                onClick={() => {
                  deleteRecord(selected.id)
                  setSelected(null)
                  reloadRecords()
                }}
              >
                Delete record
              </Button>
              <Button
                icon="export"
                onClick={() => {
                  const blob = new Blob([JSON.stringify(selected, null, 2)], { type: "application/json" })
                  const link = document.createElement("a")
                  link.href = URL.createObjectURL(blob)
                  link.download = `run-${selected.id}.json`
                  link.click()
                  URL.revokeObjectURL(link.href)
                }}
              >
                Export JSON
              </Button>
            </div>
          </aside>
        </div>
      )}

      {/* Clear Confirmation Modal */}
      {clearModal && (
        <div className="modal-backdrop">
          <div className="modal compact-modal">
            <div className="modal-icon danger"><Icon name="trash" size={22} /></div>
            <h2>Clear local history?</h2>
            <p>This permanently removes all locally saved task records from this browser storage. It does not affect provider account records.</p>
            <div className="modal-actions">
              <Button onClick={() => setClearModal(false)}>Cancel</Button>
              <Button
                variant="danger"
                onClick={() => {
                  clearHistory()
                  setRecords([])
                  setClearModal(false)
                }}
              >
                Clear all records
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

/* ========================================================================== */
/* SECTION: SETTINGS                                                         */
/* ========================================================================== */
function Settings() {
  const [checking, setChecking] = useState(false)
  const [health, setHealth] = useState<any>(null)
  const [errorMsg, setErrorMsg] = useState("")
  const [copiedSnippet, setCopiedSnippet] = useState(false)
  const [storageUsage, setStorageUsage] = useState<any>(null)

  const refresh = async () => {
    setChecking(true)
    setErrorMsg("")
    try {
      const response = await checkBackendHealth()
      setHealth(response)
    } catch (err: any) {
      setHealth(null)
      setErrorMsg(err?.message || `Backend is unreachable at ${API_BASE_URL}.`)
    } finally {
      setChecking(false)
      setStorageUsage(getStorageUsage())
    }
  }

  useEffect(() => {
    refresh()
  }, [])

  const isConfigured = Boolean(health?.services?.tinyfishConfigured)
  const isOnline = Boolean(health?.status === "ok")

  const setupSnippet = `# server/.env
PORT=5000
CLIENT_ORIGIN=http://localhost:5173
NODE_ENV=development

# TinyFish API Key (Required for Search, Fetch, and Agent APIs)
TINYFISH_API_KEY=your_actual_api_key_here`

  return (
    <>
      <PageIntro
        eyebrow="SYSTEM CONFIGURATION"
        title="Settings"
        description="Review connection health, integration readiness, and local environment setup."
        actions={
          <Button icon="refresh" onClick={refresh} disabled={checking}>
            {checking ? "Checking…" : "Refresh status"}
          </Button>
        }
      />
      <div className="settings-grid">
        <Card className="health-card">
          <div className="card-header">
            <div><span className="section-kicker">BACKEND HEALTH</span><h3>Connection status</h3></div>
            <StatusBadge tone={checking ? "accent" : isOnline ? "success" : "danger"}>
              {checking ? "Checking..." : isOnline ? "Reachable" : "Unreachable"}
            </StatusBadge>
          </div>
          <div className={`health-visual ${checking ? "checking" : ""}`}>
            <div className="health-ring"><Icon name={isOnline ? "check" : "refresh"} size={25} /></div>
            <div>
              <strong>{checking ? "Running health check…" : isOnline ? "Backend is responding" : "Backend offline"}</strong>
              <span>
                {checking
                  ? "Evaluating /api/health endpoint…"
                  : isOnline
                  ? `Base URL: ${API_BASE_URL} · Uptime: ${health?.uptime ? Math.floor(health.uptime) : 0}s`
                  : errorMsg || `Unable to reach ${API_BASE_URL}. Start server with npm run dev in /server.`}
              </span>
            </div>
          </div>
        </Card>

        <Card>
          <div className="card-header">
            <div><span className="section-kicker">APPLICATION</span><h3>Build information</h3></div>
            <span className="version-tag">v0.1.0-preview</span>
          </div>
          <div className="settings-rows">
            <div><span>Environment</span><strong>{health?.environment || "development"}</strong></div>
            <div>
              <span>Storage</span>
              <strong>{storageUsage ? `${storageUsage.count} records (${storageUsage.bytesUsedKb} KB)` : "Browser local"}</strong>
            </div>
            <div><span>API Mode</span><strong>Express Proxy ({API_BASE_URL})</strong></div>
          </div>
        </Card>
      </div>

      <div className="section-heading compact">
        <div><span className="section-kicker">INTEGRATIONS</span><h2>Feature readiness</h2></div>
      </div>
      <Card className="integration-card">
        {[
          ["Search API", "Query the web and return ranked sources.", "search", isOnline && isConfigured],
          ["Fetch API", "Extract clean content from target URLs.", "download", isOnline && isConfigured],
          ["Agent API", "Run goal-oriented browser automation with SSE.", "spark", isOnline && isConfigured],
        ].map(([title, text, icon, ready]) => (
          <div className="integration-row" key={title as string}>
            <div className="integration-icon"><Icon name={icon as IconName} size={18} /></div>
            <div><strong>{title as string}</strong><span>{text as string}</span></div>
            <StatusBadge tone={ready ? "success" : isOnline ? "warning" : "danger"}>
              {ready ? "Ready" : isOnline ? "Key Needed" : "Offline"}
            </StatusBadge>
            <a
              href="https://docs.tinyfish.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="button button-ghost"
              style={{ textDecoration: "none" }}
            >
              <span>Docs</span> <Icon name="link" size={13} />
            </a>
          </div>
        ))}
      </Card>

      <div className="settings-grid lower">
        <Card>
          <div className="card-header">
            <div><span className="section-kicker">API KEY</span><h3>Configuration state</h3></div>
            <Icon name="shield" size={19} />
          </div>
          <div className="key-state">
            <div>
              <span className={`key-dot ${isConfigured ? "success" : ""}`} />
              <strong>{isOnline ? (isConfigured ? "Configured" : "Not configured") : "Server Offline"}</strong>
            </div>
            <p>
              {isConfigured
                ? "API key loaded from server/.env. Credentials remain server-side and are never transmitted to the browser."
                : "Add your TINYFISH_API_KEY to server/.env and restart the backend server."}
            </p>
          </div>
        </Card>

        <Card className="setup-card">
          <div className="card-header">
            <div><span className="section-kicker">LOCAL SETUP</span><h3>Environment configuration</h3></div>
            <Button
              variant="ghost"
              icon={copiedSnippet ? "check" : "copy"}
              onClick={() => {
                navigator.clipboard?.writeText(setupSnippet)
                setCopiedSnippet(true)
                setTimeout(() => setCopiedSnippet(false), 1500)
              }}
            >
              {copiedSnippet ? "Copied" : "Copy"}
            </Button>
          </div>
          <pre>
            <code>{setupSnippet}</code>
          </pre>
          <p>Restart your backend with <code>npm run dev</code> after updating environment variables.</p>
        </Card>
      </div>
    </>
  )
}

/* ========================================================================== */
/* SECTION: SIDEBAR & MAIN APP SHELL                                         */
/* ========================================================================== */
function Sidebar({
  route,
  navigate,
  collapsed,
  setCollapsed,
  mobileOpen,
  setMobileOpen,
}: {
  route: Route
  navigate: (r: Route) => void
  collapsed: boolean
  setCollapsed: (v: boolean) => void
  mobileOpen: boolean
  setMobileOpen: (v: boolean) => void
}) {
  return (
    <>
      {mobileOpen && <div className="mobile-scrim" onClick={() => setMobileOpen(false)} />}
      <aside className={`sidebar ${collapsed ? "collapsed" : ""} ${mobileOpen ? "mobile-open" : ""}`}>
        <div className="sidebar-top">
          <Brand />
          <button
            className="sidebar-collapse"
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <Icon name="chevron" size={16} />
          </button>
          <button className="mobile-close" onClick={() => setMobileOpen(false)} aria-label="Close navigation">
            <Icon name="close" />
          </button>
        </div>
        <nav aria-label="Primary navigation">
          <span className="nav-label">WORKSPACE</span>
          {navItems.slice(0, 5).map((item) => (
            <button
              key={item.id}
              className={route === item.id ? "active" : ""}
              onClick={() => { navigate(item.id); setMobileOpen(false) }}
            >
              <Icon name={item.icon} size={18} />
              <span>{item.label}</span>
              {route === item.id && <i />}
            </button>
          ))}
          <span className="nav-label second">SYSTEM</span>
          {navItems.slice(5).map((item) => (
            <button
              key={item.id}
              className={route === item.id ? "active" : ""}
              onClick={() => { navigate(item.id); setMobileOpen(false) }}
            >
              <Icon name={item.icon} size={18} />
              <span>{item.label}</span>
              {route === item.id && <i />}
            </button>
          ))}
        </nav>
        <div className="sidebar-status" onClick={() => navigate("settings")} style={{ cursor: "pointer" }}>
          <div className="status-orb" />
          <div><strong>TinyBunny Studio</strong><span>Local Development</span></div>
          <Icon name="chevron" size={14} />
        </div>
      </aside>
    </>
  )
}

function getInitialRoute(): Route {
  if (typeof window === "undefined") return "dashboard"
  const path = window.location.pathname.replace(/^\//, "").toLowerCase()
  if (path === "search") return "search"
  if (path === "fetch") return "fetch"
  if (path === "agent") return "agent"
  if (path === "history") return "history"
  if (path === "settings") return "settings"
  return "dashboard"
}

export default function App() {
  const [route, setRoute] = useState<Route>(getInitialRoute)
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  // Synchronize route changes with browser address bar
  const navigate = (newRoute: Route) => {
    setRoute(newRoute)
    const targetPath = newRoute === "dashboard" ? "/" : `/${newRoute}`
    if (window.location.pathname !== targetPath) {
      window.history.pushState({ route: newRoute }, "", targetPath)
    }
  }

  // Handle browser Back / Forward buttons
  useEffect(() => {
    const onPopState = () => {
      setRoute(getInitialRoute())
    }
    window.addEventListener("popstate", onPopState)
    return () => window.removeEventListener("popstate", onPopState)
  }, [])

  const page = navItems.find((item) => item.id === route) || navItems[0]

  return (
    <div className="app">
      <div className="ambient ambient-one" /><div className="ambient ambient-two" />
      <Sidebar
        route={route}
        navigate={navigate}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />
      <div className={`main-shell ${collapsed ? "sidebar-is-collapsed" : ""}`}>
        <header className="topbar">
          <button className="mobile-menu" onClick={() => setMobileOpen(true)} aria-label="Open navigation">
            <Icon name="menu" />
          </button>
          <div className="breadcrumb">
            <span>TINYBUNNY STUDIO</span>
            <Icon name="chevron" size={12} />
            <strong>{page.label}</strong>
          </div>
          <div className="topbar-right">
            <span className="version-tag">v0.1.0-preview</span>
            <span className="top-divider" />
            <button className="command" onClick={() => navigate("search")}>
              <span>Quick search</span>
              <kbd>⌘ K</kbd>
            </button>
            <button className="avatar" aria-label="Account menu">TB</button>
          </div>
        </header>
        <main>
          {route === "dashboard" && <Dashboard navigate={navigate} />}
          {route === "search" && <SearchLab />}
          {route === "fetch" && <FetchLab />}
          {route === "agent" && <AgentLab />}
          {route === "history" && <RunHistory />}
          {route === "settings" && <Settings />}
        </main>
      </div>
    </div>
  )
}
