import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { getUser, getToken, clearAuth } from "./utils/auth.js";
import { isAdmin, isPro } from "./utils/auth.js";
import Layout from "./components/Layout.jsx";
import Login from "./pages/Login.jsx";

// PRO pages
import ProDashboard  from "./pages/pro/Dashboard.jsx";
import ProCheckIn    from "./pages/pro/CheckIn.jsx";
import ProActivities from "./pages/pro/Activities.jsx";
import ProFieldLeads from "./pages/pro/FieldLeads.jsx";
import ProExpenses   from "./pages/pro/Expenses.jsx";
import ProTargets    from "./pages/pro/Targets.jsx";
import ProVenues     from "./pages/pro/Venues.jsx";

// Admin — single cloned page
import AdminPage from "./pages/admin/AdminPage.jsx";

function ProtectedApp() {
  const user = getUser();
  if (!user || !getToken()) return <Navigate to="/login" replace />;

  if (isPro(user)) {
    return (
      <Layout>
        <Routes>
          <Route path="/"           element={<ProDashboard />} />
          <Route path="/checkin"    element={<ProCheckIn />} />
          <Route path="/activities" element={<ProActivities />} />
          <Route path="/leads"      element={<ProFieldLeads />} />
          <Route path="/expenses"   element={<ProExpenses />} />
          <Route path="/targets"    element={<ProTargets />} />
          <Route path="/venues"     element={<ProVenues />} />
          <Route path="*"           element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    );
  }

  if (isAdmin(user)) {
    return (
      <Layout>
        <Routes>
          <Route path="/*" element={<AdminPage />} />
        </Routes>
      </Layout>
    );
  }

  clearAuth();
  return <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/*"     element={<ProtectedApp />} />
      </Routes>
    </BrowserRouter>
  );
}
