import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

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

function ProfilePage() {
  const navigate = useNavigate();
  const { logout, scanHistory, user } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <section className="dashboard-info-grid">
      <section className="panel compact-user-panel">
        <div className="section-heading">
          <h2>User Info</h2>
          <p>Your account details live here instead of inside the header layout.</p>
        </div>

        <div className="user-info-list">
          <article className="meta-item">
            <span>Name</span>
            <p>{user.name}</p>
          </article>
          <article className="meta-item">
            <span>Email</span>
            <p>{user.email}</p>
          </article>
          <article className="meta-item">
            <span>Current Plan</span>
            <p>{user.plan === "pro" ? "Pro" : "Free"}</p>
          </article>
          <article className="meta-item">
            <span>Available Analyses</span>
            <p>
              {user.analysesRemaining} / {user.analysisLimit}
            </p>
          </article>
        </div>

        <div className="profile-card-actions">
          <button type="button" className="secondary-button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </section>

      <section className="panel history-panel">
        <div className="section-heading">
          <h2>Scan History</h2>
          <p>Every saved scan appears here in reverse chronological order.</p>
        </div>

        {scanHistory.length === 0 ? (
          <div className="empty-state compact-empty-state">
            <h3>No saved scans yet</h3>
            <p>Your profile history will populate after the first successful analysis.</p>
          </div>
        ) : (
          <div className="history-list">
            {scanHistory.map((scan) => (
              <article className="history-item" key={scan.id}>
                <div className="history-head">
                  <strong>{scan.matchedScenario}</strong>
                  <span>{new Date(scan.createdAt).toLocaleString()}</span>
                </div>
                <p className="history-url">{scan.url}</p>
                <div className="history-meta">
                  <span>Anchor: {scan.anchorText}</span>
                  <span>Pages Crawled: {scan.crawledPages.length}</span>
                </div>

                <div className="history-output-grid">
                  <article className="history-output-card">
                    <span>Before</span>
                    <p>{renderFormattedText(scan.output?.before || scan.before)}</p>
                  </article>
                  <article className="history-output-card">
                    <span>After</span>
                    <p>{renderFormattedText(scan.output?.after || scan.after)}</p>
                  </article>
                </div>

                <div className="history-links">
                  {scan.output?.["Target Page"] ? (
                    <a
                      href={scan.output["Target Page"]}
                      target="_blank"
                      rel="noreferrer"
                      className="result-link"
                    >
                      Target Page
                    </a>
                  ) : null}
                  {scan.output?.["anchor Url"] ? (
                    <a
                      href={scan.output["anchor Url"]}
                      target="_blank"
                      rel="noreferrer"
                      className="result-link"
                    >
                      Anchor URL
                    </a>
                  ) : null}
                </div>

                <details className="json-block history-json-block">
                  <summary>View full output</summary>
                  <pre>{JSON.stringify(scan.output, null, 2)}</pre>
                </details>
              </article>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}

export default ProfilePage;
