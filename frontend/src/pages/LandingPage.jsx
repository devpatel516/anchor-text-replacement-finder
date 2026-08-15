import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const sampleScenarios = {
  SCENARIO_1: {
    title: "Scenario 1: New Phrase Add",
    badge: "Recommended",
    description: "Inserts a new contextually tailored sentence complete with your anchor link right after an existing sentence.",
    before: "Content marketing strategies are evolving rapidly in 2026.",
    after: "Content marketing strategies are evolving rapidly in 2026. Discover how top teams use <a href='https://example.com/seo-tools'>AI SEO tools</a> to scale editorial output seamlessly.",
    anchorText: "AI SEO tools",
    anchorUrl: "https://example.com/seo-tools"
  },
  SCENARIO_2: {
    title: "Scenario 2: Phrase Replace",
    badge: "High Precision",
    description: "Replaces an existing weak sentence with a refreshed, punchier version containing your anchor link.",
    before: "We used several software products to help our website gain rankings.",
    after: "We leveraged specialized <a href='https://example.com/rank-tracker'>rank tracking software</a> to systematically boost search visibility across key markets.",
    anchorText: "rank tracking software",
    anchorUrl: "https://example.com/rank-tracker"
  },
  SCENARIO_3: {
    title: "Scenario 3: Native Fit",
    badge: "Zero Edit",
    description: "Identifies an existing phrase in the content that naturally accommodates your target hyperlink without changing wording.",
    before: "Modern web design relies heavily on responsive layouts and clean CSS structures.",
    after: "Modern web design relies heavily on <a href='https://example.com/css-guide'>responsive layouts</a> and clean CSS structures.",
    anchorText: "responsive layouts",
    anchorUrl: "https://example.com/css-guide"
  },
  SCENARIO_4: {
    title: "Scenario 4: Phrase Append / Modify",
    badge: "Context Expander",
    description: "Appends descriptive terms or contextual clauses containing your anchor link to an existing sentence.",
    before: "Fast page speed is crucial for technical search engine optimization.",
    after: "Fast page speed is crucial for technical search engine optimization, especially when using an <a href='https://example.com/cdn-service'>enterprise CDN service</a>.",
    anchorText: "enterprise CDN service",
    anchorUrl: "https://example.com/cdn-service"
  }
};

const targetAudience = [
  {
    category: "SEO",
    title: "SEO Specialists & Strategists",
    description: "Automate anchor text distribution and discover high-relevance editorial link placements across target articles efficiently."
  },
  {
    category: "Content",
    title: "Content Marketers & Editors",
    description: "Seamlessly insert internal and external backlinks into legacy articles without altering original writing style or editorial flow."
  },
  {
    category: "Agency",
    title: "Digital Marketing Agencies",
    description: "Deliver instant, AI-verified backlink insertion recommendations to clients with automated scenario classification and clear before/after text."
  },
  {
    category: "Publishers",
    title: "Bloggers & Site Publishers",
    description: "Maximize internal link equity and monetize existing blog archives with context-aware anchor link suggestions powered by Gemini."
  }
];

const keyPurposes = [
  {
    step: "01",
    title: "Intelligent Page Crawling",
    description: "Playwright automatically visits submitted target URLs, parses internal site navigation, and extracts article body paragraphs."
  },
  {
    step: "02",
    title: "AI Scenario Classification",
    description: "Gemini 2.5 Flash evaluates page content against 4 core editorial placement scenarios to determine the most natural fit."
  },
  {
    step: "03",
    title: "One-Click Copy & Insertion",
    description: "Get immediate Before and After text recommendations with HTML anchor tags ready for 1-click copy into your CMS."
  }
];

function LandingPage() {
  const { isAuthenticated } = useAuth();
  const [activeScenarioKey, setActiveScenarioKey] = useState("SCENARIO_1");
  const [copied, setCopied] = useState(false);

  const currentScenario = sampleScenarios[activeScenarioKey];

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const analyzerTarget = isAuthenticated ? "/dashboard" : "/login";

  return (
    <div className="landing-content">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-badge">
          Powered by Gemini 2.5 Flash & Playwright
        </div>
        <h1 className="hero-title">
          Editorial Link Placement & Anchor Text Intelligence
        </h1>
        <p className="hero-subtitle">
          Transform your SEO link insertion workflow. ATRF automatically crawls target articles,
          extracts context, and uses AI to recommend natural anchor link placement scenarios.
        </p>

        <div className="hero-actions">
          <Link to={analyzerTarget} className="primary-button hero-cta">
            Launch Analyzer
          </Link>
          <Link to="/guide" className="secondary-button hero-secondary">
            View User Guide
          </Link>
        </div>

        <div className="hero-stats-row">
          <div className="stat-card">
            <span className="stat-number">4</span>
            <span className="stat-label">Placement Scenarios</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">100%</span>
            <span className="stat-label">Contextual Relevance</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">Fast</span>
            <span className="stat-label">AI Analysis Engine</span>
          </div>
        </div>
      </section>

      {/* Why Application is Used & Purpose */}
      <section className="landing-section">
        <div className="section-header text-center">
          <span className="eyebrow">Core Value & Purpose</span>
          <h2>Why ATRF Is Built For Modern SEO</h2>
          <p>
            Manual backlink placement is time-consuming and often results in awkward, forced anchor text.
            ATRF bridges content analysis and AI placement algorithms to deliver natural editorial links.
          </p>
        </div>

        <div className="purposes-grid">
          {keyPurposes.map((item) => (
            <div key={item.step} className="purpose-card">
              <span className="purpose-step">{item.step}</span>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Live Scenario Simulator */}
      <section className="landing-section demo-section">
        <div className="section-header text-center">
          <span className="eyebrow">Interactive Demo</span>
          <h2>Explore The 4 Link Placement Scenarios</h2>
          <p>
            See how ATRF automatically transforms text based on contextual page analysis.
          </p>
        </div>

        <div className="scenario-simulator">
          <div className="scenario-tabs">
            {Object.keys(sampleScenarios).map((key) => (
              <button
                key={key}
                className={`scenario-tab-btn ${activeScenarioKey === key ? "active" : ""}`}
                onClick={() => setActiveScenarioKey(key)}
              >
                <span>{key.replace("_", " ")}</span>
                <small>{sampleScenarios[key].badge}</small>
              </button>
            ))}
          </div>

          <div className="simulator-body">
            <div className="simulator-header">
              <h3>{currentScenario.title}</h3>
              <span className="scenario-badge">{currentScenario.badge}</span>
            </div>
            <p className="simulator-desc">{currentScenario.description}</p>

            <div className="simulator-comparison">
              <div className="text-box before-box">
                <span className="box-tag">Original Sentence (Before)</span>
                <p>{currentScenario.before}</p>
              </div>

              <div className="text-box after-box featured">
                <div className="box-tag-row">
                  <span className="box-tag highlighted">AI Recommended Sentence (After)</span>
                  <button
                    className="copy-chip"
                    onClick={() => handleCopy(currentScenario.after)}
                  >
                    {copied ? "Copied" : "Copy HTML"}
                  </button>
                </div>
                <p
                  className="after-content"
                  dangerouslySetInnerHTML={{ __html: currentScenario.after }}
                />
              </div>
            </div>

            <div className="simulator-meta">
              <div className="meta-pill">
                <strong>Selected Anchor:</strong> <span>{currentScenario.anchorText}</span>
              </div>
              <div className="meta-pill">
                <strong>Target Link:</strong> <span className="link-text">{currentScenario.anchorUrl}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* To Whom It Is Useful */}
      <section className="landing-section">
        <div className="section-header text-center">
          <span className="eyebrow">Target Audience</span>
          <h2>Who Benefits Most From ATRF?</h2>
          <p>
            Designed for digital marketers, content creators, and agencies seeking accurate, scalable editorial link placement.
          </p>
        </div>

        <div className="audience-grid">
          {targetAudience.map((audience) => (
            <div key={audience.title} className="audience-card">
              <span className="category-tag">{audience.category}</span>
              <h3>{audience.title}</h3>
              <p>{audience.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Banner */}
      <section className="cta-banner">
        <h2>Ready To Accelerate Your Editorial Link Strategy?</h2>
        <p>Analyze target URLs and generate optimized link placements in seconds.</p>
        <div className="cta-buttons">
          <Link to={analyzerTarget} className="primary-button cta-primary">
            Launch Analyzer
          </Link>
          <Link to="/guide" className="secondary-button cta-secondary">
            Read User Guide
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="app-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <span className="brand-mark">ATRF</span>
            <p>Anchor Text Replacement & Editorial Link Finder</p>
          </div>
          <div className="footer-links">
            <Link to="/">Home</Link>
            <Link to="/guide">User Guide</Link>
            <Link to={analyzerTarget}>Analyzer</Link>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} ATRF. Built with React, Express, FastAPI & Gemini.</p>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
