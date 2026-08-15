import { Link, NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function AppLayout() {
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="page-shell">
      <main className="app-layout">
        <header className="topbar">
          <Link to="/" className="brand-mark">ATRF</Link>

          <div className="topbar-actions">
            <nav className="topnav">
              {/* 1. Home */}
              <NavLink
                to="/"
                className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
              >
                Home
              </NavLink>

              {/* 2. Guide */}
              <NavLink
                to="/guide"
                className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
              >
                Guide
              </NavLink>

              {isAuthenticated ? (
                <>
                  {/* 3. Analyzer */}
                  <NavLink
                    to="/dashboard"
                    className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
                  >
                    Analyzer
                  </NavLink>

                  {/* 4. Profile */}
                  <NavLink
                    to="/profile"
                    className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
                  >
                    Profile
                  </NavLink>

                  {/* 5. Plan */}
                  <span className="status-pill plan-pill">
                    Plan: {user?.plan === "pro" ? "Pro" : "Free"}
                  </span>

                  {/* 6. Quota */}
                  <span className="status-pill quota-pill">
                    Quota: {user?.analysesRemaining}/{user?.analysisLimit}
                  </span>

                  {/* 7. Billing */}
                  <NavLink
                    to="/upgrade"
                    className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
                  >
                    Billing
                  </NavLink>
                </>
              ) : (
                <NavLink
                  to="/login"
                  className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
                >
                  Launch Analyzer
                </NavLink>
              )}
            </nav>
          </div>
        </header>

        <Outlet />
      </main>
    </div>
  );
}

export default AppLayout;
