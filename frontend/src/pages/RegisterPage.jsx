import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
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
      await register(formData);
      navigate("/dashboard", { replace: true });
    } catch (submitError) {
      setError(submitError.message || "Registration failed.");
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
            <h2>Register</h2>
            <p>Create your account to open the protected ATRF workspace.</p>
          </div>

          {error ? <div className="feedback error">{error}</div> : null}

          <form className="analyzer-form" onSubmit={handleSubmit}>
            <label className="input-group">
              <span>Name</span>
              <input
                type="text"
                name="name"
                placeholder="Your name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </label>

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
                placeholder="Minimum 6 characters"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </label>

            <button className="primary-button" type="submit" disabled={isLoading}>
              {isLoading ? "Creating account..." : "Register"}
            </button>
          </form>

          <p className="switch-copy">
            Already have an account? <Link to="/login">Go to login</Link>
          </p>
        </section>
      </main>
    </div>
  );
}

export default RegisterPage;
