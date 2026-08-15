import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { apiRequest } from "../lib/api";

const initialForm = {
  url: "",
  anchorText: "",
  anchorTextLink: ""
};

const analysisSteps = [
  { id: 1, label: "Validating Target URL & Quota" },
  { id: 2, label: "Crawling Internal Pages with Playwright" },
  { id: 3, label: "Extracting Article Paragraphs & Structure" },
  { id: 4, label: "AI Evaluating Scenario Matches (Gemini 2.5)" },
  { id: 5, label: "Generating Recommendation & Anchor Tags" }
];

const scenarioDescriptions = {
  SCENARIO_1: "Adds a new contextually tailored sentence after a relevant line.",
  SCENARIO_2: "Replaces an existing weak sentence with a linked high-impact version.",
  SCENARIO_3: "Finds a natural place where the link already fits without editing words.",
  SCENARIO_4: "Appends or refines a sentence with descriptive linked context."
};

function renderFormattedText(text) {
  if (!text) {
    return null;
  }

  const anchorRegex = /<a\s+href="([^"]+)"\s*>(.*?)<\/a>/gi;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = anchorRegex.exec(text)) !== null) {
    const [fullMatch, href, linkText] = match;
    const startIndex = match.index;

    if (startIndex > lastIndex) {
      parts.push(text.slice(lastIndex, startIndex));
    }

    parts.push(
      <a
        key={`${href}-${startIndex}`}
        href={href}
        target="_blank"
        rel="noreferrer"
        className="inline-link"
      >
        {linkText}
      </a>
    );

    lastIndex = startIndex + fullMatch.length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : text;
}

function stripHtmlTags(htmlStr) {
  if (!htmlStr) return "";
  return htmlStr.replace(/<[^>]*>?/gm, "");
}

function DashboardPage() {
  const { apiBaseUrl, applyUser, logout, prependScanHistoryItem, token, user } = useAuth();
  const [formData, setFormData] = useState(initialForm);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  // Copy Feedback States
  const [copiedHtml, setCopiedHtml] = useState(false);
  const [copiedText, setCopiedText] = useState(false);

  // Progress simulation for analysis micro-interaction
  useEffect(() => {
    let interval;
    if (isLoading) {
      setCurrentStepIndex(0);
      interval = setInterval(() => {
        setCurrentStepIndex((prev) => (prev < analysisSteps.length - 1 ? prev + 1 : prev));
      }, 1200);
    } else {
      setCurrentStepIndex(0);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  const crawledPages = result?.crawledPages ?? [];
  const showUpgradePrompt = user.plan !== "pro" && user.analysesRemaining === 0;

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: value
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setError("");
    setResult(null);

    try {
      const data = await apiRequest(
        apiBaseUrl,
        "/api/extract",
        {
          method: "POST",
          body: JSON.stringify(formData)
        },
        token
      );

      setResult(data);

      if (data.user) {
        applyUser(data.user);
      }

      if (data.savedScan) {
        prependScanHistoryItem(data.savedScan);
      }
    } catch (submitError) {
      if (submitError.status === 401) {
        logout();
      }

      setError(submitError.message || "Failed to analyze the page.");

      if (submitError.payload?.user) {
        applyUser(submitError.payload.user);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setFormData(initialForm);
    setResult(null);
    setError("");
  };

  const copyAfterHtml = () => {
    if (!result?.after) return;
    navigator.clipboard.writeText(result.after);
    setCopiedHtml(true);
    setTimeout(() => setCopiedHtml(false), 2200);
  };

  const copyAfterPlain = () => {
    if (!result?.after) return;
    navigator.clipboard.writeText(stripHtmlTags(result.after));
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2200);
  };

  return (
    <section className="dashboard-stack">
      <section className="panel form-panel">
        <div className="section-heading">
          <h2>Run Analysis</h2>
          <p>Submit a page URL, target anchor text, and link to generate AI placement suggestions.</p>
        </div>

        {error ? <div className="feedback error">{error}</div> : null}

        <form className="analyzer-form" onSubmit={handleSubmit}>
          <label className="input-group">
            <span>Page URL</span>
            <input
              type="url"
              name="url"
              placeholder="https://example.com/article"
              value={formData.url}
              onChange={handleChange}
              disabled={isLoading}
              required
            />
          </label>

          <label className="input-group">
            <span>Anchor Text</span>
            <input
              type="text"
              name="anchorText"
              placeholder="Best AI SEO tools"
              value={formData.anchorText}
              onChange={handleChange}
              disabled={isLoading}
              required
            />
          </label>

          <label className="input-group">
            <span>Anchor Link</span>
            <input
              type="url"
              name="anchorTextLink"
              placeholder="https://yourdomain.com/target-page"
              value={formData.anchorTextLink}
              onChange={handleChange}
              disabled={isLoading}
              required
            />
          </label>

          <div className="form-actions">
            <button className="primary-button" type="submit" disabled={isLoading}>
              {isLoading ? "Analyzing..." : "Run Analysis"}
            </button>
            <button className="secondary-button" type="button" onClick={handleReset} disabled={isLoading}>
              Reset
            </button>
          </div>
        </form>

        {showUpgradePrompt ? (
          <div className="billing-cta subtle-upgrade">
            <p>Your free monthly analyses are finished. Upgrade is available now.</p>
            <Link className="primary-button inline-button" to="/upgrade">
              Open Upgrade
            </Link>
          </div>
        ) : null}
      </section>

      {/* Progress Micro-interaction Card */}
      {isLoading ? (
        <section className="panel progress-panel">
          <div className="progress-header">
            <div className="spinner-indicator" />
            <div>
              <h3>Analysis In Progress...</h3>
              <p>Please wait while our crawler and AI engine evaluate your target page.</p>
            </div>
          </div>

          <div className="progress-steps-list">
            {analysisSteps.map((step, idx) => {
              const isDone = idx < currentStepIndex;
              const isCurrent = idx === currentStepIndex;

              return (
                <div
                  key={step.id}
                  className={`progress-step-item ${isDone ? "done" : ""} ${isCurrent ? "active" : ""}`}
                >
                  <span className="step-num">{step.id}</span>
                  <span className="step-text">{step.label}</span>
                  {isDone ? <span className="step-check">✓</span> : null}
                  {isCurrent ? <span className="pulse-indicator" /> : null}
                </div>
              );
            })}
          </div>

          <div className="progress-bar-container">
            <div
              className="progress-bar-fill"
              style={{
                width: `${((currentStepIndex + 1) / analysisSteps.length) * 100}%`
              }}
            />
          </div>
        </section>
      ) : null}

      {/* Results Section */}
      {result && !isLoading ? (
        <section className="panel result-panel">
          <div className="section-heading">
            <h2>Latest Recommendation</h2>
            <p>AI-selected editorial link placement and sentence restructuring.</p>
          </div>

          <div className="result-content">
            {crawledPages.length > 0 ? (
              <section className="crawled-pages-card">
                <div className="section-heading">
                  <h3>Crawled Pages</h3>
                  <p>
                    {crawledPages.length} page{crawledPages.length > 1 ? "s" : ""} scanned
                    from the target URL.
                  </p>
                </div>

                <div className="crawled-pages-list">
                  {crawledPages.map((pageUrl) => (
                    <a
                      key={pageUrl}
                      href={pageUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="crawled-page-link"
                    >
                      {pageUrl}
                    </a>
                  ))}
                </div>
              </section>
            ) : null}

            <div className="scenario-banner">
              <span className="scenario-label">Matched Scenario</span>
              <div className="scenario-heading-row">
                <h3>{result.matched_scenario}</h3>
                <p>
                  {scenarioDescriptions[result.matched_scenario] ||
                    "AI selected the most contextually relevant scenario."}
                </p>
              </div>
            </div>

            <div className="text-comparison">
              <article className="text-card">
                <span className="text-card-label">Original Sentence (Before)</span>
                <p className="card-body-text">{renderFormattedText(result.before)}</p>
              </article>

              <article className="text-card featured">
                <div className="text-card-header">
                  <span className="text-card-label highlighted">Transformed Output (After)</span>
                  <div className="copy-action-group">
                    <button className="copy-button primary-copy" onClick={copyAfterHtml}>
                      {copiedHtml ? "HTML Copied!" : "Copy HTML"}
                    </button>
                    <button className="copy-button secondary-copy" onClick={copyAfterPlain}>
                      {copiedText ? "Text Copied!" : "Copy Text"}
                    </button>
                  </div>
                </div>
                <p className="card-body-text">{renderFormattedText(result.after)}</p>
              </article>
            </div>

            <div className="meta-grid">
              <article className="meta-item">
                <span>Target Page</span>
                <a href={result["Target Page"] || result.Target_Page} target="_blank" rel="noreferrer" className="result-link">
                  {result["Target Page"] || result.Target_Page}
                </a>
              </article>
              <article className="meta-item">
                <span>Selected Anchor Text</span>
                <p className="meta-highlight">{result["anchor text"] || result.anchor_text}</p>
              </article>
              <article className="meta-item">
                <span>Target Anchor Link</span>
                <a href={result["anchor Url"] || result.anchor_Url} target="_blank" rel="noreferrer" className="result-link">
                  {result["anchor Url"] || result.anchor_Url}
                </a>
              </article>
            </div>
          </div>
        </section>
      ) : null}
    </section>
  );
}

export default DashboardPage;
