import { Navigate, Route, Routes } from "react-router-dom";
import AppLayout from "./components/AppLayout";
import AuthRoute from "./components/AuthRoute";
import ProtectedRoute from "./components/ProtectedRoute";
import BillingSuccessPage from "./pages/BillingSuccessPage";
import DashboardPage from "./pages/DashboardPage";
import GuidePage from "./pages/GuidePage";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import ProfilePage from "./pages/ProfilePage";
import RegisterPage from "./pages/RegisterPage";
import UpgradePage from "./pages/UpgradePage";

function App() {
  return (
    <Routes>
      {/* AppLayout shell wraps all main application pages for smooth persistent navigation */}
      <Route element={<AppLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/about" element={<LandingPage />} />
        <Route path="/guide" element={<GuidePage />} />

        {/* Protected app routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/upgrade" element={<UpgradePage />} />
          <Route path="/billing/success" element={<BillingSuccessPage />} />
        </Route>
      </Route>

      {/* Auth routes (guest only) */}
      <Route element={<AuthRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
