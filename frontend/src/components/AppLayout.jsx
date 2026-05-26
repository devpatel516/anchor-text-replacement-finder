import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function AppLayout() {
  const { user } = useAuth();
  const showUpgradeLink = user?.plan !== "pro" && user?.analysesRemaining === 0;

  return (
    <div className="page-shell">
      <main className="app-layout">
        <header className="topbar">
          <div className="brand-mark">ATRF</div>

          <div className="topbar-actions">
            <nav className="topnav">
              <NavLink
                to="/dashboard"
                className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
              >
                Dashboard
              </NavLink>
              <NavLink
                to="/profile"
                className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
              >
                Profile
              </NavLink>
              {showUpgradeLink ? (
                <NavLink
                  to="/upgrade"
                  className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
                >
                  Upgrade
                </NavLink>
              ) : null}
              <span className="status-pill">Plan: {user?.plan === "pro" ? "Pro" : "Free"}</span>
              <span className="status-pill">
                Available: {user?.analysesRemaining}/{user?.analysisLimit}
              </span>
            </nav>
          </div>
        </header>

        <Outlet />
      </main>
    </div>
  );
}

export default AppLayout;
