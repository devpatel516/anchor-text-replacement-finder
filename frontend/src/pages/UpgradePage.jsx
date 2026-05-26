import { useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function UpgradePage() {
  const location = useLocation();
  const { createCheckoutSession, user } = useAuth();
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const billingCancelled = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get("billing") === "cancelled";
  }, [location.search]);

  const handleUpgrade = async () => {
    setError("");
    setIsLoading(true);

    try {
      const data = await createCheckoutSession();
      window.location.href = data.checkoutUrl;
    } catch (checkoutError) {
      setError(checkoutError.message || "Failed to open Stripe checkout.");
      setIsLoading(false);
    }
  };

  return (
    <section className="upgrade-layout">
      <section className="panel pricing-panel">
        <div className="section-heading">
          <h2>Upgrade</h2>
          <p>Open Stripe only when the current monthly plan limit is no longer enough.</p>
        </div>

        {billingCancelled ? (
          <div className="feedback info">Stripe checkout was canceled.</div>
        ) : null}

        {error ? <div className="feedback error">{error}</div> : null}

        <div className="plan-grid">
          <article className={`plan-card ${user?.plan === "free" ? "active" : ""}`}>
            <span className="plan-name">Free</span>
            <strong>3 analyses / month</strong>
            <p>Good for testing the workflow.</p>
          </article>

          <article className={`plan-card ${user?.plan === "pro" ? "active pro" : "pro"}`}>
            <span className="plan-name">Pro</span>
            <strong>100 analyses / month</strong>
            <p>Designed for actual recurring usage.</p>
          </article>
        </div>

        <div className="usage-card">
          <span className="mini-label">Current account</span>
          <strong>{user?.email}</strong>
          <p>
            You are on the {user?.plan} plan with {user?.analysesRemaining} analyses left
            this month.
          </p>
        </div>

        <div className="form-actions">
          <button
            className="primary-button"
            type="button"
            onClick={handleUpgrade}
            disabled={isLoading || user?.plan === "pro"}
          >
            {user?.plan === "pro"
              ? "Pro Already Active"
              : isLoading
                ? "Opening Stripe..."
                : "Upgrade And Pay"}
          </button>
        </div>
      </section>
    </section>
  );
}

export default UpgradePage;
