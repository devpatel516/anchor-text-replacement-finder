import { useState } from "react";

const initialForm = {
  url: "",
  anchorText: "",
  anchorTextLink: ""
};

const fieldLabels = {
  "Target Page": "Target Page",
  matched_scenario: "Matched Scenario",
  before: "Before",
  after: "After",
  "anchor text": "Anchor Text",
  "anchor Url": "Anchor URL"
};

const scenarioDescriptions = {
  SCENARIO_1: "Adds a new sentence after a relevant line.",
  SCENARIO_2: "Replaces an existing sentence with a linked version.",
  SCENARIO_3: "Finds a natural place where the link already fits.",
  SCENARIO_4: "Appends or refines a sentence with linked context."
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

function App() {
  const [formData, setFormData] = useState(initialForm);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "";

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
      const response = await fetch(`${apiBaseUrl}/api/extract`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.detail || "Failed to analyze the page.");
      }

      setResult(data);
    } catch (submitError) {
      setError(
        submitError.message ||
          "Something went wrong while contacting the analysis service."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setFormData(initialForm);
    setResult(null);
    setError("");
  };

  const crawledPages = result?.crawledPages ?? [];

  return (
    <div className="page-shell">
      <main className="app-layout">
        <section className="intro-block">
          <p className="eyebrow">ATRF Analyzer</p>
          <h1>Minimal input. Clear editorial output.</h1>
          <p className="hero-copy">
            Paste a page URL, provide the anchor text and destination, and review
            the scenario your backend selects for contextual link placement.
          </p>
        </section>

        <section className="workspace">
          <section className="panel form-panel">
            <div className="section-heading">
              <h2>Input</h2>
              <p>Everything needed to run the extraction and analysis pipeline.</p>
            </div>

            <form className="analyzer-form" onSubmit={handleSubmit}>
              <label className="input-group">
                <span>Page URL</span>
                <input
                  type="url"
                  name="url"
                  placeholder="https://example.com/article"
                  value={formData.url}
                  onChange={handleChange}
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
                  required
                />
              </label>

              <div className="form-actions">
                <button className="primary-button" type="submit" disabled={isLoading}>
                  {isLoading ? "Analyzing..." : "Run Analysis"}
                </button>
                <button className="secondary-button" type="button" onClick={handleReset}>
                  Reset
                </button>
              </div>
            </form>

            <div className="quiet-note">
              <p>Node handles extraction. FastAPI returns the structured scenario.</p>
            </div>
          </section>

          <section className="panel result-panel">
            <div className="section-heading">
              <h2>Output</h2>
              <p>The recommended scenario and the exact text transformation.</p>
            </div>

            {error ? <div className="feedback error">{error}</div> : null}

            {!result && !error ? (
              <div className="empty-state">
                <div className="empty-rule" />
                <h3>Nothing generated yet</h3>
                <p>
                  Run the analysis to see the matched scenario, suggested rewrite,
                  and link placement details.
                </p>
              </div>
            ) : null}

            {result ? (
              <div className="result-content">
                {crawledPages.length > 0 ? (
                  <section className="crawled-pages-card">
                    <div className="section-heading">
                      <h3>Crawled Pages</h3>
                      <p>
                        {crawledPages.length} page{crawledPages.length > 1 ? "s" : ""} found
                        from the submitted URL.
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
                  <span className="scenario-label">Scenario</span>
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
                    <span className="text-card-label">Before</span>
                    <p>{renderFormattedText(result.before)}</p>
                  </article>

                  <article className="text-card featured">
                    <span className="text-card-label">After</span>
                    <p>{renderFormattedText(result.after)}</p>
                  </article>
                </div>

                <div className="meta-grid">
                  {Object.entries(fieldLabels)
                    .filter(([key]) => !["before", "after", "matched_scenario"].includes(key))
                    .map(([key, label]) => (
                      <article className="meta-item" key={key}>
                        <span>{label}</span>
                        {key === "anchor Url" || key === "Target Page" ? (
                          <a
                            href={result[key]}
                            target="_blank"
                            rel="noreferrer"
                            className="result-link"
                          >
                            {result[key]}
                          </a>
                        ) : (
                          <p>{result[key]}</p>
                        )}
                      </article>
                    ))}
                </div>

                <details className="json-block">
                  <summary>View raw JSON</summary>
                  <pre>{JSON.stringify(result, null, 2)}</pre>
                </details>
              </div>
            ) : null}
          </section>
        </section>
      </main>
    </div>
  );
}

export default App;
