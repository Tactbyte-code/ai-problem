import { useState } from "react";
import './App.css';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default function App() {
  const [query, setQuery]     = useState("");
  const [apiKey, setApiKey]   = useState("");
  const [apiUrl, setApiUrl]   = useState("");
  const [testMode, setTestMode] = useState(false);
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);
  const [status, setStatus]   = useState("");

  async function handleSearch(e) {
    e.preventDefault();
    if (!query || !apiUrl || !apiKey) return;

    setLoading(true);
    setError(null);
    setData(null);
    setStatus("");

    try {
      // 1. Submit the job
      const submitRes = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          input: { prompt: query, test: testMode },
        }),
      });

      if (!submitRes.ok) throw new Error("Failed to submit job");

      const { id } = await submitRes.json();

      // 2. Build status URL
      const base = apiUrl.substring(0, apiUrl.lastIndexOf("/"));
      const statusURL = `${base}/status/${id}`;

      // 3. Poll until output appears
      while (true) {
        await sleep(2000);

        const statusRes = await fetch(statusURL, {
          headers: { Authorization: `Bearer ${apiKey}` },
        });

        if (!statusRes.ok) throw new Error("Failed to fetch job status");

        const statusData = await statusRes.json();
        setStatus(statusData.status);

        if (statusData.status === "FAILED")
          throw new Error("Job failed on the server");

        if (statusData.output?.body) {
          setData(statusData.output.body);
          break;
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setStatus("");
    }
  }

  function getSpinnerText() {
    if (status === "IN_PROGRESS") return "🧠 AI is analyzing thousands of reviews...";
    if (status === "IN_QUEUE")    return "⏳ Waiting in queue...";
    return "🚀 Submitting job...";
  }

  return (
    <>

      <div className="ara-container">
        {/* HEADER & SEARCH */}
        <header className="ara-header">
          <h1>🔍 App Review Analyzer</h1>

          <form onSubmit={handleSearch} className="ara-search-bar">
            <div className="ara-field">
              <label htmlFor="query">App Category</label>
              <input
                id="query"
                type="text"
                placeholder="e.g., 'fitness', 'yoga'"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                required
              />
            </div>

            <div className="ara-field">
              <label htmlFor="api-url">API URL</label>
              <input
                id="api-url"
                type="url"
                placeholder="https://api.runpod.ai/..."
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                required
              />
            </div>

            <div className="ara-field">
              <label htmlFor="api-key">API Key</label>
              <input
                id="api-key"
                type="password"
                placeholder="Enter your API key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                required
              />
            </div>

            {/* <div className="ara-field ara-field-inline">
              <input
                id="test-mode"
                type="checkbox"
                checked={testMode}
                onChange={(e) => setTestMode(e.target.checked)}
              />
              <label htmlFor="test-mode">Test Mode</label>
            </div> */}

            <button type="submit" className="ara-btn" disabled={loading}>
              {loading ? "Analyzing..." : "Analyze"}
            </button>
          </form>
        </header>

        {/* ERROR STATE */}
        {error && <div className="ara-error">❌ {error}</div>}

        {/* LOADING STATE */}
        {loading && (
          <div className="ara-spinner">{getSpinnerText()}</div>
        )}

        {/* RESULTS DASHBOARD */}
        {data && (
          <div className="ara-dashboard">
            {/* 1. EXECUTIVE SUMMARY */}
            <section className="ara-card">
              <h2>📊 Executive Summary</h2>
              <p className="ara-summary-text">{data.summary}</p>
            </section>

            {/* 2. ACTION PLAN */}
            <section className="ara-card">
              <h2>🚀 Recommended Actions</h2>
              <ul className="ara-action-list">
                {data.actions.map((action, i) => (
                  <li key={i}>
                    <span>✅</span>
                    {action}
                  </li>
                ))}
              </ul>
            </section>

            {/* 3. PAIN POINTS GRID */}
            <section className="ara-pain-section">
              <h2>⚠️ Top Pain Points</h2>
              <div className="ara-grid">
                {data.pain_points.map((point, i) => {
                  const freq = point.frequency.toLowerCase();
                  return (
                    <div key={i} className={`ara-point-card ${freq}`}>
                      <div className="ara-card-header">
                        <span className="ara-issue-title">{point.issue}</span>
                        <span className={`ara-badge ${freq}`}>
                          {point.frequency} Priority
                        </span>
                      </div>
                      <div className="ara-quote-box">
                        <p>"{point.example_quote}"</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* 4. DEEP DIVE DETAILS */}
            <section className="ara-card">
              <h2>📝 Detailed Analysis</h2>
              <p className="ara-details-text">{data.details}</p>
            </section>
          </div>
        )}
      </div>
    </>
  );
}