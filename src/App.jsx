import { useState, useEffect, useRef } from "react";
import './App.css';

// ─── Helpers ─────────────────────────────────────────────────────────────────
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function SentimentBadge({ value }) {
  if (!value) return null;
  return <span className={`rr-badge rr-badge-${value.toLowerCase()}`}>{value}</span>;
}

function RelevanceBar({ score }) {
  const fillRef = useRef(null);
  useEffect(() => {
    const t = setTimeout(() => {
      if (fillRef.current) fillRef.current.style.width = `${score}%`;
    }, 300);
    return () => clearTimeout(t);
  }, [score]);
  return (
    <div className="rr-rel-row">
      <div className="rr-rel-track">
        <div ref={fillRef} className="rr-rel-fill" style={{ width: 0 }} />
      </div>
      <span className="rr-rel-label">relevance {score}%</span>
    </div>
  );
}

function ThemeCard({ theme, index }) {
  const [open, setOpen] = useState(true);
  const scoreMap = Object.fromEntries(
    (theme.sources || []).map(s => [s.id, s.score ?? 0])
  );
  return (
    <div className="rr-theme" style={{ animationDelay: `${0.1 + index * 0.1}s` }}>
      <div className="rr-theme-header">
        <span className="rr-theme-title">{theme.title}</span>
        <div className="rr-theme-header-right">
          <SentimentBadge value={theme.sentiment} />
          <button className="rr-toggle" onClick={() => setOpen(o => !o)}>
            {open ? "▾ details" : "▸ details"}
          </button>
        </div>
      </div>
      <RelevanceBar score={theme.relevance_score} />
      <p className="rr-theme-summary">{theme.summary}</p>
      <div className={`rr-collapse ${open ? "rr-collapse-open" : "rr-collapse-closed"}`}>
        {theme.pain_points?.length > 0 && (
          <>
            <div className="rr-section-label" style={{ marginTop: 4 }}>Pain Points</div>
            <div className="rr-pains">
              {theme.pain_points.map((p, i) => (
                <div key={i} className="rr-pain">
                  <div className="rr-pain-header">
                    <span className="rr-pain-issue">{p.issue}</span>
                    <span className={`rr-sev rr-sev-${p.severity}`}>{p.severity}</span>
                  </div>
                  <div className="rr-pain-quote">"{p.example_quote}"</div>
                  <div className="rr-pain-impact">Impact: {p.impact}</div>
                </div>
              ))}
            </div>
          </>
        )}
        {theme.quotes?.length > 0 && (
          <>
            <div className="rr-section-label">Quotes</div>
            <div className="rr-quotes">
              {theme.quotes.map((q, i) => (
                <div key={i} className="rr-blockquote">
                  "{q.text}"
                  <div className="rr-quote-meta">
                    <span>u/{q.author}</span>
                    {scoreMap[q.comment_id] > 0 && (
                      <span className="rr-quote-score">↑ {scoreMap[q.comment_id]}</span>
                    )}
                    {q.permalink && (
                      <a href={q.permalink} target="_blank" rel="noreferrer" className="rr-quote-link">↗ view</a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
        {(theme.reddit_user_actions?.length > 0 || theme.system_actions?.length > 0) && (
          <div className="rr-actions">
            {theme.reddit_user_actions?.length > 0 && (
              <div className="rr-actions-col rr-actions-user">
                <h4>User Actions</h4>
                <ul>{theme.reddit_user_actions.map((a, i) => <li key={i}>{a}</li>)}</ul>
              </div>
            )}
            {theme.system_actions?.length > 0 && (
              <div className="rr-actions-col rr-actions-system">
                <h4>System Actions</h4>
                <ul>{theme.system_actions.map((a, i) => <li key={i}>{a}</li>)}</ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Sidebar({ data }) {
  const { meta, market_signals } = data || {};
  // Normalize confidence: "Medium-High" → "High", "Medium-Low" → "Low", etc.
  const confClass = meta?.confidence
    ? meta.confidence.includes("High") ? "High"
      : meta.confidence.includes("Low") ? "Low"
      : "Medium"
    : "";
  const sigGroups = [
    { items: market_signals?.demographic_signals || [], type: "demo",  label: "Demo" },
    { items: market_signals?.geographic_signals  || [], type: "geo",   label: "Geo" },
    { items: market_signals?.emerging_topics     || [], type: "topic", label: "Topic" },
  ];
  return (
    <div className="rr-sidebar">
      <div className="rr-card">
        <h3>Analysis Meta</h3>
        <div className="rr-meta-rows">
          <div className="rr-meta-row">
            <span className="rr-meta-key">Confidence</span>
            <span className={`rr-conf rr-conf-${confClass}`}>{meta?.confidence}</span>
          </div>
          <div className="rr-meta-row">
            <span className="rr-meta-key">Model</span>
            <span className="rr-meta-val rr-mono">{meta?.model}</span>
          </div>
          {meta?.subreddit_rank && (
            <div className="rr-meta-row">
              <span className="rr-meta-key">Subreddit Rank</span>
              <span className="rr-meta-val">#{meta.subreddit_rank?.toLocaleString()}</span>
            </div>
          )}
          {meta?.subreddit_score != null && (
            <div className="rr-meta-row">
              <span className="rr-meta-key">Subreddit Score</span>
              <span className="rr-meta-val">{meta.subreddit_score?.toFixed(4)}</span>
            </div>
          )}
          {meta?.total_posts && (
            <div className="rr-meta-row">
              <span className="rr-meta-key">Posts Analyzed</span>
              <span className="rr-meta-val">{meta.total_posts}</span>
            </div>
          )}
          {meta?.total_comments && (
            <div className="rr-meta-row">
              <span className="rr-meta-key">Comments</span>
              <span className="rr-meta-val">{meta.total_comments}</span>
            </div>
          )}
          {meta?.date_range && (
            <div className="rr-meta-row">
              <span className="rr-meta-key">Date Range</span>
              <span className="rr-meta-val rr-mono" style={{ fontSize: 11 }}>{meta.date_range}</span>
            </div>
          )}
          {meta?.caveats && (
            <div className="rr-meta-row">
              <span className="rr-meta-key">Caveats</span>
              <span className="rr-caveat">{meta.caveats}</span>
            </div>
          )}
        </div>
      </div>

      {market_signals?.brands_mentioned?.length > 0 && (
        <div className="rr-card">
          <h3>Brands Mentioned</h3>
          <div className="rr-brand-tags">
            {market_signals.brands_mentioned.map(b => (
              <span key={b} className="rr-brand">{b}</span>
            ))}
          </div>
        </div>
      )}

      {sigGroups.some(g => g.items.length > 0) && (
        <div className="rr-card">
          <h3>Market Signals</h3>
          <div className="rr-signals">
            {sigGroups.flatMap(g =>
              g.items.map(item => (
                <div key={`${g.type}-${item}`} className="rr-signal">
                  <span className={`rr-dot rr-dot-${g.type}`} />
                  <span>{item}</span>
                  <span className="rr-sig-type">{g.label}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Search Page ──────────────────────────────────────────────────────────────
// Single unified full-screen page: hero + new-job card + job-lookup card
function SearchPage({ onSubmit, onFetch, submitLoading, fetchLoading, error }) {
  // New job state
  const [query, setQuery]             = useState("");
  const [apiKey, setApiKey]           = useState("");
  const [apiUrl, setApiUrl]           = useState("");
  const [fetchAfter, setFetchAfter]   = useState("2025-01-01");
  const [maxComments, setMaxComments] = useState(50);
  const [numResults, setNumResults]   = useState(25);
  const [provider, setProvider]       = useState("hf");
  const [model, setModel]             = useState("Qwen/Qwen3-8B");
  const [testMode, setTestMode]       = useState(false);

  // Job lookup state
  const [jobId, setJobId]       = useState("");
  const [jobKey, setJobKey]     = useState("");
  const [jobUrl, setJobUrl]     = useState("");

  function handleNewJob(e) {
    e.preventDefault();
    if (!query || !apiUrl || !apiKey) return;
    onSubmit({ query, apiKey, apiUrl, fetchAfter,
      maxComments: Number(maxComments),
      numResults: Number(numResults),
      provider, model, testMode });
  }

  function handleLookup(e) {
    e.preventDefault();
    if (!jobId || !jobUrl || !jobKey) return;
    onFetch({ jobId, apiKey: jobKey, apiUrl: jobUrl });
  }

  return (
    <div className="ara-page">
      <div className="ara-page-inner">

        {/* ── Hero ── */}
        <div className="ara-eyebrow">Reddit Intelligence</div>
        <h1 className="ara-title">App Review <span>Analyzer</span></h1>
        <p className="ara-subtitle">Surface real user pain points from Reddit communities in seconds.</p>

        {/* ── New Job Card ── */}
        <div className="ara-card">
          <div className="ara-card-label">New Analysis</div>
          <form onSubmit={handleNewJob} className="ara-form">

            <div className="ara-form-row">
              <div className="ara-field">
                <label htmlFor="query">Query</label>
                <input id="query" type="text" placeholder="e.g. 'rapido issues in guwahati'"
                  value={query} onChange={e => setQuery(e.target.value)} required />
              </div>
            </div>

            <div className="ara-form-row">
              <div className="ara-field">
                <label htmlFor="api-url">API URL</label>
                <input id="api-url" type="url" placeholder="https://api.runpod.ai/..."
                  value={apiUrl} onChange={e => setApiUrl(e.target.value)} required />
              </div>
              <div className="ara-field">
                <label htmlFor="api-key">API Key</label>
                <input id="api-key" type="password" placeholder="Your API key"
                  value={apiKey} onChange={e => setApiKey(e.target.value)} required />
              </div>
            </div>

            <div className="ara-form-row">
              <div className="ara-field">
                <label htmlFor="fetch-after">Fetch After</label>
                <input id="fetch-after" type="date" value={fetchAfter}
                  onChange={e => setFetchAfter(e.target.value)} />
              </div>
              <div className="ara-field">
                <label htmlFor="max-comments">Max Comments</label>
                <input id="max-comments" type="number" min="1" max="500" value={maxComments}
                  onChange={e => setMaxComments(e.target.value)} />
              </div>
              <div className="ara-field">
                <label htmlFor="num-results">Num Results</label>
                <input id="num-results" type="number" min="1" max="100" value={numResults}
                  onChange={e => setNumResults(e.target.value)} />
              </div>
            </div>

            <div className="ara-form-row">
              <div className="ara-field">
                <label htmlFor="provider">Provider</label>
                <select id="provider" value={provider} onChange={e => setProvider(e.target.value)} className="ara-select">
                  <option value="hf">Hugging Face (hf)</option>
                  <option value="openai">OpenAI</option>
                  <option value="anthropic">Anthropic</option>
                </select>
              </div>
              <div className="ara-field">
                <label htmlFor="model">Model</label>
                <input id="model" type="text" placeholder="Qwen/Qwen3-8B"
                  value={model} onChange={e => setModel(e.target.value)} />
              </div>
            </div>

            <div className="ara-form-footer">
              {/* <label className="ara-checkbox-label">
                <input type="checkbox" checked={testMode}
                  onChange={e => setTestMode(e.target.checked)} className="ara-checkbox" />
                <span className="ara-checkbox-box">{testMode && "✓"}</span>
                <span>Test mode</span>
                <span className="ara-checkbox-hint">Uses cached data, skips live fetch</span>
              </label> */}
              <button type="submit" className="ara-btn" disabled={submitLoading}>
                {submitLoading
                  ? <span className="ara-btn-loading"><span className="ara-spinner-dot" />Analyzing…</span>
                  : "→ Analyze"}
              </button>
            </div>

          </form>
        </div>

        {/* ── Divider ── */}
        <div className="ara-section-divider">
          <span className="ara-section-divider-line" />
          <span className="ara-section-divider-label">or retrieve a previous job</span>
          <span className="ara-section-divider-line" />
        </div>

        {/* ── Job Lookup Card ── */}
        <div className="ara-card">
          <div className="ara-card-label">Load by Job ID</div>
          <form onSubmit={handleLookup} className="ara-form">
            <div className="ara-form-row">
              <div className="ara-field">
                <label htmlFor="job-api-url">API URL</label>
                <input id="job-api-url" type="url" placeholder="https://api.runpod.ai/..."
                  value={jobUrl} onChange={e => setJobUrl(e.target.value)} required />
              </div>
              <div className="ara-field">
                <label htmlFor="job-api-key">API Key</label>
                <input id="job-api-key" type="password" placeholder="Your API key"
                  value={jobKey} onChange={e => setJobKey(e.target.value)} required />
              </div>
              <div className="ara-field">
                <label htmlFor="job-id">Job ID</label>
                <input id="job-id" type="text" placeholder="e.g. abc123-..."
                  value={jobId} onChange={e => setJobId(e.target.value)} required />
              </div>
            </div>
            <button type="submit" className="ara-btn ara-btn-secondary" disabled={fetchLoading}>
              {fetchLoading
                ? <span className="ara-btn-loading"><span className="ara-spinner-dot" />Fetching…</span>
                : "↩ Load Job"}
            </button>
          </form>
        </div>

      </div>

      {error && <div className="ara-error-banner">❌ {error}</div>}
    </div>
  );
}

// ─── Loading Screen ───────────────────────────────────────────────────────────
function LoadingScreen({ status }) {
  const text =
    status === "IN_PROGRESS" ? "🧠 AI is analyzing thousands of reviews…" :
    status === "IN_QUEUE"    ? "⏳ Waiting in queue…" :
                               "🚀 Submitting job…";
  return (
    <div className="ara-loading-screen">
      <div className="ara-loading-inner">
        <div className="ara-loading-ring" />
        <p className="ara-loading-text">{text}</p>
        <p className="ara-loading-sub">This may take 30–60 seconds</p>
      </div>
    </div>
  );
}

// ─── Results View ─────────────────────────────────────────────────────────────
function ResultsView({ data, onReset }) {
  if (!data) return null;
  const d = data;
  const analyzedDate = d.analyzed_at ? new Date(d.analyzed_at) : new Date();
  return (
    <div className="rr-root">
      <div className="rr-wrap">
        <header className="rr-header">
          <div className="rr-header-meta">
            <span className="rr-tag rr-tag-accent">Reddit Intelligence</span>
            {d.subreddit && <span className="rr-tag">{d.subreddit}</span>}
            <span className="rr-tag">
              {analyzedDate.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
            </span>
            <button className="rr-reset-btn" onClick={onReset}>← New Search</button>
          </div>
          <h1 className="rr-h1">Query: <span>{d.query}</span></h1>
          <div className="rr-stats">
            {d.total_signals != null && (
              <>
                <div className="rr-stat">
                  <span className="rr-stat-val">{d.total_signals}</span>
                  <span className="rr-stat-label">Total Signals</span>
                </div>
                <div className="rr-divider" />
              </>
            )}
            {d.meta?.total_posts != null && (
              <>
                <div className="rr-stat">
                  <span className="rr-stat-val">{d.meta.total_posts}</span>
                  <span className="rr-stat-label">Posts Analyzed</span>
                </div>
                <div className="rr-divider" />
              </>
            )}
            {d.themes?.length > 0 && (
              <>
                <div className="rr-stat">
                  <span className="rr-stat-val">{d.themes.length}</span>
                  <span className="rr-stat-label">Themes</span>
                </div>
                <div className="rr-divider" />
              </>
            )}
            {d.overall_sentiment && (
              <div className="rr-stat">
                <SentimentBadge value={d.overall_sentiment} />
                <span className="rr-stat-label">Overall Sentiment</span>
              </div>
            )}
          </div>
        </header>

        {d.executive_summary && (
          <div className="rr-exec">
            <div className="rr-section-label">Executive Summary</div>
            <p>{d.executive_summary}</p>
          </div>
        )}

        <div className="rr-grid">
          <div>
            {d.themes?.length > 0 && (
              <>
                <div className="rr-themes-header">
                  <h2 className="rr-h2">Themes</h2>
                  <span className="rr-count-label">{d.themes.length} identified</span>
                </div>
                {d.themes.map((t, i) => <ThemeCard key={t.id || i} theme={t} index={i} />)}
              </>
            )}
          </div>
          {(d.meta || d.market_signals) && <Sidebar data={d} />}
        </div>

        <footer className="rr-footer">
          <span>Generated by Reddit Intelligence · {d.meta?.model || "AI"}</span>
          <span>Analyzed {analyzedDate.toUTCString()}</span>
        </footer>
      </div>
    </div>
  );
}

// ─── Root App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [phase, setPhase]           = useState("search"); // search | loading | results | error
  const [status, setStatus]         = useState("");
  const [data, setData]             = useState(null);
  const [error, setError]           = useState(null);
  const [jobLoading, setJobLoading] = useState(false);

  async function handleSearch({ query, apiKey, apiUrl, fetchAfter, maxComments, numResults, provider, model, testMode }) {
    setPhase("loading");
    setError(null);
    setStatus("");
    try {
      const submitRes = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          input: { query, fetch_after: fetchAfter, max_comments: maxComments,
            num_results: numResults, provider, model, test: testMode },
        }),
      });
      if (!submitRes.ok) throw new Error("Failed to submit job");
      const { id } = await submitRes.json();

      const base = apiUrl.substring(0, apiUrl.lastIndexOf("/"));
      const statusURL = `${base}/status/${id}`;

      while (true) {
        await sleep(2000);
        const statusRes = await fetch(statusURL, { headers: { Authorization: `Bearer ${apiKey}` } });
        if (!statusRes.ok) throw new Error("Failed to fetch job status");
        const statusData = await statusRes.json();
        setStatus(statusData.status);
        if (statusData.status === "FAILED") throw new Error("Job failed on the server");
        if (statusData.output) {
          setData(statusData.output.body);
          setPhase("results");
          break;
        }
      }
    } catch (err) {
      setError(err.message);
      setPhase("error");
    }
  }

  async function handleFetchJob({ jobId, apiKey, apiUrl }) {
    setJobLoading(true);
    setError(null);
    try {
      const base = apiUrl.endsWith("/") ? apiUrl.slice(0, -1) : apiUrl;
      const cleanBase = base.replace(/\/(run|runsync)$/, "");
      const statusURL = `${cleanBase}/status/${jobId}`;

      const res = await fetch(statusURL, { headers: { Authorization: `Bearer ${apiKey}` } });
      if (!res.ok) throw new Error(`Failed to fetch job (${res.status})`);

      const statusData = await res.json();
      if (statusData.status === "FAILED") throw new Error("Job failed on the server");
      if (!statusData.output) throw new Error(
        statusData.status === "IN_QUEUE" || statusData.status === "IN_PROGRESS"
          ? `Job is still ${statusData.status} — try again shortly`
          : "No output found for this Job ID"
      );

      setData(statusData.output.body);
      setPhase("results");
    } catch (err) {
      setError(err.message);
    } finally {
      setJobLoading(false);
    }
  }

  function reset() { setPhase("search"); setData(null); setError(null); }

  if (phase === "search" || phase === "error") {
    return (
      <SearchPage
        onSubmit={handleSearch}
        onFetch={handleFetchJob}
        submitLoading={false}
        fetchLoading={jobLoading}
        error={error}
      />
    );
  }

  if (phase === "loading") {
    return <LoadingScreen status={status} />;
  }

  return <ResultsView data={data} onReset={reset} />;
}