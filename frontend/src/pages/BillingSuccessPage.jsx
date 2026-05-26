import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function BillingSuccessPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { confirmCheckoutSession } = useAuth();
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("Confirming your Stripe payment...");

  useEffect(() => {
    let isActive = true;
    const sessionId = searchParams.get("session_id");

    if (!sessionId) {
      setStatus("error");
      setMessage("Missing Stripe session id.");
      return undefined;
    }

    const finalizeCheckout = async () => {
      try {
        await confirmCheckoutSession(sessionId);

        if (isActive) {
          setStatus("success");
          setMessage("Payment confirmed. Your Pro plan is active.");
          setTimeout(() => {
            navigate("/dashboard", { replace: true });
          }, 1500);
        }
      } catch (error) {
        if (isActive) {
          setStatus("error");
          setMessage(error.message || "Could not confirm your payment.");
        }
      }
    };

    finalizeCheckout();

    return () => {
      isActive = false;
    };
  }, [confirmCheckoutSession, navigate, searchParams]);

  return (
    <section className="upgrade-layout">
      <section className="panel pricing-panel">
        <div className="section-heading">
          <h2>Billing Success</h2>
          <p>Stripe returned here after payment and we are updating the account.</p>
        </div>

        <div className={`feedback ${status === "error" ? "error" : "success"}`}>
          {message}
        </div>
      </section>
    </section>
  );
}

export default BillingSuccessPage;
