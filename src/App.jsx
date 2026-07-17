import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { getUser, getToken, clearAuth } from "./utils/auth.js";
import { isAdmin, isPro } from "./utils/auth.js";
import Layout from "./components/Layout.jsx";
import Login from "./pages/Login.jsx";

import ProDashboard  from "./pages/pro/Dashboard.jsx";
import ProCheckIn    from "./pages/pro/CheckIn.jsx";
import ProActivities from "./pages/pro/Activities.jsx";
import ProFieldLeads from "./pages/pro/FieldLeads.jsx";
import ProExpenses   from "./pages/pro/Expenses.jsx";
import ProTargets    from "./pages/pro/Targets.jsx";

import AdminDashboard  from "./pages/admin/Dashboard.jsx";
import AdminActivities from "./pages/admin/Activities.jsx";
import AdminSessions   from "./pages/admin/Sessions.jsx";
import AdminMapView    from "./pages/admin/MapView.jsx";
import AdminTrail      from "./pages/admin/Trail.jsx";
import AdminGallery    from "./pages/admin/Gallery.jsx";
import AdminVenues     from "./pages/admin/Venues.jsx";
import AdminFieldLeads from "./pages/admin/FieldLeads.jsx";
import AdminTargets    from "./pages/admin/Targets.jsx";

function ProtectedApp() {
  const user = getUser();
  if (!user || !getToken()) return <Navigate to="/login" replace />;
  if (isPro(user)) return (
    <Layout><Routes>
      <Route path="/"           element={<ProDashboard />} />
      <Route path="/checkin"    element={<ProCheckIn />} />
      <Route path="/activities" element={<ProActivities />} />
      <Route path="/leads"      element={<ProFieldLeads />} />
      <Route path="/expenses"   element={<ProExpenses />} />
      <Route path="/targets"    element={<ProTargets />} />
      <Route path="*"           element={<Navigate to="/" replace />} />
    </Routes></Layout>
  );
  if (isAdmin(user)) return (
    <Layout><Routes>
      <Route path="/"            element={<AdminDashboard />} />
      <Route path="/activities"  element={<AdminActivities />} />
      <Route path="/sessions"    element={<AdminSessions />} />
      <Route path="/map"         element={<AdminMapView />} />
      <Route path="/trail"       element={<AdminTrail />} />
      <Route path="/gallery"     element={<AdminGallery />} />
      <Route path="/venues"      element={<AdminVenues />} />
      <Route path="/leads"       element={<AdminFieldLeads />} />
      <Route path="/targets"     element={<AdminTargets />} />
      <Route path="*"            element={<Navigate to="/" replace />} />
    </Routes></Layout>
  );
  clearAuth(); return <Navigate to="/login" replace />;
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
