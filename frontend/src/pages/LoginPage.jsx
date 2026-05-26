import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: value
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await login(formData);
      navigate(location.state?.from?.pathname || "/dashboard", { replace: true });
    } catch (submitError) {
      setError(submitError.message || "Login failed.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="page-shell centered-shell">
      <main className="auth-layout">
        <section className="auth-hero">
          <div className="auth-brand-display">
            <span className="auth-brand-kicker">ATRF</span>
            <h1>Analyzer</h1>
          </div>
        </section>

        <section className="panel auth-panel">
          <div className="section-heading">
            <h2>Login</h2>
            <p>Enter your account to open the protected ATRF workspace.</p>
          </div>

          {error ? <div className="feedback error">{error}</div> : null}

          <form className="analyzer-form" onSubmit={handleSubmit}>
            <label className="input-group">
              <span>Email</span>
              <input
                type="email"
                name="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </label>

            <label className="input-group">
              <span>Password</span>
              <input
                type="password"
                name="password"
                placeholder="Your password"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </label>

            <button className="primary-button" type="submit" disabled={isLoading}>
              {isLoading ? "Signing in..." : "Login"}
            </button>
          </form>

          <p className="switch-copy">
            No account yet? <Link to="/register">Create one here</Link>
          </p>
        </section>
      </main>
    </div>
  );
}

export default LoginPage;
